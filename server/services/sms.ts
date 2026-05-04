import twilio from "twilio";

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error("TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN not set");
  return twilio(sid, token);
}

function fromNumber() {
  const n = process.env.TWILIO_PHONE_NUMBER;
  if (!n) throw new Error("TWILIO_PHONE_NUMBER not set");
  return n;
}

export async function sendSMS(to: string, body: string): Promise<string> {
  try {
    const client = getClient();
    const message = await client.messages.create({
      to,
      from: fromNumber(),
      body,
    });
    return message.sid;
  } catch (err: any) {
    console.error("[Twilio] SMS failed:", err.message);
    throw err;
  }
}

// Normalize phone to E.164 — assumes US numbers if no country code
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

// ── Templated SMS messages ────────────────────────────────────────────────────

export async function smsWelcome(to: string, name: string, portalUrl: string) {
  await sendSMS(normalizePhone(to),
    `Hi ${name}! Welcome to Life House Reentry Program. Access your client portal: ${portalUrl} — Questions? Call (855) 454-3387`
  );
}

export async function smsHousingAssigned(to: string, name: string, moveInDate?: string) {
  await sendSMS(normalizePhone(to),
    `Hi ${name}, great news! You've been assigned housing at Life House.${moveInDate ? ` Move-in date: ${moveInDate}.` : ""} Your case manager will follow up with details. Call (855) 454-3387.`
  );
}

export async function smsAppointmentReminder(to: string, name: string, eventTitle: string, date: string, time: string) {
  await sendSMS(normalizePhone(to),
    `Life House Reminder: Hi ${name}, you have "${eventTitle}" on ${date} at ${time}. Reply STOP to opt out. (855) 454-3387`
  );
}

export async function smsCaseManagerMessage(to: string, staffName: string, message: string) {
  await sendSMS(normalizePhone(to),
    `Life House — Message from ${staffName}: ${message} Reply or call (855) 454-3387.`
  );
}

export async function smsCheckInReminder(to: string, name: string) {
  await sendSMS(normalizePhone(to),
    `Hi ${name}, this is a reminder to complete your check-in with Life House today. Log in to your portal or call (855) 454-3387.`
  );
}

export async function smsDocumentReady(to: string, name: string, docTitle: string, signUrl: string) {
  await sendSMS(normalizePhone(to),
    `Life House: Hi ${name}, "${docTitle}" is ready for your signature: ${signUrl} — Questions? (855) 454-3387`
  );
}

export async function smsPasswordReset(to: string, resetUrl: string) {
  await sendSMS(normalizePhone(to),
    `Life House: Password reset link (expires in 1 hour): ${resetUrl} — If you didn't request this, call (855) 454-3387.`
  );
}

export async function smsStaffNewApplication(to: string, applicantName: string, confirmationNumber: string) {
  await sendSMS(normalizePhone(to),
    `Life House Alert: New housing application from ${applicantName} (${confirmationNumber}). Log in to review: lifehousereentry.com/app — (855) 454-3387`
  );
}
