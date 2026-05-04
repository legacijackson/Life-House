import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type State = "loading" | "ready" | "completed" | "error";

export default function SignPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [state, setState] = useState<State>("loading");
  const [embedUrl, setEmbedUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!slug) {
      setState("error");
      setErrorMsg("Invalid signing link.");
      return;
    }

    // Fetch embed URL from server (no auth required for signers)
    apiRequest("GET", `/api/sign/embed/${slug}`)
      .then(r => r.json())
      .then((data: any) => {
        if (data?.url) {
          setEmbedUrl(data.url);
          setState("ready");
        } else {
          throw new Error(data?.message || "Could not load signing session.");
        }
      })
      .catch((err: any) => {
        setState("error");
        setErrorMsg(err.message || "Failed to load signing link.");
      });
  }, [slug]);

  // Listen for DocuSeal completion event from the iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "docuseal:completed" || e.data?.completed === true) {
        setState("completed");
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#2E5339] mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading your document…</p>
        </div>
      </div>
    );
  }

  if (state === "completed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm px-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Document Signed!</h1>
          <p className="text-gray-500 mb-6">
            Thank you. Your signed copy will be saved to your client file and emailed to you.
          </p>
          <p className="text-sm text-gray-400">You may close this window.</p>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm px-6">
          <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link Unavailable</h1>
          <p className="text-gray-500 mb-6">{errorMsg}</p>
          <p className="text-sm text-gray-400">
            If you believe this is a mistake, contact your case manager at{" "}
            <a href="tel:8554543387" className="text-[#2E5339] underline">(855) 454-3387</a>.
          </p>
        </div>
      </div>
    );
  }

  // ready — render DocuSeal iframe
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Branded header */}
      <header className="bg-[#2E5339] text-white px-6 py-4 flex items-center gap-3 shadow-md">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">LH</div>
        <div>
          <p className="font-semibold text-sm leading-none">Life House Reentry Program</p>
          <p className="text-xs text-white/70 mt-0.5">Secure Document Signing</p>
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        <iframe
          src={embedUrl}
          className="flex-1 w-full border-0"
          style={{ minHeight: "calc(100vh - 64px)" }}
          allow="camera; microphone"
          title="Sign Document"
          onLoad={() => {
            // DocuSeal redirects to a completion URL — detect via postMessage above
          }}
        />
      </div>
    </div>
  );
}
