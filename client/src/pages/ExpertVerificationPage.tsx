import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ExpertLayout } from "@/components/ExpertLayout";
import { ArrowLeft, Upload } from "lucide-react";

const COUNTRIES = [
  "United Kingdom", "United States", "Canada", "Australia", "Germany",
  "France", "Ghana", "Nigeria", "Kenya", "South Africa", "India", "UAE",
  "Singapore", "Japan", "Brazil", "Mexico", "Italy", "Spain", "Netherlands",
];

const FormInput = ({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-white/60 uppercase tracking-wide">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-11 rounded-xl bg-[#1e2022] border border-[#2e3032] px-4 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-colors"
    />
  </div>
);

const FormSelect = ({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-white/60 uppercase tracking-wide">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 rounded-xl bg-[#1e2022] border border-[#2e3032] px-4 text-sm text-white focus:border-white/30 focus:outline-none transition-colors appearance-none"
    >
      <option value="">Select…</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

export const ExpertVerificationPage = () => {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [personal, setPersonal] = useState({
    firstName: "", lastName: "", phone: "", email: "",
    countryOfResidence: "", physicalAddress: "", govIdFileName: "",
  });

  const [business, setBusiness] = useState({
    isRegistered: "Yes", businessName: "", registrationNumber: "",
    countryOfRegistration: "", businessAddress: "", website: "",
    socialMediaUrl: "", businessPhone: "",
  });

  const setP = (key: string) => (v: string) => setPersonal((p) => ({ ...p, [key]: v }));
  const setB = (key: string) => (v: string) => setBusiness((b) => ({ ...b, [key]: v }));

  const validateStep1 = () => {
    if (!personal.firstName || !personal.lastName || !personal.phone || !personal.email) {
      setError("Please fill in all required fields."); return false;
    }
    if (!personal.countryOfResidence) {
      setError("Please select your country of residence."); return false;
    }
    return true;
  };

  const handleNext = () => {
    setError("");
    if (step === 1 && validateStep1()) setStep(2);
  };

  const handleSubmit = async () => {
    setError("");
    if (!business.businessName) { setError("Business name is required."); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem("askmigi_token");
      const res = await fetch("/api/expert/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ personalInfo: personal, businessInfo: business }),
      });
      if (!res.ok) throw new Error("Verification failed");
      qc.invalidateQueries({ queryKey: ["/api/expert/verification"] });
      navigate("/expert-dashboard");
    } catch (e: any) {
      setError(e.message || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ExpertLayout title="Verification" verified={false}>
      <div className="px-4 md:px-8 py-6">
        <button
          onClick={() => step === 1 ? navigate("/expert-dashboard") : setStep(1)}
          className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={15} />
          Back
        </button>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold text-white">Complete your account verification</h1>
            <span className="text-sm text-white/40 shrink-0">{step} of 2</span>
          </div>
          <p className="text-sm text-white/50">
            {step === 1
              ? "Provide your personal information to begin verification."
              : "Tell us about your business to complete verification."}
          </p>
          {/* Progress bar */}
          <div className="mt-4 h-1 bg-[#2e3032] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2d7dd2] rounded-full transition-all duration-500"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-[#161618] border border-[#2e3032] rounded-2xl p-5 md:p-6">
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-base font-bold text-white mb-1">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="First Name" value={personal.firstName} onChange={setP("firstName")} placeholder="Enter first name" />
                <FormInput label="Last Name" value={personal.lastName} onChange={setP("lastName")} placeholder="Enter last name" />
              </div>
              <FormInput label="Phone Number" value={personal.phone} onChange={setP("phone")} placeholder="+44 7700 000000" type="tel" />
              <FormInput label="Email Address" value={personal.email} onChange={setP("email")} placeholder="you@example.com" type="email" />
              <FormSelect label="Country of Residence" value={personal.countryOfResidence} onChange={setP("countryOfResidence")} options={COUNTRIES} />
              <FormInput label="Physical Address" value={personal.physicalAddress} onChange={setP("physicalAddress")} placeholder="123 Main Street, City" />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wide">Government Issued ID</label>
                <label className="h-24 rounded-xl bg-[#1e2022] border border-dashed border-[#3e4042] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-white/30 transition-colors">
                  <Upload size={20} className="text-white/30" />
                  <span className="text-sm text-white/40">
                    {personal.govIdFileName || "Click to upload ID document"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setP("govIdFileName")(f.name);
                    }}
                  />
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-base font-bold text-white mb-1">Business Information</h2>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wide">Is your business registered?</label>
                <div className="flex gap-3">
                  {["Yes", "No"].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setB("isRegistered")(opt)}
                      className={`flex-1 h-11 rounded-xl border text-sm font-medium transition-colors ${
                        business.isRegistered === opt
                          ? "border-white/40 bg-white/10 text-white"
                          : "border-[#2e3032] text-white/50 hover:border-white/20"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <FormInput label="Business Name" value={business.businessName} onChange={setB("businessName")} placeholder="Your business name" />
              {business.isRegistered === "Yes" && (
                <FormInput label="Registration Number" value={business.registrationNumber} onChange={setB("registrationNumber")} placeholder="REG-XXXXXXXX" />
              )}
              <FormSelect label="Country of Registration" value={business.countryOfRegistration} onChange={setB("countryOfRegistration")} options={COUNTRIES} />
              <FormInput label="Business Address" value={business.businessAddress} onChange={setB("businessAddress")} placeholder="123 Business Street, City" />
              <FormInput label="Website" value={business.website} onChange={setB("website")} placeholder="https://yourbusiness.com" />
              <FormInput label="Social Media URL" value={business.socialMediaUrl} onChange={setB("socialMediaUrl")} placeholder="https://linkedin.com/company/..." />
              <FormInput label="Business Phone" value={business.businessPhone} onChange={setB("businessPhone")} placeholder="+44 20 0000 0000" type="tel" />
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm text-red-400 text-center">{error}</p>
          )}
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => step === 1 ? navigate("/expert-dashboard") : setStep(1)}
            className="h-11 px-6 rounded-full border border-[#2e3032] text-white/70 font-medium text-sm hover:bg-white/5 hover:text-white transition-colors"
          >
            Previous
          </button>
          {step === 1 ? (
            <button
              onClick={handleNext}
              className="h-11 px-8 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="h-11 px-8 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting…" : "Submit Verification"}
            </button>
          )}
        </div>
      </div>
    </ExpertLayout>
  );
};
