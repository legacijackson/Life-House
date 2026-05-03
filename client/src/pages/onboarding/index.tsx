import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearch, useLocation } from "wouter";
import {
  CheckCircle2, Circle, Clock, ChevronRight, ChevronLeft,
  Save, AlertCircle, Loader2, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// ── Phase definitions ─────────────────────────────────────────────────────────

const PHASES = [
  { key: "P1", label: "Initial Contact & Intake" },
  { key: "P2", label: "Benefits & Eligibility" },
  { key: "P3", label: "Housing Placement" },
  { key: "P4", label: "Move-In & Orientation" },
  { key: "P5", label: "Medi-Cal & Insurance" },
  { key: "P6", label: "Care Plan Development" },
  { key: "P7", label: "Case Manager Assignment" },
  { key: "P8", label: "Program Enrollment" },
  { key: "P9", label: "Employment & Education" },
  { key: "P10", label: "Legal & Supervision" },
  { key: "P11", label: "Health & Wellness" },
  { key: "P12", label: "Life Skills" },
  { key: "P13", label: "Completion & Exit Planning" },
];

// ── Auto-save hook ────────────────────────────────────────────────────────────

function useAutoSave(clientId: string | null, phaseKey: string) {
  const qc = useQueryClient();
  const timerRef = useRef<NodeJS.Timeout>();

  const mutation = useMutation({
    mutationFn: (fields: Record<string, string>) =>
      apiRequest("POST", "/api/onboarding/field-save", { clientId, phaseKey, fields }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/onboarding/phases", clientId] }),
  });

  function scheduleAutoSave(fields: Record<string, string>) {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => mutation.mutate(fields), 1200);
  }

  return { scheduleAutoSave, isSaving: mutation.isPending };
}

// ── Phase Panel ───────────────────────────────────────────────────────────────

function PhasePanel({ phase, clientId, phaseData, onComplete }: {
  phase: typeof PHASES[0];
  clientId: string;
  phaseData: any;
  onComplete: () => void;
}) {
  const [fields, setFields] = useState<Record<string, string>>(phaseData?.data ?? {});
  const { scheduleAutoSave, isSaving } = useAutoSave(clientId, phase.key);
  const { toast } = useToast();
  const qc = useQueryClient();

  const setField = (name: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const updated = { ...fields, [name]: e.target.value };
    setFields(updated);
    scheduleAutoSave(updated);
  };

  const completePhase = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/onboarding/complete-phase", { clientId, phaseKey: phase.key }),
    onSuccess: () => {
      toast({ title: `Phase ${phase.key} completed` });
      qc.invalidateQueries({ queryKey: ["/api/onboarding/phases", clientId] });
      onComplete();
    },
  });

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{phase.label}</h2>
            <p className="text-sm text-gray-500">{phase.key}</p>
          </div>
          {isSaving && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving…
            </span>
          )}
        </div>

        {/* Phase-specific fields */}
        <PhaseFields phase={phase} fields={fields} setField={setField} />

        <div className="mt-8 flex justify-end">
          <Button
            onClick={() => completePhase.mutate()}
            disabled={completePhase.isPending}
          >
            {completePhase.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Completing…</>
            ) : (
              <><CheckCircle2 className="h-4 w-4 mr-2" /> Complete Phase</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Phase-specific field definitions ─────────────────────────────────────────

function PhaseFields({ phase, fields, setField }: {
  phase: typeof PHASES[0];
  fields: Record<string, string>;
  setField: (name: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) {
  const text = (name: string, label: string, type = "text") => (
    <div key={name}>
      <Label className="text-xs">{label}</Label>
      <Input type={type} className="h-9 text-sm mt-1" value={fields[name] ?? ""} onChange={setField(name)} />
    </div>
  );

  const area = (name: string, label: string) => (
    <div key={name}>
      <Label className="text-xs">{label}</Label>
      <Textarea className="text-sm mt-1" rows={3} value={fields[name] ?? ""} onChange={setField(name)} />
    </div>
  );

  switch (phase.key) {
    case "P1":
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {text("firstName", "First Name")}
            {text("lastName", "Last Name")}
            {text("phone", "Phone")}
            {text("email", "Email")}
            {text("dob", "Date of Birth", "date")}
            {text("cin", "CIN Number")}
          </div>
          {area("reasonForContact", "Reason for Contact")}
          {text("referralSource", "Referral Source")}
          {text("supervisionType", "Supervision Type (parole/probation)")}
          {text("releaseDate", "Release Date", "date")}
        </div>
      );

    case "P2":
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Assist client with benefits applications.</p>
          {text("mcp", "Managed Care Plan (MCP)")}
          {text("mediCalStatus", "Medi-Cal Status")}
          {text("calFreshStatus", "CalFresh Status")}
          {text("ssiStatus", "SSI/SSDI Status")}
          {text("gaStatus", "GA Status")}
          <div className="p-3 bg-blue-50 rounded-lg text-sm">
            <p className="font-medium text-blue-800 mb-2">Benefits Applications</p>
            <a
              href="https://benefitscal.com/ApplyForBenefits/begin/ABOVR?lang=en"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-1"
            >
              <ExternalLink className="h-3.5 w-3.5" /> BenefitsCal Application
            </a>
          </div>
          {area("benefitsNotes", "Benefits Notes")}
        </div>
      );

    case "P3":
      return (
        <div className="space-y-4">
          {text("bedAssignment", "Bed Assignment")}
          {text("propertyAddress", "Property Address")}
          {text("moveInDate", "Move-In Date", "date")}
          {text("rentAmount", "Rent Amount ($)")}
          {text("payType", "Pay Type (self-pay / insurance)")}
          {area("moveInNotes", "Move-In Notes")}
        </div>
      );

    case "P4":
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-700 font-medium">Orientation Checklist</p>
          {[
            "House rules reviewed",
            "Emergency contacts collected",
            "Keys/access issued",
            "Lease/occupancy agreement signed",
            "Tour completed",
            "Medications protocol reviewed",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={fields[`check_${item}`] === "1"}
                onChange={(e) =>
                  setField(`check_${item}`)({ target: { value: e.target.checked ? "1" : "" } } as any)
                }
                className="h-4 w-4"
              />
              <Label className="text-sm">{item}</Label>
            </div>
          ))}
          {area("orientationNotes", "Orientation Notes")}
        </div>
      );

    case "P5":
      return (
        <div className="space-y-4">
          {text("mediCalNumber", "Medi-Cal Number")}
          {text("authorizationCode", "Authorization Code")}
          {text("icd10Primary", "Primary ICD-10 Code")}
          {text("pcpName", "PCP Name")}
          {text("pcpPhone", "PCP Phone")}
          <div className="p-3 bg-blue-50 rounded-lg text-sm">
            <a
              href="https://provider-portal.apps.prd.cammis.medi-cal.ca.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-1"
            >
              <ExternalLink className="h-3.5 w-3.5" /> CAMMIS Provider Portal
            </a>
          </div>
        </div>
      );

    case "P6":
      return (
        <div className="space-y-4">
          {text("carePlanDueDate", "Care Plan Due Date", "date")}
          {area("goals", "Client Goals (one per line)")}
          {area("carePlanNotes", "Care Plan Notes")}
          <p className="text-xs text-gray-500">Care plan must be completed within 3 days of move-in.</p>
        </div>
      );

    default:
      return (
        <div className="space-y-4">
          {area("notes", `${phase.label} Notes`)}
          {area("actionItems", "Action Items")}
          {area("outcome", "Outcome")}
        </div>
      );
  }
}

