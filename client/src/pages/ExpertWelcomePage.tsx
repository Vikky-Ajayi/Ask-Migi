import { useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Sidebar } from "@/components/Sidebar";
import { AuthSheets, type AuthView } from "@/components/AuthSheets";
import { SiFacebook, SiInstagram, SiX } from "react-icons/si";

const reviews = [
  { name: "Sarah K.", date: "25 Apr 2024", text: "They're really nice above anything... My career coach helped me completely transform my job search. I landed a position that I love in just 2 months!" },
  { name: "Sarah K.", date: "25 Apr 2024", text: "They're really nice above anything... My career coach helped me completely transform my job search. I landed a position that I love in just 2 months!" },
  { name: "Sarah K.", date: "25 Apr 2024", text: "They're really nice above anything... My career coach helped me completely transform my job search. I landed a position that I love in just 2 months!" },
];

const StarRating = () => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map((s) => (
      <span key={s} className="text-green-500 text-sm">★</span>
    ))}
  </div>
);

export const ExpertWelcomePage = (): JSX.Element => {
  const [, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authView, setAuthView] = useState<AuthView>(null);
  const [isLoggedIn] = useState(true);

  return (
    <main className="min-h-screen w-full bg-white text-black">
      {/* Email-style header */}
      <div className="bg-black px-6 pt-8 pb-6">
        <img className="h-8 w-[120px]" alt="Ask MiGi" src="/figmaAssets/vector.svg" />
        <p className="mt-2 text-sm text-th-text-60">Clear answers. Trusted experts. Real help.</p>
      </div>

      <div className="px-6 py-8 flex flex-col gap-6">
        {/* New Response badge */}
        <div className="inline-flex items-center gap-2 bg-green-500 rounded-full px-3 py-1.5 w-fit">
          <span className="text-th-text text-xs font-semibold">📧 New Response</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-black leading-tight">
            You've Got Feedback from an Expert! ✍️
          </h1>
          <div className="mt-4 text-sm text-black/70 leading-6">
            <p>Hi [First Name],</p>
            <p className="mt-2">Great news! An expert has replied to your question and provided detailed guidance to help you move forward with confidence.</p>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="flex items-start gap-4">
          {[
            { icon: "✅", label: "Verified Expert" },
            { icon: "📋", label: "Detailed Response" },
            { icon: "🚀", label: "Next Steps" },
          ].map((f) => (
            <div key={f.label} className="flex flex-col items-center gap-2 flex-1">
              <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">{f.icon}</div>
              <span className="text-xs text-black/60 text-center">{f.label}</span>
            </div>
          ))}
        </div>

        {/* CTA box */}
        <div className="rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">
          <p className="text-sm text-black/70 leading-5">
            Your immigration question has been answered by a verified professional. Log in now to read their comprehensive response.
          </p>
          <button
            onClick={() => navigate("/")}
            className="w-full h-12 rounded-full bg-black text-th-text font-semibold text-sm hover:bg-black/90 transition-colors"
            data-testid="button-read-response"
          >
            Read Expert Response
          </button>
        </div>

        <p className="text-sm text-black/70 leading-6">
          This is exactly why Ask Migi exists – to connect you with trusted experts who provide clear, actionable answers when you need them most.
        </p>

        <div>
          <p className="text-sm text-black/70">Warm regards,</p>
          <p className="text-sm font-bold text-black">The Ask Migi Team</p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gray-50 px-6 py-6 border-t border-gray-100">
        <h3 className="text-sm font-semibold text-black mb-3">Join Our Growing Community</h3>
        <div className="flex justify-between">
          {[
            { value: "500+", label: "Active Experts" },
            { value: "10K+", label: "Questions Answered" },
            { value: "95%", label: "Satisfaction Rate" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-xl font-bold text-black">{s.value}</p>
              <p className="text-xs text-black/50 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div className="px-6 py-6 flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-black">What our clients say</h3>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-black">Rated Excellent</span>
          <StarRating />
        </div>
        {reviews.map((r, i) => (
          <div key={i} className="flex flex-col gap-2 pb-4 border-b border-gray-100 last:border-0">
            <StarRating />
            <p className="text-xs font-semibold text-black">{r.text.split("...")[0]}...</p>
            <p className="text-xs text-black/60 leading-5">{r.text.split("...")[1]}</p>
            <p className="text-xs text-black/40">{r.name} · {r.date}</p>
          </div>
        ))}
      </div>

      <p className="px-6 pb-4 text-sm text-black/50 text-center">
        Thanks for joining us. We're excited to see the impact you'll make!
      </p>

      {/* Footer */}
      <div className="bg-black px-6 py-8 flex flex-col items-center gap-4">
        <div className="flex items-center gap-5">
          <a href="#" className="h-9 w-9 rounded-full bg-th-hover flex items-center justify-center text-th-text hover:bg-white/20">
            <SiFacebook size={16} />
          </a>
          <a href="#" className="h-9 w-9 rounded-full bg-th-hover flex items-center justify-center text-th-text hover:bg-white/20">
            <SiInstagram size={16} />
          </a>
          <a href="#" className="h-9 w-9 rounded-full bg-th-hover flex items-center justify-center text-th-text hover:bg-white/20">
            <SiX size={16} />
          </a>
        </div>
        <p className="text-xs text-th-text-50 text-center">
          If you ever need support, we're always here:{" "}
          <a href="mailto:support@askmigi.com" className="text-th-text underline">support@askmigi.com</a>
        </p>
        <p className="text-xs text-th-text-30">Copyright ©AskMigi. All rights reserved.</p>
      </div>
    </main>
  );
};
