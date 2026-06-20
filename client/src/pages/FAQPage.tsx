import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { useLocation } from "wouter";
import { DesktopNav } from "@/components/DesktopNav";
import { AuthSheets, type AuthView } from "@/components/AuthSheets";

const faqs = [
  {
    q: "What is AskMigi?",
    a: "AskMigi is a professional platform that connects users with certified immigration experts, travel agents, and tour guides from around the world. Our goal is to help individuals who are planning to visit or relocate to a new country — whether for tourism, study, business, work, or settlement — by providing accurate, country-specific information and advice.",
  },
  {
    q: "Who are the experts on AskMigi?",
    a: "Our experts include: Certified immigration consultants and lawyers, Licensed travel agents, Experienced local tour guides. Each expert specialises in a particular country and offers guidance specific to that location's visa, entry, and settlement processes.",
  },
  {
    q: "What kind of questions can I ask on AskMigi?",
    a: "You can ask questions related to: Visa applications (tourist, student, business, work, etc.), Immigration pathways (temporary or permanent), Travel tips, local culture and local customs, Study abroad options and university application support, Business or commercial travel regulations, How to settle, integrate, or apply for permanent residency or citizenship.",
  },
  {
    q: "Is AskMigi free to use?",
    a: "No, AskMigi is a paid service. To ask a question or get a response from an expert, users purchase coins and use them to submit their inquiries. The number of coins required may vary depending on the complexity of your question or the type of expert you're consulting.",
  },
  {
    q: "How do I know the information is reliable?",
    a: "All responses come from verified experts who are knowledgeable and active in the country they represent. While we do our best to ensure the information provided, laws and procedures can change, so we always recommend verifying critical details through your country's official embassy or legal resources.",
  },
  {
    q: "Can I get advice specific to the country I plan to visit or move to?",
    a: "Yes. Every question is matched to an expert specialising in the specific country you're asking about. This ensures that you get relevant, up-to-date, and location-specific advice.",
  },
  {
    q: "Can AskMigi help me with applying for a visa?",
    a: "Yes — our experts can provide: Step-by-step guidance on how to apply, Lists of required documents, Timeline expectations for the process, Tips to improve your application rate. Note: AskMigi does not submit visa applications on your behalf. We guide you through the process but you must apply through the official embassy or immigration website.",
  },
  {
    q: "Can AskMigi help me settle in a new country?",
    a: "Absolutely. AskMigi can help you with: Finding accommodation, Understanding healthcare, banking, and education systems, Cultural insights and finding a job, Understanding your rights and responsibilities as a visitor or new resident.",
  },
  {
    q: "Can I speak directly with an expert?",
    a: "Yes. In many cases. Once you post your question, you may be offered the option to: Chat privately, Book a call, Receive a more detailed, custom response depending on the expert.",
  },
  {
    q: "What languages do experts speak?",
    a: "Most experts respond in English, but some also speak French, Spanish, Arabic, Mandarin, Hindi, and other local languages. You can filter or request a response in your preferred language where available.",
  },
  {
    q: "Is AskMigi affiliated with any government or embassy?",
    a: "No. AskMigi is an independent platform and is not affiliated with any government, embassy, or consular office. All guidance provided is independent and for informational purposes only.",
  },
  {
    q: "What happens if I receive incorrect or outdated information?",
    a: "We encourage all users to double-check important details with official government sources. While we vet our experts, AskMigi is not liable for decisions made based on expert responses. See our Terms of Use and Disclaimer for more details.",
  },
  {
    q: "How do I become an expert on AskMigi?",
    a: "If you're a certified immigration consultant, travel agent, or tour guide, you can apply to join our expert team by visiting our application page. All experts go through a verification process before being approved to answer questions.",
  },
  {
    q: "How is my data protected?",
    a: "Your data is protected in accordance with our Privacy Policy. We do not sell your personal information. You can ask questions anonymously or delete your account at any time.",
  },
  {
    q: "How can I contact AskMigi support?",
    a: "For any issues or additional questions, please contact us at support@askmigi.com",
  },
];

const FAQItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#2e3032]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-5 text-left gap-4"
        data-testid={`faq-item-${q.slice(0, 20).replace(/\s+/g, "-").toLowerCase()}`}
      >
        <span className="text-sm font-semibold text-white leading-5">{q}</span>
        {open
          ? <Minus size={18} className="shrink-0 text-white/40" />
          : <Plus size={18} className="shrink-0 text-white/40" />
        }
      </button>
      {open && <p className="pb-5 text-sm text-white/60 leading-6">{a}</p>}
    </div>
  );
};

export const FAQPage = (): JSX.Element => {
  const [, navigate] = useLocation();
  const [authView, setAuthView] = useState<AuthView>(null);

  return (
    <main className="min-h-screen w-full bg-[#161618] text-white flex flex-col">
      <DesktopNav
        onLoginClick={() => setAuthView("login")}
        onSignUpClick={() => setAuthView("register")}
      />

      <div className="flex flex-col items-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <h1 className="text-3xl font-bold text-white tracking-tight text-center mb-8">FAQ's</h1>
          <div className="flex flex-col">
            {faqs.map((item) => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-[#2e3032] flex flex-col items-center gap-4">
            <img className="h-6" alt="Ask MiGi" src="/figmaAssets/vector.svg" />
            <div className="flex items-center gap-5 flex-wrap justify-center text-xs text-white/40">
              {[["Terms of Use", "/terms"], ["Privacy Policy", "/privacy-policy"], ["Disclaimer", "/disclaimer"], ["Refund Policy", "/refund-policy"]].map(([label, path]) => (
                <button key={label} onClick={() => navigate(path)} className="hover:text-white transition-colors">
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AuthSheets view={authView} onViewChange={setAuthView} onClose={() => setAuthView(null)} />
    </main>
  );
};
