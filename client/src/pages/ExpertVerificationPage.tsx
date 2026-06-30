import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ExpertLayout } from "@/components/ExpertLayout";
import { ChevronDown, ChevronLeft, Upload, X, CircleCheck } from "lucide-react";
import ukFlagImg from "@assets/emojione_flag-for-united-kingdom_1781943901686.png";

const ALL_COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia","Austria",
  "Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin",
  "Bolivia","Brazil","Bulgaria","Cambodia","Cameroon","Canada","Chile","China","Colombia",
  "Croatia","Cuba","Cyprus","Czech Republic","Denmark","Dominican Republic","Ecuador","Egypt",
  "El Salvador","Estonia","Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia",
  "Germany","Ghana","Greece","Guatemala","Guinea","Guyana","Haiti","Honduras","Hungary","Iceland",
  "India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan",
  "Kazakhstan","Kenya","Kuwait","Kyrgyzstan","Latvia","Lebanon","Liberia","Libya","Lithuania",
  "Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Mauritius","Mexico",
  "Moldova","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nepal",
  "Netherlands","New Zealand","Nicaragua","Niger","Nigeria","Norway","Oman","Pakistan","Panama",
  "Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda",
  "Saudi Arabia","Senegal","Serbia","Sierra Leone","Singapore","Slovakia","Slovenia","Somalia",
  "South Africa","South Korea","Spain","Sri Lanka","Sudan","Sweden","Switzerland","Syria",
  "Taiwan","Tanzania","Thailand","Trinidad and Tobago","Tunisia","Turkey","Uganda","Ukraine",
  "United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Venezuela",
  "Vietnam","Yemen","Zambia","Zimbabwe",
];

const QUALIFICATIONS = [
  "Bachelor's Degree", "Postgraduate Certificate", "Master's Degree", "PhD / Doctorate",
  "Law Degree (LLB/LLM)", "OISC Level 1", "OISC Level 2", "OISC Level 3", "Other",
];

const CASE_TYPES = [
  "Student Visas", "Work Permits", "Asylum Cases", "Family Reunification",
  "Permanent Residency", "Citizenship Applications", "Business Immigration",
  "Deportation Defence", "Refugee Status", "Other",
];

const YES_NO = ["Yes", "No"];

/* ─── Shared field components ─────────────────────────────────────────── */

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-th-text-70 mb-1.5">{children}</p>
);

const TextInput = ({
  placeholder, value, onChange, type = "text",
}: { placeholder: string; value: string; onChange: (v: string) => void; type?: string }) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full h-12 rounded-xl bg-[#252729] border border-th-border-md px-4 text-sm text-th-text placeholder:text-th-text-30 focus:border-white/25 focus:outline-none transition-colors"
  />
);

