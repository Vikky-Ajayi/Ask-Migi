import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { useLocation } from "wouter";
import { NavBar } from "@/components/NavBar";
import { AuthSheets, type AuthView } from "@/components/AuthSheets";

const faqs: { q: string; a: string; bullets?: string[]; note?: string }[] = [
  {
    q: "What is AskMigi?",
    a: "AskMigi is a professional career coaching platform that connects users with experienced career coaches, recruiters, and industry professionals from around the world. Our goal is to help individuals improve their careers, land better jobs, and successfully navigate job searches — whether locally or internationally — by providing practical, real-world guidance tailored to their goals.",
  },
  {
    q: "Who are the experts on AskMigi?",
    a: "Our experts include:",
    bullets: [
      "Certified career coaches and HR professionals",
      "Recruiters and talent acquisition specialists",
      "Industry professionals across tech, business, finance, healthcare, and more",
    ],
    note: "Each expert specialises in specific industries or regions and provides practical, up-to-date advice on hiring trends, job applications, and career growth.",
  },
  {
    q: "What kind of questions can I ask on AskMigi?",
    a: "You can ask questions related to:",
    bullets: [
      "Job search strategies and application advice",
      "CV/resume and LinkedIn optimisation",
      "Career switching and skill development",
      "Interview preparation and mock interview guidance",
      "Salary negotiation and career progression",
      "Remote work and international job opportunities",
      "Industry insights and hiring trends",
      "Career planning and long-term growth strategies",
    ],
  },
  {
    q: "Is AskMigi free to use?",
    a: "No, AskMigi is a paid service. To ask a question or receive expert feedback, users purchase coins and use them to submit their inquiries. The number of coins required may vary depending on the complexity of your question or the level of expert support requested.",
  },
  {
    q: "How do I know the advice is reliable?",
    a: "All responses come from verified professionals with real experience in hiring, recruiting, or career development. While we ensure quality and relevance, hiring practices and job markets can change, so we recommend combining expert advice with up-to-date research and industry sources when making important decisions.",
  },
  {
    q: "Can I get advice specific to my career situation or country?",
    a: "Yes. Every question is matched with an expert relevant to your industry, role, or target job market. This ensures you receive practical, location-aware and role-specific guidance tailored to your goals.",
  },
  {
    q: "Can AskMigi help me get a job?",
    a: "Yes — our experts can help you with:",
    bullets: [
      "Improving your CV and job applications",
      "Identifying suitable roles and career paths",
      "Preparing for interviews",
      "Understanding hiring requirements in your target market",
      "Building a stronger personal brand",
    ],
    note: "Note: AskMigi does not guarantee job placement, but provides guidance to significantly improve your chances of getting hired.",
  },
  {
    q: "Can AskMigi help me change careers?",
    a: "Absolutely. AskMigi can help you:",
    bullets: [
      "Transition into a new industry",
      "Identify transferable skills",
      "Build a learning roadmap for your target role",
      "Understand entry requirements for new careers",
      "Create a step-by-step transition strategy",
    ],
  },
  {
    q: "Can I speak directly with an expert?",
    a: "Yes. Depending on the expert, you may be able to:",
    bullets: [
      "Chat directly",
      "Book a call session",
      "Receive detailed written feedback on your CV or career plan",
    ],
  },
  {
    q: "What languages do experts speak?",
    a: "Most experts communicate in English, and some also speak additional languages such as French, Spanish, Arabic, Mandarin, Hindi, and others depending on availability.",
  },
  {
    q: "Is AskMigi affiliated with any employer or recruitment agency?",
    a: "No. AskMigi is an independent career guidance platform and is not affiliated with any specific employer or recruitment agency. All advice is provided for informational and educational purposes only.",
  },
  {
    q: "What happens if I receive incorrect or outdated career advice?",
    a: "We encourage users to cross-check critical information with official job listings, company websites, or industry sources. While experts are vetted, AskMigi is not responsible for decisions made based on advice received on the platform.",
  },
  {
    q: "How do I become an expert on AskMigi?",
    a: "If you are a recruiter, HR professional, or experienced industry specialist, you can apply to join AskMigi as an expert. All applicants go through a verification process to ensure quality and credibility before being approved.",
  },
  {
    q: "How is my data protected?",
    a: "Your data is handled securely in line with our privacy policy. We do not sell personal information. You can use the platform anonymously and manage or delete your account at any time.",
  },
  {
    q: "How can I contact AskMigi support?",
    a: "For any questions or support needs, you can reach us at: support@askmigi.com",
  },
];

const FAQItem = ({ q, a, bullets, note }: typeof faqs[0]) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-th-border-md">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-5 text-left gap-4"
        data-testid={`faq-item-${q.slice(0, 20).replace(/\s+/g, "-").toLowerCase()}`}
      >
        <span className="text-sm font-semibold text-th-text leading-5">{q}</span>
        {open ? <Minus size={18} className="shrink-0 text-th-text-40" /> : <Plus size={18} className="shrink-0 text-th-text-40" />}
      </button>
      {open && (
        <div className="pb-5 flex flex-col gap-2">
          <p className="text-sm text-th-text-60 leading-6">{a}</p>
          {bullets && bullets.length > 0 && (
            <ul className="flex flex-col gap-1 pl-1">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-th-text-60 leading-6">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/30 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          )}
          {note && <p className="text-sm text-th-text-50 leading-6 italic">{note}</p>}
        </div>
      )}
    </div>
  );
};

export const FAQPage = (): JSX.Element => {
  const [, navigate] = useLocation();
  const [authView, setAuthView] = useState<AuthView>(null);

  return (
    <main className="min-h-screen w-full bg-th-page text-th-text flex flex-col">
      <NavBar onLoginClick={() => setAuthView("login")} onSignUpClick={() => setAuthView("register")} />

      <div className="flex flex-col items-center px-4 md:px-6 py-10 md:py-12">
        <div className="w-full max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-bold text-th-text tracking-tight text-center mb-8">FAQ's</h1>
          <div className="flex flex-col">
            {faqs.map((item) => <FAQItem key={item.q} {...item} />)}
          </div>
          <div className="mt-12 pt-8 border-t border-th-border-md flex flex-col items-center gap-4">
            <img className="h-6" alt="Ask MiGi" src="/figmaAssets/vector.svg" />
            <div className="flex items-center gap-4 flex-wrap justify-center text-xs text-th-text-40">
              {[["Terms of Use", "/terms"], ["Privacy Policy", "/privacy-policy"], ["Disclaimer", "/disclaimer"], ["Refund Policy", "/refund-policy"]].map(([label, path]) => (
                <button key={label} onClick={() => navigate(path)} className="hover:text-th-text transition-colors">{label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AuthSheets view={authView} onViewChange={setAuthView} onClose={() => setAuthView(null)} />
    </main>
  );
};
