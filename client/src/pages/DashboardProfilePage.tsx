import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Plus, Loader2, CheckCircle2, Pencil, ArrowLeft, ArrowRight, Save } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { SKILL_SUGGESTIONS } from "@/lib/suggestions";

const UK_INDUSTRIES = [
  "Technology", "Finance & Banking", "Healthcare", "Legal", "Marketing & Media",
  "Engineering", "Education", "Retail & E-commerce", "Construction", "Manufacturing",
  "Hospitality & Tourism", "Consulting", "Logistics & Supply Chain", "Real Estate",
  "Energy & Utilities", "Government & Public Sector", "Non-profit", "Creative Arts",
  "Agriculture", "Other",
];

const UK_CITIES = [
  "London", "Manchester", "Birmingham", "Leeds", "Glasgow", "Edinburgh",
  "Liverpool", "Sheffield", "Bristol", "Cambridge", "Oxford", "Nottingham",
  "Cardiff", "Belfast", "Newcastle", "Leicester", "Coventry", "Bradford",
  "Southampton", "Portsmouth", "Reading", "Brighton", "York", "Bath",
  "Exeter", "Norwich", "Plymouth", "Derby", "Wolverhampton", "Stoke-on-Trent",
  "Other",
];

const WORK_TYPE_OPTIONS = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

const PROFILE_STEPS = ["Basics", "Preferences", "Experience", "Education", "References", "Review"];

type ExperienceItem = {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
};

type EducationItem = {
  id: string;
  school: string;
  qualification: string;
  field: string;
  startDate: string;
  endDate: string;
};

type CertificationItem = {
  id: string;
  name: string;
  issuer: string;
  year: string;
  url: string;
};

type ReferenceItem = {
  id: string;
  name: string;
  role: string;
  company: string;
  email: string;
  phone: string;
  relationship: string;
};

type ProfileForm = {
  industry: string;
  jobTitle: string;
  yearsExperience: string;
  skills: string[];
  locationCity: string;
  locationPostcode: string;
  linkedinUrl: string;
  salaryMin: string;
  salaryMax: string;
  workTypes: string[];
  targetRoles: string;
  dealBreakers: string;
  experiences: ExperienceItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
  references: ReferenceItem[];
};

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function formatNumberInput(value: string): string {
  const digits = onlyDigits(value);
  return digits ? Number(digits).toLocaleString("en-GB") : "";
}

function parseFormattedNumber(value: string): number | null {
  const digits = onlyDigits(value);
  return digits ? parseInt(digits, 10) : null;
}

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

const emptyExperience = (): ExperienceItem => ({
  id: newId(),
  title: "",
  company: "",
  location: "",
  startDate: "",
  endDate: "",
  current: false,
  description: "",
});

const emptyEducation = (): EducationItem => ({
  id: newId(),
  school: "",
  qualification: "",
  field: "",
  startDate: "",
  endDate: "",
});

const emptyCertification = (): CertificationItem => ({
  id: newId(),
  name: "",
  issuer: "",
  year: "",
  url: "",
});

const emptyReference = (): ReferenceItem => ({
  id: newId(),
  name: "",
  role: "",
  company: "",
  email: "",
  phone: "",
  relationship: "",
});

const initialForm: ProfileForm = {
  industry: "",
  jobTitle: "",
  yearsExperience: "",
  skills: [],
  locationCity: "",
  locationPostcode: "",
  linkedinUrl: "",
  salaryMin: "",
  salaryMax: "",
  workTypes: [],
  targetRoles: "",
  dealBreakers: "",
  experiences: [],
  education: [],
  certifications: [],
  references: [],
};

function isFilledRecord<T extends Record<string, any>>(item: T, keys: Array<keyof T>) {
  return keys.some((key) => String(item[key] ?? "").trim().length > 0);
}

