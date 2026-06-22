import { Resend } from "resend";

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Ask MiGi <onboarding@resend.dev>";
const SITE_URL = process.env.SITE_URL || "https://askmigi.com";

// ─── Shared building blocks ───────────────────────────────────────────────────

const LOGO_SVG_URL = `${SITE_URL}/figmaAssets/vector.svg`;

function emailHeader(): string {
  return `
    <tr>
      <td style="background:#1a1a1a;padding:24px 28px 20px;">
        <img src="${LOGO_SVG_URL}" alt="Ask Migi" height="32" style="display:block;height:32px;margin:0 0 8px;" />
        <p style="margin:0;font-size:13px;color:#9ca3af;font-family:Arial,Helvetica,sans-serif;">Clear answers. Trusted experts. Real help.</p>
      </td>
    </tr>`;
}

function emailFooter(): string {
  return `
    <tr>
      <td style="background:#1a1a1a;padding:28px 24px 24px;text-align:center;">
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
          <tr>
            <td style="padding:0 6px;">
              <a href="https://facebook.com/askmigi" style="display:inline-block;width:38px;height:38px;background:#ffffff;border-radius:50%;text-align:center;line-height:38px;text-decoration:none;color:#1a1a1a;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:900;">f</a>
            </td>
            <td style="padding:0 6px;">
              <a href="https://instagram.com/askmigi" style="display:inline-block;width:38px;height:38px;background:#ffffff;border-radius:50%;text-align:center;line-height:38px;text-decoration:none;color:#1a1a1a;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;">&#9617;</a>
            </td>
            <td style="padding:0 6px;">
              <a href="https://x.com/askmigi" style="display:inline-block;width:38px;height:38px;background:#ffffff;border-radius:50%;text-align:center;line-height:38px;text-decoration:none;color:#1a1a1a;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:900;">&#120143;</a>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 4px;font-size:13px;color:#9ca3af;font-family:Arial,Helvetica,sans-serif;">If you ever need support, we're always here: <a href="mailto:support@askmigi.com" style="color:#9ca3af;text-decoration:underline;">support@askmigi.com</a></p>
        <p style="margin:0;font-size:12px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;">Copyright &copy;AskMigi. All rights reserved.</p>
      </td>
    </tr>`;
}

