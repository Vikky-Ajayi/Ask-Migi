import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { ExpertLayout } from "@/components/ExpertLayout";
import { PromoteModal } from "@/components/PromoteModal";
import { ArrowLeft, Check, ChevronDown, X } from "lucide-react";
import ukFlagImg from "@assets/emojione_flag-for-united-kingdom_1781943901686.png";

const SERVICE_TYPES = [
  "Visa and Passport Services",
  "Travel Booking Services",
  "Accommodation Services",
  "Student Travel Services",
  "Transportation Services",
  "Corporate and Business Travel Services",
  "Holiday and Tour Packages",
  "Travel Insurance Services",
  "Pilgrimage and Religious Travel",
  "Travel Consultation and Planning",
  "Document services",
];

const VISA_TYPES: { label: string; sub: string }[] = [
  { label: "Tourist Visa Services", sub: "Single/multiple entry, e-Visas, visa on arrival" },
  { label: "Business Visa Services", sub: "Business meetings, conferences, trade activities" },
  { label: "Student Visa Assistance", sub: "Student visa applications, document verification" },
  { label: "Work Visa Services", sub: "Skilled/unskilled worker visas, work permits" },
  { label: "Medical Visa Services", sub: "Treatment abroad, hospital coordination" },
  { label: "Family / Spouse Visa", sub: "Family reunification, dependent visas" },
  { label: "Pilgrimage / Religious Visa", sub: "Hajj, Umrah, religious travel" },
  { label: "Transit Visa Services", sub: "Transit visas, layover assistance" },
  { label: "Visa Extension / Renewal", sub: "Extending existing visas" },
  { label: "Immigration & PR Visas", sub: "Permanent residency guidance" },
  { label: "Embassy Services", sub: "Appointment booking, documentation" },
  { label: "Document Legalization", sub: "Attestation services" },
  { label: "Group Travel or Corporate Visa Coordination", sub: "Handling multiple visas for tour groups or corporate delegations" },
  { label: "e-Visa Application Assistance", sub: "For countries offering online visa platforms (like India, Turkey, Kenya)" },
  { label: "Visa Appeal or Reapplication Support", sub: "For clients who have had visa denials and need help reapplying or appealing" },
];

const ALL_COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria",
  "Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan",
  "Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia",
  "Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica",
  "Croatia","Cuba","Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt",
  "El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France","Gabon",
  "Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana",
  "Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel",
  "Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos",
  "Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi",
  "Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova",
  "Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands",
  "New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan","Palau",
  "Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania",
  "Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe",
  "Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia",
  "South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria",
  "Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey",
  "Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu",
  "Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
];

const CURRENCIES: { code: string; flag?: string; flagImg?: string }[] = [
  { code: "GBP", flagImg: "uk" },
  { code: "USD", flag: "🇺🇸" },
  { code: "EUR", flag: "🇪🇺" },
  { code: "CAD", flag: "🇨🇦" },
  { code: "AUD", flag: "🇦🇺" },
  { code: "NGN", flag: "🇳🇬" },
  { code: "GHS", flag: "🇬🇭" },
  { code: "KES", flag: "🇰🇪" },
  { code: "ZAR", flag: "🇿🇦" },
];

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span className={`flex-shrink-0 h-[18px] w-[18px] rounded-[4px] border flex items-center justify-center transition-colors ${
      checked ? "bg-white border-white" : "border-th-border-strong bg-transparent"
    }`}>
      {checked && <Check size={11} strokeWidth={3} className="text-black" />}
    </span>
  );
}

