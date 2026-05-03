import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, CheckCircle2, AlertCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";

// ── Kaiser-specific form fields ───────────────────────────────────────────────

function KaiserForm({ fields, setField, setSelectField }: FormProps) {
  return (
    <>
      <div className="p-3 bg-blue-50 rounded-lg text-sm mb-4">
        <p className="font-semibold text-blue-800">Kaiser ECM/CHW Referral Form</p>
        <p className="text-blue-700 text-xs mt-1">Complete all fields. This form will be routed to Kaiser Care Management.</p>
      </div>
      <Field label="ECM Program Type" required>
        <Select value={fields.ecmType ?? ""} onValueChange={(v) => setSelectField("ecmType", v)}>
          <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ECM">Enhanced Care Management (ECM)</SelectItem>
            <SelectItem value="CHW">Community Health Worker (CHW)</SelectItem>
            <SelectItem value="CS_Housing">Community Support — Transitional Housing</SelectItem>
            <SelectItem value="CS_IHSS">Community Support — IHSS Enrollment</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="ICD-10 Primary Diagnosis Code" required>
        <Input value={fields.icd10 ?? ""} onChange={setField("icd10")} placeholder="e.g. F10.20" />
      </Field>
      <Field label="LOCUS Score">
        <Input type="number" value={fields.locusScore ?? ""} onChange={setField("locusScore")} placeholder="0–40" />
      </Field>
      <Field label="Clinical Justification" required>
        <Textarea rows={4} value={fields.clinicalJustification ?? ""} onChange={setField("clinicalJustification")}
          placeholder="Describe clinical need, barriers to care, and how ECM will address them…" />
      </Field>
      <Field label="Prior Authorization Number (if applicable)">
        <Input value={fields.priorAuth ?? ""} onChange={setField("priorAuth")} />
      </Field>
      <Field label="Referring Provider Name" required>
        <Input value={fields.referringProvider ?? ""} onChange={setField("referringProvider")} />
      </Field>
      <Field label="Referring Provider NPI" required>
        <Input value={fields.referringNpi ?? ""} onChange={setField("referringNpi")} />
      </Field>
    </>
  );
}

// ── Anthem form ───────────────────────────────────────────────────────────────

function AnthemForm({ fields, setField, setSelectField }: FormProps) {
  return (
    <>
      <div className="p-3 bg-amber-50 rounded-lg text-sm mb-4">
        <p className="font-semibold text-amber-800">Anthem ECM / Community Support Referral</p>
        <p className="text-amber-700 text-xs mt-1">Submit this form to Anthem Care Management. Authorization required before services begin.</p>
      </div>
      <Field label="Service Type" required>
        <Select value={fields.serviceType ?? ""} onValueChange={(v) => setSelectField("serviceType", v)}>
          <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ECM">Enhanced Care Management</SelectItem>
            <SelectItem value="CS_Housing">Community Support — Housing Transition</SelectItem>
            <SelectItem value="CS_IHSS">Community Support — IHSS Enrollment</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Diagnosis / Clinical Summary" required>
        <Textarea rows={3} value={fields.clinicalSummary ?? ""} onChange={setField("clinicalSummary")} />
      </Field>
      <Field label="Housing Plan Attached">
        <Select value={fields.housingPlanAttached ?? ""} onValueChange={(v) => setSelectField("housingPlanAttached", v)}>
          <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes — attached to fax/portal submission</SelectItem>
            <SelectItem value="no">No — will follow</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Referring Provider Name" required>
        <Input value={fields.referringProvider ?? ""} onChange={setField("referringProvider")} />
      </Field>
      <Field label="Referring Provider NPI" required>
        <Input value={fields.referringNpi ?? ""} onChange={setField("referringNpi")} />
      </Field>
    </>
  );
}

// ── Generic form (HealthNet, Molina, Other) ───────────────────────────────────

function GenericForm({ fields, setField, setSelectField, mcpPlan }: FormProps & { mcpPlan?: string }) {
  return (
    <>
      <Field label="Service Type" required>
        <Select value={fields.serviceType ?? ""} onValueChange={(v) => setSelectField("serviceType", v)}>
          <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ECM">Enhanced Care Management</SelectItem>
            <SelectItem value="CS_Housing">Community Support — Housing</SelectItem>
            <SelectItem value="CS_Other">Community Support — Other</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Primary Diagnosis (ICD-10)" required>
        <Input value={fields.icd10 ?? ""} onChange={setField("icd10")} placeholder="e.g. F20.9" />
      </Field>
      <Field label="Clinical Justification / Summary" required>
        <Textarea rows={4} value={fields.clinicalJustification ?? ""} onChange={setField("clinicalJustification")}
          placeholder="Describe the client's needs and how this service will help…" />
      </Field>
      <Field label="Referring Provider Name" required>
        <Input value={fields.referringProvider ?? ""} onChange={setField("referringProvider")} />
      </Field>
      <Field label="Referring Provider NPI" required>
        <Input value={fields.referringNpi ?? ""} onChange={setField("referringNpi")} />
      </Field>
      <Field label="Referring Organization">
        <Input value={fields.referringOrg ?? ""} onChange={setField("referringOrg")} />
      </Field>
    </>
  );
}

