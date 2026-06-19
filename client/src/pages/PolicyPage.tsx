import { useLocation } from "wouter";
import { useState } from "react";
import { DesktopNav } from "@/components/DesktopNav";
import { AuthSheets, type AuthView } from "@/components/AuthSheets";

const policies: Record<string, { title: string; content: string[] }> = {
  disclaimer: {
    title: "Disclaimer",
    content: [
      "The information provided on AskMigi is for general informational purposes only. While we strive to ensure that all content is accurate and up-to-date, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability of the information, products, services, or related graphics contained on the platform.",
      "AskMigi is not a law firm and does not provide legal advice. The responses given by experts on our platform are informational in nature and should not be construed as legal, immigration, or professional advice. Users are strongly encouraged to verify all information with official government sources and consult with a licensed legal professional where necessary.",
      "Any reliance you place on such information is strictly at your own risk. In no event will AskMigi be liable for any loss or damage including, without limitation, indirect or consequential loss or damage arising out of or in connection with the use of this platform.",
      "Immigration laws and regulations change frequently. While our experts do their best to provide current information, AskMigi cannot guarantee that all content reflects the most recent legal changes in any jurisdiction.",
      "By using this platform, you agree to the terms set out in this Disclaimer.",
    ],
  },
  "privacy-policy": {
    title: "Privacy Policy",
    content: [
      "At AskMigi, we are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our platform.",
      "Information We Collect: We collect information that you provide directly to us, such as your name, email address, and payment information when you create an account or make a purchase. We also collect usage data, including how you interact with our platform, pages visited, and features used.",
      "How We Use Your Information: We use the information we collect to provide, operate, and maintain our platform; process transactions and send related information; send you technical notices and support messages; respond to your comments and questions; and send you marketing communications where you have opted in.",
      "Sharing Your Information: We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties without your consent, except to provide services you have requested or as required by law.",
      "Data Security: We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.",
      "Your Rights: You have the right to access, correct, or delete your personal data at any time. You may also withdraw consent where processing is based on consent. To exercise these rights, contact us at support@askmigi.com.",
      "Changes to This Policy: We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.",
    ],
  },
  "refund-policy": {
    title: "Refund Policy",
    content: [
      "At AskMigi, we want you to be satisfied with your purchase. This Refund Policy outlines the terms under which refunds may be granted for coin purchases made on our platform.",
      "Coin Purchases: All coin purchases are non-refundable once coins have been used to ask a question or access expert responses. We encourage users to review our pricing and coin packages carefully before making a purchase.",
      "Eligible Refunds: Refunds may be considered in the following circumstances: If you purchased coins but have not used any of them, within 7 days of purchase; If there was a technical error resulting in coins being deducted without a successful question submission; If an expert fails to provide a response within the stated timeframe of 3-5 business days.",
      "How to Request a Refund: To request a refund, please contact us at support@askmigi.com with your account details and a description of the issue. We will review your request and respond within 5-7 business days.",
      "Processing Refunds: Approved refunds will be processed to the original payment method within 10-14 business days, depending on your bank or payment provider.",
      "Changes to This Policy: AskMigi reserves the right to modify this Refund Policy at any time. Any changes will be posted on this page and will take effect immediately upon posting.",
    ],
  },
  terms: {
    title: "Terms of Use",
    content: [
      "Welcome to AskMigi. By accessing or using our platform, you agree to be bound by these Terms of Use. Please read them carefully before using the service.",
      "Acceptance of Terms: By creating an account or using AskMigi, you confirm that you are at least 18 years of age and agree to these Terms of Use and our Privacy Policy.",
      "Use of the Platform: AskMigi provides a platform for connecting users with immigration experts, travel agents, and tour guides. You agree to use the platform only for lawful purposes and in a way that does not infringe the rights of others.",
      "User Accounts: You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorised use of your account.",
      "Coins and Payments: Coins are purchased to access expert responses. All purchases are final unless otherwise specified in our Refund Policy. AskMigi reserves the right to modify coin pricing at any time.",
      "Expert Content: The information provided by experts is for informational purposes only and does not constitute legal, immigration, or professional advice. AskMigi does not guarantee the accuracy or completeness of expert responses.",
      "Prohibited Conduct: You agree not to misuse the platform, post false information, harass experts or other users, or attempt to circumvent the coin-based payment system.",
      "Limitation of Liability: AskMigi shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.",
      "Changes to Terms: We reserve the right to modify these Terms at any time. Continued use of the platform after changes constitutes acceptance of the new Terms.",
    ],
  },
};

interface PolicyPageProps {
  type: "disclaimer" | "privacy-policy" | "refund-policy" | "terms";
}

export const PolicyPage = ({ type }: PolicyPageProps): JSX.Element => {
  const [, navigate] = useLocation();
  const [authView, setAuthView] = useState<AuthView>(null);
  const policy = policies[type];

  return (
    <main className="min-h-screen w-full bg-[#161618] text-white flex flex-col">
      <DesktopNav
        isLoggedIn={false}
        onLoginClick={() => setAuthView("login")}
        onSignUpClick={() => setAuthView("register")}
      />

      <div className="flex flex-col items-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-8">{policy.title}</h1>
          <div className="flex flex-col gap-6">
            {policy.content.map((paragraph, i) => (
              <p key={i} className="text-sm text-white/65 leading-7">
                {paragraph}
              </p>
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
