const API_KEY = process.env.GOOGLE_APPS_SCRIPT_API_KEY ?? "";

async function postToScript(url: string, payload: Record<string, unknown>): Promise<void> {
  if (!url) {
    console.warn("[AppsScript] URL not configured, skipping");
    return;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, apiKey: API_KEY }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[AppsScript] Error response:", res.status, text);
    }
  } catch (err) {
    console.error("[AppsScript] Request failed (non-blocking):", err);
  }
}

export async function callCallLogScript(data: Record<string, unknown>): Promise<void> {
  return postToScript(process.env.APPS_SCRIPT_CALL_LOG_URL ?? "", data);
}

export async function callIntakeScript(data: Record<string, unknown>): Promise<void> {
  return postToScript(process.env.APPS_SCRIPT_INTAKE_URL ?? "", data);
}

export async function callLCPReferralScript(data: Record<string, unknown>): Promise<void> {
  return postToScript(process.env.APPS_SCRIPT_LCP_REFERRAL_URL ?? "", data);
}
