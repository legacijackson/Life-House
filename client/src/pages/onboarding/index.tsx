import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearch, useLocation } from "wouter";
import {
  CheckCircle2, Circle, Clock, ChevronRight, ChevronLeft,
  Save, AlertCircle, Loader2, ExternalLink, Mail, Youtube,
  UserCheck, RefreshCw, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const MCP_PLANS = ["Kaiser", "Anthem", "HealthNet", "Molina", "LA Care", "Blue Shield", "Other"];

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

  useEffect(() => {
    setFields(phaseData?.data ?? {});
  }, [phaseData]);

  const setField = (name: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const updated = { ...fields, [name]: e.target.value };
    setFields(updated);
    scheduleAutoSave(updated);
  };

  const setSelectField = (name: string, value: string) => {
    const updated = { ...fields, [name]: value };
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

        <PhaseFields
          phase={phase}
          fields={fields}
          setField={setField}
          setSelectField={setSelectField}
          clientId={clientId}
        />

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

// ── LCP Invite Panel (P7) ─────────────────────────────────────────────────────

function LcpInvitePanel({ clientId, mcpPlan }: { clientId: string; mcpPlan?: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [lcpEmail, setLcpEmail] = useState("");
  const [lcpName, setLcpName] = useState("");

  const { data: invites = [] } = useQuery<any[]>({
    queryKey: ["/api/onboarding/lcp-invite", clientId],
    queryFn: () => apiRequest("GET", `/api/onboarding/lcp-invite/${clientId}`).then((r) => r.json()),
    enabled: !!clientId,
    refetchInterval: 30_000,
  });

  const sendInvite = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/onboarding/lcp-invite", { clientId, lcpEmail, lcpName, mcpPlan }),
    onSuccess: () => {
      toast({ title: "LCP invite sent", description: `Invite link sent to ${lcpEmail}` });
      setLcpEmail("");
      setLcpName("");
      qc.invalidateQueries({ queryKey: ["/api/onboarding/lcp-invite", clientId] });
    },
    onError: () => toast({ title: "Error", description: "Failed to send invite", variant: "destructive" }),
  });

  const latestInvite = invites[0];
  const isCompleted = latestInvite?.status === "completed";

  return (
    <div className="mt-4 p-4 border rounded-lg bg-indigo-50">
      <p className="text-sm font-medium text-indigo-800 mb-3 flex items-center gap-2">
        <UserCheck className="h-4 w-4" /> LCP Referral Assignment
        {mcpPlan && <Badge variant="outline" className="text-xs">{mcpPlan}</Badge>}
      </p>

      {isCompleted ? (
        <div className="flex items-center gap-2 text-green-700 text-sm">
          <CheckCircle2 className="h-4 w-4" />
          LCP referral completed by {latestInvite.lcpName ?? latestInvite.lcpEmail}
          {latestInvite.completedAt && (
            <span className="text-gray-500 text-xs ml-1">
              on {new Date(latestInvite.completedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      ) : latestInvite ? (
        <div className="space-y-2">
          <p className="text-sm text-amber-700">
            Invite sent to <strong>{latestInvite.lcpEmail}</strong> — awaiting completion
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => sendInvite.mutate()}
            disabled={sendInvite.isPending}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Resend
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">LCP Email *</Label>
              <Input
                type="email"
                className="h-8 text-sm mt-1"
                value={lcpEmail}
                onChange={(e) => setLcpEmail(e.target.value)}
                placeholder="lcp@provider.org"
              />
            </div>
            <div>
              <Label className="text-xs">LCP Name</Label>
              <Input
                className="h-8 text-sm mt-1"
                value={lcpName}
                onChange={(e) => setLcpName(e.target.value)}
                placeholder="Dr. Jane Smith"
              />
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => sendInvite.mutate()}
            disabled={!lcpEmail || sendInvite.isPending}
          >
            {sendInvite.isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5 mr-1.5" />
            )}
            Send LCP Referral Invite
          </Button>
        </div>
      )}
    </div>
  );
}

// ── YouTube Watch Tracker (P8) ────────────────────────────────────────────────

function YoutubeTracker({ clientId, videoId, videoTitle }: { clientId: string; videoId: string; videoTitle: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: watchEvents = [] } = useQuery<any[]>({
    queryKey: ["/api/onboarding/youtube-watched", clientId],
    queryFn: () => apiRequest("GET", `/api/onboarding/youtube-watched/${clientId}`).then((r) => r.json()),
    enabled: !!clientId,
  });

  const thisVideo = (watchEvents as any[]).find((e) => e.videoId === videoId);
  const isComplete = (thisVideo?.percentWatched ?? 0) >= 90;

  const markWatched = useMutation({
    mutationFn: (percent: number) =>
      apiRequest("POST", "/api/onboarding/youtube-watched", { clientId, videoId, videoTitle, percentWatched: percent }),
    onSuccess: (_, percent) => {
      toast({ title: percent >= 90 ? "Session marked complete ✓" : "Progress saved" });
      qc.invalidateQueries({ queryKey: ["/api/onboarding/youtube-watched", clientId] });
    },
  });

  return (
    <div className="mt-4 p-4 border rounded-lg bg-red-50">
      <p className="text-sm font-medium text-red-800 mb-3 flex items-center gap-2">
        <Youtube className="h-4 w-4" /> {videoTitle}
        {isComplete && <Badge className="bg-green-100 text-green-700 text-xs">Completed ✓</Badge>}
      </p>
      <a
        href={`https://www.youtube.com/watch?v=${videoId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-red-600 hover:underline flex items-center gap-1 text-sm mb-3"
      >
        <ExternalLink className="h-3.5 w-3.5" /> Watch on YouTube
      </a>
      <div className="flex gap-2 flex-wrap">
        {[25, 50, 75, 90, 100].map((pct) => (
          <Button
            key={pct}
            size="sm"
            variant={isComplete && pct <= (thisVideo?.percentWatched ?? 0) ? "default" : "outline"}
            className={`text-xs ${(thisVideo?.percentWatched ?? 0) >= pct ? "border-green-500 text-green-700" : ""}`}
            onClick={() => markWatched.mutate(pct)}
            disabled={markWatched.isPending}
          >
            {pct}%{pct === 90 ? " (Complete)" : ""}
          </Button>
        ))}
      </div>
      {thisVideo && (
        <p className="text-xs text-gray-500 mt-2">
          Last recorded: {thisVideo.percentWatched}% watched
        </p>
      )}
    </div>
  );
}

// ── Life Design Form Sender (P6) ──────────────────────────────────────────────

function LifeDesignSender({ clientId }: { clientId: string }) {
  const { toast } = useToast();

  const send = useMutation({
    mutationFn: () => apiRequest("POST", "/api/onboarding/life-design-send", { clientId }),
    onSuccess: () => toast({ title: "30-Day Life Design form emailed to client" }),
    onError: () => toast({ title: "Error", description: "Failed to send email", variant: "destructive" }),
  });

  return (
    <div className="mt-4 p-4 border rounded-lg bg-purple-50">
      <p className="text-sm font-medium text-purple-800 mb-2 flex items-center gap-2">
        <Mail className="h-4 w-4" /> 30-Day Life Design Form
      </p>
      <p className="text-xs text-gray-600 mb-3">
        Email the client a personalized link to complete their 30-day life design form. They can fill it out independently and it will route back to the case manager.
      </p>
      <Button
        size="sm"
        onClick={() => send.mutate()}
        disabled={send.isPending}
        className="bg-purple-600 hover:bg-purple-700 text-white"
      >
        {send.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
        Send Life Design Form
      </Button>
    </div>
  );
}

// ── Phase-specific field definitions ─────────────────────────────────────────

function PhaseFields({ phase, fields, setField, setSelectField, clientId }: {
  phase: typeof PHASES[0];
  fields: Record<string, string>;
  setField: (name: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  setSelectField: (name: string, value: string) => void;
  clientId: string;
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

  const sel = (name: string, label: string, options: string[]) => (
    <div key={name}>
      <Label className="text-xs">{label}</Label>
      <Select value={fields[name] ?? ""} onValueChange={(v) => setSelectField(name, v)}>
        <SelectTrigger className="h-9 text-sm mt-1">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  const check = (name: string, label: string) => (
    <div key={name} className="flex items-center gap-2">
      <input
        type="checkbox"
        id={name}
        checked={fields[name] === "1"}
        onChange={(e) => setField(name)({ target: { value: e.target.checked ? "1" : "" } } as any)}
        className="h-4 w-4"
      />
      <Label htmlFor={name} className="text-sm cursor-pointer">{label}</Label>
    </div>
  );

  const mcpPlan = fields["mcp"] ?? "";

  // ── Kaiser-specific CoC guidance ────────────────────────────────────────────
  const KaiserGuide = () => (
    <div className="p-3 bg-blue-50 rounded-lg text-sm mt-2">
      <p className="font-semibold text-blue-800 mb-1">Kaiser ECM/CHW Routing</p>
      <ul className="text-blue-700 space-y-1 text-xs list-disc list-inside">
        <li>Submit ECM Authorization Request to Kaiser Care Management</li>
        <li>Include ICD-10 primary + LOCUS score in referral</li>
        <li>Community Support: Transitional Housing form required</li>
        <li>Non-Resident: complete Non-Resident Enrollment form</li>
        <li>Email routing: ecm@kp.org (Southern CA)</li>
      </ul>
    </div>
  );

  const AnthemGuide = () => (
    <div className="p-3 bg-amber-50 rounded-lg text-sm mt-2">
      <p className="font-semibold text-amber-800 mb-1">Anthem ECM/Community Support Routing</p>
      <ul className="text-amber-700 space-y-1 text-xs list-disc list-inside">
        <li>ECM: submit to Anthem Care Management via fax or portal</li>
        <li>Community Support (Transitional Housing): attach housing plan</li>
        <li>Authorization required before billing</li>
      </ul>
    </div>
  );

  const HealthNetGuide = () => (
    <div className="p-3 bg-green-50 rounded-lg text-sm mt-2">
      <p className="font-semibold text-green-800 mb-1">HealthNet ECM/Community Support Routing</p>
      <ul className="text-green-700 space-y-1 text-xs list-disc list-inside">
        <li>ECM referral via HealthNet Provider Portal</li>
        <li>Community Support: Housing Transition Navigator required</li>
        <li>Attach signed consent form with referral</li>
      </ul>
    </div>
  );

  const MolinaGuide = () => (
    <div className="p-3 bg-purple-50 rounded-lg text-sm mt-2">
      <p className="font-semibold text-purple-800 mb-1">Molina ECM/Community Support Routing</p>
      <ul className="text-purple-700 space-y-1 text-xs list-disc list-inside">
        <li>ECM: Molina My Care LA referral line 1-844-767-6448</li>
        <li>Community Support: submit Housing Transition form</li>
        <li>Prior auth required for all CS services</li>
      </ul>
    </div>
  );

  const McpGuide = () => {
    if (mcpPlan === "Kaiser") return <KaiserGuide />;
    if (mcpPlan === "Anthem") return <AnthemGuide />;
    if (mcpPlan === "HealthNet") return <HealthNetGuide />;
    if (mcpPlan === "Molina") return <MolinaGuide />;
    return null;
  };

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
            {text("ssn", "Last 4 SSN")}
            {sel("gender", "Gender", ["Male", "Female", "Non-binary", "Other", "Prefer not to say"])}
          </div>
          {area("reasonForContact", "Reason for Contact")}
          {text("referralSource", "Referral Source")}
          {sel("supervisionType", "Supervision Type", ["Parole", "Probation", "PRCS", "Mandatory Supervision", "None"])}
          {text("releaseDate", "Release Date / Expected Release Date", "date")}
          {text("agentName", "Parole/Probation Agent Name")}
          {text("agentPhone", "Agent Phone")}
          {area("criminalHistory", "Criminal History Summary")}
        </div>
      );

    case "P2":
      return (
        <div className="space-y-4">
          {sel("mcp", "Managed Care Plan (MCP)", MCP_PLANS)}
          {text("mediCalStatus", "Medi-Cal Status")}
          {text("calFreshStatus", "CalFresh Status")}
          {text("ssiStatus", "SSI/SSDI Status")}
          {text("gaStatus", "GA Status")}
          {text("ssaBenefitDate", "SSA Benefit Date", "date")}
          {text("gaWorkerName", "GA Worker Name")}
          {text("gaWorkerPhone", "GA Worker Phone")}

          <div className="p-3 bg-blue-50 rounded-lg text-sm">
            <p className="font-medium text-blue-800 mb-2">Benefits Applications</p>
            <div className="space-y-1.5">
              <a
                href="https://benefitscal.com/ApplyForBenefits/begin/ABOVR?lang=en"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-3.5 w-3.5" /> BenefitsCal Application
              </a>
              <a
                href="https://coveredca.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Covered California
              </a>
              <a
                href="https://dpss.lacounty.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-3.5 w-3.5" /> DPSS (GA/GR)
              </a>
            </div>
          </div>

          <McpGuide />

          {mcpPlan && (
            <>
              {text("ecmAuthNumber", "ECM Authorization Number")}
              {text("ecmStartDate", "ECM Start Date", "date")}
              {text("communitySupport", "Community Support Type")}
              {sel("cocStatus", "Continuance of Care Status", ["Not started", "In progress", "Submitted", "Approved", "Denied"])}
            </>
          )}

          {area("benefitsNotes", "Benefits Notes")}
        </div>
      );

    case "P3":
      return (
        <div className="space-y-4">
          {text("bedAssignment", "Bed Assignment (e.g. Room 2 Bunk A)")}
          {text("propertyAddress", "Property Address")}
          {text("moveInDate", "Move-In Date", "date")}
          {text("rentAmount", "Rent Amount ($)")}
          {sel("payType", "Pay Type", ["Self-pay", "Insurance", "GA", "Voucher", "Funded"])}
          {text("leaseStartDate", "Lease Start Date", "date")}
          {text("leaseEndDate", "Lease End Date", "date")}
          {area("moveInNotes", "Move-In Notes")}
          <div className="p-3 bg-yellow-50 rounded-lg text-xs text-yellow-800">
            Drive folder will be created automatically on phase completion.
          </div>
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
            "Life House Handbook reviewed and signed",
            "Personal property sheet completed",
            "Move-in checklist verified",
            "Medical release consent signed",
          ].map((item) => check(`chk_${item.replace(/\W+/g, "_")}`, item))}

          <div className="pt-2 border-t">
            <p className="text-sm font-medium text-gray-700 mb-2">Emergency Contacts</p>
            <div className="grid grid-cols-2 gap-3">
              {text("ec1_name", "Contact 1 Name")}
              {text("ec1_phone", "Contact 1 Phone")}
              {text("ec1_relation", "Relationship")}
              {text("ec2_name", "Contact 2 Name")}
              {text("ec2_phone", "Contact 2 Phone")}
              {text("ec2_relation", "Relationship")}
            </div>
          </div>

          {area("orientationNotes", "Orientation Notes")}
        </div>
      );

    case "P5":
      return (
        <div className="space-y-4">
          {text("mediCalNumber", "Medi-Cal BIC Number")}
          {text("authorizationCode", "Authorization Code")}
          {text("icd10Primary", "Primary ICD-10 Code")}
          {text("icd10Secondary", "Secondary ICD-10 Code")}
          {text("locusScore", "LOCUS Score")}
          {sel("diagnosisCategory", "Diagnosis Category", [
            "SMI", "SED", "SUD", "Co-Occurring", "Physical Health", "Other"
          ])}
          {text("pcpName", "PCP Name")}
          {text("pcpPhone", "PCP Phone")}
          {text("pcpNpi", "PCP NPI")}
          {text("psychiatristName", "Psychiatrist / Prescriber")}
          {text("psychiatristPhone", "Prescriber Phone")}

          <div className="p-3 bg-blue-50 rounded-lg text-sm">
            <p className="font-medium text-blue-800 mb-2">Eligibility Portals</p>
            <div className="space-y-1.5">
              <a href="https://provider-portal.apps.prd.cammis.medi-cal.ca.gov/" target="_blank" rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1">
                <ExternalLink className="h-3.5 w-3.5" /> CAMMIS Provider Portal
              </a>
              <a href="https://medi-cal.ca.gov" target="_blank" rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1">
                <ExternalLink className="h-3.5 w-3.5" /> DHCS Medi-Cal
              </a>
            </div>
          </div>

          {mcpPlan && <McpGuide />}

          {text("priorAuthNumber", "Prior Authorization Number")}
          {text("authStartDate", "Authorization Start Date", "date")}
          {text("authEndDate", "Authorization End Date", "date")}
          {area("insuranceNotes", "Insurance Notes")}
        </div>
      );

    case "P6":
      return (
        <div className="space-y-4">
          {text("carePlanDueDate", "Care Plan Due Date", "date")}
          {text("carePlanCompletedDate", "Care Plan Completed Date", "date")}
          {sel("carePlanStatus", "Care Plan Status", ["Not started", "In progress", "Completed", "Signed"])}
          {area("goals", "Client Goals (one per line)")}
          {area("strengths", "Client Strengths")}
          {area("barriers", "Identified Barriers")}
          {area("interventions", "Planned Interventions")}
          {area("carePlanNotes", "Care Plan Notes")}
          <p className="text-xs text-gray-500">Care plan must be completed within 3 days of move-in (DHCS requirement).</p>
          <LifeDesignSender clientId={clientId} />
        </div>
      );

    case "P7":
      return (
        <div className="space-y-4">
          {text("assignedCaseManager", "Assigned Case Manager Name")}
          {text("caseManagerEmail", "Case Manager Email")}
          {text("caseManagerPhone", "Case Manager Phone")}
          {text("caseManagerNpi", "Case Manager NPI")}
          {text("supervisorName", "Supervisor Name")}
          {area("introductionNotes", "Introduction / Handoff Notes")}
          <LcpInvitePanel clientId={clientId} mcpPlan={fields["mcp"]} />
        </div>
      );

    case "P8":
      return (
        <div className="space-y-4">
          {sel("programType", "Program Type", ["ECM", "Community Support", "SUD Residential", "Recovery Housing", "Bridge Housing", "Other"])}
          {text("enrollmentDate", "Enrollment Date", "date")}
          {text("expectedExitDate", "Expected Exit Date", "date")}
          {text("programLocation", "Program Location")}
          {area("programGoals", "Program Goals")}
          {area("enrollmentNotes", "Enrollment Notes")}

          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Orientation Video</p>
            <YoutubeTracker
              clientId={clientId}
              videoId="dQw4w9WgXcQ"
              videoTitle="Life House — Session 1: Program Orientation"
            />
          </div>
        </div>
      );

    case "P9":
      return (
        <div className="space-y-4">
          {sel("employmentStatus", "Employment Status", ["Unemployed", "Part-time", "Full-time", "Self-employed", "Seeking", "Disabled/SSI"])}
          {text("employer", "Employer Name")}
          {text("jobTitle", "Job Title")}
          {text("hourlyWage", "Hourly Wage ($)")}
          {text("educationLevel", "Education Level")}
          {text("schoolOrProgram", "School / Vocational Program")}
          {text("resumeDate", "Resume Completed Date", "date")}
          {area("employmentGoals", "Employment / Education Goals")}
          {area("barriers", "Barriers to Employment")}
          {area("notes", "Notes")}
        </div>
      );

    case "P10":
      return (
        <div className="space-y-4">
          {sel("supervisionStatus", "Supervision Status", ["Active Parole", "Active Probation", "PRCS", "Mandatory Supervision", "Discharged", "None"])}
          {text("agentName", "Agent / Officer Name")}
          {text("agentPhone", "Agent Phone")}
          {text("agentEmail", "Agent Email")}
          {text("nextReportDate", "Next Report Date", "date")}
          {text("dischargeDate", "Projected Discharge Date", "date")}
          {area("specialConditions", "Special Conditions (curfew, restrictions, etc.)")}
          {area("courtCases", "Open Court Cases")}
          {area("legalNotes", "Legal Notes")}
        </div>
      );

    case "P11":
      return (
        <div className="space-y-4">
          {text("primaryDiagnosis", "Primary Diagnosis")}
          {text("medications", "Current Medications")}
          {text("lastPhysical", "Last Physical Exam Date", "date")}
          {text("nextAppointment", "Next Medical Appointment", "date")}
          {sel("substanceUseHistory", "Substance Use History", ["None", "Alcohol", "Cannabis", "Meth", "Opioids", "Multiple", "Other"])}
          {text("sobrietyDate", "Sobriety/Clean Date", "date")}
          {text("naloxoneTraining", "Naloxone Training Date", "date")}
          {check("mentalHealthTx", "Actively enrolled in mental health treatment")}
          {check("sudTx", "Actively enrolled in SUD treatment")}
          {area("healthNotes", "Health & Wellness Notes")}
        </div>
      );

    case "P12":
      return (
        <div className="space-y-4">
          {check("budgetCompleted", "Budget worksheet completed")}
          {check("bankAccountOpened", "Bank account opened")}
          {check("idSecured", "Government ID secured")}
          {check("socialSecurityCard", "Social Security card secured")}
          {check("birthCertificate", "Birth certificate secured")}
          {check("driverLicense", "Driver's license / State ID obtained")}
          {check("transitTraining", "Public transit training completed")}
          {check("cookingClass", "Cooking/Nutrition class attended")}
          {area("lifeSkillsGoals", "Life Skills Goals")}
          {area("notes", "Notes")}
        </div>
      );

    case "P13":
      return (
        <div className="space-y-4">
          {sel("exitType", "Exit Type", ["Successful Completion", "Transfer", "Voluntary", "Administrative Discharge", "Incarceration", "Deceased", "Unknown"])}
          {text("exitDate", "Exit Date", "date")}
          {text("housingDestination", "Housing Destination at Exit")}
          {text("incomeAtExit", "Income at Exit ($)")}
          {sel("maintenanceOfGains", "Maintenance of Gains", ["High", "Moderate", "Low", "Unknown"])}
          {check("aftercareReferralsProvided", "Aftercare referrals provided")}
          {check("exitInterviewCompleted", "Exit interview completed")}
          {area("exitSummary", "Exit Summary")}
          {area("recommendations", "Recommendations for Future Services")}
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

  const completedCount = PHASES.filter((p) => getPhaseState(p.key)?.status === "completed").length;
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
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-indigo-500 h-1.5 rounded-full transition-all"
                style={{ width: `${(completedCount / PHASES.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{completedCount}/{PHASES.length}</span>
          </div>
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