function emailWrapper(rows: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Ask Migi</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;">
    <tr><td align="center" style="padding:0;">
      <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;">
        ${rows}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── New Question Notification (to Expert) ────────────────────────────────────

export async function sendNewQuestionEmail(
  expertEmail: string,
  userName: string,
  question: string,
  enquiryId: string
): Promise<void> {
  const client = getResend();
  const dashboardUrl = `${SITE_URL}/expert-dashboard`;

  const html = emailWrapper(`
    ${emailHeader()}
    <tr>
      <td style="padding:28px 28px 0;">
        <span style="display:inline-block;background:#3b82f6;color:#ffffff;font-size:12px;font-weight:700;padding:5px 13px;border-radius:100px;font-family:Arial,Helvetica,sans-serif;letter-spacing:0.2px;">&#128203; New Question</span>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 28px 0;">
        <h1 style="margin:0;font-size:22px;font-weight:800;color:#111827;font-family:Arial,Helvetica,sans-serif;line-height:1.3;">A user has submitted a question for you</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:14px 28px 0;">
        <p style="margin:0;font-size:15px;color:#374151;font-family:Arial,Helvetica,sans-serif;line-height:1.6;"><strong>${userName}</strong> has submitted a new question and is waiting for your expert response. An AI draft has been prepared to help you get started.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 28px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f5f5f5;border-radius:10px;border-left:4px solid #3b82f6;">
          <tr>
            <td style="padding:16px 20px;">
              <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#6b7280;font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;letter-spacing:0.5px;">Their question</p>
              <p style="margin:0;font-size:15px;color:#111827;font-family:Arial,Helvetica,sans-serif;line-height:1.6;">&ldquo;${question}&rdquo;</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 28px 0;text-align:center;">
        <a href="${dashboardUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 28px;border-radius:100px;font-family:Arial,Helvetica,sans-serif;">Review &amp; Send Response</a>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 28px 0;">
        <p style="margin:0;font-size:13px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;line-height:1.6;text-align:center;">Please respond within 6&ndash;12 hours. The user has been informed of this timeframe.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 28px 28px;">
        <p style="margin:0;font-size:14px;color:#374151;font-family:Arial,Helvetica,sans-serif;line-height:1.7;">Thanks,<br/><strong>The Ask Migi Team</strong></p>
      </td>
    </tr>
    ${emailFooter()}
  `);

  await client.emails.send({
    from: FROM_EMAIL,
    to: expertEmail,
    subject: `New question from ${userName} – review needed`,
    html,
  });
}

// ─── Expert Reply Email ───────────────────────────────────────────────────────

export async function sendExpertReplyEmail(
  email: string,
  firstName: string,
  question: string,
  enquiryId: string
): Promise<void> {
  const client = getResend();
  const chatUrl = `${SITE_URL}/chat?id=${enquiryId}`;

  const html = emailWrapper(`
    ${emailHeader()}
    <tr>
      <td style="padding:28px 28px 0;">
        <span style="display:inline-block;background:#22c55e;color:#ffffff;font-size:12px;font-weight:700;padding:5px 13px;border-radius:100px;font-family:Arial,Helvetica,sans-serif;letter-spacing:0.2px;">&#128139; New Response</span>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 28px 0;">
        <h1 style="margin:0;font-size:22px;font-weight:800;color:#111827;font-family:Arial,Helvetica,sans-serif;line-height:1.3;">You've Got Feedback from an Expert! &#9997;&#65039;</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:14px 28px 0;">
        <p style="margin:0;font-size:15px;color:#374151;font-family:Arial,Helvetica,sans-serif;line-height:1.6;"><strong>Hi ${firstName},</strong><br/>Great news! An expert has replied to your question and provided detailed guidance to help you move forward with confidence.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 28px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td width="33%" style="text-align:center;padding:0 8px;">
              <div style="font-size:36px;line-height:1;margin:0 0 8px;">&#9989;</div>
              <p style="margin:0;font-size:12px;color:#374151;font-family:Arial,Helvetica,sans-serif;font-weight:600;">Verified Expert</p>
            </td>
            <td width="33%" style="text-align:center;padding:0 8px;">
              <div style="font-size:36px;line-height:1;margin:0 0 8px;">&#128203;</div>
              <p style="margin:0;font-size:12px;color:#374151;font-family:Arial,Helvetica,sans-serif;font-weight:600;">Detailed Response</p>
            </td>
            <td width="33%" style="text-align:center;padding:0 8px;">
              <div style="font-size:36px;line-height:1;margin:0 0 8px;">&#128640;</div>
              <p style="margin:0;font-size:12px;color:#374151;font-family:Arial,Helvetica,sans-serif;font-weight:600;">Next Steps</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 28px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f5f5f5;border-radius:10px;border-left:4px solid #374151;">
          <tr>
            <td style="padding:18px 20px;">
              <p style="margin:0 0 18px;font-size:14px;color:#374151;font-family:Arial,Helvetica,sans-serif;line-height:1.6;">Your immigration question has been answered by a verified professional. Log in now to read their comprehensive response.</p>
              <div style="text-align:center;">
                <a href="${chatUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 28px;border-radius:100px;font-family:Arial,Helvetica,sans-serif;">Read Expert Response</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 28px 0;">
        <p style="margin:0;font-size:14px;color:#374151;font-family:Arial,Helvetica,sans-serif;line-height:1.6;">This is exactly why Ask Migi exists &ndash; to connect you with trusted experts who provide clear, actionable answers when you need them most.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 28px 28px;">
        <p style="margin:0;font-size:14px;color:#374151;font-family:Arial,Helvetica,sans-serif;line-height:1.7;">Warm regards,<br/><strong>The Ask Migi Team</strong></p>
      </td>
    </tr>
    ${emailFooter()}
  `);

  await client.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "You've Got Feedback from an Expert! ✍️",
    html,
  });
}

// ─── Expert Welcome Email ─────────────────────────────────────────────────────

