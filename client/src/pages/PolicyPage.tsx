import { useLocation } from "wouter";
import { useState } from "react";
import { NavBar } from "@/components/NavBar";
import { AuthSheets, type AuthView } from "@/components/AuthSheets";

type Section = { heading?: string; body: string };

const policies: Record<string, { title: string; effectiveDate: string; sections: Section[] }> = {
  disclaimer: {
    title: "Disclaimer", effectiveDate: "01/01/2019",
    sections: [
      { body: "The information provided on AskMigi (\"we,\" \"us,\" or \"our\") is intended for general informational purposes only. By using this platform, you acknowledge and agree to the terms outlined in this disclaimer." },
      { heading: "1. Not Legal Advice", body: "AskMigi is an information and community platform where users can ask immigration-related questions and receive responses from certified immigration experts. However, the information shared on AskMigi does not constitute legal advice and should not be substituted for professional legal counsel.\n\nIf you require legal advice tailored to your specific situation, we strongly recommend consulting a certified immigration attorney or accredited legal representative in your jurisdiction." },
      { heading: "2. No Attorney-Client Relationship", body: "Using AskMigi does not create an attorney-client, consultant-client, or any other professional relationship between users and experts. Communications on the platform are not confidential and should not include sensitive or personally identifiable information beyond what is necessary." },
      { heading: "3. Accuracy and Reliability", body: "We strive to ensure that responses provided by experts are accurate and helpful. However:\n• We do not guarantee the correctness, completeness, or current validity of any information posted.\n• Immigration laws and policies frequently change, and responses may become outdated.\n• AskMigi is not responsible for any actions taken based on the information shared on the platform.\n• All information is provided \"as is\" without warranties of any kind, express or implied." },
      { heading: "4. Expert Verification", body: "Experts on AskMigi may be required to provide credentials, certifications, or proof of experience; however, AskMigi does not independently verify or guarantee the qualifications, licensing status, or professional conduct of any expert." },
      { heading: "5. User Responsibility", body: "You are solely responsible for how you use the information provided on AskMigi. By using this site, you agree not to rely solely on AskMigi for making important decisions regarding your immigration status or legal matters." },
      { heading: "6. Limitation of Liability", body: "Under no circumstances shall AskMigi, its affiliates, or team members or contributors be held liable for any direct, indirect, incidental, or consequential damages resulting from your use of the platform or reliance on any information obtained through it.\n\nIf you have any questions regarding this disclaimer, please reach out to us at: support@askmigi.com" },
    ],
  },
  "privacy-policy": {
    title: "Privacy Policy", effectiveDate: "01/01/2019",
    sections: [
      { body: "Welcome to AskMigi (\"we,\" \"us,\" or \"our\"). We value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you use our platform. By accessing or using AskMigi, you agree to the terms of this Privacy Policy." },
      { heading: "1. Information We Collect", body: "Information You Provide Directly:\n• Create an account\n• Ask a question or post content\n• Apply to become an expert\n• Contact us\nWe may collect:\n• Name and email address\n• Country of residence\n• Profile information\n• Immigration-related questions or travel enquiries\n• Certifications and ID documents (for experts)\n\nInformation Collected Automatically:\nWhen you visit our platform, we may automatically collect:\n• Device information\n• IP address\n• Pages visited\n• Location\n• Cookies and similar tracking technologies (see Section 7)" },
      { heading: "2. How We Use Your Information", body: "We use the information we collect to:\n• Provide and improve our services\n• Connect users with certified experts\n• Process payments securely\n• Maintain platform security\n• Comply with legal obligations" },
      { heading: "3. How We Share Your Information", body: "We may share your information:\n• With experts: If you submit a question, it may be visible to verified experts and, if applicable, select immigration professionals.\n• With Service Providers: We may use third-party vendors for tasks like payment processing, email services, and analytics.\n• For legal reasons: If required by law, court order, or to protect our rights.\n• We do not sell your personal data.\n• We do not share your country of residence or enquiry content with government agencies or embassies." },
      { heading: "4. Data Retention", body: "We retain your personal data as long as:\n• You have an active account\n• Provide services\n• Comply with legal obligations\n• Resolve disputes\n• Enforce agreements\nYou may request deletion of your data by contacting support@askmigi.com" },
      { heading: "5. Your Rights", body: "Depending on your location, you may have rights to:\n• Access the personal data we hold about you\n• Request correction of inaccurate data\n• Request deletion of your data\n• Opt out of marketing communications\n• Object to certain uses of your data\n• Withdraw consent (where applicable)\nTo exercise any of these rights, please contact support@askmigi.com" },
      { heading: "6. How We Protect Your Data", body: "We take data security seriously and use:\n• SSL encryption\n• Secure data storage\n• Access controls\nHowever, no online system is 100% secure. We encourage you to use strong passwords and protect your account." },
      { heading: "7. Cookies and Tracking Technologies", body: "We use cookies and similar tracking technologies to:\n• Improve site functionality\n• Analyze traffic and usage\n• Remember your preferences\nYou can manage cookie preferences through your browser settings." },
      { heading: "8. Children's Privacy", body: "AskMigi is not intended for children under 18. We do not knowingly collect personal information from users under 18. If you believe a child has provided us with personal information, please contact us so we can delete it." },
      { heading: "9. Third-Party Links", body: "We may include links to third-party sites or services on our platform. We are not responsible for the privacy practices or content of those websites. Please review their Privacy Policy before sharing information." },
      { heading: "10. Changes to This Privacy Policy", body: "We may update this Privacy Policy from time to time. When we do, we'll post the updated version on this page with a revised effective date." },
      { heading: "11. Contact Us", body: "If you have any questions about this Privacy Policy or how your data is collected, contact us at: support@askmigi.com" },
    ],
  },
  "refund-policy": {
    title: "Refund Policy", effectiveDate: "01/01/2019",
    sections: [
      { body: "At AskMigi, we want you to be satisfied with your purchase. This Refund Policy outlines the terms under which refunds may be granted for coin purchases made on our platform." },
      { heading: "1. Coin Purchases", body: "All coin purchases are non-refundable once coins have been used to ask a question or access expert responses. We encourage users to review our pricing and coin packages carefully before making a purchase." },
      { heading: "2. Eligible Refunds", body: "Refunds may be considered in the following circumstances:\n• If you purchased coins but have not used any of them, within 7 days of purchase.\n• If there was a technical error resulting in coins being deducted without a successful question submission.\n• If an expert fails to provide a response within the stated timeframe of 3-5 business days." },
      { heading: "3. How to Request a Refund", body: "To request a refund, please contact us at support@askmigi.com with your account details and a description of the issue. We will review your request and respond within 5-7 business days." },
      { heading: "4. Processing Refunds", body: "Approved refunds will be processed to the original payment method within 10-14 business days, depending on your bank or payment provider." },
      { heading: "5. Changes to This Policy", body: "AskMigi reserves the right to modify this Refund Policy at any time. Any changes will be posted on this page and will take effect immediately upon posting." },
    ],
  },
  terms: {
    title: "Terms of Use", effectiveDate: "01/01/2019",
    sections: [
      { body: "Welcome to AskMigi. By accessing or using our platform, you agree to be bound by these Terms of Use. Please read them carefully before using the service." },
      { heading: "1. Acceptance of Terms", body: "By creating an account or using AskMigi, you confirm that you are at least 18 years of age and agree to these Terms of Use and our Privacy Policy." },
      { heading: "2. Use of the Platform", body: "AskMigi provides a platform for connecting users with immigration experts, travel agents, and tour guides. You agree to use the platform only for lawful purposes and in a way that does not infringe the rights of others." },
      { heading: "3. User Accounts", body: "You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorised use of your account." },
      { heading: "4. Coins and Payments", body: "Coins are purchased to access expert responses. All purchases are final unless otherwise specified in our Refund Policy. AskMigi reserves the right to modify coin pricing at any time." },
      { heading: "5. Expert Content", body: "The information provided by experts is for informational purposes only and does not constitute legal, immigration, or professional advice. AskMigi does not guarantee the accuracy or completeness of expert responses." },
      { heading: "6. Prohibited Conduct", body: "You agree not to misuse the platform, post false information, harass experts or other users, or attempt to circumvent the coin-based payment system." },
      { heading: "7. Limitation of Liability", body: "AskMigi shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform." },
      { heading: "8. Changes to Terms", body: "We reserve the right to modify these Terms at any time. Continued use of the platform after changes constitutes acceptance of the new Terms." },
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
      <NavBar onLoginClick={() => setAuthView("login")} onSignUpClick={() => setAuthView("register")} />

      <div className="flex flex-col items-center px-4 md:px-6 py-10 md:py-12">
        <div className="w-full max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{policy.title}</h1>
          <p className="text-sm text-white/40 mt-1 mb-8">Effective Date: {policy.effectiveDate}</p>
          <div className="flex flex-col gap-6">
            {policy.sections.map((section, i) => (
              <div key={i} className="flex flex-col gap-2">
                {section.heading && <h2 className="text-sm font-bold text-white">{section.heading}</h2>}
                <p className="text-sm text-white/65 leading-7 whitespace-pre-line">{section.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-8 border-t border-[#2e3032] flex flex-col items-center gap-4">
            <img className="h-6" alt="Ask MiGi" src="/figmaAssets/vector.svg" />
            <div className="flex items-center gap-4 flex-wrap justify-center text-xs text-white/40">
              {[["Terms of Use", "/terms"], ["Privacy Policy", "/privacy-policy"], ["Disclaimer", "/disclaimer"], ["Refund Policy", "/refund-policy"]].map(([label, path]) => (
                <button key={label} onClick={() => navigate(path)} className="hover:text-white transition-colors">{label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AuthSheets view={authView} onViewChange={setAuthView} onClose={() => setAuthView(null)} />
    </main>
  );
};
