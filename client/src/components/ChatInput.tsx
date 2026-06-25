import { useState, useRef } from "react";
import { Paperclip, ArrowUp, ChevronDown, MessageCircle, Phone, X } from "lucide-react";
import coinImg from "@assets/coins_1781943901685.png";
import ukFlagImg from "@assets/emojione_flag-for-united-kingdom_1781943901686.png";
import { CallExpertModal } from "./CallExpertModal";

export interface AttachmentData { data: string; name: string }

interface ChatInputProps {
  onSubmit?: (question: string, expertType: string, country: string, attachment?: AttachmentData | null) => void;
  showAudienceTabs?: boolean;
  isSubmitting?: boolean;
  initialQuestion?: string;
}

const countries = [
  { flag: null, flagImg: ukFlagImg, name: "United Kingdom" },
  { flag: "🇦🇫", name: "Afghanistan" },
  { flag: "🇦🇱", name: "Albania" },
  { flag: "🇩🇿", name: "Algeria" },
  { flag: "🇦🇩", name: "Andorra" },
  { flag: "🇦🇴", name: "Angola" },
  { flag: "🇦🇬", name: "Antigua and Barbuda" },
  { flag: "🇦🇷", name: "Argentina" },
  { flag: "🇦🇲", name: "Armenia" },
  { flag: "🇦🇺", name: "Australia" },
  { flag: "🇦🇹", name: "Austria" },
  { flag: "🇦🇿", name: "Azerbaijan" },
  { flag: "🇧🇸", name: "Bahamas" },
  { flag: "🇧🇭", name: "Bahrain" },
  { flag: "🇧🇩", name: "Bangladesh" },
  { flag: "🇧🇧", name: "Barbados" },
  { flag: "🇧🇾", name: "Belarus" },
  { flag: "🇧🇪", name: "Belgium" },
  { flag: "🇧🇿", name: "Belize" },
  { flag: "🇧🇯", name: "Benin" },
  { flag: "🇧🇹", name: "Bhutan" },
  { flag: "🇧🇴", name: "Bolivia" },
  { flag: "🇧🇦", name: "Bosnia and Herzegovina" },
  { flag: "🇧🇼", name: "Botswana" },
  { flag: "🇧🇷", name: "Brazil" },
  { flag: "🇧🇳", name: "Brunei" },
  { flag: "🇧🇬", name: "Bulgaria" },
  { flag: "🇧🇫", name: "Burkina Faso" },
  { flag: "🇧🇮", name: "Burundi" },
  { flag: "🇨🇻", name: "Cabo Verde" },
  { flag: "🇰🇭", name: "Cambodia" },
  { flag: "🇨🇲", name: "Cameroon" },
  { flag: "🇨🇦", name: "Canada" },
  { flag: "🇨🇫", name: "Central African Republic" },
  { flag: "🇹🇩", name: "Chad" },
  { flag: "🇨🇱", name: "Chile" },
  { flag: "🇨🇳", name: "China" },
  { flag: "🇨🇴", name: "Colombia" },
  { flag: "🇰🇲", name: "Comoros" },
  { flag: "🇨🇩", name: "Congo (DRC)" },
  { flag: "🇨🇬", name: "Congo (Republic)" },
  { flag: "🇨🇷", name: "Costa Rica" },
  { flag: "🇨🇮", name: "Côte d'Ivoire" },
  { flag: "🇭🇷", name: "Croatia" },
  { flag: "🇨🇺", name: "Cuba" },
  { flag: "🇨🇾", name: "Cyprus" },
  { flag: "🇨🇿", name: "Czech Republic" },
  { flag: "🇩🇰", name: "Denmark" },
  { flag: "🇩🇯", name: "Djibouti" },
  { flag: "🇩🇲", name: "Dominica" },
  { flag: "🇩🇴", name: "Dominican Republic" },
  { flag: "🇪🇨", name: "Ecuador" },
  { flag: "🇪🇬", name: "Egypt" },
  { flag: "🇸🇻", name: "El Salvador" },
  { flag: "🇬🇶", name: "Equatorial Guinea" },
  { flag: "🇪🇷", name: "Eritrea" },
  { flag: "🇪🇪", name: "Estonia" },
  { flag: "🇸🇿", name: "Eswatini" },
  { flag: "🇪🇹", name: "Ethiopia" },
  { flag: "🇫🇯", name: "Fiji" },
  { flag: "🇫🇮", name: "Finland" },
  { flag: "🇫🇷", name: "France" },
  { flag: "🇬🇦", name: "Gabon" },
  { flag: "🇬🇲", name: "Gambia" },
  { flag: "🇬🇪", name: "Georgia" },
  { flag: "🇩🇪", name: "Germany" },
  { flag: "🇬🇭", name: "Ghana" },
  { flag: "🇬🇷", name: "Greece" },
  { flag: "🇬🇩", name: "Grenada" },
  { flag: "🇬🇹", name: "Guatemala" },
  { flag: "🇬🇳", name: "Guinea" },
  { flag: "🇬🇼", name: "Guinea-Bissau" },
  { flag: "🇬🇾", name: "Guyana" },
  { flag: "🇭🇹", name: "Haiti" },
  { flag: "🇭🇳", name: "Honduras" },
  { flag: "🇭🇺", name: "Hungary" },
  { flag: "🇮🇸", name: "Iceland" },
  { flag: "🇮🇳", name: "India" },
  { flag: "🇮🇩", name: "Indonesia" },
  { flag: "🇮🇷", name: "Iran" },
  { flag: "🇮🇶", name: "Iraq" },
  { flag: "🇮🇪", name: "Ireland" },
  { flag: "🇮🇱", name: "Israel" },
  { flag: "🇮🇹", name: "Italy" },
  { flag: "🇯🇲", name: "Jamaica" },
  { flag: "🇯🇵", name: "Japan" },
  { flag: "🇯🇴", name: "Jordan" },
  { flag: "🇰🇿", name: "Kazakhstan" },
  { flag: "🇰🇪", name: "Kenya" },
  { flag: "🇰🇮", name: "Kiribati" },
  { flag: "🇰🇼", name: "Kuwait" },
  { flag: "🇰🇬", name: "Kyrgyzstan" },
  { flag: "🇱🇦", name: "Laos" },
  { flag: "🇱🇻", name: "Latvia" },
  { flag: "🇱🇧", name: "Lebanon" },
  { flag: "🇱🇸", name: "Lesotho" },
  { flag: "🇱🇷", name: "Liberia" },
  { flag: "🇱🇾", name: "Libya" },
  { flag: "🇱🇮", name: "Liechtenstein" },
  { flag: "🇱🇹", name: "Lithuania" },
  { flag: "🇱🇺", name: "Luxembourg" },
  { flag: "🇲🇬", name: "Madagascar" },
  { flag: "🇲🇼", name: "Malawi" },
  { flag: "🇲🇾", name: "Malaysia" },
  { flag: "🇲🇻", name: "Maldives" },
  { flag: "🇲🇱", name: "Mali" },
  { flag: "🇲🇹", name: "Malta" },
  { flag: "🇲🇭", name: "Marshall Islands" },
  { flag: "🇲🇷", name: "Mauritania" },
  { flag: "🇲🇺", name: "Mauritius" },
  { flag: "🇲🇽", name: "Mexico" },
  { flag: "🇫🇲", name: "Micronesia" },
  { flag: "🇲🇩", name: "Moldova" },
  { flag: "🇲🇨", name: "Monaco" },
  { flag: "🇲🇳", name: "Mongolia" },
  { flag: "🇲🇪", name: "Montenegro" },
  { flag: "🇲🇦", name: "Morocco" },
  { flag: "🇲🇿", name: "Mozambique" },
  { flag: "🇲🇲", name: "Myanmar" },
  { flag: "🇳🇦", name: "Namibia" },
  { flag: "🇳🇷", name: "Nauru" },
  { flag: "🇳🇵", name: "Nepal" },
  { flag: "🇳🇱", name: "Netherlands" },
  { flag: "🇳🇿", name: "New Zealand" },
  { flag: "🇳🇮", name: "Nicaragua" },
  { flag: "🇳🇪", name: "Niger" },
  { flag: "🇳🇬", name: "Nigeria" },
  { flag: "🇲🇰", name: "North Macedonia" },
  { flag: "🇳🇴", name: "Norway" },
  { flag: "🇴🇲", name: "Oman" },
  { flag: "🇵🇰", name: "Pakistan" },
  { flag: "🇵🇼", name: "Palau" },
  { flag: "🇵🇦", name: "Panama" },
  { flag: "🇵🇬", name: "Papua New Guinea" },
  { flag: "🇵🇾", name: "Paraguay" },
  { flag: "🇵🇪", name: "Peru" },
  { flag: "🇵🇭", name: "Philippines" },
  { flag: "🇵🇱", name: "Poland" },
  { flag: "🇵🇹", name: "Portugal" },
  { flag: "🇶🇦", name: "Qatar" },
  { flag: "🇷🇴", name: "Romania" },
  { flag: "🇷🇺", name: "Russia" },
  { flag: "🇷🇼", name: "Rwanda" },
  { flag: "🇰🇳", name: "Saint Kitts and Nevis" },
  { flag: "🇱🇨", name: "Saint Lucia" },
  { flag: "🇻🇨", name: "Saint Vincent and the Grenadines" },
  { flag: "🇼🇸", name: "Samoa" },
  { flag: "🇸🇲", name: "San Marino" },
  { flag: "🇸🇹", name: "Sao Tome and Principe" },
  { flag: "🇸🇦", name: "Saudi Arabia" },
  { flag: "🇸🇳", name: "Senegal" },
  { flag: "🇷🇸", name: "Serbia" },
  { flag: "🇸🇨", name: "Seychelles" },
  { flag: "🇸🇱", name: "Sierra Leone" },
  { flag: "🇸🇬", name: "Singapore" },
  { flag: "🇸🇰", name: "Slovakia" },
  { flag: "🇸🇮", name: "Slovenia" },
  { flag: "🇸🇧", name: "Solomon Islands" },
  { flag: "🇸🇴", name: "Somalia" },
  { flag: "🇿🇦", name: "South Africa" },
  { flag: "🇸🇸", name: "South Sudan" },
  { flag: "🇪🇸", name: "Spain" },
  { flag: "🇱🇰", name: "Sri Lanka" },
  { flag: "🇸🇩", name: "Sudan" },
  { flag: "🇸🇷", name: "Suriname" },
  { flag: "🇸🇪", name: "Sweden" },
  { flag: "🇨🇭", name: "Switzerland" },
  { flag: "🇸🇾", name: "Syria" },
  { flag: "🇹🇼", name: "Taiwan" },
  { flag: "🇹🇯", name: "Tajikistan" },
  { flag: "🇹🇿", name: "Tanzania" },
  { flag: "🇹🇭", name: "Thailand" },
  { flag: "🇹🇱", name: "Timor-Leste" },
  { flag: "🇹🇬", name: "Togo" },
  { flag: "🇹🇴", name: "Tonga" },
  { flag: "🇹🇹", name: "Trinidad and Tobago" },
  { flag: "🇹🇳", name: "Tunisia" },
  { flag: "🇹🇷", name: "Turkey" },
  { flag: "🇹🇲", name: "Turkmenistan" },
  { flag: "🇹🇻", name: "Tuvalu" },
  { flag: "🇺🇬", name: "Uganda" },
  { flag: "🇺🇦", name: "Ukraine" },
  { flag: "🇦🇪", name: "United Arab Emirates" },
  { flag: "🇺🇸", name: "United States" },
  { flag: "🇺🇾", name: "Uruguay" },
  { flag: "🇺🇿", name: "Uzbekistan" },
  { flag: "🇻🇺", name: "Vanuatu" },
  { flag: "🇻🇪", name: "Venezuela" },
  { flag: "🇻🇳", name: "Vietnam" },
  { flag: "🇾🇪", name: "Yemen" },
  { flag: "🇿🇲", name: "Zambia" },
  { flag: "🇿🇼", name: "Zimbabwe" },
];