export async function sendExpertWelcomeEmail(email: string, firstName: string): Promise<void> {
  const client = getResend();
  const profileUrl = `${SITE_URL}/expert/dashboard`;

  const greenStar = `<span style="color:#22c55e;font-size:16px;">&#9733;</span>`;
  const fiveStars = greenStar.repeat(5);

  const reviewCard = (name: string, date: string) => `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:10px;">
      <tr>
        <td style="padding:14px 16px;">
          <p style="margin:0 0 4px;font-size:13px;color:#22c55e;">${fiveStars}</p>
          <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#111827;font-family:Arial,Helvetica,sans-serif;">They're really nice above anything...</p>
          <p style="margin:0 0 8px;font-size:12px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;line-height:1.5;">&ldquo;My career coach helped me completely transform my job search. I landed a position that I love in just 2 months!&rdquo;</p>
          <p style="margin:0;font-size:12px;font-weight:700;color:#374151;font-family:Arial,Helvetica,sans-serif;">${name} &nbsp;<span style="font-weight:400;color:#9ca3af;">${date}</span></p>
        </td>
      </tr>
    </table>`;

  const html = emailWrapper(`
    ${emailHeader()}
    <tr>
      <td style="padding:28px 28px 0;">
        <h1 style="margin:0;font-size:22px;font-weight:800;color:#111827;font-family:Arial,Helvetica,sans-serif;line-height:1.35;">Welcome to Ask Migi &ndash; Let's Start Helping and Earning! &#127881;</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:14px 28px 0;">
        <p style="margin:0;font-size:15px;color:#374151;font-family:Arial,Helvetica,sans-serif;line-height:1.6;"><strong>Hi ${firstName},</strong><br/>Welcome to Ask Migi &ndash; we're thrilled to have you on board!<br/>You've joined a growing community of immigration experts dedicated to helping people navigate complex immigration issues with clarity and confidence. Whether it's a visa question, green card concern, or work permit confusion, your knowledge makes a real difference.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 28px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
          <tr>
            <td style="padding:16px 20px 12px;text-align:center;">
              <p style="margin:0 0 14px;font-size:13px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;font-weight:600;">Join Our Growing Community</p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td width="33%" style="text-align:center;padding:0 4px;">
                    <p style="margin:0;font-size:24px;font-weight:800;color:#111827;font-family:Arial,Helvetica,sans-serif;">500+</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;font-family:Arial,Helvetica,sans-serif;">Active Experts</p>
                  </td>
                  <td width="33%" style="text-align:center;padding:0 4px;">
                    <p style="margin:0;font-size:24px;font-weight:800;color:#111827;font-family:Arial,Helvetica,sans-serif;">10K+</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;font-family:Arial,Helvetica,sans-serif;">Questions Answered</p>
                  </td>
                  <td width="33%" style="text-align:center;padding:0 4px;">
                    <p style="margin:0;font-size:24px;font-weight:800;color:#111827;font-family:Arial,Helvetica,sans-serif;">95%</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;font-family:Arial,Helvetica,sans-serif;">Satisfaction Rate</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 28px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#fffde7;border-radius:10px;">
          <tr>
            <td style="padding:16px 18px;">
              <p style="margin:0;font-size:14px;color:#374151;font-family:Arial,Helvetica,sans-serif;line-height:1.6;">&#128176; <strong>You earn while you help.</strong> Every time you answer a question on the platform, you get paid. Simple, secure, and impactful.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 28px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f9fafb;border-radius:10px;">
          <tr>
            <td style="padding:18px 20px;">
              <p style="margin:0 0 12px;font-size:15px;font-weight:800;color:#111827;font-family:Arial,Helvetica,sans-serif;">Here's what you can do next:</p>
              <p style="margin:0 0 8px;font-size:13px;color:#374151;font-family:Arial,Helvetica,sans-serif;">&#9989; Complete your profile so users know who you are</p>
              <p style="margin:0 0 8px;font-size:13px;color:#374151;font-family:Arial,Helvetica,sans-serif;">&#9989; Get notified when questions come in</p>
              <p style="margin:0;font-size:13px;color:#374151;font-family:Arial,Helvetica,sans-serif;">&#9989; Start answering questions and building your reputation on the platform</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 28px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td width="33%" style="text-align:center;padding:0 8px;">
              <div style="font-size:34px;line-height:1;margin:0 0 8px;">&#9997;&#65039;</div>
              <p style="margin:0;font-size:12px;color:#374151;font-family:Arial,Helvetica,sans-serif;font-weight:600;">Answer Questions</p>
            </td>
            <td width="33%" style="text-align:center;padding:0 8px;">
              <div style="font-size:34px;line-height:1;margin:0 0 8px;">&#128176;</div>
              <p style="margin:0;font-size:12px;color:#374151;font-family:Arial,Helvetica,sans-serif;font-weight:600;">Earn Money</p>
            </td>
            <td width="33%" style="text-align:center;padding:0 8px;">
              <div style="font-size:34px;line-height:1;margin:0 0 8px;">&#11088;</div>
              <p style="margin:0;font-size:12px;color:#374151;font-family:Arial,Helvetica,sans-serif;font-weight:600;">Build Reputation</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 28px 0;text-align:center;">
        <a href="${profileUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 28px;border-radius:100px;font-family:Arial,Helvetica,sans-serif;">Complete my Profile</a>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 28px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
          <tr>
            <td style="padding:16px 20px;">
              <p style="margin:0 0 4px;font-size:14px;font-weight:800;color:#111827;font-family:Arial,Helvetica,sans-serif;text-align:center;">What our clients say</p>
              <p style="margin:0 0 14px;font-size:12px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;text-align:center;">Rated Excellent &nbsp;${fiveStars}</p>
              ${reviewCard("Sarah K.", "25 Apr 2024")}
              ${reviewCard("Sarah K.", "25 Apr 2024")}
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 28px 28px;">
        <p style="margin:0;font-size:14px;color:#374151;font-family:Arial,Helvetica,sans-serif;line-height:1.6;">Thanks again for joining us. We're excited to see the impact you'll make!</p>
      </td>
    </tr>
    ${emailFooter()}
  `);

  await client.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Welcome to Ask Migi – Let's Start Helping and Earning! 🎉",
    html,
  });
}

