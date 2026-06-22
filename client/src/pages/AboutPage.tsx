import { useState } from "react";
import { NavBar } from "@/components/NavBar";
import { AuthSheets, type AuthView } from "@/components/AuthSheets";

export const AboutPage = (): JSX.Element => {
  const [authView, setAuthView] = useState<AuthView>(null);

  return (
    <main className="min-h-screen w-full bg-[#161618] text-white flex flex-col">
      <NavBar onLoginClick={() => setAuthView("login")} onSignUpClick={() => setAuthView("register")} />

      <div className="flex flex-col items-center px-4 md:px-6 py-12 md:py-16">
        <div className="w-full max-w-3xl flex flex-col gap-14">

          {/* Hero */}
          <div className="text-center">
            <span className="inline-block bg-white/10 border border-white/10 text-white/70 text-xs font-semibold px-4 py-1.5 rounded-full mb-5 tracking-wide uppercase">
              About Ask Migi
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-5">
              Clear answers from people<br className="hidden md:block" /> who actually know.
            </h1>
            <p className="text-base text-white/55 leading-7 max-w-2xl mx-auto">
              Ask Migi was built for one purpose — to connect people who have important, life-changing questions 
              with verified career and immigration experts who can give real, practical answers. No generic advice. 
              No search engine rabbit holes. Just clear guidance from professionals who've seen it all.
            </p>
          </div>

          {/* How it works */}
          <div>
            <h2 className="text-xl font-bold text-white mb-6">How it works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  step: "01",
                  title: "Ask your question",
                  desc: "Type your question — about visas, career moves, relocation, or anything in between. Use your coins to submit.",
                },
                {
                  step: "02",
                  title: "Expert reviews it",
                  desc: "A verified expert is notified immediately. They review an AI-prepared draft, personalise it, and send their response.",
                },
                {
                  step: "03",
                  title: "You get a real answer",
                  desc: "Within 6–12 hours you receive a detailed, expert-verified response by email — and it's saved in your chat history.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="rounded-2xl border border-[#2e3032] bg-[#1a1c1e] p-6 flex flex-col gap-3"
                >
                  <span className="text-3xl font-black text-white/10">{item.step}</span>
                  <h3 className="text-base font-bold text-white">{item.title}</h3>
                  <p className="text-sm text-white/50 leading-6">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Why Ask Migi */}
          <div className="rounded-2xl border border-[#2e3032] bg-[#1a1c1e] p-7 md:p-10">
            <h2 className="text-xl font-bold text-white mb-4">Why Ask Migi exists</h2>
            <p className="text-sm text-white/60 leading-7 mb-4">
              Immigration and career decisions are some of the most consequential choices a person can make — yet 
              getting trustworthy advice has historically meant expensive consultations, long waiting lists, or 
              wading through unreliable information online.
            </p>
            <p className="text-sm text-white/60 leading-7 mb-4">
              We built Ask Migi to change that. By combining the speed of AI with the judgment of real professionals, 
              we give anyone access to high-quality, personalised guidance — at a fraction of the cost and none of the wait.
            </p>
            <p className="text-sm text-white/60 leading-7">
              Every answer on our platform is reviewed and approved by a human expert before it reaches you. 
              We believe you deserve more than an algorithm. You deserve someone who actually cares about getting it right.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "6–12h", label: "Response time" },
              { value: "100%", label: "Expert reviewed" },
              { value: "50+", label: "Countries covered" },
              { value: "24/7", label: "Question submission" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-[#2e3032] bg-[#1a1c1e] p-5 text-center">
                <p className="text-2xl font-black text-white mb-1">{stat.value}</p>
                <p className="text-xs text-white/40">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="rounded-2xl border border-[#2e3032] bg-[#1a1c1e] p-8 text-center">
            <h2 className="text-xl font-bold text-white mb-3">Ready to get real answers?</h2>
            <p className="text-sm text-white/55 leading-6 mb-6 max-w-lg mx-auto">
              Create a free account and get 5 coins to ask your first questions. 
              No commitment, no subscription — just expert answers when you need them.
            </p>
            <button
              onClick={() => setAuthView("register")}
              className="h-11 px-8 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors"
              data-testid="button-about-signup"
            >
              Get started free
            </button>
          </div>

        </div>
      </div>

      <AuthSheets view={authView} onViewChange={setAuthView} onClose={() => setAuthView(null)} />
    </main>
  );
};
