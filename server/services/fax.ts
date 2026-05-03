import axios from "axios";
import FormData from "form-data";
import fs from "fs";

function env(key: string) {
  return process.env[key] ?? "";
}

// ── Telnyx eFax ──────────────────────────────────────────────────────────────

interface FaxResult {
  id: string;
  status: string;
  to: string;
  from: string;
  createdAt: string;
}

export async function sendFaxViaTelnyx(opts: {
  to: string;
  from?: string;
  mediaUrl?: string;
  mediaPath?: string;
  connectionId?: string;
}): Promise<FaxResult> {
  const apiKey = env("TELNYX_API_KEY");
  const defaultFrom = env("TELNYX_FAX_NUMBER");

  if (!apiKey) throw new Error("TELNYX_API_KEY not configured");
  if (!opts.to) throw new Error("Recipient fax number required");

  const from = opts.from ?? defaultFrom;
  if (!from) throw new Error("TELNYX_FAX_NUMBER not configured and no from number supplied");

  const payload: Record<string, string> = {
    to: opts.to,
    from,
  };

  if (opts.mediaUrl) {
    payload.media_url = opts.mediaUrl;
  } else if (opts.mediaPath) {
    // For local files, upload is handled separately; use media_url in production
    payload.media_url = opts.mediaPath;
  }

  if (opts.connectionId) {
    payload.connection_id = opts.connectionId;
  }

  const { data } = await axios.post("https://api.telnyx.com/v2/faxes", payload, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  const fax = data?.data ?? {};
  return {
    id: fax.id ?? "",
    status: fax.status ?? "queued",
    to: fax.to ?? opts.to,
    from: fax.from ?? from,
    createdAt: fax.created_at ?? new Date().toISOString(),
  };
}

export async function getFaxStatus(faxId: string): Promise<FaxResult> {
  const apiKey = env("TELNYX_API_KEY");
  if (!apiKey) throw new Error("TELNYX_API_KEY not configured");

  const { data } = await axios.get(`https://api.telnyx.com/v2/faxes/${faxId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const fax = data?.data ?? {};
  return {
    id: fax.id ?? faxId,
    status: fax.status ?? "unknown",
    to: fax.to ?? "",
    from: fax.from ?? "",
    createdAt: fax.created_at ?? "",
  };
}

// ── HylaFAX (net2fax wrapper) ─────────────────────────────────────────────

export function buildHylaFaxCommand(opts: {
  to: string;
  filePath: string;
  coverTemplate?: string;
}): string[] {
  const host = env("HYLAFAX_HOST") || "localhost";
  const port = env("HYLAFAX_PORT") || "4559";
  const user = env("HYLAFAX_USER") || "anonymous";

  const args = ["-h", host, "-P", port, "-u", user, "-d", opts.to];
  if (opts.coverTemplate) args.push("-D", opts.coverTemplate);
  args.push(opts.filePath);
  return ["sendfax", ...args];
}