function CountryMultiSelect({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = ALL_COUNTRIES.filter(
    (c) => c.toLowerCase().includes(search.toLowerCase()) && !selected.includes(c)
  );

  const toggle = (c: string) => {
    onChange(selected.includes(c) ? selected.filter((x) => x !== c) : [...selected, c]);
  };

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => setOpen((o) => !o)}
        className="min-h-[44px] w-full rounded-xl bg-th-card-alt border border-th-border-md px-3 py-2 flex items-center gap-2 flex-wrap cursor-pointer hover:border-th-border-strong transition-colors"
      >
        {selected.map((c) => (
          <span
            key={c}
            onClick={(e) => { e.stopPropagation(); toggle(c); }}
            className="flex items-center gap-1 bg-th-card-hover border border-th-border-md text-th-text text-xs rounded-md px-2 py-1 cursor-pointer hover:border-th-border-strong"
          >
            {c}
            <X size={10} className="text-th-text-50" />
          </span>
        ))}
        {selected.length === 0 && (
          <span className="text-sm text-th-text-30">Select countries…</span>
        )}
        <ChevronDown size={16} className={`ml-auto text-th-text-40 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-th-sidebar border border-th-border-md rounded-xl shadow-2xl z-20 flex flex-col">
          <div className="p-2 border-b border-th-border-md">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search countries…"
              className="w-full h-9 bg-th-card-alt border border-th-border-md rounded-lg px-3 text-sm text-th-text placeholder:text-th-text-30 focus:outline-none focus:border-th-border-strong"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-th-text-40 py-4">No results</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c}
                  onClick={() => { toggle(c); setSearch(""); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-th-text-70 hover:text-th-text hover:bg-th-hover transition-colors flex items-center justify-between"
                >
                  {c}
                  {selected.includes(c) && <Check size={13} className="text-th-text-60" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SuccessModal({ onClose, onPromote }: { onClose: () => void; onPromote: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#0f1011] border border-th-border-md rounded-2xl p-7 shadow-2xl flex flex-col items-center text-center gap-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-th-card-alt text-th-text-50 hover:text-th-text transition-colors"
        >
          <X size={15} />
        </button>

        <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center shadow-lg mt-2">
          <Check size={36} strokeWidth={2.5} className="text-black" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-th-text mb-2">Service Created Successfully</h2>
          <p className="text-sm text-th-text-60 leading-6">
            Your travel agency service is live! Promote it to boost visibility and start getting bookings faster.
          </p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={onClose}
            className="w-full h-12 rounded-full bg-[#0f0f11] text-white font-semibold text-sm hover:bg-black/90 transition-colors"
          >
            Proceed Without Promotion
          </button>
          <button
            onClick={onPromote}
            className="w-full h-12 rounded-full bg-th-sidebar border border-th-border-md text-th-text font-semibold text-sm hover:bg-th-card-hover transition-colors"
          >
            Promote with coins
          </button>
        </div>
      </div>
    </div>
  );
}

export const ExpertCreateServicePage = () => {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);

  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [currency, setCurrency] = useState("GBP");
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [averagePrice, setAveragePrice] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [visaServices, setVisaServices] = useState<string[]>([]);

  const currencyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) setShowCurrencyMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleServiceType = (t: string) => {
    setServiceTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  };
  const toggleVisa = (v: string) => {
    setVisaServices((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);
  };

  const validateStep1 = () => {
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

  const selectedCurrency = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

  return (
    <ExpertLayout title="Create Service" verified={true}>
      <div className="px-4 md:px-8 py-6">
        {/* Back + title */}
        <button
          onClick={() => step === 1 ? navigate("/expert-dashboard") : setStep(1)}
          className="flex items-center gap-1.5 text-sm text-th-text-50 hover:text-th-text transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <h1 className="text-2xl font-bold text-th-text mb-5">Set up your service</h1>

        {/* Card */}
        <div className="bg-th-page border border-th-border-md rounded-2xl overflow-hidden">

          {/* Card header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-th-border-md">
            <h2 className="text-base font-semibold text-th-text">
              {step === 1 ? "What type of services do you provide" : "Select the type of Visa assistance you offer"}
            </h2>
            <span className="text-xs font-medium text-th-text-50 bg-th-card-alt border border-th-border-md rounded-lg px-2.5 py-1 shrink-0 ml-4">
              {step} of 2
            </span>
          </div>

          {/* Card body */}
          <div className="px-6 py-5 flex flex-col gap-5">

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <>
                {/* Business name (hidden from reference but needed for API) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-th-text-60">Business / Agency Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Global Journeys Travel"
                    className="h-11 rounded-xl bg-th-card-alt border border-th-border-md px-4 text-sm text-th-text placeholder:text-th-text-30 focus:border-th-border-strong focus:outline-none transition-colors"
                  />
                </div>

                {/* Service types checkboxes */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-th-text-60">What type of Services do you provide</label>
                  <div className="border border-th-border-md rounded-xl overflow-hidden divide-y divide-[#2e3032]">
                    {SERVICE_TYPES.map((t) => (
                      <button
                        key={t}
                        onClick={() => toggleServiceType(t)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-white/[0.03] transition-colors"
                      >
                        <Checkbox checked={serviceTypes.includes(t)} />
                        <span className={serviceTypes.includes(t) ? "text-th-text" : "text-th-text-70"}>{t}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Countries multi-select */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-th-text-60">What countries do you provide visa assistance for?</label>
                  <CountryMultiSelect selected={countries} onChange={setCountries} />
                </div>

                {/* Price */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-th-text-60">What's the average price of your service</label>
                  <div className="flex h-11 rounded-xl bg-th-card-alt border border-th-border-md overflow-hidden focus-within:border-th-border-strong transition-colors">
                    {/* Currency selector */}
                    <div ref={currencyRef} className="relative">
                      <button
                        onClick={() => setShowCurrencyMenu((o) => !o)}
                        className="h-full flex items-center gap-1.5 px-3 border-r border-th-border-md text-sm text-th-text hover:bg-th-hover transition-colors whitespace-nowrap"
                      >
                        {selectedCurrency.flagImg === "uk"
                          ? <img src={ukFlagImg} alt="UK" className="w-5 h-5 object-contain" />
                          : <span className="text-base leading-none">{selectedCurrency.flag}</span>}
                        <span>{selectedCurrency.code}</span>
                        <ChevronDown size={13} className="text-th-text-40" />
                      </button>
                      {showCurrencyMenu && (
                        <div className="absolute left-0 top-full mt-1 bg-th-sidebar border border-th-border-md rounded-xl shadow-2xl z-20 min-w-[120px]">
                          {CURRENCIES.map((c) => (
                            <button
                              key={c.code}
                              onClick={() => { setCurrency(c.code); setShowCurrencyMenu(false); }}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-th-text-70 hover:text-th-text hover:bg-th-hover transition-colors"
                            >
                              {c.flagImg === "uk"
                                ? <img src={ukFlagImg} alt="UK" className="w-5 h-5 object-contain" />
                                : <span>{c.flag}</span>}
                              <span>{c.code}</span>
                              {c.code === currency && <Check size={12} className="ml-auto text-th-text-60" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input
                      type="number"
                      value={averagePrice}
                      onChange={(e) => setAveragePrice(e.target.value)}
                      placeholder="Enter amount, e.g 10"
                      className="flex-1 bg-transparent px-3 text-sm text-th-text placeholder:text-th-text-30 focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <>
                <label className="text-sm text-th-text-60">What type of Services do you provide</label>
                <div className="border border-th-border-md rounded-xl overflow-hidden divide-y divide-[#2e3032] -mt-3">
                  {VISA_TYPES.map((v) => (
                    <button
                      key={v.label}
                      onClick={() => toggleVisa(v.label)}
                      className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
                    >
                      <Checkbox checked={visaServices.includes(v.label)} />
                      <div className="flex flex-col">
                        <span className={`text-sm font-medium leading-snug ${visaServices.includes(v.label) ? "text-th-text" : "text-th-text-80"}`}>
                          {v.label}
                        </span>
                        <span className="text-xs text-th-text-40 mt-0.5 leading-snug">{v.sub}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
          </div>

          {/* Card footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-th-border-md">
            <button
              onClick={() => step === 1 ? navigate("/expert-dashboard") : setStep(1)}
              className="h-10 px-5 rounded-full border border-th-border-md text-th-text-70 font-medium text-sm hover:bg-th-hover hover:text-th-text transition-colors flex items-center gap-1"
            >
              <ArrowLeft size={13} />
              Previous
            </button>
            {step === 1 ? (
              <button
                onClick={handleNext}
                className="h-10 px-6 rounded-full bg-[#0f0f11] text-white font-semibold text-sm hover:bg-black/90 transition-colors flex items-center gap-1"
              >
                Next
                <span className="text-base leading-none ml-0.5">›</span>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="h-10 px-6 rounded-full bg-[#0f0f11] text-white font-semibold text-sm hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {loading ? "Creating…" : <>Create Service <span className="text-base leading-none ml-0.5">›</span></>}
              </button>
            )}
          </div>
        </div>
      </div>

      {success && !promoteOpen && (
        <SuccessModal
          onClose={() => navigate("/expert-dashboard")}
          onPromote={() => setPromoteOpen(true)}
        />
      )}

      {promoteOpen && (
        <PromoteModal
          onClose={() => navigate("/expert-dashboard")}
          coins={user?.coins ?? 0}
          onSuccess={() => navigate("/expert-dashboard")}
        />
      )}
    </ExpertLayout>
  );
};
