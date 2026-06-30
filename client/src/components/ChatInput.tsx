import { useState, useRef, useEffect } from "react";
import { Paperclip, ArrowUp, ChevronDown, MessageCircle, Phone, X } from "lucide-react";
import coinImg from "@assets/coins_1781943901685.png";
import { CallExpertModal } from "./CallExpertModal";

export interface AttachmentData { data: string; name: string }

interface ChatInputProps {
  onSubmit?: (question: string, expertType: string, country: string, attachment?: AttachmentData | null) => void;
  showAudienceTabs?: boolean;
  isSubmitting?: boolean;
  initialQuestion?: string;
}

const countries = [
  { code: "gb", name: "United Kingdom" },
  { code: "af", name: "Afghanistan" },
  { code: "al", name: "Albania" },
  { code: "dz", name: "Algeria" },
  { code: "ad", name: "Andorra" },
  { code: "ao", name: "Angola" },
  { code: "ag", name: "Antigua and Barbuda" },
  { code: "ar", name: "Argentina" },
  { code: "am", name: "Armenia" },
  { code: "au", name: "Australia" },
  { code: "at", name: "Austria" },
  { code: "az", name: "Azerbaijan" },
  { code: "bs", name: "Bahamas" },
  { code: "bh", name: "Bahrain" },
  { code: "bd", name: "Bangladesh" },
  { code: "bb", name: "Barbados" },
  { code: "by", name: "Belarus" },
  { code: "be", name: "Belgium" },
  { code: "bz", name: "Belize" },
  { code: "bj", name: "Benin" },
  { code: "bt", name: "Bhutan" },
  { code: "bo", name: "Bolivia" },
  { code: "ba", name: "Bosnia and Herzegovina" },
  { code: "bw", name: "Botswana" },
  { code: "br", name: "Brazil" },
  { code: "bn", name: "Brunei" },
  { code: "bg", name: "Bulgaria" },
  { code: "bf", name: "Burkina Faso" },
  { code: "bi", name: "Burundi" },
  { code: "cv", name: "Cabo Verde" },
  { code: "kh", name: "Cambodia" },
  { code: "cm", name: "Cameroon" },
  { code: "ca", name: "Canada" },
  { code: "cf", name: "Central African Republic" },
  { code: "td", name: "Chad" },
  { code: "cl", name: "Chile" },
  { code: "cn", name: "China" },
  { code: "co", name: "Colombia" },
  { code: "km", name: "Comoros" },
  { code: "cd", name: "Congo (DRC)" },
  { code: "cg", name: "Congo (Republic)" },
  { code: "cr", name: "Costa Rica" },
  { code: "ci", name: "Côte d'Ivoire" },
  { code: "hr", name: "Croatia" },
  { code: "cu", name: "Cuba" },
  { code: "cy", name: "Cyprus" },
  { code: "cz", name: "Czech Republic" },
  { code: "dk", name: "Denmark" },
  { code: "dj", name: "Djibouti" },
  { code: "dm", name: "Dominica" },
  { code: "do", name: "Dominican Republic" },
  { code: "ec", name: "Ecuador" },
  { code: "eg", name: "Egypt" },
  { code: "sv", name: "El Salvador" },
  { code: "gq", name: "Equatorial Guinea" },
  { code: "er", name: "Eritrea" },
  { code: "ee", name: "Estonia" },
  { code: "sz", name: "Eswatini" },
  { code: "et", name: "Ethiopia" },
  { code: "fj", name: "Fiji" },
  { code: "fi", name: "Finland" },
  { code: "fr", name: "France" },
  { code: "ga", name: "Gabon" },
  { code: "gm", name: "Gambia" },
  { code: "ge", name: "Georgia" },
  { code: "de", name: "Germany" },
  { code: "gh", name: "Ghana" },
  { code: "gr", name: "Greece" },
  { code: "gd", name: "Grenada" },
  { code: "gt", name: "Guatemala" },
  { code: "gn", name: "Guinea" },
  { code: "gw", name: "Guinea-Bissau" },
  { code: "gy", name: "Guyana" },
  { code: "ht", name: "Haiti" },
  { code: "hn", name: "Honduras" },
  { code: "hu", name: "Hungary" },
  { code: "is", name: "Iceland" },
  { code: "in", name: "India" },
  { code: "id", name: "Indonesia" },
  { code: "ir", name: "Iran" },
  { code: "iq", name: "Iraq" },
  { code: "ie", name: "Ireland" },
  { code: "il", name: "Israel" },
  { code: "it", name: "Italy" },
  { code: "jm", name: "Jamaica" },
  { code: "jp", name: "Japan" },
  { code: "jo", name: "Jordan" },
  { code: "kz", name: "Kazakhstan" },
  { code: "ke", name: "Kenya" },
  { code: "ki", name: "Kiribati" },
  { code: "kw", name: "Kuwait" },
  { code: "kg", name: "Kyrgyzstan" },
  { code: "la", name: "Laos" },
  { code: "lv", name: "Latvia" },
  { code: "lb", name: "Lebanon" },
  { code: "ls", name: "Lesotho" },
  { code: "lr", name: "Liberia" },
  { code: "ly", name: "Libya" },
  { code: "li", name: "Liechtenstein" },
  { code: "lt", name: "Lithuania" },
  { code: "lu", name: "Luxembourg" },
  { code: "mg", name: "Madagascar" },
  { code: "mw", name: "Malawi" },
  { code: "my", name: "Malaysia" },
  { code: "mv", name: "Maldives" },
  { code: "ml", name: "Mali" },
  { code: "mt", name: "Malta" },
  { code: "mh", name: "Marshall Islands" },
  { code: "mr", name: "Mauritania" },
  { code: "mu", name: "Mauritius" },
  { code: "mx", name: "Mexico" },
  { code: "fm", name: "Micronesia" },
  { code: "md", name: "Moldova" },
  { code: "mc", name: "Monaco" },
  { code: "mn", name: "Mongolia" },
  { code: "me", name: "Montenegro" },
  { code: "ma", name: "Morocco" },
  { code: "mz", name: "Mozambique" },
  { code: "mm", name: "Myanmar" },
  { code: "na", name: "Namibia" },
  { code: "nr", name: "Nauru" },
  { code: "np", name: "Nepal" },
  { code: "nl", name: "Netherlands" },
  { code: "nz", name: "New Zealand" },
  { code: "ni", name: "Nicaragua" },
  { code: "ne", name: "Niger" },
  { code: "ng", name: "Nigeria" },
  { code: "mk", name: "North Macedonia" },
  { code: "no", name: "Norway" },
  { code: "om", name: "Oman" },
  { code: "pk", name: "Pakistan" },
  { code: "pw", name: "Palau" },
  { code: "pa", name: "Panama" },
  { code: "pg", name: "Papua New Guinea" },
  { code: "py", name: "Paraguay" },
  { code: "pe", name: "Peru" },
  { code: "ph", name: "Philippines" },
  { code: "pl", name: "Poland" },
  { code: "pt", name: "Portugal" },
  { code: "qa", name: "Qatar" },
  { code: "ro", name: "Romania" },
  { code: "ru", name: "Russia" },
  { code: "rw", name: "Rwanda" },
  { code: "kn", name: "Saint Kitts and Nevis" },
  { code: "lc", name: "Saint Lucia" },
  { code: "vc", name: "Saint Vincent and the Grenadines" },
  { code: "ws", name: "Samoa" },
  { code: "sm", name: "San Marino" },
  { code: "st", name: "Sao Tome and Principe" },
  { code: "sa", name: "Saudi Arabia" },
  { code: "sn", name: "Senegal" },
  { code: "rs", name: "Serbia" },
  { code: "sc", name: "Seychelles" },
  { code: "sl", name: "Sierra Leone" },
  { code: "sg", name: "Singapore" },
  { code: "sk", name: "Slovakia" },
  { code: "si", name: "Slovenia" },
  { code: "sb", name: "Solomon Islands" },
  { code: "so", name: "Somalia" },
  { code: "za", name: "South Africa" },
  { code: "ss", name: "South Sudan" },
  { code: "es", name: "Spain" },
  { code: "lk", name: "Sri Lanka" },
  { code: "sd", name: "Sudan" },
  { code: "sr", name: "Suriname" },
  { code: "se", name: "Sweden" },
  { code: "ch", name: "Switzerland" },
  { code: "sy", name: "Syria" },
  { code: "tw", name: "Taiwan" },
  { code: "tj", name: "Tajikistan" },
  { code: "tz", name: "Tanzania" },
  { code: "th", name: "Thailand" },
  { code: "tl", name: "Timor-Leste" },
  { code: "tg", name: "Togo" },
  { code: "to", name: "Tonga" },
  { code: "tt", name: "Trinidad and Tobago" },
  { code: "tn", name: "Tunisia" },
  { code: "tr", name: "Turkey" },
  { code: "tm", name: "Turkmenistan" },
  { code: "tv", name: "Tuvalu" },
  { code: "ug", name: "Uganda" },
  { code: "ua", name: "Ukraine" },
  { code: "ae", name: "United Arab Emirates" },
  { code: "us", name: "United States" },
  { code: "uy", name: "Uruguay" },
  { code: "uz", name: "Uzbekistan" },
  { code: "vu", name: "Vanuatu" },
  { code: "ve", name: "Venezuela" },
  { code: "vn", name: "Vietnam" },
  { code: "ye", name: "Yemen" },
  { code: "zm", name: "Zambia" },
  { code: "zw", name: "Zimbabwe" },
];

