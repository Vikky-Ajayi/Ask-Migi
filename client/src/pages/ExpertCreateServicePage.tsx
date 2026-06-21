import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ExpertLayout } from "@/components/ExpertLayout";
import { ArrowLeft, X, Check } from "lucide-react";

const SERVICE_TYPES = [
  "Visa and Passport Services",
  "Travel Booking Services",
  "Immigration Consulting",
  "Document Preparation",
  "Work Permit Assistance",
  "Student Visa Services",
  "Family Reunion Services",
  "Business Immigration",
  "PR & Citizenship Applications",
  "Translation Services",
];

const COUNTRIES = [
  "United Kingdom", "United States", "Canada", "Australia", "Germany",
  "France", "Ghana", "Nigeria", "Kenya", "South Africa", "India", "UAE",
  "Singapore", "Japan", "New Zealand", "Ireland", "Italy", "Spain",
  "Netherlands", "Sweden", "Norway", "Switzerland", "Brazil", "Mexico",
];

const VISA_TYPES = [
  "Tourist / Visitor Visa",
  "Work Visa / Work Permit",
  "Student Visa",
  "Family / Spouse Visa",
  "Business Visa",
  "Skilled Worker Visa",
  "Digital Nomad Visa",
  "Transit Visa",
  "Refugee / Asylum",
  "Permanent Residency",
  "Citizenship / Naturalisation",
  "Schengen Visa",
  "EU Blue Card",
  "Investor Visa",
  "Entrepreneur Visa",
  "Dependent Visa",
  "Visa on Arrival",
  "e-Visa",
];

const CURRENCIES = ["GBP", "USD", "EUR", "CAD", "AUD", "NGN", "GHS", "KES", "ZAR"];

function SuccessModal({ businessName, onClose }: { businessName: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#0f1011] border border-[#2e3032] rounded-2xl p-7 shadow-2xl flex flex-col items-center text-center gap-5">
        <div className="h-16 w-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
          <Check size={28} className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white mb-1">Service Created!</h2>
          <p className="text-sm text-white/55 leading-6">
            <span className="font-semibold text-white">{businessName}</span> has been created and is now active on the platform.
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full h-11 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors"
        >
          View Dashboard
        </button>
      </div>
    </div>
  );
}

export const ExpertCreateServicePage = () => {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [countryInput, setCountryInput] = useState("");
  const [currency, setCurrency] = useState("GBP");
  const [averagePrice, setAveragePrice] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [visaServices, setVisaServices] = useState<string[]>([]);

  const toggleServiceType = (t: string) => {
    setServiceTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  };

  const toggleVisa = (v: string) => {
    setVisaServices((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);
  };

  const addCountry = (c: string) => {
    if (c && !countries.includes(c)) setCountries((prev) => [...prev, c]);
    setCountryInput("");
  };

  const removeCountry = (c: string) => setCountries((prev) => prev.filter((x) => x !== c));

  const filteredCountries = COUNTRIES.filter(
    (c) => c.toLowerCase().includes(countryInput.toLowerCase()) && !countries.includes(c)
  );

  const validateStep1 = () => {
    if (!businessName) { setError("Please enter your business name."); return false; }
    if (serviceTypes.length === 0) { setError("Please select at least one service type."); return false; }
    return true;
  };

  const handleNext = () => {
    setError("");
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const token = localStorage.getItem("askmigi_token");
      const res = await fetch("/api/expert/services", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ businessName, serviceTypes, countries, visaServices, currency, averagePrice }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create service");
      }
      qc.invalidateQueries({ queryKey: ["/api/expert/services"] });
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || "Failed to create service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ExpertLayout title="Create Service" verified={true}>
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
            <h1 className="text-xl font-bold text-white">Set up your service</h1>
            <span className="text-sm text-white/40 shrink-0">{step} of 2</span>
          </div>
          <div className="mt-4 h-1 bg-[#2e3032] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2d7dd2] rounded-full transition-all duration-500"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-[#161618] border border-[#2e3032] rounded-2xl p-5 md:p-6">
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <h2 className="text-base font-bold text-white">What type of services do you provide?</h2>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wide">Business / Agency Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Global Journeys Travel"
                  className="h-11 rounded-xl bg-[#1e2022] border border-[#2e3032] px-4 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wide">Service Types</label>
                <div className="grid grid-cols-1 gap-2">
                  {SERVICE_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => toggleServiceType(t)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm text-left transition-colors ${
                        serviceTypes.includes(t)
                          ? "border-white/30 bg-white/8 text-white"
                          : "border-[#2e3032] text-white/60 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      <span>{t}</span>
                      {serviceTypes.includes(t) && <Check size={14} className="text-white/70 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wide">Countries You Cover</label>
                {countries.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {countries.map((c) => (
                      <span key={c} className="flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-[#1e4a7a] border border-[#2a6095] text-xs text-white">
                        {c}
                        <button onClick={() => removeCountry(c)} className="text-white/50 hover:text-white transition-colors">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <input
                    type="text"
                    value={countryInput}
                    onChange={(e) => setCountryInput(e.target.value)}
                    placeholder="Type to search countries…"
                    className="h-11 w-full rounded-xl bg-[#1e2022] border border-[#2e3032] px-4 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-colors"
                  />
                  {countryInput && filteredCountries.length > 0 && (
                    <div className="absolute left-0 right-0 top-12 bg-[#1a1c1e] border border-[#2e3032] rounded-xl shadow-xl z-10 max-h-44 overflow-y-auto">
                      {filteredCountries.slice(0, 8).map((c) => (
                        <button
                          key={c}
                          onClick={() => addCountry(c)}
                          className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wide">Average Price of Service</label>
                <div className="flex gap-2">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="h-11 w-24 rounded-xl bg-[#1e2022] border border-[#2e3032] px-3 text-sm text-white focus:border-white/30 focus:outline-none transition-colors appearance-none"
                  >
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input
                    type="number"
                    value={averagePrice}
                    onChange={(e) => setAveragePrice(e.target.value)}
                    placeholder="0.00"
                    className="h-11 flex-1 rounded-xl bg-[#1e2022] border border-[#2e3032] px-4 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-base font-bold text-white">Select the type of Visa assistance you offer</h2>
              <p className="text-sm text-white/50 -mt-1">Choose all visa types you can assist clients with.</p>
              <div className="grid grid-cols-1 gap-2">
                {VISA_TYPES.map((v) => (
                  <button
                    key={v}
                    onClick={() => toggleVisa(v)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm text-left transition-colors ${
                      visaServices.includes(v)
                        ? "border-white/30 bg-white/8 text-white"
                        : "border-[#2e3032] text-white/60 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <span>{v}</span>
                    {visaServices.includes(v) && <Check size={14} className="text-white/70 shrink-0" />}
                  </button>
                ))}
              </div>
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
              {loading ? "Creating…" : "Create Service"}
            </button>
          )}
        </div>
      </div>

      {success && (
        <SuccessModal
          businessName={businessName}
          onClose={() => navigate("/expert-dashboard")}
        />
      )}
    </ExpertLayout>
  );
};
