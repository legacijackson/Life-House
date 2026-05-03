import { db } from "../db";
import { callLog } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { getRecentCalls, getVoicemails } from "../services/freedomvoice";
import { notifyNewLead } from "../services/notifications";

let lastSyncTime: Date | null = null;

export async function syncFreedomVoiceCalls(): Promise<void> {
  const since = lastSyncTime ?? new Date(Date.now() - 10 * 60 * 1000);

  try {
    const [calls, voicemails] = await Promise.all([
      getRecentCalls(since),
      getVoicemails(since),
    ]);

    const all = [...calls, ...voicemails];

    for (const call of all) {
      const existing = await db.query.callLog.findFirst({
        where: eq(callLog.freedomVoiceCallId, call.id),
      });

      if (existing) continue;

      const [inserted] = await db.insert(callLog).values({
        freedomVoiceCallId: call.id,
        contactType: "Other",
        status: "in-progress",
        phone: call.callerNumber,
        callDate: call.date,
        callTime: call.time,
        freedomVoiceRecordingUrl: call.recordingUrl ?? null,
      }).returning();

      await notifyNewLead({
        firstName: "Unknown",
        phone: call.callerNumber,
        contactType: call.type === "voicemail" ? "Voicemail" : "Call",
        callId: inserted.id,
      });
    }

    lastSyncTime = new Date();
  } catch (err) {
    console.error("[FVSync] Error:", err);
  }
}
