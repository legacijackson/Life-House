import sgMail from "@sendgrid/mail";

function init() {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) throw new Error("SENDGRID_API_KEY not set");
  sgMail.setApiKey(key);
}

function fromAddress() {
  return process.env.SENDGRID_FROM_EMAIL || "lifeup@lifehousereentry.com";
}

function fromName() {
  return process.env.SENDGRID_FROM_NAME || "Life House Reentry Program";
}

export interface EmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export async function sendEmail(opts: EmailOptions): Promise<void> {
  try {
    init();
    await sgMail.send({
      to: { email: opts.to, name: opts.toName },
      from: { email: fromAddress(), name: fromName() },
      replyTo: opts.replyTo,
      subject: opts.subject,
      html: opts.html,
      text: opts.text || opts.html.replace(/<[^>]+>/g, ""),
    });
  } catch (err: any) {
    console.error("[SendGrid] Failed to send email:", err.response?.body || err.message);
    throw err;
  }
}

// ── Branded HTML wrapper ──────────────────────────────────────────────────────

function wrapHtml(bodyContent: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; background: #f4f4f4; }
  .wrapper { max-width: 600px; margin: 24px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #166534 0%, #1d4ed8 100%); padding: 28px 32px; color: white; }
  .header h1 { margin: 0; font-size: 22px; }
  .header p { margin: 4px 0 0; font-size: 12px; color: rgba(255,255,255,0.8); }
  .body { padding: 28px 32px; color: #333; font-size: 14px; line-height: 1.6; }
  .body h2 { color: #166534; font-size: 18px; margin: 0 0 16px; }
  .body p { margin: 0 0 12px; }
  .btn { display: inline-block; background: #166534; color: white !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 8px 0; }
  .info-box { background: #f0fdf4; border-left: 4px solid #166534; padding: 12px 16px; border-radius: 0 4px 4px 0; margin: 16px 0; }
  .footer { background: #f9fafb; padding: 16px 32px; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
  .footer a { color: #6b7280; }
  table.data { width: 100%; border-collapse: collapse; margin: 12px 0; }
  table.data td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
  table.data td:first-child { font-weight: 600; color: #555; width: 40%; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>Life House</h1>
    <p>Reentry Program — Sacramento, CA</p>
  </div>
  <div class="body">
    ${bodyContent}
  </div>
  <div class="footer">
    &copy; Life House Reentry Program &bull; 8399 Folsom Blvd STE 1 #4014, Sacramento CA 95826<br>
    <a href="tel:8554543387">(855) 454-3387</a> &bull; <a href="mailto:lifeup@lifehousereentry.com">lifeup@lifehousereentry.com</a><br>
    You are receiving this because you are enrolled in or referred to the Life House program.
  </div>
</div>
</body>
</html>`;
}

// ── Templated emails ──────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string, portalUrl: string) {
  await sendEmail({
    to,
    toName: name,
    subject: "Welcome to Life House — Your Account is Ready",
    html: wrapHtml(`
      <h2>Welcome, ${name}!</h2>
      <p>You've been enrolled in the Life House Reentry Program. We're glad you're here.</p>
      <p>You can log in to your client portal at any time to view your progress, upcoming events, and resources.</p>
      <a href="${portalUrl}" class="btn">Access Your Portal</a>
      <div class="info-box">
        <strong>What's next?</strong><br>
        Your case manager will reach out to schedule your intake meeting. In the meantime, feel free to explore your portal.
      </div>
      <p>If you have any questions, call us at <strong>(855) 454-3387</strong> or email <a href="mailto:lifeup@lifehousereentry.com">lifeup@lifehousereentry.com</a>.</p>
    `),
  });
}

export async function sendHousingAssignedEmail(to: string, name: string, opts: {
  propertyAddress?: string;
  roomAssignment?: string;
  moveInDate?: string;
  caseManager?: string;
}) {
  await sendEmail({
    to,
    toName: name,
    subject: "Housing Assigned — Welcome to Life House",
    html: wrapHtml(`
      <h2>Great news, ${name}!</h2>
      <p>You have been assigned housing through the Life House Reentry Program. Here are your placement details:</p>
      <table class="data">
        ${opts.propertyAddress ? `<tr><td>Property</td><td>${opts.propertyAddress}</td></tr>` : ""}
        ${opts.roomAssignment ? `<tr><td>Room</td><td>${opts.roomAssignment}</td></tr>` : ""}
        ${opts.moveInDate ? `<tr><td>Move-in Date</td><td>${opts.moveInDate}</td></tr>` : ""}
        ${opts.caseManager ? `<tr><td>Case Manager</td><td>${opts.caseManager}</td></tr>` : ""}
      </table>
      <div class="info-box">
        Please bring a valid photo ID and any personal belongings on your move-in date. Your case manager will walk you through orientation.
      </div>
      <p>Questions? Contact us at <strong>(855) 454-3387</strong>.</p>
    `),
  });
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  await sendEmail({
    to,
    toName: name,
    subject: "Reset Your Life House Password",
    html: wrapHtml(`
      <h2>Password Reset Request</h2>
      <p>Hi ${name}, we received a request to reset your Life House account password.</p>
      <p>Click the button below to set a new password. This link expires in 1 hour.</p>
      <a href="${resetUrl}" class="btn">Reset Password</a>
      <p style="color:#888;font-size:12px;margin-top:16px;">If you didn't request this, you can safely ignore this email — your password won't be changed.</p>
    `),
  });
}

export async function sendCaseNoteNotification(to: string, staffName: string, clientName: string, noteType: string, summary: string) {
  await sendEmail({
    to,
    subject: `Case Note Added — ${clientName}`,
    html: wrapHtml(`
      <h2>Case Note: ${clientName}</h2>
      <table class="data">
        <tr><td>Client</td><td>${clientName}</td></tr>
        <tr><td>Note Type</td><td>${noteType}</td></tr>
        <tr><td>Added By</td><td>${staffName}</td></tr>
        <tr><td>Date</td><td>${new Date().toLocaleDateString()}</td></tr>
      </table>
      <div class="info-box"><strong>Summary:</strong><br>${summary}</div>
    `),
  });
}

export async function sendAppointmentReminder(to: string, name: string, opts: {
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  location?: string;
  staffName?: string;
}) {
  await sendEmail({
    to,
    toName: name,
    subject: `Reminder: ${opts.eventTitle} — ${opts.eventDate}`,
    html: wrapHtml(`
      <h2>Upcoming Appointment Reminder</h2>
      <p>Hi ${name}, this is a reminder about your upcoming appointment:</p>
      <table class="data">
        <tr><td>Event</td><td>${opts.eventTitle}</td></tr>
        <tr><td>Date</td><td>${opts.eventDate}</td></tr>
        <tr><td>Time</td><td>${opts.eventTime}</td></tr>
        ${opts.location ? `<tr><td>Location</td><td>${opts.location}</td></tr>` : ""}
        ${opts.staffName ? `<tr><td>Staff</td><td>${opts.staffName}</td></tr>` : ""}
      </table>
      <p>If you need to reschedule, please contact your case manager as soon as possible.</p>
    `),
  });
}

export async function sendDonationReceiptEmail(to: string, name: string, opts: {
  amount: string;
  frequency: string;
  date: string;
  transactionId?: string;
}) {
  await sendEmail({
    to,
    toName: name,
    subject: "Thank You for Your Donation to Life House",
    html: wrapHtml(`
      <h2>Thank You, ${name}!</h2>
      <p>Your generous donation supports formerly incarcerated individuals as they rebuild their lives with dignity and purpose.</p>
      <table class="data">
        <tr><td>Amount</td><td><strong>$${opts.amount}</strong></td></tr>
        <tr><td>Type</td><td>${opts.frequency}</td></tr>
        <tr><td>Date</td><td>${opts.date}</td></tr>
        ${opts.transactionId ? `<tr><td>Transaction ID</td><td>${opts.transactionId}</td></tr>` : ""}
      </table>
      <div class="info-box">
        Life House is a registered 501(c)(3) nonprofit. Your donation may be tax-deductible. Please retain this email as your receipt.
        <br><strong>EIN: [Your EIN here]</strong>
      </div>
      <p>With gratitude,<br><strong>The Life House Team</strong></p>
    `),
  });
}

export async function sendStaffAlertEmail(to: string, subject: string, message: string, opts?: { clientName?: string; actionUrl?: string }) {
  await sendEmail({
    to,
    subject: `[Life House Alert] ${subject}`,
    html: wrapHtml(`
      <h2>${subject}</h2>
      ${opts?.clientName ? `<p><strong>Client:</strong> ${opts.clientName}</p>` : ""}
      <div class="info-box">${message}</div>
      ${opts?.actionUrl ? `<a href="${opts.actionUrl}" class="btn">View Details</a>` : ""}
    `),
  });
}

export async function sendNewApplicationEmail(staffEmail: string, applicant: { name: string; phone?: string; email?: string; referralSource?: string }) {
  await sendEmail({
    to: staffEmail,
    subject: `New Application Received — ${applicant.name}`,
    html: wrapHtml(`
      <h2>New Application Received</h2>
      <p>A new housing application has been submitted and requires review.</p>
      <table class="data">
        <tr><td>Name</td><td>${applicant.name}</td></tr>
        ${applicant.phone ? `<tr><td>Phone</td><td>${applicant.phone}</td></tr>` : ""}
        ${applicant.email ? `<tr><td>Email</td><td>${applicant.email}</td></tr>` : ""}
        ${applicant.referralSource ? `<tr><td>Referred By</td><td>${applicant.referralSource}</td></tr>` : ""}
        <tr><td>Submitted</td><td>${new Date().toLocaleDateString()}</td></tr>
      </table>
      <p>Log in to the admin portal to review and process this application.</p>
    `),
  });
}
