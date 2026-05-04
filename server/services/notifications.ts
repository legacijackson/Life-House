import { db } from "../db";
import { notifications, users, communicationLog } from "../../shared/schema";
import { eq } from "drizzle-orm";

interface NotificationPayload {
  userId: string;
  type: string;
  title: string;
  body?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  linkType?: string;
  linkId?: string;
}

export async function createNotification(payload: NotificationPayload) {
  const [notif] = await db.insert(notifications).values({
    userId: payload.userId,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    priority: payload.priority ?? "normal",
    linkType: payload.linkType,
    linkId: payload.linkId ? payload.linkId as any : undefined,
  }).returning();
  return notif;
}

export async function notifyAdmins(payload: Omit<NotificationPayload, "userId">) {
  const adminUsers = await db.select({ id: users.id })
    .from(users)
    .where(eq(users.isAdmin, true));

  for (const admin of adminUsers) {
    await createNotification({ ...payload, userId: admin.id });
  }
}

export async function notifyUser(userId: string, payload: Omit<NotificationPayload, "userId">) {
  return createNotification({ ...payload, userId });
}

// ── Communication log ─────────────────────────────────────────────────────────

export async function logComm(opts: {
  channel: 'email' | 'sms' | 'in_app' | 'fax';
  toUserId?: string;
  toAddress: string;
  fromAddress?: string;
  subject?: string;
  body?: string;
  templateType?: string;
  externalId?: string;
  status?: 'sent' | 'failed' | 'pending' | 'delivered' | 'bounced';
  errorMessage?: string;
  sentBy?: string;
}) {
  try {
    await db.insert(communicationLog).values({
      channel: opts.channel,
      status: opts.status ?? 'sent',
      toUserId: opts.toUserId,
      toAddress: opts.toAddress,
      fromAddress: opts.fromAddress,
      subject: opts.subject,
      body: opts.body,
      templateType: opts.templateType,
      externalId: opts.externalId,
      errorMessage: opts.errorMessage,
      sentBy: opts.sentBy,
    });
  } catch (err) {
    console.error("[CommLog] Failed to log:", err);
  }
}

// ── Wrapped send helpers (log + send) ─────────────────────────────────────────

export async function sendEmailNotification(opts: {
  toUserId?: string;
  toEmail: string;
  toName?: string;
  subject: string;
  html: string;
  templateType?: string;
  sentBy?: string;
}) {
  const { sendEmail } = await import("./email");
  try {
    await sendEmail({ to: opts.toEmail, toName: opts.toName, subject: opts.subject, html: opts.html });
    await logComm({
      channel: 'email',
      toUserId: opts.toUserId,
      toAddress: opts.toEmail,
      subject: opts.subject,
      body: opts.html.replace(/<[^>]+>/g, '').slice(0, 500),
      templateType: opts.templateType,
      status: 'sent',
      sentBy: opts.sentBy,
    });
  } catch (err: any) {
    await logComm({
      channel: 'email',
      toUserId: opts.toUserId,
      toAddress: opts.toEmail,
      subject: opts.subject,
      templateType: opts.templateType,
      status: 'failed',
      errorMessage: err.message,
      sentBy: opts.sentBy,
    });
  }
}

export async function sendSmsNotification(opts: {
  toUserId?: string;
  toPhone: string;
  body: string;
  templateType?: string;
  sentBy?: string;
}) {
  const { sendSMS, normalizePhone } = await import("./sms");
  const normalized = normalizePhone(opts.toPhone);
  try {
    const sid = await sendSMS(normalized, opts.body);
    await logComm({
      channel: 'sms',
      toUserId: opts.toUserId,
      toAddress: normalized,
      body: opts.body,
      templateType: opts.templateType,
      externalId: sid,
      status: 'sent',
      sentBy: opts.sentBy,
    });
  } catch (err: any) {
    await logComm({
      channel: 'sms',
      toUserId: opts.toUserId,
      toAddress: normalized,
      body: opts.body,
      templateType: opts.templateType,
      status: 'failed',
      errorMessage: err.message,
      sentBy: opts.sentBy,
    });
  }
}

// ── Google Chat ───────────────────────────────────────────────────────────────

export async function sendGoogleChatMessage(webhookUrl: string, text: string, threadKey?: string) {
  if (!webhookUrl) return;

  const body: Record<string, unknown> = { text };
  const url = threadKey
    ? `${webhookUrl}&threadKey=${encodeURIComponent(threadKey)}&messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD`
    : webhookUrl;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error("[GoogleChat] Failed:", res.status, txt);
    }
  } catch (err) {
    console.error("[GoogleChat] Error sending message:", err);
  }
}

export async function notifyNewLead(callDetails: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  contactType: string;
  callId: string;
}) {
  const name = [callDetails.firstName, callDetails.lastName].filter(Boolean).join(" ") || "Unknown";
  const title = `New ${callDetails.contactType} call — ${name}`;
  const body = `Phone: ${callDetails.phone ?? "N/A"}`;

  const staffUsers = await db.select({ id: users.id, isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.role, "CaseManager" as any));

  for (const staff of staffUsers) {
    await createNotification({
      userId: staff.id,
      type: "new_lead_call",
      title,
      body,
      priority: "high",
      linkType: "call_log",
      linkId: callDetails.callId,
    });
  }
  await notifyAdmins({ type: "new_lead_call", title, body, priority: "high", linkType: "call_log", linkId: callDetails.callId });

  const webhook = process.env.GOOGLE_CHAT_WEBHOOK;
  if (webhook) {
    await sendGoogleChatMessage(webhook, `📞 *${title}*\n${body}`, process.env.GOOGLE_CHAT_CALLBACKS_THREAD);
  }
}

export async function notifyCallbackAssigned(assigneeId: string, callDetails: {
  callerName: string;
  callbackDate?: Date;
  callId: string;
}) {
  await createNotification({
    userId: assigneeId,
    type: "callback_assigned",
    title: `Callback assigned — ${callDetails.callerName}`,
    body: callDetails.callbackDate
      ? `Due: ${callDetails.callbackDate.toLocaleDateString()}`
      : undefined,
    priority: "high",
    linkType: "call_log",
    linkId: callDetails.callId,
  });

  const webhook = process.env.GOOGLE_CHAT_WEBHOOK;
  if (webhook) {
    await sendGoogleChatMessage(
      webhook,
      `📋 Callback assigned to staff for *${callDetails.callerName}*`,
      process.env.GOOGLE_CHAT_CALLBACKS_THREAD,
    );
  }
}
