import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, CheckCircle2, AlertCircle, Send, Heart, Star, Target, Zap, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ icon: Icon, color, title, subtitle, children }: {
  icon: React.ElementType;
  color: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl p-5 ${color}`}>
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/60 flex items-center justify-center">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">{title}</h3>
          {subtitle && <p className="text-xs text-gray-600 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, name, value, onChange, rows = 3, placeholder }: {
  label: string; name: string; value: string; onChange: (v: string) => void;
  rows?: number; placeholder?: string;
}) {
  return (
    <div>
      <Label className="text-xs font-medium text-gray-700 mb-1 block">{label}</Label>
      <Textarea
        rows={rows}
        className="text-sm bg-white/80 resize-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

// ── Main Form ─────────────────────────────────────────────────────────────────

export default function LifeDesignFormPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const set = (key: string) => (value: string) => setForm((p) => ({ ...p, [key]: value }));

  const { data, isLoading, error } = useQuery<{ clientName: string; clientId: string }>({
    queryKey: ["/api/life-design", token],
    queryFn: async () => {
      const r = await apiRequest("GET", `/api/life-design/${token}`);
      if (!r.ok) {
        const body = await r.json();
        if (body.message === "already_submitted") throw new Error("already_submitted");
        throw new Error("not_found");
      }
      return r.json();
    },
    enabled: !!token,
    retry: false,
  });

  const submit = useMutation({
    mutationFn: () => apiRequest("POST", `/api/life-design/${token}/submit`, form),
    onSuccess: () => setSubmitted(true),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error?.message === "already_submitted") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 px-4">
        <div className="text-center max-w-sm bg-white rounded-2xl shadow-sm p-8">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Already Submitted</h2>
          <p className="text-gray-500 text-sm">Your Life Design form has already been submitted. Your case manager will be in touch.</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 px-4">
        <div className="text-center max-w-sm bg-white rounded-2xl shadow-sm p-8">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Link Not Found</h2>
          <p className="text-gray-500 text-sm">This form link is invalid or has expired. Please contact your case manager.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 px-4">
        <div className="text-center max-w-sm bg-white rounded-2xl shadow-sm p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Thank You, {data.clientName.split(" ")[0]}!</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Your 30-Day Life Design form has been submitted. Your case manager will review your goals and reach out to support your journey.
          </p>
          <p className="text-xs text-gray-400 mt-4">Life House Reentry Services</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">LH</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">30-Day Life Design</h1>
          <p className="text-gray-600 mt-1">
            Hi <strong>{data.clientName.split(" ")[0]}</strong> — take a few minutes to reflect and set your intentions for the next 30 days.
          </p>
        </div>

        <div className="space-y-5">
          {/* Goals */}
          <Section icon={Target} color="bg-blue-50" title="Your 30-Day Goals"
            subtitle="What are the 3 most important things you want to accomplish in the next 30 days?">
            <Field label="Goal 1" name="goal1" value={form.goal1 ?? ""} onChange={set("goal1")}
              placeholder="e.g. Get my driver's license renewed" rows={2} />
            <Field label="Goal 2" name="goal2" value={form.goal2 ?? ""} onChange={set("goal2")}
              placeholder="e.g. Apply for 3 jobs" rows={2} />
            <Field label="Goal 3" name="goal3" value={form.goal3 ?? ""} onChange={set("goal3")}
              placeholder="e.g. Stay clean and attend weekly meetings" rows={2} />
          </Section>

          {/* Strengths */}
          <Section icon={Star} color="bg-amber-50" title="Your Strengths"
            subtitle="What are you good at? What has helped you survive tough times?">
            <Field label="My strengths and what I'm proud of" name="strengths" value={form.strengths ?? ""} onChange={set("strengths")}
              placeholder="e.g. I'm resilient, I care about my family, I'm good with my hands…" rows={4} />
          </Section>

          {/* Challenges */}
          <Section icon={Zap} color="bg-orange-50" title="Challenges & Support"
            subtitle="What might get in the way? What do you need from your case manager?">
            <Field label="Challenges I anticipate" name="challenges" value={form.challenges ?? ""} onChange={set("challenges")}
              placeholder="e.g. Finding housing, transportation, staying away from old friends who use…" rows={3} />
            <Field label="Support I need from my case manager" name="supportNeeded" value={form.supportNeeded ?? ""} onChange={set("supportNeeded")}
              placeholder="e.g. Help with job applications, someone to talk to weekly…" rows={3} />
          </Section>

          {/* Daily Life */}
          <Section icon={Sun} color="bg-green-50" title="Your Ideal Day"
            subtitle="Describe what a successful, healthy day looks like for you 30 days from now.">
            <Field label="Describe your ideal daily routine" name="idealDay" value={form.idealDay ?? ""} onChange={set("idealDay")}
              placeholder="e.g. Wake up at 7am, exercise, go to work, cook dinner, call my kids before bed…" rows={4} />
            <Field label="One habit I want to build or change" name="habitChange" value={form.habitChange ?? ""} onChange={set("habitChange")}
              placeholder="e.g. Stop scrolling my phone at night and read instead" rows={2} />
          </Section>

          {/* Relationships */}
          <Section icon={Heart} color="bg-pink-50" title="People & Relationships"
            subtitle="Who matters most to you? How do you want to show up for them?">
            <Field label="Who I want to reconnect with or strengthen" name="relationships" value={form.relationships ?? ""} onChange={set("relationships")}
              placeholder="e.g. My daughter, my sister, my sponsor…" rows={2} />
            <Field label="How I want to show up for them" name="showUp" value={form.showUp ?? ""} onChange={set("showUp")}
              placeholder="e.g. Be present, call every week, keep my promises…" rows={2} />
          </Section>

          {/* Anything else */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <Label className="text-sm font-semibold text-gray-700 block mb-2">Anything else you want your case manager to know?</Label>
            <Textarea
              rows={4}
              className="text-sm"
              value={form.additionalNotes ?? ""}
              onChange={(e) => set("additionalNotes")(e.target.value)}
              placeholder="Share anything on your mind — questions, worries, hopes, or things you don't know how to ask for yet."
            />
          </div>

          {/* Name confirmation */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <Label className="text-sm font-semibold text-gray-700 block mb-1">Your signature (type your full name)</Label>
            <p className="text-xs text-gray-500 mb-2">By typing your name you confirm this is your own work and reflects your honest thoughts.</p>
            <Input
              className="text-sm"
              value={form.signature ?? ""}
              onChange={(e) => set("signature")(e.target.value)}
              placeholder={data.clientName}
            />
          </div>

          <Button
            className="w-full h-12 text-base"
            onClick={() => submit.mutate()}
            disabled={!form.goal1 || !form.signature || submit.isPending}
          >
            {submit.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…</>
            ) : (
              <><Send className="h-4 w-4 mr-2" /> Submit My 30-Day Life Design</>
            )}
          </Button>

          {submit.isError && (
            <p className="text-red-500 text-sm text-center">Something went wrong. Please try again.</p>
          )}

          <p className="text-center text-xs text-gray-400 pb-4">
            Life House Reentry Services · Your responses are confidential and shared only with your case manager.
          </p>
        </div>
      </div>
    </div>
  );
}
