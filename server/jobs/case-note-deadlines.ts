import { db } from "../db";
import { eventAttendance, staffCaseNotes, users } from "../../shared/schema";
import { eq, and, isNull, lt, sql } from "drizzle-orm";
import { createNotification, notifyAdmins } from "../services/notifications";

export async function checkCaseNoteDeadlines(): Promise<void> {
  try {
    const now = new Date();
    const fourDaysMs = 4 * 24 * 60 * 60 * 1000;

    // Find attendance records where case note is required, not yet filed, and past due
    const overdueRecords = await db.select()
      .from(eventAttendance)
      .where(
        and(
          eq(eventAttendance.caseNoteRequired, true),
          isNull(eventAttendance.caseNoteId),
          lt(eventAttendance.caseNoteDueAt, now),
        ),
      );

    for (const record of overdueRecords) {
      if (!record.caseNoteDueAt || !record.staffId) continue;

      const dueAt = new Date(record.caseNoteDueAt);
      const isExtremelyLate = now.getTime() - dueAt.getTime() > fourDaysMs;
      const label = isExtremelyLate ? "extremely-late" : "overdue";

      const notifTitle = isExtremelyLate
        ? "EXTREMELY LATE case note"
        : "Overdue case note";

      await createNotification({
        userId: record.staffId,
        type: `case_note_${label}`,
        title: notifTitle,
        body: `Case note was due ${dueAt.toLocaleDateString()}`,
        priority: isExtremelyLate ? "urgent" : "high",
        linkType: "event_attendance",
        linkId: record.id,
      });

      if (isExtremelyLate) {
        await notifyAdmins({
          type: "case_note_extremely_late",
          title: `EXTREMELY LATE case note — staff ${record.staffId}`,
          body: `Due: ${dueAt.toLocaleDateString()}`,
          priority: "urgent",
          linkType: "event_attendance",
          linkId: record.id,
        });
      }
    }
  } catch (err) {
    console.error("[CaseNoteDeadlines] Error:", err);
  }
}