export function DashboardProfilePage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [skillInput, setSkillInput] = useState("");
  const [skillFocused, setSkillFocused] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [formSynced, setFormSynced] = useState(false);

  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/profile"],
    retry: false,
  });

  useEffect(() => {
    if (!profile || formSynced) return;
    setForm({
      industry: profile.industry ?? "",
      jobTitle: profile.jobTitle ?? "",
      yearsExperience: profile.yearsExperience?.toString() ?? "",
      skills: profile.skills ?? [],
      locationCity: profile.locationCity ?? "",
      locationPostcode: profile.locationPostcode ?? "",
      linkedinUrl: profile.linkedinUrl ?? "",
      salaryMin: profile.salaryMin != null ? formatNumberInput(String(profile.salaryMin)) : "",
      salaryMax: profile.salaryMax != null ? formatNumberInput(String(profile.salaryMax)) : "",
      workTypes: profile.workTypes ?? [],
      targetRoles: profile.targetRoles?.join(", ") ?? "",
      dealBreakers: profile.dealBreakers ?? "",
      experiences: profile.experiences ?? [],
      education: profile.education ?? [],
      certifications: profile.certifications ?? [],
      references: profile.references ?? [],
    });
    setStep(Math.min(profile.profileStep ?? 0, PROFILE_STEPS.length - 1));
    setFormSynced(true);
  }, [profile, formSynced]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) =>
      apiRequest("POST", "/api/dashboard/profile", data).then((r) => r.json()),
    onSuccess: (data) => {
      qc.setQueryData(["/api/dashboard/profile"], data);
      qc.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: () => toast({ title: "Error", description: "Could not save profile.", variant: "destructive" }),
  });

  const cvMutation = useMutation({
    mutationFn: async (file: File) => {
      const buffer = await file.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
      const resp = await fetch("/api/dashboard/profile/cv", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, mimeType: file.type, data: btoa(binary) }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || "Upload failed");
      return data;
    },
    onSuccess: (data) => {
      toast({ title: "CV uploaded", description: "Your CV has been parsed and profile updated." });
      if (data.profile) qc.setQueryData(["/api/dashboard/profile"], data.profile);
      const parsed = data.parsed ?? {
        industry: data.industry,
        jobTitle: data.parsedTitle,
        yearsExperience: data.yearsExperience,
        skills: data.parsedSkills,
      };
      setForm((f) => ({
        ...f,
        industry: parsed.industry ?? f.industry,
        jobTitle: parsed.jobTitle ?? f.jobTitle,
        yearsExperience: parsed.yearsExperience?.toString() ?? f.yearsExperience,
        skills: parsed.skills?.length ? parsed.skills : f.skills,
        linkedinUrl: parsed.linkedinUrl ?? f.linkedinUrl,
        targetRoles: parsed.targetRoles?.length ? parsed.targetRoles.join(", ") : f.targetRoles,
        experiences: parsed.experiences?.length ? parsed.experiences : f.experiences,
        education: parsed.education?.length ? parsed.education : f.education,
      }));
      setFormSynced(true);
    },
    onError: (error: Error) => toast({
      title: "Upload failed",
      description: error.message || "Could not read this CV. Please try again.",
      variant: "destructive",
    }),
  });

  function buildPayload(profileComplete: boolean, profileStep: number) {
    return {
      ...form,
      yearsExperience: form.yearsExperience ? parseInt(form.yearsExperience, 10) : null,
      salaryMin: parseFormattedNumber(form.salaryMin),
      salaryMax: parseFormattedNumber(form.salaryMax),
      targetRoles: form.targetRoles.split(",").map((s) => s.trim()).filter(Boolean),
      experiences: form.experiences.filter((item) => isFilledRecord(item, ["title", "company", "description"])),
      education: form.education.filter((item) => isFilledRecord(item, ["school", "qualification", "field"])),
      certifications: form.certifications.filter((item) => isFilledRecord(item, ["name", "issuer", "year"])),
      references: form.references.filter((item) => isFilledRecord(item, ["name", "email", "phone", "company"])),
      profileStep,
      profileComplete,
    };
  }

  async function saveProgress(nextStep = step) {
    await saveMutation.mutateAsync(buildPayload(false, nextStep));
    setStep(nextStep);
  }

  async function saveAndContinue() {
    const next = Math.min(step + 1, PROFILE_STEPS.length - 1);
    await saveProgress(next);
  }

  async function submitProfile() {
    await saveMutation.mutateAsync(buildPayload(true, PROFILE_STEPS.length - 1));
    toast({ title: "Profile submitted", description: "Your career profile has been completed." });
  }

  function handleFile(file: File) {
    if (!file.name.match(/\.(pdf|doc|docx|txt)$/i)) {
      toast({ title: "Invalid file", description: "Please upload a PDF, DOC, DOCX, or TXT file.", variant: "destructive" });
      return;
    }
    cvMutation.mutate(file);
  }

  function addSkillValue(skill: string) {
    const s = skill.trim();
    if (s && !form.skills.some((existing) => existing.toLowerCase() === s.toLowerCase()) && form.skills.length < 20) {
      setForm((f) => ({ ...f, skills: [...f.skills, s] }));
    }
    setSkillInput("");
    setSkillFocused(false);
  }

  function removeSkill(skill: string) {
    setForm((f) => ({ ...f, skills: f.skills.filter((s) => s !== skill) }));
  }

  function toggleWorkType(wt: string) {
    setForm((f) => ({
      ...f,
      workTypes: f.workTypes.includes(wt) ? f.workTypes.filter((w) => w !== wt) : [...f.workTypes, wt],
    }));
  }

  function updateList<T extends { id: string }>(key: keyof ProfileForm, id: string, patch: Partial<T>) {
    setForm((f) => ({
      ...f,
      [key]: (f[key] as unknown as T[]).map((item) => item.id === id ? { ...item, ...patch } : item),
    }));
  }

  function removeListItem<T extends { id: string }>(key: keyof ProfileForm, id: string) {
    setForm((f) => ({ ...f, [key]: (f[key] as unknown as T[]).filter((item) => item.id !== id) }));
  }

  const skillSuggestions = SKILL_SUGGESTIONS
    .filter((suggestion) => {
      const query = skillInput.trim().toLowerCase();
      if (!query) return false;
      return suggestion.label.toLowerCase().includes(query) &&
        !form.skills.some((skill) => skill.toLowerCase() === suggestion.label.toLowerCase());
    })
    .slice(0, 8);

  const inputClass = "w-full bg-[var(--th-input)] border border-[var(--th-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--th-text)] placeholder:text-[var(--th-text-40)] focus:outline-none focus:ring-1 focus:ring-[var(--th-border-strong)]";
  const labelClass = "block text-xs font-medium text-[var(--th-text-70)] mb-1.5";

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 size={24} className="animate-spin text-[var(--th-text-50)]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[var(--th-text)]">Career Profile</h1>
          <p className="text-[var(--th-text-60)] mt-1 text-sm">
            Build your profile in steps. Save your draft and continue whenever you are ready.
          </p>
          {profile?.profileComplete && (
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
              <CheckCircle2 size={12} />
              Profile complete
            </div>
          )}
        </div>

        <div className="mb-6 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {PROFILE_STEPS.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                step === index
                  ? "border-[var(--th-border-strong)] bg-white text-black dark:bg-white dark:text-black"
                  : "border-[var(--th-border)] bg-[var(--th-card)] text-[var(--th-text-60)] hover:bg-[var(--th-hover)]"
              )}
            >
              <span className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                step === index ? "bg-black text-white" : "bg-[var(--th-input)] text-[var(--th-text-70)]"
              )}>
                {index + 1}
              </span>
              {label}
            </button>
          ))}
        </div>

        <div className="bg-[var(--th-card)] border border-[var(--th-border)] rounded-xl p-5 md:p-6">
          {step === 0 && (
            <div className="space-y-6">
              <SectionTitle title="CV & Basics" subtitle="Start with the details needed for matching." />
              <div>
                <h3 className="text-sm font-semibold text-[var(--th-text)] mb-1">Upload your CV</h3>
                <p className="text-xs text-[var(--th-text-50)] mb-4">We'll read it to auto-fill your profile. PDF, DOC, DOCX, or TXT.</p>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                  onClick={() => fileRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                    dragOver ? "border-[var(--th-text)] bg-[var(--th-hover)]" : "border-[var(--th-border-md)] hover:border-[var(--th-border-strong)] hover:bg-[var(--th-hover)]"
                  )}
                >
                  {cvMutation.isPending ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 size={28} className="animate-spin text-[var(--th-text-50)]" />
                      <p className="text-sm text-[var(--th-text-60)]">Reading CV...</p>
                    </div>
                  ) : profile?.cvFilename ? (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 size={28} className="text-emerald-500" />
                      <p className="text-sm font-medium text-[var(--th-text)]">{profile.cvFilename}</p>
                      <p className="text-xs text-[var(--th-text-50)]">Click to replace</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload size={28} className="text-[var(--th-text-40)]" />
                      <p className="text-sm font-medium text-[var(--th-text)]">Drop your CV here or click to browse</p>
                      <p className="text-xs text-[var(--th-text-40)]">PDF, DOC, DOCX or TXT</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Current / Target Job Title">
                  <input value={form.jobTitle} onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))} placeholder="e.g. Software Engineer" className={inputClass} />
                </Field>
                <Field label="Industry">
                  <select value={form.industry} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))} className={inputClass}>
                    <option value="">Select industry</option>
                    {UK_INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </Field>
                <Field label="Years of Experience">
                  <input type="number" min="0" max="50" value={form.yearsExperience} onChange={(e) => setForm((f) => ({ ...f, yearsExperience: e.target.value }))} placeholder="e.g. 5" className={inputClass} />
                </Field>
                <Field label="LinkedIn URL">
                  <input value={form.linkedinUrl} onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))} placeholder="https://linkedin.com/in/yourname" className={inputClass} />
                </Field>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <SectionTitle title="Preferences & Skills" subtitle="Tell Ask Migi what kind of work should be prioritised." />
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Location (UK City)">
                  <select value={form.locationCity} onChange={(e) => setForm((f) => ({ ...f, locationCity: e.target.value }))} className={inputClass}>
                    <option value="">Select city</option>
                    {UK_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Postcode">
                  <input value={form.locationPostcode} onChange={(e) => setForm((f) => ({ ...f, locationPostcode: e.target.value }))} placeholder="e.g. SW1A 1AA" className={inputClass} />
                </Field>
              </div>
              <div>
                <label className={labelClass}>Skills (up to 20)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.skills.map((skill) => (
                    <span key={skill} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--th-input)] rounded-full text-xs font-medium text-[var(--th-text-80)]">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="hover:text-red-500 transition-colors"><X size={10} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      value={skillInput}
                      onChange={(e) => { setSkillInput(e.target.value); setSkillFocused(true); }}
                      onFocus={() => setSkillFocused(true)}
                      onBlur={() => setTimeout(() => setSkillFocused(false), 120)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkillValue(skillInput); } }}
                      placeholder="Type a skill and press Enter"
                      className={inputClass}
                    />
                    {skillFocused && skillSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-56 overflow-y-auto rounded-lg border border-[var(--th-border)] bg-[var(--th-card)] shadow-xl">
                        {skillSuggestions.map((suggestion) => (
                          <button
                            key={`${suggestion.category}-${suggestion.label}`}
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); addSkillValue(suggestion.label); }}
                            className="w-full px-3 py-2 text-left hover:bg-[var(--th-hover)] transition-colors"
                          >
                            <span className="block text-sm font-medium text-[var(--th-text)]">{suggestion.label}</span>
                            <span className="block text-[11px] text-[var(--th-text-50)]">{suggestion.category}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={() => addSkillValue(skillInput)} className="px-3 py-2 rounded-lg bg-[var(--th-input)] border border-[var(--th-border)] hover:bg-[var(--th-card-hover)] transition-colors">
                    <Plus size={14} className="text-[var(--th-text-70)]" />
                  </button>
                </div>
              </div>
              <div>
                <label className={labelClass}>Work Type Preference</label>
                <div className="flex flex-wrap gap-2">
                  {WORK_TYPE_OPTIONS.map((wt) => (
                    <button
                      key={wt.value}
                      type="button"
                      onClick={() => toggleWorkType(wt.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm border transition-all",
                        form.workTypes.includes(wt.value)
                          ? "bg-[#0f0f11] text-white border-transparent dark:bg-white dark:text-black"
                          : "bg-[var(--th-input)] text-[var(--th-text-70)] border-[var(--th-border)] hover:border-[var(--th-border-strong)]"
                      )}
                    >
                      {wt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Minimum Salary (GBP/yr)">
                  <input type="text" inputMode="numeric" value={form.salaryMin} onChange={(e) => setForm((f) => ({ ...f, salaryMin: formatNumberInput(e.target.value) }))} placeholder="e.g. 40,000" className={inputClass} />
                </Field>
                <Field label="Maximum Salary (GBP/yr)">
                  <input type="text" inputMode="numeric" value={form.salaryMax} onChange={(e) => setForm((f) => ({ ...f, salaryMax: formatNumberInput(e.target.value) }))} placeholder="e.g. 80,000" className={inputClass} />
                </Field>
              </div>
              <Field label="Target Roles (comma-separated)">
                <input value={form.targetRoles} onChange={(e) => setForm((f) => ({ ...f, targetRoles: e.target.value }))} placeholder="e.g. Senior Developer, Tech Lead, Engineering Manager" className={inputClass} />
              </Field>
              <Field label="Deal breakers">
                <textarea value={form.dealBreakers} onChange={(e) => setForm((f) => ({ ...f, dealBreakers: e.target.value }))} placeholder="Commute limits, visa needs, salary minimums, industries to avoid..." rows={3} className={inputClass} />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <SectionTitle title="Experience" subtitle="Add work history, projects, internships, or voluntary roles." />
              {form.experiences.length === 0 && <EmptyState text="No experience added yet." />}
              {form.experiences.map((item, index) => (
                <div key={item.id} className="rounded-lg border border-[var(--th-border)] p-4 space-y-4">
                  <RowHeader title={`Experience ${index + 1}`} onRemove={() => removeListItem<ExperienceItem>("experiences", item.id)} />
                  <div className="grid md:grid-cols-2 gap-4">
                    <Field label="Role title"><input value={item.title} onChange={(e) => updateList<ExperienceItem>("experiences", item.id, { title: e.target.value })} className={inputClass} /></Field>
                    <Field label="Company"><input value={item.company} onChange={(e) => updateList<ExperienceItem>("experiences", item.id, { company: e.target.value })} className={inputClass} /></Field>
                    <Field label="Location"><input value={item.location} onChange={(e) => updateList<ExperienceItem>("experiences", item.id, { location: e.target.value })} className={inputClass} /></Field>
                    <Field label="Start date"><input type="month" value={item.startDate} onChange={(e) => updateList<ExperienceItem>("experiences", item.id, { startDate: e.target.value })} className={inputClass} /></Field>
                    <Field label="End date"><input type="month" value={item.endDate} disabled={item.current} onChange={(e) => updateList<ExperienceItem>("experiences", item.id, { endDate: e.target.value })} className={inputClass} /></Field>
                    <label className="flex items-end gap-2 pb-2 text-sm text-[var(--th-text-70)]">
                      <input type="checkbox" checked={item.current} onChange={(e) => updateList<ExperienceItem>("experiences", item.id, { current: e.target.checked, endDate: e.target.checked ? "" : item.endDate })} />
                      I currently work here
                    </label>
                  </div>
                  <Field label="Responsibilities and achievements">
                    <textarea value={item.description} onChange={(e) => updateList<ExperienceItem>("experiences", item.id, { description: e.target.value })} rows={4} className={inputClass} />
                  </Field>
                </div>
              ))}
              <AddButton label="Add experience" onClick={() => setForm((f) => ({ ...f, experiences: [...f.experiences, emptyExperience()] }))} />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-7">
              <SectionTitle title="Education & Certifications" subtitle="Add qualifications, training, and credentials." />
              <div className="space-y-5">
                <h3 className="text-sm font-semibold text-[var(--th-text)]">Education</h3>
                {form.education.length === 0 && <EmptyState text="No education added yet." />}
                {form.education.map((item, index) => (
                  <div key={item.id} className="rounded-lg border border-[var(--th-border)] p-4 space-y-4">
                    <RowHeader title={`Education ${index + 1}`} onRemove={() => removeListItem<EducationItem>("education", item.id)} />
                    <div className="grid md:grid-cols-2 gap-4">
                      <Field label="School or university"><input value={item.school} onChange={(e) => updateList<EducationItem>("education", item.id, { school: e.target.value })} className={inputClass} /></Field>
                      <Field label="Qualification"><input value={item.qualification} onChange={(e) => updateList<EducationItem>("education", item.id, { qualification: e.target.value })} className={inputClass} /></Field>
                      <Field label="Field of study"><input value={item.field} onChange={(e) => updateList<EducationItem>("education", item.id, { field: e.target.value })} className={inputClass} /></Field>
                      <Field label="Start date"><input type="month" value={item.startDate} onChange={(e) => updateList<EducationItem>("education", item.id, { startDate: e.target.value })} className={inputClass} /></Field>
                      <Field label="End date"><input type="month" value={item.endDate} onChange={(e) => updateList<EducationItem>("education", item.id, { endDate: e.target.value })} className={inputClass} /></Field>
                    </div>
                  </div>
                ))}
                <AddButton label="Add education" onClick={() => setForm((f) => ({ ...f, education: [...f.education, emptyEducation()] }))} />
              </div>
              <div className="space-y-5">
                <h3 className="text-sm font-semibold text-[var(--th-text)]">Certifications</h3>
                {form.certifications.length === 0 && <EmptyState text="No certifications added yet." />}
                {form.certifications.map((item, index) => (
                  <div key={item.id} className="rounded-lg border border-[var(--th-border)] p-4 space-y-4">
                    <RowHeader title={`Certification ${index + 1}`} onRemove={() => removeListItem<CertificationItem>("certifications", item.id)} />
                    <div className="grid md:grid-cols-2 gap-4">
                      <Field label="Certification name"><input value={item.name} onChange={(e) => updateList<CertificationItem>("certifications", item.id, { name: e.target.value })} className={inputClass} /></Field>
                      <Field label="Issuer"><input value={item.issuer} onChange={(e) => updateList<CertificationItem>("certifications", item.id, { issuer: e.target.value })} className={inputClass} /></Field>
                      <Field label="Year"><input value={item.year} onChange={(e) => updateList<CertificationItem>("certifications", item.id, { year: e.target.value })} className={inputClass} /></Field>
                      <Field label="Credential URL"><input value={item.url} onChange={(e) => updateList<CertificationItem>("certifications", item.id, { url: e.target.value })} className={inputClass} /></Field>
                    </div>
                  </div>
                ))}
                <AddButton label="Add certification" onClick={() => setForm((f) => ({ ...f, certifications: [...f.certifications, emptyCertification()] }))} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <SectionTitle title="References" subtitle="Add referees the user can keep on file for applications." />
              {form.references.length === 0 && <EmptyState text="No references added yet." />}
              {form.references.map((item, index) => (
                <div key={item.id} className="rounded-lg border border-[var(--th-border)] p-4 space-y-4">
                  <RowHeader title={`Reference ${index + 1}`} onRemove={() => removeListItem<ReferenceItem>("references", item.id)} />
                  <div className="grid md:grid-cols-2 gap-4">
                    <Field label="Name"><input value={item.name} onChange={(e) => updateList<ReferenceItem>("references", item.id, { name: e.target.value })} className={inputClass} /></Field>
                    <Field label="Role"><input value={item.role} onChange={(e) => updateList<ReferenceItem>("references", item.id, { role: e.target.value })} className={inputClass} /></Field>
                    <Field label="Company"><input value={item.company} onChange={(e) => updateList<ReferenceItem>("references", item.id, { company: e.target.value })} className={inputClass} /></Field>
                    <Field label="Relationship"><input value={item.relationship} onChange={(e) => updateList<ReferenceItem>("references", item.id, { relationship: e.target.value })} className={inputClass} /></Field>
                    <Field label="Email"><input type="email" value={item.email} onChange={(e) => updateList<ReferenceItem>("references", item.id, { email: e.target.value })} className={inputClass} /></Field>
                    <Field label="Phone"><input value={item.phone} onChange={(e) => updateList<ReferenceItem>("references", item.id, { phone: e.target.value })} className={inputClass} /></Field>
                  </div>
                </div>
              ))}
              <AddButton label="Add reference" onClick={() => setForm((f) => ({ ...f, references: [...f.references, emptyReference()] }))} />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <SectionTitle title="Review Profile" subtitle="Preview the details before final submission." />
              <ReviewSection title="Basics" onEdit={() => setStep(0)} rows={[
                ["Job title", form.jobTitle],
                ["Industry", form.industry],
                ["Years of experience", form.yearsExperience],
                ["LinkedIn", form.linkedinUrl],
              ]} />
              <ReviewSection title="Preferences" onEdit={() => setStep(1)} rows={[
                ["Location", [form.locationCity, form.locationPostcode].filter(Boolean).join(", ")],
                ["Work type", form.workTypes.map((wt) => WORK_TYPE_OPTIONS.find((option) => option.value === wt)?.label ?? wt).join(", ")],
                ["Salary", [form.salaryMin, form.salaryMax].filter(Boolean).join(" - ")],
                ["Target roles", form.targetRoles],
                ["Skills", form.skills.join(", ")],
                ["Deal breakers", form.dealBreakers],
              ]} />
              <ReviewCards title="Experience" onEdit={() => setStep(2)} items={form.experiences} empty="No experience added." render={(item) => (
                <>
                  <p className="font-medium text-[var(--th-text)]">{item.title || "Untitled role"}</p>
                  <p className="text-sm text-[var(--th-text-60)]">{[item.company, item.location].filter(Boolean).join(" - ")}</p>
                  <p className="text-xs text-[var(--th-text-50)]">{[item.startDate, item.current ? "Present" : item.endDate].filter(Boolean).join(" to ")}</p>
                  {item.description && <p className="mt-2 text-sm text-[var(--th-text-70)] whitespace-pre-line">{item.description}</p>}
                </>
              )} />
              <ReviewCards title="Education" onEdit={() => setStep(3)} items={form.education} empty="No education added." render={(item) => (
                <>
                  <p className="font-medium text-[var(--th-text)]">{item.qualification || "Qualification"}</p>
                  <p className="text-sm text-[var(--th-text-60)]">{[item.school, item.field].filter(Boolean).join(" - ")}</p>
                  <p className="text-xs text-[var(--th-text-50)]">{[item.startDate, item.endDate].filter(Boolean).join(" to ")}</p>
                </>
              )} />
              <ReviewCards title="Certifications" onEdit={() => setStep(3)} items={form.certifications} empty="No certifications added." render={(item) => (
                <>
                  <p className="font-medium text-[var(--th-text)]">{item.name || "Certification"}</p>
                  <p className="text-sm text-[var(--th-text-60)]">{[item.issuer, item.year].filter(Boolean).join(" - ")}</p>
                  {item.url && <p className="text-xs text-[var(--th-text-50)] break-all">{item.url}</p>}
                </>
              )} />
              <ReviewCards title="References" onEdit={() => setStep(4)} items={form.references} empty="No references added." render={(item) => (
                <>
                  <p className="font-medium text-[var(--th-text)]">{item.name || "Reference"}</p>
                  <p className="text-sm text-[var(--th-text-60)]">{[item.role, item.company].filter(Boolean).join(" - ")}</p>
                  <p className="text-xs text-[var(--th-text-50)]">{[item.email, item.phone].filter(Boolean).join(" - ")}</p>
                  {item.relationship && <p className="text-xs text-[var(--th-text-50)]">{item.relationship}</p>}
                </>
              )} />
            </div>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[var(--th-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setStep((current) => Math.max(current - 1, 0))}
              disabled={step === 0 || saveMutation.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--th-border)] px-4 py-2.5 text-sm font-medium text-[var(--th-text-70)] disabled:opacity-40"
            >
              <ArrowLeft size={14} />
              Back
            </button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => saveProgress(step)}
                disabled={saveMutation.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--th-border)] px-4 py-2.5 text-sm font-medium text-[var(--th-text)] hover:bg-[var(--th-hover)] disabled:opacity-50"
              >
                {saveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save draft
              </button>
              {step < PROFILE_STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={saveAndContinue}
                  disabled={saveMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0f0f11] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-black"
                >
                  Save & continue
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submitProfile}
                  disabled={saveMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0f0f11] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-black"
                >
                  {saveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Submit profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-[var(--th-text)]">{title}</h2>
      <p className="mt-1 text-sm text-[var(--th-text-50)]">{subtitle}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-[var(--th-text-70)] mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function RowHeader({ title, onRemove }: { title: string; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-sm font-semibold text-[var(--th-text)]">{title}</h3>
      <button type="button" onClick={onRemove} className="rounded-lg p-2 text-[var(--th-text-50)] hover:bg-[var(--th-hover)] hover:text-red-500">
        <X size={14} />
      </button>
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-2 rounded-lg border border-[var(--th-border)] px-3 py-2 text-sm font-medium text-[var(--th-text)] hover:bg-[var(--th-hover)]">
      <Plus size={14} />
      {label}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-[var(--th-border)] px-4 py-5 text-sm text-[var(--th-text-50)]">{text}</p>;
}

function ReviewSection({ title, rows, onEdit }: { title: string; rows: string[][]; onEdit: () => void }) {
  return (
    <section className="rounded-lg border border-[var(--th-border)] p-4">
      <ReviewHeader title={title} onEdit={onEdit} />
      <dl className="mt-4 grid gap-3 md:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-medium text-[var(--th-text-50)]">{label}</dt>
            <dd className="mt-1 text-sm text-[var(--th-text)] whitespace-pre-line">{value || "Not provided"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ReviewCards<T>({ title, items, empty, render, onEdit }: {
  title: string;
  items: T[];
  empty: string;
  render: (item: T) => React.ReactNode;
  onEdit: () => void;
}) {
  return (
    <section className="rounded-lg border border-[var(--th-border)] p-4">
      <ReviewHeader title={title} onEdit={onEdit} />
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--th-text-50)]">{empty}</p>
      ) : (
        <div className="mt-4 grid gap-3">
          {items.map((item, index) => (
            <div key={index} className="rounded-lg bg-[var(--th-input)] p-3">
              {render(item)}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ReviewHeader({ title, onEdit }: { title: string; onEdit: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-sm font-semibold text-[var(--th-text)]">{title}</h3>
      <button type="button" onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-[var(--th-text-60)] hover:bg-[var(--th-hover)]">
        <Pencil size={12} />
        Edit
      </button>
    </div>
  );
}