// ── Main Onboarding Page ──────────────────────────────────────────────────────

export default function OnboardingPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const clientId = params.get("clientId");
  const [, setLocation] = useLocation();
  const [activePhase, setActivePhase] = useState(0);
  const phaseStartRef = useRef<number>(Date.now());
  const qc = useQueryClient();

  const { data: phaseStates = [] } = useQuery({
    queryKey: ["/api/onboarding/phases", clientId],
    queryFn: () => {
      if (!clientId) return [];
      return apiRequest("GET", `/api/onboarding/phases?clientId=${clientId}`).then((r) => r.json());
    },
    enabled: !!clientId,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    phaseStartRef.current = Date.now();
  }, [activePhase]);

  function getPhaseState(key: string) {
    return (phaseStates as any[]).find((p: any) => p.phaseKey === key);
  }

  const currentPhase = PHASES[activePhase];
  const currentState = getPhaseState(currentPhase.key);

  if (!clientId) {
    return (
      <div className="flex items-center justify-center h-full p-12 text-center">
        <div>
          <AlertCircle className="mx-auto h-12 w-12 text-amber-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Client Selected</h2>
          <p className="text-gray-500 text-sm mb-4">
            Navigate here from the Intake page or Clients page to start onboarding.
          </p>
          <Button variant="outline" onClick={() => setLocation("/app/intake")}>
            Go to Intake
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Side Panel */}
      <div className="w-64 border-r bg-gray-50 flex-shrink-0 overflow-y-auto">
        <div className="p-4 border-b bg-white">
          <h2 className="font-semibold text-gray-800">Onboarding</h2>
          <p className="text-xs text-gray-500 mt-0.5">Client #{clientId?.slice(-6)}</p>
        </div>
        <nav className="p-2 space-y-0.5">
          {PHASES.map((phase, i) => {
            const state = getPhaseState(phase.key);
            const isCompleted = state?.status === "completed";
            const isActive = i === activePhase;
            return (
              <button
                key={phase.key}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => setActivePhase(i)}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                ) : isActive ? (
                  <div className="h-4 w-4 rounded-full border-2 border-indigo-500 flex-shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-300 flex-shrink-0" />
                )}
                <span className="truncate">
                  <span className="text-xs text-gray-400 mr-1">{phase.key}</span>
                  {phase.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <PhasePanel
          phase={currentPhase}
          clientId={clientId}
          phaseData={currentState}
          onComplete={() => {
            if (activePhase < PHASES.length - 1) setActivePhase((i) => i + 1);
          }}
        />

        {/* Navigation */}
        <div className="border-t bg-white px-6 py-3 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActivePhase((i) => Math.max(0, i - 1))}
            disabled={activePhase === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <span className="text-xs text-gray-400">
            Phase {activePhase + 1} of {PHASES.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActivePhase((i) => Math.min(PHASES.length - 1, i + 1))}
            disabled={activePhase === PHASES.length - 1}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