// ── Shared field wrapper ──────────────────────────────────────────────────────

type FormProps = {
  fields: Record<string, string>;
  setField: (name: string) => React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  setSelectField: (name: string, value: string) => void;
};

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <Label className="text-xs mb-1 block">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
    </div>
  );
}

// ── Main LCP Form Page ────────────────────────────────────────────────────────

export default function LcpFormPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [fields, setFieldsState] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const setField = (name: string): React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> =>
    (e) => setFieldsState((prev) => ({ ...prev, [name]: e.target.value }));

  const setSelectField = (name: string, value: string) =>
    setFieldsState((prev) => ({ ...prev, [name]: value }));

  const { data, isLoading, error } = useQuery<{ clientName: string; mcpPlan: string | null; invite: any }>({
    queryKey: ["/api/lcp", token],
    queryFn: () => apiRequest("GET", `/api/lcp/${token}`).then((r) => {
      if (!r.ok) throw new Error("Not found");
      return r.json();
    }),
    enabled: !!token,
    retry: false,
  });

  const submit = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/lcp/${token}/complete`, {
        ...fields,
        submittedAt: new Date().toISOString(),
      }),
    onSuccess: () => setSubmitted(true),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Link Not Found</h2>
          <p className="text-gray-500 text-sm">
            This referral link is invalid, has expired, or has already been completed. Please contact Life House staff.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Referral Submitted</h2>
          <p className="text-gray-600 text-sm">
            Thank you for completing the referral for <strong>{data.clientName}</strong>.
            Life House staff have been notified.
          </p>
        </div>
      </div>
    );
  }

  const mcpPlan = data.mcpPlan ?? "Other";
  const formProps: FormProps = { fields, setField, setSelectField };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-sm p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 border-b pb-4">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">LH</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Life House — LCP Referral</h1>
            <p className="text-xs text-gray-500">Linking Clinical Providers for reentry client support</p>
          </div>
        </div>

        <div className="mb-6 p-3 bg-indigo-50 rounded-lg text-sm">
          <p className="text-indigo-800">
            You have been invited to complete an LCP referral for client <strong>{data.clientName}</strong>.
            {mcpPlan && mcpPlan !== "Other" && (
              <span className="ml-1">Managed Care Plan: <strong>{mcpPlan}</strong>.</span>
            )}
          </p>
        </div>

        <div className="space-y-4">
          {/* Common fields */}
          <Field label="Your Full Name" required>
            <Input value={fields.lcpSubmitterName ?? ""} onChange={setField("lcpSubmitterName")} placeholder="Dr. Jane Smith" />
          </Field>
          <Field label="Your Email" required>
            <Input type="email" value={fields.lcpSubmitterEmail ?? ""} onChange={setField("lcpSubmitterEmail")} />
          </Field>
          <Field label="Your Phone">
            <Input value={fields.lcpSubmitterPhone ?? ""} onChange={setField("lcpSubmitterPhone")} />
          </Field>
          <Field label="Organization / Practice">
            <Input value={fields.lcpOrg ?? ""} onChange={setField("lcpOrg")} />
          </Field>

          <hr className="my-2" />

          {/* Plan-specific fields */}
          {mcpPlan === "Kaiser" && <KaiserForm {...formProps} />}
          {mcpPlan === "Anthem" && <AnthemForm {...formProps} />}
          {(mcpPlan !== "Kaiser" && mcpPlan !== "Anthem") && (
            <GenericForm {...formProps} mcpPlan={mcpPlan} />
          )}

          <Field label="Additional Notes / Comments">
            <Textarea rows={3} value={fields.additionalNotes ?? ""} onChange={setField("additionalNotes")} />
          </Field>

          <Button
            className="w-full mt-2"
            onClick={() => submit.mutate()}
            disabled={submit.isPending || !fields.lcpSubmitterName || !fields.lcpSubmitterEmail}
          >
            {submit.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…</>
            ) : (
              <><Send className="h-4 w-4 mr-2" /> Submit Referral</>
            )}
          </Button>

          {submit.isError && (
            <p className="text-red-500 text-sm text-center">Submission failed. Please try again.</p>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Life House Reentry Services · HIPAA Compliant
        </p>
      </div>
    </div>
  );
}
