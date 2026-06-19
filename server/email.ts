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

export async function sendOTPEmail(email: string, otp: string, firstName: string): Promise<void> {
  const client = getResend();
  await client.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Your Ask MiGi Password Reset Code",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#161618;font-family:Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#161618;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1e2022;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
        <tr>
          <td style="background:#161618;padding:24px 32px;text-align:center;border-bottom:1px solid #2a2c2e;">
            <img src="${SITE_URL}/figmaAssets/vector.svg" alt="Ask MiGi" height="28" style="height:28px;" />
          </td>
        </tr>
        <tr>
          <td style="padding:36px 32px;">
            <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 12px;">Password Reset Request</h1>
            <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 28px;">
              Hi ${firstName}, we received a request to reset your password. Use the code below:
            </p>
            <div style="background:#242628;border-radius:12px;padding:24px;text-align:center;margin:0 0 28px;">
              <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Your OTP Code</p>
              <p style="color:#ffffff;font-size:42px;font-weight:700;letter-spacing:8px;margin:0;font-family:monospace;">${otp}</p>
            </div>
            <p style="color:rgba(255,255,255,0.5);font-size:13px;line-height:1.6;margin:0 0 4px;">
              This code expires in <strong style="color:rgba(255,255,255,0.7);">15 minutes</strong>.
            </p>
            <p style="color:rgba(255,255,255,0.5);font-size:13px;line-height:1.6;margin:0;">
              If you didn't request this, please ignore this email — your account is safe.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #2a2c2e;text-align:center;">
            <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0;">
              &copy; Ask MiGi. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `.trim(),
  });
}

export async function sendWelcomeEmail(email: string, firstName: string): Promise<void> {
  const client = getResend();
  await client.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Welcome to Ask MiGi!",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#161618;font-family:Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#161618;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1e2022;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
        <tr>
          <td style="background:#161618;padding:24px 32px;text-align:center;border-bottom:1px solid #2a2c2e;">
            <img src="${SITE_URL}/figmaAssets/vector.svg" alt="Ask MiGi" height="28" style="height:28px;" />
          </td>
        </tr>
        <tr>
          <td style="padding:36px 32px;">
            <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 12px;">Welcome to Ask MiGi! 🎉</h1>
            <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 20px;">
              Hi ${firstName}, your account has been created successfully. You've received <strong style="color:#ffffff;">5 free coins</strong> to get started!
            </p>
            <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 28px;">
              Use your coins to ask questions from our verified immigration, travel, and tour experts. Each question costs 3 coins and you'll get a response within 3–5 business days.
            </p>
            <div style="text-align:center;margin:0 0 28px;">
              <a href="${SITE_URL}" style="display:inline-block;background:#ffffff;color:#000000;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:100px;">
                Start Asking Questions
              </a>
            </div>
            <p style="color:rgba(255,255,255,0.4);font-size:13px;line-height:1.6;margin:0;">
              Warm regards,<br/><strong style="color:rgba(255,255,255,0.6);">The Ask MiGi Team</strong>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #2a2c2e;text-align:center;">
            <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0;">
              &copy; Ask MiGi. All rights reserved. &nbsp;|&nbsp; <a href="${SITE_URL}/privacy-policy" style="color:rgba(255,255,255,0.3);">Privacy Policy</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `.trim(),
  });
}

export async function sendExpertReplyEmail(
  email: string,
  firstName: string,
  question: string,
  enquiryId: string
): Promise<void> {
  const client = getResend();
  const shortQuestion = question.length > 80 ? question.slice(0, 80) + "…" : question;
  await client.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "You've Got Feedback from an Expert! ✍️",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;max-width:560px;width:100%;">
        <tr>
          <td style="background:#161618;padding:24px 32px;">
            <img src="${SITE_URL}/figmaAssets/vector.svg" alt="Ask MiGi" height="28" style="height:28px;" />
            <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:6px 0 0;">Clear answers. Trusted experts. Real help.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="display:inline-block;background:#e8f5e9;color:#2e7d32;font-size:13px;font-weight:600;padding:6px 14px;border-radius:100px;margin:0 0 20px;">📩 New Response</p>
            <h1 style="color:#111827;font-size:22px;font-weight:700;margin:0 0 16px;">You've Got Feedback from an Expert! ✍️</h1>
            <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
              Hi <strong>${firstName}</strong>,<br/>
              Great news! An expert has replied to your question and provided detailed guidance to help you move forward with confidence.
            </p>
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin:0 0 24px;">
              <p style="color:#6b7280;font-size:13px;margin:0 0 8px;">Your question:</p>
              <p style="color:#111827;font-size:15px;font-style:italic;margin:0;">"${shortQuestion}"</p>
            </div>
            <div style="text-align:center;margin:0 0 24px;">
              <a href="${SITE_URL}/chat?id=${enquiryId}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:100px;">
                Read Expert Response
              </a>
            </div>
            <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 20px;">
              This is exactly why Ask Migi exists — to connect you with trusted experts who provide clear, actionable answers when you need them most.
            </p>
            <p style="color:#374151;font-size:14px;margin:0;">
              Warm regards,<br/><strong>The Ask Migi Team</strong>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#111827;padding:24px 32px;text-align:center;">
            <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0 0 8px;">
              If you ever need support, we're always here: <a href="mailto:support@askmigi.com" style="color:rgba(255,255,255,0.5);">support@askmigi.com</a>
            </p>
            <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0;">Copyright &copy;AskMigi. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `.trim(),
  });
}