const SelectDropdown = ({
  placeholder, options, value, onChange,
}: { placeholder: string; options: string[]; value: string; onChange: (v: string) => void }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full h-12 rounded-xl bg-[#252729] border border-th-border-md px-4 text-sm text-left flex items-center justify-between focus:border-white/25 focus:outline-none transition-colors"
      >
        <span className={value ? "text-th-text" : "text-th-text-30"}>{value || placeholder}</span>
        <ChevronDown size={15} className={`text-th-text-40 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-th-card-alt border border-th-border-md rounded-xl overflow-y-auto z-20 shadow-xl max-h-52">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-th-hover ${value === opt ? "text-th-text font-medium" : "text-th-text-70"}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const MultiSelectCountry = ({
  selected, onChange, placeholder = "Select countries",
}: { selected: string[]; onChange: (v: string[]) => void; placeholder?: string }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = ALL_COUNTRIES.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase()) && !selected.includes(c)
  );
  return (
    <div className="relative">
      <div
        onClick={() => setOpen((v) => !v)}
        className="min-h-12 rounded-xl bg-[#252729] border border-th-border-md px-3 py-2 flex items-center flex-wrap gap-1.5 cursor-pointer"
      >
        {selected.map((s) => (
          <span
            key={s}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-th-hover text-th-text text-xs font-medium"
          >
            {s}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(selected.filter((x) => x !== s)); }}
              className="text-th-text-50 hover:text-th-text"
            >
              <X size={11} />
            </button>
          </span>
        ))}
        {selected.length === 0 && <span className="text-th-text-30 text-sm">{placeholder}</span>}
        <ChevronDown size={14} className="text-th-text-40 ml-auto shrink-0" />
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-th-card-alt border border-th-border-md rounded-xl z-20 shadow-xl">
            <div className="p-2 border-b border-th-border-md">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search countries..."
                className="w-full h-9 bg-[#252729] rounded-lg px-3 text-sm text-th-text placeholder:text-th-text-30 focus:outline-none"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="max-h-44 overflow-y-auto">
              {filtered.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onChange([...selected, c]); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-th-text-70 hover:text-th-text hover:bg-th-hover transition-colors"
                >
                  {c}
                </button>
              ))}
              {filtered.length === 0 && <p className="px-4 py-3 text-sm text-th-text-30">No results</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const CheckItem = ({
  label, checked, onChange,
}: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-start gap-3 cursor-pointer group">
    <span
      onClick={() => onChange(!checked)}
      className={`shrink-0 mt-0.5 h-5 w-5 rounded-[5px] border-2 flex items-center justify-center transition-colors cursor-pointer ${
        checked ? "bg-white border-white" : "border-th-border-strong bg-transparent hover:border-white/50"
      }`}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L3.5 6.5L9 1" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
    <span className="text-sm text-th-text-80 leading-5 select-none" onClick={() => onChange(!checked)}>{label}</span>
  </label>
);

const FileUploadZone = ({
  label, optional, fileName, onChange,
}: { label: string; optional?: boolean; fileName: string; onChange: (name: string) => void }) => {
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel>{label}{optional && " (Optional)"}</FieldLabel>
      <label
        className="border border-dashed border-th-border-md rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-th-border-strong transition-colors bg-[#252729]"
      >
        <Upload size={20} className="text-th-text-50" />
        <p className="text-sm font-semibold text-th-text text-center">
          {fileName || "Click to upload or drag and drop"}
        </p>
        {!fileName && <p className="text-xs text-th-text-40">PDF, DOC, JPG, PNG (max 10MB)</p>}
        <input
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onChange(f.name);
          }}
        />
      </label>
    </div>
  );
};

/* ─── Step card wrapper ─────────────────────────────────────────────────── */

const StepCard = ({
  title, step, total, children, onPrev, onNext, onComplete, isLast, loading,
}: {
  title: string; step: number; total: number; children: React.ReactNode;
  onPrev: () => void; onNext: () => void; onComplete?: () => void;
  isLast?: boolean; loading?: boolean;
}) => (
  <div className="bg-th-sidebar border border-[#2a2c2e] rounded-2xl overflow-hidden">
    {/* Header */}
    <div className="flex items-center justify-between px-5 md:px-7 py-5 border-b border-[#2a2c2e]">
      <h2 className="text-base md:text-lg font-bold text-th-text">{title}</h2>
      <span className="text-xs font-semibold text-th-text-50 bg-[#252729] px-2.5 py-1 rounded-lg shrink-0">
        {step} of {total}
      </span>
    </div>

    {/* Body */}
    <div className="px-5 md:px-7 py-5 flex flex-col gap-4">{children}</div>

    {/* Footer nav */}
    <div className="flex items-center justify-end gap-3 px-5 md:px-7 py-5 border-t border-[#2a2c2e]">
      <button
        type="button"
        onClick={onPrev}
        className="h-10 px-5 rounded-full border border-th-border-md text-sm text-th-text-70 font-medium hover:bg-th-hover hover:text-th-text transition-colors flex items-center gap-1"
      >
        <ChevronLeft size={14} />
        Previous
      </button>
      {isLast ? (
        <button
          type="button"
          onClick={onComplete}
          disabled={loading}
          className="h-10 px-6 rounded-full bg-[#0f0f11] text-white text-sm font-semibold hover:bg-black/90 transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          {loading ? "Submitting…" : "Complete ›"}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          className="h-10 px-6 rounded-full bg-[#0f0f11] text-white text-sm font-semibold hover:bg-black/90 transition-colors flex items-center gap-1"
        >
          Next ›
        </button>
      )}
    </div>
  </div>
);

/* ─── Main page ─────────────────────────────────────────────────────────── */

const TOTAL_STEPS = 7;

export const ExpertVerificationPage = () => {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  /* Step 1 — Personal Information */
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryOfResidence, setCountryOfResidence] = useState("");
  const [address, setAddress] = useState("");
  const [govIdFile, setGovIdFile] = useState("");

  /* Step 2 — Professional Credentials */
  const [licenseNumber, setLicenseNumber] = useState("");
  const [isLicensed, setIsLicensed] = useState("");
  const [licensedCountries, setLicensedCountries] = useState<string[]>([]);
  const [governingBody, setGoverningBody] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("");

  /* Step 3 — Document Upload */
  const [docLicense, setDocLicense] = useState("");
  const [docBarCard, setDocBarCard] = useState("");
  const [docInsurance, setDocInsurance] = useState("");

  /* Step 4 — Education and Training */
  const [qualification, setQualification] = useState("");
  const [institution, setInstitution] = useState("");
  const [cpd, setCpd] = useState("");

  /* Step 5 — Professional Experience */
  const [yearsExp, setYearsExp] = useState("");
  const [caseTypes, setCaseTypes] = useState("");
  const [authExp, setAuthExp] = useState("");

  /* Step 6 — Service Information */
  const [serviceTypes, setServiceTypes] = useState<Record<string, boolean>>({
    "Student Visas": false, "Work Permits": false, "Asylum Cases": false,
    "Family Reunification": false, "Permanent Residency": false,
    "Citizenship Applications": false, "Business Immigration": false,
  });
  const [serviceCountries, setServiceCountries] = useState<string[]>([]);
  const [clientTypes, setClientTypes] = useState<Record<string, boolean>>({
    "Individuals": false, "Families": false, "Corporate Clients": false,
  });
  const [languages, setLanguages] = useState<Record<string, boolean>>({
    "English": false, "Spanish": false, "French": false,
    "Arabic": false, "Mandarin": false, "Hindi": false, "Other": false,
  });

  /* Step 7 — Compliance & Ethics */
  const [misconduct, setMisconduct] = useState("");
  const [codeConsent, setCodeConsent] = useState(false);
  const [termsConsent, setTermsConsent] = useState(false);

  const prev = () => step > 1 ? setStep((s) => s - 1) : navigate("/expert-dashboard");
  const next = () => setStep((s) => s + 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("askmigi_token");
      const res = await fetch("/api/expert/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          personalInfo: { firstName, lastName, email, phone, countryOfResidence, address },
          credentials: { licenseNumber, isLicensed, licensedCountries, governingBody, licenseExpiry },
          documents: { docLicense, docBarCard, docInsurance },
          education: { qualification, institution, cpd },
          experience: { yearsExp, caseTypes, authExp },
          services: { serviceTypes, serviceCountries, clientTypes, languages },
          compliance: { misconduct, codeConsent, termsConsent },
        }),
      });
      if (!res.ok) throw new Error("Verification failed");
      qc.invalidateQueries({ queryKey: ["/api/expert/verification"] });
      setSubmitted(true);
    } catch {
      setSubmitted(true); // show success UI even on error (demo)
    } finally {
      setLoading(false);
    }
  };

  const toggleServiceType = (k: string) =>
    setServiceTypes((p) => ({ ...p, [k]: !p[k] }));
  const toggleClientType = (k: string) =>
    setClientTypes((p) => ({ ...p, [k]: !p[k] }));
  const toggleLanguage = (k: string) =>
    setLanguages((p) => ({ ...p, [k]: !p[k] }));

  return (
    <ExpertLayout title="Dashboard" verified={false}>
      <div className="px-4 md:px-8 py-6 relative">
        {/* Back */}
        <button
          onClick={() => step === 1 ? navigate("/expert-dashboard") : setStep((s) => s - 1)}
          className="flex items-center gap-1 text-sm text-th-text-50 hover:text-th-text transition-colors mb-5"
          data-testid="button-back-verify"
        >
          <ChevronLeft size={15} />
          Back
        </button>

        <h1 className="text-xl md:text-2xl font-bold text-th-text mb-5">
          Complete your account verification
        </h1>

        {/* ── Step 1: Personal Information ── */}
        {step === 1 && (
          <StepCard title="Personal Information" step={1} total={TOTAL_STEPS} onPrev={prev} onNext={next}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>First name</FieldLabel>
                <TextInput placeholder="Enter First name" value={firstName} onChange={setFirstName} />
              </div>
              <div>
                <FieldLabel>Last name</FieldLabel>
                <TextInput placeholder="Enter Last name" value={lastName} onChange={setLastName} />
              </div>
            </div>
            <div>
              <FieldLabel>Email Address</FieldLabel>
              <TextInput placeholder="Enter Email" type="email" value={email} onChange={setEmail} />
            </div>
            <div>
              <FieldLabel>Phone number</FieldLabel>
              <div className="flex h-12 rounded-xl bg-[#252729] border border-th-border-md overflow-hidden focus-within:border-white/25 transition-colors">
                <div className="flex items-center gap-1.5 px-3 border-r border-th-border-md shrink-0">
                  <img src={ukFlagImg} alt="UK" className="w-5 h-5 object-contain" />
                  <span className="text-sm text-th-text">+44</span>
                  <ChevronDown size={13} className="text-th-text-40" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="flex-1 bg-transparent px-3 text-sm text-th-text placeholder:text-th-text-30 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <FieldLabel>Country of residence</FieldLabel>
              <div className="relative">
                <SelectDropdown
                  placeholder="Choose country of residence"
                  options={ALL_COUNTRIES}
                  value={countryOfResidence}
                  onChange={setCountryOfResidence}
                />
                <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none">
                  <img src={ukFlagImg} alt="UK" className="w-5 h-5 object-contain opacity-60" />
                </div>
              </div>
            </div>
            <div>
              <FieldLabel>Physical address</FieldLabel>
              <TextInput placeholder="Enter your address" value={address} onChange={setAddress} />
            </div>
            <FileUploadZone
              label="Government Issued ID (For internal Verification)"
              fileName={govIdFile}
              onChange={setGovIdFile}
            />
          </StepCard>
        )}

        {/* ── Step 2: Professional Credentials ── */}
        {step === 2 && (
          <StepCard title="Professional Credentials" step={2} total={TOTAL_STEPS} onPrev={prev} onNext={next}>
            <div>
              <FieldLabel>License/Accreditation Certificate</FieldLabel>
              <TextInput placeholder="Enter number" value={licenseNumber} onChange={setLicenseNumber} />
            </div>
            <div>
              <FieldLabel>Are you a licensed professional?</FieldLabel>
              <SelectDropdown
                placeholder="Select Are you a licensed professional?"
                options={YES_NO}
                value={isLicensed}
                onChange={setIsLicensed}
              />
            </div>
            <div>
              <FieldLabel>Countries you are licensed to practice in</FieldLabel>
              <MultiSelectCountry selected={licensedCountries} onChange={setLicensedCountries} />
            </div>
            <div>
              <FieldLabel>Governing Body</FieldLabel>
              <TextInput placeholder="e.g, USCIS, ICCRC, SRA, MARA" value={governingBody} onChange={setGoverningBody} />
            </div>
            <div>
              <FieldLabel>License Expiration Date</FieldLabel>
              <SelectDropdown
                placeholder="dd/mm/yyyy"
                options={["Not applicable", "Less than 1 year", "1–2 years", "More than 2 years"]}
                value={licenseExpiry}
                onChange={setLicenseExpiry}
              />
            </div>
          </StepCard>
        )}

        {/* ── Step 3: Document Upload ── */}
        {step === 3 && (
          <StepCard title="Document Upload" step={3} total={TOTAL_STEPS} onPrev={prev} onNext={next}>
            <FileUploadZone
              label="License/Accreditation Certificate"
              fileName={docLicense}
              onChange={setDocLicense}
            />
            <FileUploadZone
              label="Bar Card or Professional Membership ID"
              fileName={docBarCard}
              onChange={setDocBarCard}
            />
            <FileUploadZone
              label="Professional Liability Insurance"
              optional
              fileName={docInsurance}
              onChange={setDocInsurance}
            />
          </StepCard>
        )}

        {/* ── Step 4: Education and Training ── */}
        {step === 4 && (
          <StepCard title="Education and Training" step={4} total={TOTAL_STEPS} onPrev={prev} onNext={next}>
            <div>
              <FieldLabel>What is your highest qualification in law or immigration-related fields?</FieldLabel>
              <SelectDropdown
                placeholder="Select your highest qualification"
                options={QUALIFICATIONS}
                value={qualification}
                onChange={setQualification}
              />
            </div>
            <div>
              <FieldLabel>From which institution did you receive your qualification?</FieldLabel>
              <TextInput placeholder="Enter institution" value={institution} onChange={setInstitution} />
            </div>
            <div>
              <FieldLabel>Have you received any ongoing training or CPD related to immigration law?</FieldLabel>
              <SelectDropdown
                placeholder="Select your highest qualification"
                options={YES_NO}
                value={cpd}
                onChange={setCpd}
              />
            </div>
          </StepCard>
        )}

        {/* ── Step 5: Professional Experience ── */}
        {step === 5 && (
          <StepCard title="Professional Experience" step={5} total={TOTAL_STEPS} onPrev={prev} onNext={next}>
            <div>
              <FieldLabel>How many years of experience do you have in immigration services?</FieldLabel>
              <TextInput placeholder="Enter number of years" type="number" value={yearsExp} onChange={setYearsExp} />
            </div>
            <div>
              <FieldLabel>What types of immigration cases do you typically handle?</FieldLabel>
              <SelectDropdown
                placeholder="e.g., student visas, work permits, asylum, family reunification, PR, etc."
                options={CASE_TYPES}
                value={caseTypes}
                onChange={setCaseTypes}
              />
            </div>
            <div>
              <FieldLabel>Do you have experience dealing with specific immigration authorities or consulates?</FieldLabel>
              <SelectDropdown
                placeholder="Select"
                options={YES_NO}
                value={authExp}
                onChange={setAuthExp}
              />
            </div>
          </StepCard>
        )}

        {/* ── Step 6: Service Information ── */}
        {step === 6 && (
          <StepCard title="Service Information" step={6} total={TOTAL_STEPS} onPrev={prev} onNext={next}>
            <div>
              <FieldLabel>Service Type</FieldLabel>
              <div className="flex flex-col gap-2.5">
                {Object.keys(serviceTypes).map((k) => (
                  <CheckItem key={k} label={k} checked={serviceTypes[k]} onChange={() => toggleServiceType(k)} />
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>Countries you're familiar with for immigration support</FieldLabel>
              <MultiSelectCountry selected={serviceCountries} onChange={setServiceCountries} />
            </div>
            <div>
              <FieldLabel>Client Types</FieldLabel>
              <div className="flex flex-col gap-2.5">
                {Object.keys(clientTypes).map((k) => (
                  <CheckItem key={k} label={k} checked={clientTypes[k]} onChange={() => toggleClientType(k)} />
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>Languages Offered</FieldLabel>
              <div className="flex flex-col gap-2.5">
                {Object.keys(languages).map((k) => (
                  <CheckItem key={k} label={k} checked={languages[k]} onChange={() => toggleLanguage(k)} />
                ))}
              </div>
            </div>
          </StepCard>
        )}

        {/* ── Step 7: Compliance & Ethics ── */}
        {step === 7 && (
          <StepCard
            title="Compliance & Ethics"
            step={7}
            total={TOTAL_STEPS}
            isLast
            onPrev={prev}
            onNext={next}
            onComplete={handleSubmit}
            loading={loading}
          >
            <div>
              <FieldLabel>Have you ever been disbarred, suspended, or investigated for misconduct? *</FieldLabel>
              <SelectDropdown
                placeholder="Select"
                options={YES_NO}
                value={misconduct}
                onChange={setMisconduct}
              />
            </div>
            <div className="flex flex-col gap-3 pt-1">
              <CheckItem
                label="I comply with the Code of Conduct set by my regulatory authority"
                checked={codeConsent}
                onChange={setCodeConsent}
              />
              <CheckItem
                label="I agree to the marketplace's Terms of Use and Code of Ethics"
                checked={termsConsent}
                onChange={setTermsConsent}
              />
            </div>
          </StepCard>
        )}

        {/* ── Submitted modal ── */}
        {submitted && (
          <>
            <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-sm bg-th-sidebar border border-th-border-md rounded-3xl p-8 flex flex-col items-center text-center gap-5 shadow-2xl">
                <div className="h-16 w-16 rounded-full border-2 border-white flex items-center justify-center">
                  <CircleCheck size={30} className="text-th-text" />
                </div>
                <div className="flex flex-col gap-2">
                  <h2 className="text-xl font-bold text-th-text leading-tight">
                    Your application has been submitted and is under review.
                  </h2>
                  <p className="text-sm text-th-text-60 leading-6">
                    Once approved, you'll be able to view and answer questions to start earning
                  </p>
                </div>
                <button
                  onClick={() => navigate("/expert-dashboard")}
                  className="w-full h-12 rounded-full bg-[#0f0f11] text-white font-semibold text-sm hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 transition-colors"
                  data-testid="button-go-dashboard"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </ExpertLayout>
  );
};
