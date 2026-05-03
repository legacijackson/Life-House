const BASE_URL = "https://api.freedomvoice.com/v1";

interface FVCall {
  id: string;
  callerNumber: string;
  date: string;
  time: string;
  duration: number;
  recordingUrl?: string;
  type: "call" | "voicemail";
}

async function fvFetch(path: string, params: Record<string, string> = {}): Promise<unknown> {
  const apiKey = process.env.FREEDOMVOICE_API_KEY;
  const accountNumber = process.env.FREEDOMVOICE_ACCOUNT_NUMBER;

  if (!apiKey || !accountNumber) {
    console.warn("[FreedomVoice] API credentials not configured");
    return null;
  }

  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("accountNumber", accountNumber);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FreedomVoice API error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function getRecentCalls(since?: Date): Promise<FVCall[]> {
  try {
    const params: Record<string, string> = {};
    if (since) {
      params.since = since.toISOString();
    }

    const data = (await fvFetch("/calls", params)) as { calls?: FVCall[] } | null;
    return data?.calls ?? [];
  } catch (err) {
    console.error("[FreedomVoice] getRecentCalls error:", err);
    return [];
  }
}

export async function getVoicemails(since?: Date): Promise<FVCall[]> {
  try {
    const params: Record<string, string> = {};
    if (since) {
      params.since = since.toISOString();
    }

    const data = (await fvFetch("/voicemails", params)) as { voicemails?: FVCall[] } | null;
    return (data?.voicemails ?? []).map((v) => ({ ...v, type: "voicemail" as const }));
  } catch (err) {
    console.error("[FreedomVoice] getVoicemails error:", err);
    return [];
  }
}

export type { FVCall };