type Country = typeof countries[0];

const CountryFlag = ({ country, size = 20 }: { country: Country; size?: number }) => {
  if (country.flagImg) {
    return (
      <img
        src={country.flagImg}
        alt={country.name}
        width={size}
        height={size}
        className="object-contain flex-shrink-0"
        style={{ imageRendering: "auto" }}
      />
    );
  }
  return <span style={{ fontSize: size * 0.85 }}>{country.flag}</span>;
};

export const ChatInput = ({ onSubmit, showAudienceTabs = true, isSubmitting = false, initialQuestion = "" }: ChatInputProps) => {
  const [question, setQuestion] = useState(initialQuestion);
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [langOpen, setLangOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [attachment, setAttachment] = useState<AttachmentData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredCountries = countrySearch.trim()
    ? countries.filter((c) => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
    : countries;

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
            className="h-9 rounded-full px-4 text-sm font-medium transition-colors flex items-center gap-2 bg-white text-black"
            data-testid="button-chat-expert"
            type="button"
          >
            <MessageCircle size={15} />
            Chat an Expert
          </button>
          <button
            onClick={() => setCallModalOpen(true)}
            className="h-9 rounded-full px-4 text-sm font-medium transition-colors flex items-center gap-2 border border-[#3a3c3e] text-white/70 hover:text-white hover:bg-white/5"
            data-testid="button-call-expert"
            type="button"
          >
            <Phone size={15} />
            Call an Expert
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-[#3a3c3e] bg-[#242628] overflow-hidden">
        {/* Text area */}
        <div className="px-4 pt-4 pb-2">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKey}
            placeholder="What do you want to know?"
            rows={3}
            disabled={isSubmitting}
            className="w-full resize-none bg-transparent text-base text-white/80 placeholder:text-white/40 focus:outline-none leading-6 disabled:opacity-60"
            data-testid="input-question"
          />
        </div>

        {/* Attachment pill */}
        {attachment && (
          <div className="px-4 pb-2 flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-3 py-1 max-w-[240px]">
              <Paperclip size={12} className="text-white/60 shrink-0" />
              <span className="text-xs text-white/70 truncate">{attachment.name}</span>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="ml-1 text-white/40 hover:text-white/80 transition-colors shrink-0"
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
            <button
              onClick={() => fileInputRef.current?.click()}
              className="h-9 w-9 flex items-center justify-center rounded-full bg-[#2a2c2e] border border-white/10 text-white/70 hover:text-white hover:bg-[#333537] transition-colors"
              aria-label="Attach file"
              data-testid="button-attach"
              type="button"
            >
              <Paperclip size={16} className="-rotate-45" />
            </button>

            <div className="relative">
              <button
                onClick={() => { setLangOpen((v) => !v); setCountrySearch(""); }}
                type="button"
                className="flex items-center gap-1.5 h-9 px-2 sm:px-3 rounded-full border border-[#3a3c3e] text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                data-testid="button-language"
              >
                <CountryFlag country={selectedCountry} size={20} />
                <span className="hidden sm:inline max-w-[100px] truncate">{selectedCountry.name}</span>
                <ChevronDown size={13} className={`transition-transform shrink-0 ${langOpen ? "rotate-180" : ""}`} />
              </button>
              {langOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
                  <div className="absolute bottom-full left-0 mb-2 w-60 bg-[#1e2022] border border-white/10 rounded-xl shadow-xl z-20 flex flex-col overflow-hidden">
                    <div className="p-2 border-b border-white/8">
                      <input
                        type="text"
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        placeholder="Search country…"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none"
                        autoFocus
                        data-testid="input-country-search"
                      />
                    </div>
                    <div className="overflow-y-auto max-h-52 py-1">
                      {filteredCountries.length === 0 && (
                        <p className="text-xs text-white/30 text-center py-4">No results</p>
                      )}
                      {filteredCountries.map((c) => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => { setSelectedCountry(c); setLangOpen(false); setCountrySearch(""); }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 flex items-center gap-2 ${
                            selectedCountry.name === c.name ? "text-white" : "text-white/80"
                          }`}
                        >
                          <CountryFlag country={c} size={18} />
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: coins + submit */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 h-9 px-2 sm:px-3 rounded-full border border-[#3a3c3e] text-sm text-white/60">
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

      {callModalOpen && <CallExpertModal onClose={() => setCallModalOpen(false)} />}
    </div>
  );
};
