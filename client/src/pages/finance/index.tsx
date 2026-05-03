import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const FINANCE_URL = (import.meta as any).env?.VITE_FINANCE_APP_URL ?? "https://lifehouseaccounting.replit.app";

export default function FinancePage() {
  const { user } = useAuth();
  const [canEmbed, setCanEmbed] = useState<boolean | null>(null);

  const isAdmin = (user as any)?.isAdmin || (user as any)?.role === "admin";

  useEffect(() => {
    // Probe whether the Finance app allows framing by checking our proxy endpoint
    fetch(`/api/finance/embed-check`)
      .then((r) => r.json())
      .then((d: any) => setCanEmbed(d.canEmbed ?? false))
      .catch(() => setCanEmbed(false));
  }, []);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full p-12 text-center text-gray-500">
        <p>Finance Portal is restricted to administrators.</p>
      </div>
    );
  }

  if (canEmbed === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-gray-400">Loading Finance Portal…</div>
      </div>
    );
  }

  if (!canEmbed) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-gray-600 text-sm">The Finance Portal must be opened in a separate tab.</p>
        <Button asChild>
          <a href={FINANCE_URL} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Finance Portal
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      <div className="px-6 py-3 border-b bg-white flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">Finance Portal</h1>
        <a
          href={FINANCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open in new tab
        </a>
      </div>
      <iframe
        src={FINANCE_URL}
        style={{ width: "100%", flex: 1, border: "none" }}
        title="Life House Finance Portal"
      />
    </div>
  );
}
