import fetch from "node-fetch";

function env(key: string) {
  return process.env[key] ?? "";
}

const BASE = () => env("DOCUSEAL_BASE_URL") || "https://api.docuseal.co";
const KEY = () => env("DOCUSEAL_API_KEY");

function headers() {
  const key = KEY();
  if (!key) throw new Error("DOCUSEAL_API_KEY not configured");
  return { "X-Auth-Token": key, "Content-Type": "application/json" };
}

// ── Submission ────────────────────────────────────────────────────────────────

export interface DocuSealSubmitter {
  email: string;
  name?: string;
  phone?: string;
  role?: string;
  fields?: Array<{ name: string; default_value?: string }>;
  send_email?: boolean;
}

export interface CreateSubmissionResult {
  id: number;
  slug: string;
  submitters: Array<{ id: number; slug: string; email: string; embed_src?: string }>;
}

export async function createSubmission(opts: {
  templateId: string | number;
  submitters: DocuSealSubmitter[];
  sendEmail?: boolean;
}): Promise<CreateSubmissionResult> {
  const res = await fetch(`${BASE()}/api/submissions`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      template_id: opts.templateId,
      submitters: opts.submitters.map((s) => ({
        email: s.email,
        name: s.name,
        phone: s.phone,
        role: s.role,
        fields: s.fields,
        send_email: s.send_email ?? opts.sendEmail ?? false,
      })),
    }),
  });
  return res.json() as Promise<CreateSubmissionResult>;
}

// Fetch submission status
export async function getSubmission(submissionId: number) {
  const res = await fetch(`${BASE()}/api/submissions/${submissionId}`, {
    headers: headers(),
  });
  return res.json();
}

// Get an embedded signing URL for a specific submitter slug
export function getEmbedUrl(submitterSlug: string): string {
  return `${BASE()}/s/${submitterSlug}`;
}

// ── Template shortcuts ────────────────────────────────────────────────────────

export function leaseTemplateId() {
  return env("DOCUSEAL_LEASE_TEMPLATE_ID");
}

export function carePlanTemplateId() {
  return env("DOCUSEAL_CARE_PLAN_TEMPLATE_ID");
}

export function medicalReleaseTemplateId() {
  return env("DOCUSEAL_MEDICAL_RELEASE_TEMPLATE_ID");
}

// ── Webhook event types ───────────────────────────────────────────────────────

export interface DocuSealWebhookPayload {
  event_type: "submission.completed" | "submitter.completed" | "submission.created";
  data: {
    id: number;
    submission_id?: number;
    email?: string;
    status?: string;
    completed_at?: string;
    template?: { id: number; name: string };
    submitters?: Array<{ email: string; status: string; completed_at?: string }>;
  };
}