// ─── Regular User Welcome Email ───────────────────────────────────────────────

export async function sendWelcomeEmail(email: string, firstName: string): Promise<void> {
  const client = getResend();

  const html = emailWrapper(`
    ${emailHeader()}
    <tr>
      <td style="padding:28px 28px 0;">
        <h1 style="margin:0;font-size:22px;font-weight:800;color:#111827;font-family:Arial,Helvetica,sans-serif;line-height:1.35;">Welcome to Ask Migi! &#127881;</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:14px 28px 0;">
        <p style="margin:0;font-size:15px;color:#374151;font-family:Arial,Helvetica,sans-serif;line-height:1.6;"><strong>Hi ${firstName},</strong><br/>We're thrilled to have you on board! Your account has been created and you've received <strong>5 free coins</strong> to get you started.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 28px 0;">
        <p style="margin:0;font-size:15px;color:#374151;font-family:Arial,Helvetica,sans-serif;line-height:1.6;">Use your coins to ask questions from our verified immigration, travel, and tour experts. Each question costs 3 coins and you'll get a detailed expert response.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 28px 0;text-align:center;">
        <a href="${SITE_URL}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 28px;border-radius:100px;font-family:Arial,Helvetica,sans-serif;">Start Asking Questions</a>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 28px 28px;">
        <p style="margin:0;font-size:14px;color:#374151;font-family:Arial,Helvetica,sans-serif;line-height:1.7;">Warm regards,<br/><strong>The Ask Migi Team</strong></p>
      </td>
    </tr>
    ${emailFooter()}
  `);

  await client.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Welcome to Ask Migi!",
    html,
  });
}

// ─── Password Reset / OTP Email ───────────────────────────────────────────────

export async function sendOTPEmail(email: string, otp: string, firstName: string): Promise<void> {
  const client = getResend();
  const resetUrl = `${SITE_URL}/forgot-password?step=verify&email=${encodeURIComponent(email)}&otp=${otp}`;

  const html = emailWrapper(`
    ${emailHeader()}
    <tr>
      <td style="padding:28px 28px 0;">
        <h1 style="margin:0;font-size:22px;font-weight:800;color:#111827;font-family:Arial,Helvetica,sans-serif;line-height:1.35;">Password Reset Request &#128274;</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:14px 28px 0;">
        <p style="margin:0;font-size:15px;color:#374151;font-family:Arial,Helvetica,sans-serif;line-height:1.6;"><strong>Hi ${firstName},</strong><br/>We received a request to reset your password for your Ask Migi account. If you made this request, just click the button below to create a new password:</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 28px 0;text-align:center;">
        <a href="${resetUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 28px;border-radius:100px;font-family:Arial,Helvetica,sans-serif;">Reset My Password</a>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 28px 0;">
        <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;font-family:Arial,Helvetica,sans-serif;text-align:center;">Or use this code on the site: <strong style="color:#374151;letter-spacing:2px;">${otp}</strong></p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 28px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#fff7ed;border:1px solid #fdba74;border-radius:10px;">
          <tr>
            <td style="padding:14px 18px;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:800;color:#ea580c;font-family:Arial,Helvetica,sans-serif;">Security Notice</p>
              <p style="margin:0;font-size:14px;color:#ea580c;font-family:Arial,Helvetica,sans-serif;line-height:1.5;">This link will expire in 60 minutes for your security.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 28px 0;">
        <p style="margin:0;font-size:14px;color:#374151;font-family:Arial,Helvetica,sans-serif;line-height:1.6;">If you didn't request a password reset, you can safely ignore this email &mdash; your account is still secure.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 28px 28px;">
        <p style="margin:0;font-size:14px;color:#374151;font-family:Arial,Helvetica,sans-serif;line-height:1.7;">Thanks,<br/><strong>The Ask Migi Team</strong></p>
      </td>
    </tr>
    ${emailFooter()}
  `);

  await client.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Your Ask MiGi Password Reset Code",
    html,
  });
}
