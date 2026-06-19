import { useState } from "react";
import { Paperclip, ArrowUp, ChevronDown } from "lucide-react";

interface ChatInputProps {
  onSubmit?: (question: string, expertType: string, country: string) => void;
  showAudienceTabs?: boolean;
  isSubmitting?: boolean;
}

const audienceOptions = ["Immigration Experts", "Travel agents", "Tour Guides"];

const countries = [
  { flag: "🇬🇧", name: "United Kingdom" },
  { flag: "🇺🇸", name: "United States" },
  { flag: "🇨🇦", name: "Canada" },
  { flag: "🇦🇺", name: "Australia" },
  { flag: "🇩🇪", name: "Germany" },
  { flag: "🇫🇷", name: "France" },
  { flag: "🇳🇬", name: "Nigeria" },
  { flag: "🇬🇭", name: "Ghana" },
];

export const ChatInput = ({ onSubmit, showAudienceTabs = true, isSubmitting = false }: ChatInputProps) => {
  const [question, setQuestion] = useState("");
  const [selectedAudience, setSelectedAudience] = useState("Immigration Experts");
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [langOpen, setLangOpen] = useState(false);

  const handleSubmit = () => {
    if (question.trim() && !isSubmitting) {
      onSubmit?.(question.trim(), selectedAudience, selectedCountry.name);
      setQuestion("");
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {showAudienceTabs && (
        <div className="flex items-center gap-2 flex-wrap">
          {audienceOptions.map((opt) => {
            const active = selectedAudience === opt;
            return (
              <button
                key={opt}
                onClick={() => setSelectedAudience(opt)}
                className={`h-9 rounded-full px-4 text-sm font-medium transition-colors ${
                  active ? "bg-white text-black" : "border border-[#3a3c3e] text-white/70 hover:text-white hover:bg-white/5"
                }`}
                data-testid={`audience-tab-${opt.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {opt}
              </button>
            );
          })}
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

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-3 pb-3">
          {/* Left: attach + language */}
          <div className="flex items-center gap-2">
            <button
              className="h-9 w-9 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Attach file"
              data-testid="button-attach"
              type="button"
            >
              <Paperclip size={18} />
            </button>

            <div className="relative">
              <button
                onClick={() => setLangOpen((v) => !v)}
                type="button"
                className="flex items-center gap-1.5 h-9 px-3 rounded-full border border-[#3a3c3e] text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                data-testid="button-language"
              >
                <span>{selectedCountry.flag}</span>
                <span>{selectedCountry.name}</span>
                <ChevronDown size={13} className={`transition-transform ${langOpen ? "rotate-180" : ""}`} />
              </button>
              {langOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
                  <div className="absolute bottom-full left-0 mb-2 w-52 bg-[#1e2022] border border-white/10 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                    {countries.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => { setSelectedCountry(c); setLangOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 flex items-center gap-2 ${
                          selectedCountry.name === c.name ? "text-white" : "text-white/80"
                        }`}
                      >
                        {c.flag} {c.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: coins + submit */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 h-9 px-3 rounded-full border border-[#3a3c3e] text-sm text-white/60">
              <span>🪙</span>
              <span>3 Coins/question</span>
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
    </div>
  );
};