type Country = typeof countries[0];

const flagUrl = (code: string, size: 20 | 40 = 20) =>
  `https://flagcdn.com/w${size}/${code}.png`;

const CountryFlag = ({ code, name, size = 20 }: { code: string; name: string; size?: number }) => (
  <img
    src={flagUrl(code, size <= 20 ? 20 : 40)}
    srcSet={`${flagUrl(code, 40)} 2x`}
    alt={name}
    width={size}
    height={Math.round(size * 0.75)}
    className="object-cover rounded-[2px] shrink-0"
    style={{ imageRendering: "auto" }}
    loading="lazy"
  />
);

export const ChatInput = ({ onSubmit, showAudienceTabs = true, isSubmitting = false, initialQuestion = "" }: ChatInputProps) => {
  const [question, setQuestion] = useState(initialQuestion);
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [langOpen, setLangOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [attachment, setAttachment] = useState<AttachmentData | null>(null);
  const [attachInfoOpen, setAttachInfoOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const attachInfoRef = useRef<HTMLDivElement>(null);

  // Close attach info popover on outside click
  useEffect(() => {
    if (!attachInfoOpen) return;
    const handler = (e: MouseEvent) => {
      if (attachInfoRef.current && !attachInfoRef.current.contains(e.target as Node)) {
        setAttachInfoOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [attachInfoOpen]);

  const filteredCountries = countrySearch.trim()
    ? countries.filter((c) => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
    : countries;

  const openDropdown = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 240),
      });
    }
    setCountrySearch("");
    setLangOpen(true);
  };

  const closeDropdown = () => {
    setLangOpen(false);
    setCountrySearch("");
  };

  const handleSubmit = () => {
    if (question.trim() && !isSubmitting) {
      onSubmit?.(question.trim(), "immigration", selectedCountry.name, attachment);
      setQuestion("");
      setAttachment(null);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Please upload a file under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({ data: reader.result as string, name: file.name });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-3">
      {showAudienceTabs && (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button
            className="h-9 rounded-full px-4 text-sm font-medium transition-colors flex items-center gap-2 bg-[#0f0f11] text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
            data-testid="button-chat-expert"
            type="button"
          >
            <MessageCircle size={15} />
            Chat an Expert
          </button>
          <button
            onClick={() => setCallModalOpen(true)}
            className="h-9 rounded-full px-4 text-sm font-medium transition-colors flex items-center gap-2 border border-th-border-md text-th-text-70 hover:text-th-text hover:bg-th-hover"
            data-testid="button-call-expert"
            type="button"
          >
            <Phone size={15} />
            Call an Expert
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-th-border-md bg-th-card">
        {/* Text area */}
        <div className="px-4 pt-4 pb-2">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKey}
            placeholder="What do you want to know?"
            rows={3}
            disabled={isSubmitting}
            className="w-full resize-none bg-transparent text-base text-th-text-80 placeholder:text-th-text-40 focus:outline-none leading-6 disabled:opacity-60"
            data-testid="input-question"
          />
        </div>

        {/* Attachment pill */}
        {attachment && (
          <div className="px-4 pb-2 flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-th-hover border border-th-border-md rounded-full px-3 py-1 max-w-[240px]">
              <Paperclip size={12} className="text-th-text-60 shrink-0" />
              <span className="text-xs text-th-text-70 truncate">{attachment.name}</span>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="ml-1 text-th-text-40 hover:text-th-text-80 transition-colors shrink-0"
                aria-label="Remove attachment"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-3 pb-3">
          {/* Left: attach + language */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              className="hidden"
              onChange={handleFileChange}
              data-testid="input-file"
            />
            <div className="relative" ref={attachInfoRef}>
              <button
                onClick={() => setAttachInfoOpen((o) => !o)}
                className="h-9 w-9 flex items-center justify-center rounded-full bg-th-card-hover border border-th-border-md text-th-text-70 hover:text-th-text hover:bg-th-card-hover transition-colors"
                aria-label="Attach file"
                data-testid="button-attach"
                type="button"
              >
                <Paperclip size={16} className="-rotate-45" />
              </button>

              {attachInfoOpen && (
                <div className="absolute bottom-11 left-0 z-50 w-64 rounded-2xl bg-th-sidebar border border-th-border-md shadow-xl p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-th-text/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Paperclip size={13} className="text-th-text -rotate-45" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-th-text leading-snug">Attach a document</p>
                      <p className="text-xs text-th-text-50 mt-1 leading-5">You can attach your CV, cover letter, or any relevant document you'd like the expert to review. Max 5MB.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setAttachInfoOpen(false); fileInputRef.current?.click(); }}
                    className="w-full h-9 rounded-full bg-[#0f0f11] text-white text-xs font-semibold hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 transition-colors"
                    data-testid="button-attach-choose"
                  >
                    Choose file
                  </button>
                </div>
              )}
            </div>

            <button
              ref={triggerRef}
              onClick={openDropdown}
              type="button"
              className="flex items-center gap-1.5 h-9 px-2 sm:px-3 rounded-full border border-th-border-md text-sm text-th-text-70 hover:text-th-text hover:bg-th-hover transition-colors"
              data-testid="button-language"
            >
              <CountryFlag code={selectedCountry.code} name={selectedCountry.name} size={20} />
              <span className="hidden sm:inline max-w-[100px] truncate">{selectedCountry.name}</span>
              <ChevronDown size={13} className={`transition-transform shrink-0 ${langOpen ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* Right: coins + submit */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 h-9 px-2 sm:px-3 rounded-full border border-th-border-md text-sm text-th-text-60">
              <img src={coinImg} alt="coins" className="w-[18px] h-[18px] object-contain" style={{ imageRendering: "auto" }} />
              <span className="hidden sm:inline">3 Coins/question</span>
            </div>
            <button
              onClick={handleSubmit}
              type="button"
              disabled={isSubmitting || !question.trim()}
              className="h-9 w-9 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Submit question"
              data-testid="button-submit"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <ArrowUp size={18} className="text-black" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Country dropdown — rendered in a portal via fixed positioning to escape any overflow:hidden */}
      {langOpen && dropdownPos && (
        <>
          <div className="fixed inset-0 z-[999]" onClick={closeDropdown} />
          <div
            className="fixed z-[1000] bg-th-card-alt border border-th-border-md rounded-xl shadow-2xl flex flex-col overflow-hidden"
            style={{
              bottom: window.innerHeight - dropdownPos.top + 8,
              left: dropdownPos.left,
              width: 260,
            }}
          >
            <div className="p-2 border-b border-th-border shrink-0">
              <input
                type="text"
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                placeholder="Search country…"
                className="w-full bg-th-hover border border-th-border-md rounded-lg px-3 py-1.5 text-xs text-th-text placeholder:text-th-text-30 focus:outline-none"
                autoFocus
                data-testid="input-country-search"
              />
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 220 }}>
              {filteredCountries.length === 0 && (
                <p className="text-xs text-th-text-30 text-center py-4">No results</p>
              )}
              {filteredCountries.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { setSelectedCountry(c); closeDropdown(); }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-th-hover flex items-center gap-2.5 transition-colors ${
                    selectedCountry.code === c.code ? "text-th-text bg-th-hover" : "text-th-text-80"
                  }`}
                >
                  <CountryFlag code={c.code} name={c.name} size={20} />
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {callModalOpen && <CallExpertModal onClose={() => setCallModalOpen(false)} />}
    </div>
  );
};
