import { useState } from "react";
import { NavBar } from "@/components/NavBar";
import { AuthSheets, type AuthView } from "@/components/AuthSheets";

export const AboutPage = (): JSX.Element => {
  const [authView, setAuthView] = useState<AuthView>(null);

  return (
    <main className="min-h-screen w-full bg-[#161618] text-white flex flex-col">
      <NavBar onLoginClick={() => setAuthView("login")} onSignUpClick={() => setAuthView("register")} />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center text-center px-5 pt-14 pb-4 md:pt-20 md:pb-6">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight max-w-2xl">
          Clear answers from people<br className="hidden md:block" /> who actually know.
        </h1>
        <p className="mt-5 text-sm md:text-base text-white/55 leading-7 max-w-lg">
          Looking for honest guidance on careers, job hunting, or finding sponsored roles or working
          abroad? Ask Migi connects you with verified experts who've been there — and gives you real
          answers, fast.
        </p>
        <div className="mt-8 flex items-center gap-3 flex-wrap justify-center">
          <button
            onClick={() => setAuthView("register")}
            className="h-11 px-7 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors"
            data-testid="button-hero-signup"
          >
            Create Account
          </button>
          <button
            onClick={() => setAuthView("login")}
            className="h-11 px-7 rounded-full border border-white/20 text-white font-semibold text-sm hover:bg-white/5 transition-colors"
            data-testid="button-hero-login"
          >
            Log in
          </button>
        </div>

        {/* Group photo */}
        <div className="mt-12 mb-2 w-full max-w-lg">
          <img
            src="/experts-group.png"
            alt="Ask Migi experts"
            className="w-full h-auto"
            style={{ filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.7))" }}
          />
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center px-5 pt-16 pb-12 md:pt-24 md:pb-5">
        <div className="text-center mb-12 md:mb-5 max-w-lg">
          <h2 className="text-3xl md:text-4xl font-black text-white">How it works</h2>
          <p className="mt-4 text-sm md:text-base text-white/55 leading-7">
            Whether you're exploring new opportunities, navigating a career change, or looking for
            professional guidance, we're here to help. Submit your question, and we'll connect you with
            the right expert to support your career journey.
          </p>
        </div>

        <div className="w-full max-w-2xl md:max-w-4xl flex flex-col gap-5 md:gap-6">
          {/* Step 01 — left */}
          <div className="self-start w-[85%] md:w-[75%]">
            <div className="bg-[#1e2022] border border-[#2e3032] rounded-2xl px-6 py-6 flex items-start gap-5">
              <div className="shrink-0 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center">
                <span className="text-xs font-bold text-white/70">01</span>
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-black text-white leading-tight">Ask your question</h3>
                <p className="mt-2 text-sm text-white/55 leading-6">
                  Type your question — about career moves, finding jobs locally and internationally,
                  sponsored roles abroad, levelling up your career, getting a promotion, or being the best at
                  what you do. Message or call an expert — whichever works for you.
                </p>
              </div>
            </div>
          </div>

          {/* Step 02 — right */}
          <div className="self-end w-[85%] md:w-[75%]">
            <div className="bg-[#1e2022] border border-[#2e3032] rounded-2xl px-6 py-6 flex items-start gap-5">
              <div className="shrink-0 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center">
                <span className="text-xs font-bold text-white/70">02</span>
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-black text-white leading-tight">Expert reviews it</h3>
                <p className="mt-2 text-sm text-white/55 leading-6">
                  A career expert reviews your question and offers tailored guidance to help you
                  kick-start your career or goals.
                </p>
              </div>
            </div>
          </div>

          {/* Step 03 — left */}
          <div className="self-start w-[85%] md:w-[75%]">
            <div className="bg-[#1e2022] border border-[#2e3032] rounded-2xl px-6 py-6 flex items-start gap-5">
              <div className="shrink-0 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center">
                <span className="text-xs font-bold text-white/70">03</span>
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-black text-white leading-tight">You get a real answer</h3>
                <p className="mt-2 text-sm text-white/55 leading-6">
                  Within 6–12 hours you receive a detailed, expert-verified response — saved in
                  your chat history and sent to your email.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <section className="px-5 pb-12 md:pb-16">
        <div className="max-w-2xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
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
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="px-5 pb-16 md:pb-20">
        <div className="max-w-2xl mx-auto rounded-2xl border border-[#2e3032] bg-[#1a1c1e] p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-3">Ready to get real answers?</h2>
          <p className="text-sm text-white/55 leading-6 mb-6 max-w-lg mx-auto">
            Create a free account and ask your first questions.
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
      </section>

      <AuthSheets view={authView} onViewChange={setAuthView} onClose={() => setAuthView(null)} />
    </main>
  );
};
