import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Plus, Loader2, CheckCircle2, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

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

export function DashboardProfilePage() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [skillInput, setSkillInput] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/profile"],
    retry: false,
  });

  const [form, setForm] = useState<{
    industry: string; jobTitle: string; yearsExperience: string;
    skills: string[]; locationCity: string; locationPostcode: string;
    linkedinUrl: string; salaryMin: string; salaryMax: string;
    workTypes: string[]; targetRoles: string; dealBreakers: string;
  }>({
    industry: "", jobTitle: "", yearsExperience: "", skills: [],
    locationCity: "", locationPostcode: "", linkedinUrl: "",
    salaryMin: "", salaryMax: "", workTypes: [], targetRoles: "", dealBreakers: "",
  });

  // Sync form with loaded profile
  const [formSynced, setFormSynced] = useState(false);
  if (profile && !formSynced) {
    setForm({
      industry: profile.industry ?? "",
      jobTitle: profile.jobTitle ?? "",
      yearsExperience: profile.yearsExperience?.toString() ?? "",
      skills: profile.skills ?? [],
      locationCity: profile.locationCity ?? "",
      locationPostcode: profile.locationPostcode ?? "",
      linkedinUrl: profile.linkedinUrl ?? "",
      salaryMin: profile.salaryMin?.toString() ?? "",
      salaryMax: profile.salaryMax?.toString() ?? "",
      workTypes: profile.workTypes ?? [],
      targetRoles: profile.targetRoles?.join(", ") ?? "",
      dealBreakers: profile.dealBreakers ?? "",
    });
    setFormSynced(true);
  }

  const saveMutation = useMutation({
    mutationFn: async (data: any) =>
      apiRequest("POST", "/api/dashboard/profile", data).then(r => r.json()),
    onSuccess: () => {
      toast({ title: "Profile saved", description: "Your career profile has been updated." });
      qc.invalidateQueries({ queryKey: ["/api/dashboard/profile"] });
      qc.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: () => toast({ title: "Error", description: "Could not save profile.", variant: "destructive" }),
  });

  const cvMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("cv", file);
      const resp = await fetch("/api/dashboard/profile/cv", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!resp.ok) throw new Error("Upload failed");
      return resp.json();
    },
    onSuccess: (data) => {
      toast({ title: "CV uploaded", description: "Your CV has been parsed and profile updated." });
      qc.invalidateQueries({ queryKey: ["/api/dashboard/profile"] });
      // Pre-fill fields from parsed CV
      if (data.parsed) {
        setForm((f) => ({
          ...f,
          industry: data.parsed.industry ?? f.industry,
          jobTitle: data.parsed.jobTitle ?? f.jobTitle,
          yearsExperience: data.parsed.yearsExperience?.toString() ?? f.yearsExperience,
          skills: data.parsed.skills?.length ? data.parsed.skills : f.skills,
        }));
        setFormSynced(false);
      }
    },
    onError: () => toast({ title: "Upload failed", description: "Could not parse CV. Please try again.", variant: "destructive" }),
  });

  function handleFile(file: File) {
    if (!file.name.match(/\.(pdf|doc|docx|txt)$/i)) {
      toast({ title: "Invalid file", description: "Please upload a PDF, DOC, DOCX, or TXT file.", variant: "destructive" });
      return;
    }
    cvMutation.mutate(file);
  }

  function addSkill() {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s) && form.skills.length < 20) {
      setForm((f) => ({ ...f, skills: [...f.skills, s] }));
    }
    setSkillInput("");
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

  function handleSave() {
    saveMutation.mutate({
      ...form,
      yearsExperience: form.yearsExperience ? parseInt(form.yearsExperience) : null,
      salaryMin: form.salaryMin ? parseInt(form.salaryMin) : null,
      salaryMax: form.salaryMax ? parseInt(form.salaryMax) : null,
      targetRoles: form.targetRoles.split(",").map((s) => s.trim()).filter(Boolean),
    });
  }

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
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[var(--th-text)]">Career Profile</h1>
          <p className="text-[var(--th-text-60)] mt-1 text-sm">
            Your profile is used to match you to networking events and job opportunities.
          </p>
          {profile?.profileComplete && (
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
              <CheckCircle2 size={12} />
              Profile complete
            </div>
          )}
        </div>

        {/* CV Upload */}
        <div className="bg-[var(--th-card)] border border-[var(--th-border)] rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-[var(--th-text)] mb-1">Upload your CV</h2>
          <p className="text-xs text-[var(--th-text-50)] mb-4">We'll parse it with AI to auto-fill your profile. PDF, DOC, DOCX, or TXT.</p>

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
                <p className="text-sm text-[var(--th-text-60)]">Parsing CV with AI…</p>
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

        {/* Profile Form */}
        <div className="bg-[var(--th-card)] border border-[var(--th-border)] rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-[var(--th-text)]">Career Details</h2>

          {/* Row: Job title + Industry */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--th-text-70)] mb-1.5">Current / Target Job Title</label>
              <input
                value={form.jobTitle}
                onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
                placeholder="e.g. Software Engineer"
                className="w-full bg-[var(--th-input)] border border-[var(--th-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--th-text)] placeholder:text-[var(--th-text-40)] focus:outline-none focus:ring-1 focus:ring-[var(--th-border-strong)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--th-text-70)] mb-1.5">Industry</label>
              <select
                value={form.industry}
                onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                className="w-full bg-[var(--th-input)] border border-[var(--th-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--th-text)] focus:outline-none focus:ring-1 focus:ring-[var(--th-border-strong)]"
              >
                <option value="">Select industry</option>
                {UK_INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>

          {/* Row: Experience + Location */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--th-text-70)] mb-1.5">Years of Experience</label>
              <input
                type="number" min="0" max="50"
                value={form.yearsExperience}
                onChange={(e) => setForm((f) => ({ ...f, yearsExperience: e.target.value }))}
                placeholder="e.g. 5"
                className="w-full bg-[var(--th-input)] border border-[var(--th-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--th-text)] placeholder:text-[var(--th-text-40)] focus:outline-none focus:ring-1 focus:ring-[var(--th-border-strong)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--th-text-70)] mb-1.5">Location (UK City)</label>
              <select
                value={form.locationCity}
                onChange={(e) => setForm((f) => ({ ...f, locationCity: e.target.value }))}
                className="w-full bg-[var(--th-input)] border border-[var(--th-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--th-text)] focus:outline-none focus:ring-1 focus:ring-[var(--th-border-strong)]"
              >
                <option value="">Select city</option>
                {UK_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-xs font-medium text-[var(--th-text-70)] mb-1.5">Skills (up to 20)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.skills.map((skill) => (
                <span key={skill} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--th-input)] rounded-full text-xs font-medium text-[var(--th-text-80)]">
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="hover:text-red-500 transition-colors"><X size={10} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                placeholder="Type a skill and press Enter"
                className="flex-1 bg-[var(--th-input)] border border-[var(--th-border)] rounded-lg px-3 py-2 text-sm text-[var(--th-text)] placeholder:text-[var(--th-text-40)] focus:outline-none focus:ring-1 focus:ring-[var(--th-border-strong)]"
              />
              <button onClick={addSkill} className="px-3 py-2 rounded-lg bg-[var(--th-input)] border border-[var(--th-border)] hover:bg-[var(--th-card-hover)] transition-colors">
                <Plus size={14} className="text-[var(--th-text-70)]" />
              </button>
            </div>
          </div>

          {/* Work type preference */}
          <div>
            <label className="block text-xs font-medium text-[var(--th-text-70)] mb-1.5">Work Type Preference</label>
            <div className="flex gap-2">
              {WORK_TYPE_OPTIONS.map((wt) => (
                <button
                  key={wt.value}
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

          {/* Salary range */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--th-text-70)] mb-1.5">Minimum Salary (£/yr)</label>
              <input
                type="number" min="0"
                value={form.salaryMin}
                onChange={(e) => setForm((f) => ({ ...f, salaryMin: e.target.value }))}
                placeholder="e.g. 40000"
                className="w-full bg-[var(--th-input)] border border-[var(--th-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--th-text)] placeholder:text-[var(--th-text-40)] focus:outline-none focus:ring-1 focus:ring-[var(--th-border-strong)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--th-text-70)] mb-1.5">Maximum Salary (£/yr)</label>
              <input
                type="number" min="0"
                value={form.salaryMax}
                onChange={(e) => setForm((f) => ({ ...f, salaryMax: e.target.value }))}
                placeholder="e.g. 80000"
                className="w-full bg-[var(--th-input)] border border-[var(--th-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--th-text)] placeholder:text-[var(--th-text-40)] focus:outline-none focus:ring-1 focus:ring-[var(--th-border-strong)]"
              />
            </div>
          </div>

          {/* LinkedIn + Target roles */}
          <div>
            <label className="block text-xs font-medium text-[var(--th-text-70)] mb-1.5">LinkedIn URL (optional)</label>
            <input
              value={form.linkedinUrl}
              onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
              placeholder="https://linkedin.com/in/yourname"
              className="w-full bg-[var(--th-input)] border border-[var(--th-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--th-text)] placeholder:text-[var(--th-text-40)] focus:outline-none focus:ring-1 focus:ring-[var(--th-border-strong)]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--th-text-70)] mb-1.5">Target Roles (comma-separated)</label>
            <input
              value={form.targetRoles}
              onChange={(e) => setForm((f) => ({ ...f, targetRoles: e.target.value }))}
              placeholder="e.g. Senior Developer, Tech Lead, Engineering Manager"
              className="w-full bg-[var(--th-input)] border border-[var(--th-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--th-text)] placeholder:text-[var(--th-text-40)] focus:outline-none focus:ring-1 focus:ring-[var(--th-border-strong)]"
            />
          </div>

          {/* Save button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0f0f11] dark:bg-white text-white dark:text-black text-sm font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
              Save profile
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
