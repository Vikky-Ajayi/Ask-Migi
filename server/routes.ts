import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import multer from "multer";
import {
  storage,
  hashPassword,
  verifyPassword,
  createAuthToken,
  getUserIdFromToken,
  deleteAuthToken,
} from "./storage";
import { randomInt, randomBytes, createHmac } from "crypto";
import { generateAIResponse, generateQuestionAnalysis, generateCasualReply } from "./ai";
import { sendOTPEmail, sendWelcomeEmail, sendExpertWelcomeEmail, sendExpertReplyEmail, sendNewQuestionEmail, sendCoinPurchaseEmail } from "./email";
import { keywordScore, buildProfileText, buildProfileSummary, rankCandidatesWithAI } from "./embeddings";
import { parseCvWithAI, processQueuedApplications } from "./autoApply";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

interface AuthRequest extends Request {
  userId?: string;
}

// reference → checkoutId  (populated when checkout is created, survives until server restarts)
const checkoutCache = new Map<string, string>();

function getExpertMagicToken(): string {
  return createHmac("sha256", process.env.TOKEN_SECRET || "secret")
    .update("expert_dashboard_access")
    .digest("hex");
}

// ── Health check ──────────────────────────────────────────────────────────────
export function registerHealthCheck(app: Express) {
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });
}

// ── Auth middleware ────────────────────────────────────────────────────────────
function getTokenFromRequest(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getTokenFromRequest(req);
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  const userId = getUserIdFromToken(token);
  if (!userId) return res.status(401).json({ message: "Invalid or expired token" });
  const user = await storage.getUser(userId);
  if (!user) return res.status(401).json({ message: "User not found" });
  (req as any).userId = userId;
  (req as any).user = user;
  next();
}

// ── Sanitize user (strip password) ───────────────────────────────────────────
function safeUser(user: any) {
  const { password, ...rest } = user;
  return rest;
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // ── Auth routes ─────────────────────────────────────────────────────────────

  // POST /api/auth/register
  app.post("/api/auth/register", async (req, res) => {
    const schema = z.object({
      email: z.string().email("Invalid email"),
      firstName: z.string().min(1, "First name required"),
      lastName: z.string().min(1, "Last name required"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      role: z.enum(["user", "expert"]).optional().default("user"),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: result.error.issues[0].message });

    const { email, firstName, lastName, password, role } = result.data;
    const existing = await storage.getUserByEmail(email);
    if (existing) return res.status(409).json({ message: "An account with this email already exists" });

    const hashedPw = hashPassword(password);
    const user = await storage.createUser({ email, firstName, lastName, password: hashedPw, role });
    const token = createAuthToken(user.id);

    // Send role-appropriate welcome email (non-blocking)
    const welcomeFn = role === "expert" ? sendExpertWelcomeEmail : sendWelcomeEmail;
    welcomeFn(email, firstName).catch((err) =>
      console.error("[EMAIL] Failed to send welcome email:", err.message)
    );

    return res.status(201).json({ user: safeUser(user), token });
  });

  // POST /api/auth/login
  app.post("/api/auth/login", async (req, res) => {
    const schema = z.object({
      email: z.string().email("Invalid email"),
      password: z.string().min(1, "Password required"),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: result.error.issues[0].message });

    const { email, password } = result.data;
    const user = await storage.getUserByEmail(email);
    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = createAuthToken(user.id);
    return res.json({ user: safeUser(user), token });
  });

  // POST /api/auth/logout
  app.post("/api/auth/logout", (req, res) => {
    const token = getTokenFromRequest(req);
    if (token) deleteAuthToken(token);
    return res.json({ message: "Logged out" });
  });

  // GET /api/auth/me
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    return res.json({ user: safeUser((req as any).user) });
  });

  // POST /api/auth/forgot-password
  app.post("/api/auth/forgot-password", async (req, res) => {
    const schema = z.object({ email: z.string().email() });
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: "Invalid email" });

    const { email } = result.data;
    const user = await storage.getUserByEmail(email);
    // Always respond success to avoid email enumeration
    if (user) {
      const otp = String(randomInt(100000, 999999));
      await storage.createPasswordReset(email, otp);

      // Send OTP via Resend (non-blocking)
      sendOTPEmail(email, otp, user.firstName).catch((err) => {
        console.error("[EMAIL] Failed to send OTP email:", err.message);
      });

      // In dev mode only, log OTP to console and return in response
      const isDev = process.env.NODE_ENV === "development";
      if (isDev) console.log(`[AUTH] OTP for ${email}: ${otp}`);
      return res.json({ message: "OTP sent", ...(isDev ? { otp } : {}) });
    }
    return res.json({ message: "If that email exists, an OTP has been sent." });
  });

  // POST /api/auth/verify-otp
  app.post("/api/auth/verify-otp", async (req, res) => {
    const schema = z.object({ email: z.string().email(), otp: z.string() });
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: "Invalid request" });

    const { email, otp } = result.data;
    const reset = await storage.getPasswordReset(email, otp);
    if (!reset) return res.status(400).json({ message: "Invalid or expired OTP" });
    return res.json({ message: "OTP verified", resetId: reset.id });
  });

  // POST /api/auth/reset-password
  app.post("/api/auth/reset-password", async (req, res) => {
    const schema = z.object({
      email: z.string().email(),
      otp: z.string(),
      newPassword: z.string().min(6),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: result.error.issues[0].message });

    const { email, otp, newPassword } = result.data;
    const reset = await storage.getPasswordReset(email, otp);
    if (!reset) return res.status(400).json({ message: "Invalid or expired OTP" });

    const user = await storage.getUserByEmail(email);
    if (!user) return res.status(404).json({ message: "User not found" });

    await storage.updateUserPassword(user.id, hashPassword(newPassword));
    await storage.markPasswordResetUsed(reset.id);
    return res.json({ message: "Password reset successfully" });
  });

  // PATCH /api/auth/change-password (logged in user)
  app.patch("/api/auth/change-password", requireAuth, async (req, res) => {
    const schema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(6, "New password must be at least 6 characters"),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: result.error.issues[0].message });

    const user = (req as any).user;
    if (!verifyPassword(result.data.currentPassword, user.password)) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }
    await storage.updateUserPassword(user.id, hashPassword(result.data.newPassword));
    return res.json({ message: "Password changed successfully" });
  });

  // ── Enquiries ──────────────────────────────────────────────────────────────

  // GET /api/enquiries
  app.get("/api/enquiries", requireAuth, async (req, res) => {
    const userId = (req as any).userId;
    const enquiries = await storage.getEnquiries(userId);
    return res.json(enquiries);
  });

  // GET /api/enquiries/:id
  app.get("/api/enquiries/:id", requireAuth, async (req, res) => {
    const enquiry = await storage.getEnquiry(req.params.id);
    if (!enquiry) return res.status(404).json({ message: "Enquiry not found" });
    if (enquiry.userId !== (req as any).userId) return res.status(403).json({ message: "Forbidden" });
    return res.json(enquiry);
  });

  // POST /api/casual-chat — free, no coins, no enquiry created
  app.post("/api/casual-chat", requireAuth, async (req, res) => {
    const schema = z.object({ message: z.string().min(1) });
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: "Message is required" });
    const reply = await generateCasualReply(result.data.message);
    return res.json({ reply });
  });

  // POST /api/enquiries
  app.post("/api/enquiries", requireAuth, async (req, res) => {
    const schema = z.object({
      question: z.string().min(1, "Please enter a question"),
      expertType: z.enum(["immigration", "travel", "tour"]).default("immigration"),
      country: z.string().default("United Kingdom"),
      attachment: z.string().optional().nullable(),
      attachmentName: z.string().optional().nullable(),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: result.error.issues[0].message });

    const userId = (req as any).userId;
    const user = (req as any).user;
    const coinsNeeded = 3;

    if (!user.unlimitedCoins && user.coins < coinsNeeded) {
      return res.status(402).json({ message: "Insufficient coins. Please purchase more coins." });
    }

    // Generate short analysis for the user (synchronous — shown immediately)
    let analysis = "";
    try {
      analysis = await generateQuestionAnalysis(result.data.question, result.data.expertType, result.data.country);
    } catch (err: any) {
      console.error("[AI] Failed to generate analysis:", err.message);
    }

    // Create enquiry with analysis
    const enquiry = await storage.createEnquiry({
      userId,
      expertType: result.data.expertType,
      question: result.data.question,
      country: result.data.country,
      coinsUsed: coinsNeeded,
      analysis: analysis || null,
      attachment: result.data.attachment ?? null,
      attachmentName: result.data.attachmentName ?? null,
    });

    if (!user.unlimitedCoins) {
      await storage.updateUserCoins(userId, -coinsNeeded);
    }

    // Notify expert of new question (non-blocking, include magic link)
    const expertEmail = process.env.EXPERT_EMAIL;
    if (expertEmail) {
      const magicToken = getExpertMagicToken();
      sendNewQuestionEmail(expertEmail, `${user.firstName} ${user.lastName}`, result.data.question, enquiry.id, magicToken).catch(
        (err) => console.error("[EMAIL] Failed to send expert notification:", err.message)
      );
    }

    // Generate AI draft response for expert to review (non-blocking, not shown to user)
    generateAIResponse(result.data.question, result.data.expertType, result.data.country)
      .then(async (aiAnswer) => {
        await storage.updateEnquiryAnswer(enquiry.id, aiAnswer, "AI Draft", "ai_draft");
      })
      .catch((err) => {
        console.error("[AI] Failed to generate AI draft:", err.message);
      });

    return res.status(201).json(enquiry);
  });

  // ── Admin: Answer enquiry manually ─────────────────────────────────────────
  // PATCH /api/enquiries/:id/answer
  app.patch("/api/enquiries/:id/answer", requireAuth, async (req, res) => {
    const schema = z.object({
      answer: z.string().min(1),
      answeredBy: z.string().default("Expert Team"),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: result.error.issues[0].message });

    const enquiry = await storage.getEnquiry(req.params.id);
    if (!enquiry) return res.status(404).json({ message: "Enquiry not found" });

    const updated = await storage.updateEnquiryAnswer(
      req.params.id,
      result.data.answer,
      result.data.answeredBy
    );

    // Notify the user by email
    const user = await storage.getUser(enquiry.userId);
    if (user) {
      sendExpertReplyEmail(user.email, user.firstName, enquiry.question, enquiry.id).catch((err) =>
        console.error("[EMAIL] Failed to send expert reply notification:", err.message)
      );
    }

    return res.json(updated);
  });

  // POST /api/expert/magic-login — permanent magic link token exchange
  app.post("/api/expert/magic-login", async (req, res) => {
    const schema = z.object({ token: z.string().min(1) });
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: "Invalid request" });

    const expected = getExpertMagicToken();
    if (result.data.token !== expected) {
      return res.status(401).json({ message: "Invalid access token" });
    }

    // Find or auto-create the expert user via EXPERT_EMAIL
    const expertEmail = process.env.EXPERT_EMAIL;
    if (!expertEmail) {
      return res.status(500).json({ message: "EXPERT_EMAIL is not configured on this server. Please contact the administrator." });
    }

    let expertUser = await storage.getUserByEmail(expertEmail);

    // Auto-create the expert account on first magic-link access — no manual registration needed
    if (!expertUser) {
      const randomPw = hashPassword(randomBytes(32).toString("hex"));
      expertUser = await storage.createUser({
        email: expertEmail,
        firstName: "Expert",
        lastName: "Advisor",
        password: randomPw,
        role: "expert",
      });
    } else if (expertUser.role !== "expert") {
      // Upgrade the account to expert if it exists but isn't marked as expert
      await storage.updateUserRole(expertUser.id, "expert");
      expertUser = { ...expertUser, role: "expert" };
    }

    const token = createAuthToken(expertUser.id);
    return res.json({ user: safeUser(expertUser), token });
  });

  // ── Expert Questions Feed ──────────────────────────────────────────────────

  // GET /api/expert/questions — all pending enquiries for the live feed
  app.get("/api/expert/questions", requireAuth, async (req, res) => {
    const user = (req as any).user;
    if (user.role !== "expert") return res.status(403).json({ message: "Experts only" });
    const all = await storage.getAllPendingEnquiries();
    return res.json(all);
  });

  // GET /api/expert/answered — all answered enquiries (for edit history)
  app.get("/api/expert/answered", requireAuth, async (req, res) => {
    const user = (req as any).user;
    if (user.role !== "expert") return res.status(403).json({ message: "Experts only" });
    const all = await storage.getAllAnsweredEnquiries();
    return res.json(all);
  });

  // PATCH /api/expert/questions/:id/answer — expert submits or edits an answer
  app.patch("/api/expert/questions/:id/answer", requireAuth, async (req, res) => {
    const user = (req as any).user;
    if (user.role !== "expert") return res.status(403).json({ message: "Experts only" });
    const schema = z.object({ answer: z.string().min(10, "Answer too short"), isEdit: z.boolean().optional() });
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: result.error.issues[0].message });

    const enquiry = await storage.getEnquiry(req.params.id);
    if (!enquiry) return res.status(404).json({ message: "Not found" });

    const isEdit = result.data.isEdit === true || enquiry.status === "answered";
    const answeredBy = `${user.firstName} ${user.lastName}`;
    const updated = await storage.updateEnquiryAnswer(req.params.id, result.data.answer, answeredBy, "answered", user.profilePic ?? null);

    if (!isEdit) {
      const enquiryUser = await storage.getUser(enquiry.userId);
      if (enquiryUser) {
        sendExpertReplyEmail(enquiryUser.email, enquiryUser.firstName, enquiry.question, enquiry.id).catch(() => {});
      }
    }
    return res.json(updated);
  });

  // GET /api/expert/profile-pic — public endpoint to get current expert's pic
  app.get("/api/expert/profile-pic", async (_req, res) => {
    try {
      const expertEmail = process.env.EXPERT_EMAIL;
      if (!expertEmail) return res.json({ profilePic: null });
      const expertUser = await storage.getUserByEmail(expertEmail);
      return res.json({ profilePic: expertUser?.profilePic ?? null });
    } catch {
      return res.json({ profilePic: null });
    }
  });

  // POST /api/auth/profile-pic — upload any user's profile picture
  app.post("/api/auth/profile-pic", requireAuth, async (req, res) => {
    const user = (req as any).user;
    const schema = z.object({ imageData: z.string().min(1) });
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: "imageData is required" });
    const updated = await storage.updateUserProfilePic(user.id, result.data.imageData);
    return res.json({ profilePic: updated?.profilePic });
  });

  // POST /api/expert/profile-pic — upload expert's profile picture
  app.post("/api/expert/profile-pic", requireAuth, async (req, res) => {
    const user = (req as any).user;
    if (user.role !== "expert") return res.status(403).json({ message: "Experts only" });
    const schema = z.object({ imageData: z.string().min(1) });
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: "imageData is required" });
    const updated = await storage.updateUserProfilePic(user.id, result.data.imageData);
    return res.json({ profilePic: updated?.profilePic });
  });


  // ── Experts ────────────────────────────────────────────────────────────────

  // GET /api/experts?type=travel
  app.get("/api/experts", async (req, res) => {
    const type = req.query.type as string | undefined;
    const experts = await storage.getExperts(type);
    return res.json(experts);
  });

  // GET /api/experts/:id
  app.get("/api/experts/:id", async (req, res) => {
    const expert = await storage.getExpert(req.params.id);
    if (!expert) return res.status(404).json({ message: "Expert not found" });
    return res.json(expert);
  });

  // ── Coins ──────────────────────────────────────────────────────────────────

  // POST /api/coins/create-checkout  — creates a SumUp hosted checkout
  app.post("/api/coins/create-checkout", requireAuth, async (req, res) => {
    const schema = z.object({
      coinsAmount: z.number().int().positive(),
      price: z.number().positive(),
      currency: z.string().min(3).max(3).default("GBP"),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });

    const userId = (req as any).userId as string;
    const { coinsAmount, price, currency } = parsed.data;
    const reference = `askmigi-${userId.slice(0, 8)}-${coinsAmount}c-${Date.now()}`;

    // Determine return URL — an explicitly configured SITE_URL (production domain) always wins,
    // since REPLIT_DOMAINS can point at an internal preview domain that differs from the live site.
    const host = process.env.SITE_URL
      || (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}` : `https://${req.hostname}`);

    try {
      const { createCheckout } = await import("./sumup.js");
      const redirectUrl = `${host}/buy-coins?ref=${encodeURIComponent(reference)}&coins=${coinsAmount}`;
      const webhookUrl = `${host}/api/coins/sumup-webhook`;
      const checkout = await createCheckout({
        reference,
        amount: price,
        currency,
        description: `${coinsAmount} Coins – Ask Migi`,
        redirectUrl,
        webhookUrl,
      });
      // Cache server-side (best-effort — may be lost on restart; client-side localStorage is primary)
      checkoutCache.set(reference, checkout.checkoutId);
      // Persist a pending purchase row immediately — this lets a background job credit the
      // user's coins even if the browser never makes it back from SumUp's hosted page.
      await storage.createPendingCoinPurchase({
        userId,
        coinsAmount,
        price: String(price),
        sumupRef: reference,
        checkoutId: checkout.checkoutId,
      });
      console.log(`[SUMUP] checkout created: ${checkout.checkoutId} ref=${reference} redirectUrl=${redirectUrl}`);
      return res.json({ checkoutId: checkout.checkoutId, payUrl: checkout.payUrl, reference });
    } catch (err: any) {
      console.error("[SUMUP] create-checkout error:", err.message);
      return res.status(502).json({ message: "Payment provider unavailable. Please try again later." });
    }
  });

  // POST /api/coins/sumup-webhook — server-to-server callback SumUp POSTs when a checkout's
  // status changes. This is the real-time complement to the reconciliation poller: it lets us
  // credit coins immediately on payment success, independent of whether the buyer's browser
  // ever returns to the app at all (SumUp's hosted checkout does not auto-redirect the browser —
  // it only shows a "return to site" button, which some users never click).
  app.post("/api/coins/sumup-webhook", async (req, res) => {
    try {
      const checkoutId: string | undefined = req.body?.id || req.body?.checkout_id;
      if (!checkoutId) {
        console.warn("[SUMUP][webhook] payload missing checkout id:", JSON.stringify(req.body));
        return res.status(200).json({ received: true });
      }

      const { getCheckoutStatus } = await import("./sumup.js");
      const checkout = await getCheckoutStatus(checkoutId);

      const purchase = await storage.getPurchaseBySumupRef(checkout.reference);
      if (!purchase) {
        console.warn(`[SUMUP][webhook] no purchase found for reference=${checkout.reference}`);
        return res.status(200).json({ received: true });
      }

      if (purchase.status === "completed") {
        return res.status(200).json({ received: true, alreadyProcessed: true });
      }

      if (checkout.status === "PAID") {
        await storage.markCoinPurchaseStatus(purchase.id, "completed");
        const updatedUser = await storage.updateUserCoins(purchase.userId, purchase.coinsAmount);
        console.log(`[SUMUP][webhook] credited ${purchase.coinsAmount} coins to user ${purchase.userId} (ref=${checkout.reference})`);

        const buyer = await storage.getUser(purchase.userId);
        if (buyer?.email) {
          const amountFormatted = `£${checkout.amount.toFixed(2)}`;
          sendCoinPurchaseEmail(buyer.email, buyer.firstName, purchase.coinsAmount, updatedUser?.coins ?? 0, amountFormatted)
            .catch((err) => console.error("[EMAIL] Failed to send webhook coin purchase receipt:", err.message));
        }
      } else if (checkout.status === "FAILED" || checkout.status === "CANCELLED") {
        await storage.markCoinPurchaseStatus(purchase.id, "failed");
      }

      return res.status(200).json({ received: true });
    } catch (err: any) {
      console.error("[SUMUP][webhook] error:", err.message);
      // Always 200 so SumUp doesn't endlessly retry a permanently-failing payload;
      // the reconciliation poller acts as a safety net for anything missed here.
      return res.status(200).json({ received: true, error: true });
    }
  });

  // POST /api/coins/create-crypto-checkout — creates a NOWPayments invoice for crypto payment
  app.post("/api/coins/create-crypto-checkout", requireAuth, async (req, res) => {
    const schema = z.object({
      coinsAmount: z.number().int().positive(),
      price: z.number().positive(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });

    const nowpaymentsKey = process.env.NOWPAYMENTS_API_KEY?.trim();
    if (!nowpaymentsKey) return res.status(503).json({ message: "Crypto payments are not yet configured. Please use card payment." });
    console.log(`[NOWPAYMENTS] key length: ${nowpaymentsKey.length}, starts with: ${nowpaymentsKey.slice(0, 4)}...`);

    const userId = (req as any).userId as string;
    const { coinsAmount, price } = parsed.data;
    const orderId = `migi-${userId.slice(0, 8)}-${coinsAmount}c-${Date.now()}`;

    const host = process.env.SITE_URL
      || (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}` : `https://${req.hostname}`);

    try {
      const response = await fetch("https://api.nowpayments.io/v1/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": nowpaymentsKey },
        body: JSON.stringify({
          price_amount: price,
          price_currency: "gbp",
          order_id: orderId,
          order_description: `${coinsAmount} Coins – Ask Migi`,
          success_url: `${host}/buy-coins?crypto_success=1&coins=${coinsAmount}`,
          cancel_url: `${host}/buy-coins`,
          ipn_callback_url: `${host}/api/coins/crypto-webhook`,
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error("[NOWPAYMENTS] invoice error:", err);
        return res.status(502).json({ message: "Could not create crypto invoice. Please try card payment." });
      }
      const data = await response.json() as { invoice_url: string; id: string };
      return res.json({ invoiceUrl: data.invoice_url, orderId });
    } catch (err: any) {
      console.error("[NOWPAYMENTS] error:", err.message);
      return res.status(502).json({ message: "Crypto payment provider unavailable. Please try card payment." });
    }
  });

  // POST /api/coins/crypto-webhook — NOWPayments IPN callback
  app.post("/api/coins/crypto-webhook", async (req, res) => {
    try {
      const { payment_status, order_id } = req.body ?? {};
      if (payment_status !== "finished" && payment_status !== "confirmed") {
        return res.status(200).json({ received: true });
      }
      if (!order_id || typeof order_id !== "string") return res.status(400).json({ message: "Invalid order_id" });

      // Parse order_id: format "migi-USERID8-Nc-TIMESTAMP"
      const match = order_id.match(/^migi-([a-zA-Z0-9]{8})-(\d+)c-/);
      if (!match) return res.status(400).json({ message: "Invalid order_id format" });

      const partialUserId = match[1];
      const coinsAmount = parseInt(match[2], 10);

      // Find user by partial ID prefix
      const { db } = await import("./db.js");
      const { users: usersTable } = await import("../shared/schema.js");
      const { sql: sqlFn } = await import("drizzle-orm");
      const [targetUser] = await db.select().from(usersTable).where(sqlFn`${usersTable.id} LIKE ${partialUserId + "%"}`).limit(1);

      if (!targetUser) {
        console.error("[NOWPAYMENTS] user not found for order:", order_id);
        return res.status(404).json({ message: "User not found" });
      }

      // Idempotency: use orderId as sumupRef
      const existing = await storage.getPurchaseBySumupRef(order_id);
      if (!existing) {
        await storage.createCoinPurchase({ userId: targetUser.id, coinsAmount, price: String(req.body.price_amount ?? 0), sumupRef: order_id });
        const updatedUser = await storage.updateUserCoins(targetUser.id, coinsAmount);

        // Send purchase receipt email (non-blocking)
        if (targetUser.email) {
          const price = req.body.price_amount ? `£${parseFloat(req.body.price_amount).toFixed(2)}` : "crypto payment";
          sendCoinPurchaseEmail(targetUser.email, targetUser.firstName, coinsAmount, updatedUser?.coins ?? 0, price)
            .catch((err) => console.error("[EMAIL] Failed to send crypto coin purchase receipt:", err.message));
        }
      }

      return res.status(200).json({ received: true });
    } catch (err: any) {
      console.error("[NOWPAYMENTS] webhook error:", err.message);
      return res.status(500).json({ message: "Webhook processing error" });
    }
  });

  // POST /api/coins/verify-payment  — verifies SumUp checkout and credits coins (idempotent)
  app.post("/api/coins/verify-payment", requireAuth, async (req, res) => {
    const schema = z.object({
      checkoutId: z.string().optional(), // optional — resolved from checkoutCache if missing
      coinsAmount: z.number().int().positive(),
      reference: z.string().min(1),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });

    const userId = (req as any).userId as string;
    const { coinsAmount, reference } = parsed.data;

    // Resolve checkoutId: prefer what the client sent, fall back to server-side cache
    const checkoutId = parsed.data.checkoutId || checkoutCache.get(reference) || "";
    if (!checkoutId) {
      return res.status(400).json({ message: "Cannot resolve checkout ID. Please contact support if you were charged." });
    }

    // Idempotency: if already processed (completed), return success without double-crediting.
    // A "pending" row is expected here — it was created when the checkout was first initiated,
    // and a background reconciliation job may have already completed it independently.
    const existing = await storage.getPurchaseBySumupRef(reference);
    if (existing && existing.status === "completed") {
      const user = await storage.getUser(userId);
      return res.json({ success: true, coins: user?.coins, alreadyProcessed: true });
    }

    try {
      const { getCheckoutStatus } = await import("./sumup.js");

      // Poll up to 8 times (×1.5 s apart = ~12 s total) — SumUp API can lag after redirect
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      let checkout = await getCheckoutStatus(checkoutId);
      let attempts = 1;
      while (checkout.status === "PENDING" && attempts < 8) {
        await sleep(1500);
        checkout = await getCheckoutStatus(checkoutId);
        attempts++;
        console.log(`[SUMUP] verify attempt ${attempts}: ${checkout.status}`);
      }

      if (checkout.status !== "PAID") {
        return res.status(402).json({ message: `Payment not completed (status: ${checkout.status}). If you were charged, please contact support.` });
      }

      // Re-check right before crediting in case the background reconciler completed it in the meantime
      const recheck = await storage.getPurchaseBySumupRef(reference);
      if (recheck && recheck.status === "completed") {
        const user = await storage.getUser(userId);
        return res.json({ success: true, coins: user?.coins, alreadyProcessed: true });
      }

      const purchase = existing
        ? await (async () => { await storage.markCoinPurchaseStatus(existing.id, "completed"); return existing; })()
        : await storage.createCoinPurchase({
            userId,
            coinsAmount,
            price: String(checkout.amount),
            sumupRef: reference,
            checkoutId,
          });
      const updatedUser = await storage.updateUserCoins(userId, coinsAmount);
      // Clean up cache after successful verification
      checkoutCache.delete(reference);

      // Send purchase receipt email (non-blocking)
      const buyer = await storage.getUser(userId);
      if (buyer?.email) {
        const amountFormatted = `£${checkout.amount.toFixed(2)}`;
        sendCoinPurchaseEmail(buyer.email, buyer.firstName, coinsAmount, updatedUser?.coins ?? 0, amountFormatted)
          .catch((err) => console.error("[EMAIL] Failed to send coin purchase receipt:", err.message));
      }

      return res.json({ success: true, coins: updatedUser?.coins, purchase });
    } catch (err: any) {
      console.error("[SUMUP] verify-payment error:", err.message);
      return res.status(502).json({ message: "Could not verify payment. Please contact support." });
    }
  });

  // POST /api/coins/purchase  — legacy direct-grant (kept for admin/dev use)
  app.post("/api/coins/purchase", requireAuth, async (req, res) => {
    const schema = z.object({
      coinsAmount: z.number().int().positive(),
      price: z.string(),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: result.error.issues[0].message });

    const userId = (req as any).userId;
    const purchase = await storage.createCoinPurchase({
      userId,
      coinsAmount: result.data.coinsAmount,
      price: result.data.price,
    });
    const updatedUser = await storage.updateUserCoins(userId, result.data.coinsAmount);
    return res.status(201).json({ purchase, coins: updatedUser?.coins });
  });

  // GET /api/coins/purchases
  app.get("/api/coins/purchases", requireAuth, async (req, res) => {
    const purchases = await storage.getCoinPurchases((req as any).userId);
    return res.json(purchases);
  });

  // ── Expert Verification ────────────────────────────────────────────────────

  // GET /api/expert/verification
  app.get("/api/expert/verification", requireAuth, async (req, res) => {
    const userId = (req as any).userId;
    const verification = await storage.getExpertVerification(userId);
    return res.json(verification);
  });

  // POST /api/expert/verification
  app.post("/api/expert/verification", requireAuth, async (req, res) => {
    const schema = z.object({
      personalInfo: z.record(z.string()).optional(),
      businessInfo: z.record(z.string()).optional(),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: result.error.issues[0].message });

    const userId = (req as any).userId;
    const updated = await storage.updateExpertVerification(userId, {
      ...result.data,
      status: "pending",
      submittedAt: new Date(),
    });
    return res.json(updated);
  });

  // ── Expert Services ────────────────────────────────────────────────────────

  // GET /api/expert/services
  app.get("/api/expert/services", requireAuth, async (req, res) => {
    const userId = (req as any).userId;
    const services = await storage.getExpertServices(userId);
    return res.json(services);
  });

  // POST /api/expert/services
  app.post("/api/expert/services", requireAuth, async (req, res) => {
    const schema = z.object({
      businessName: z.string().min(1, "Business name required"),
      serviceTypes: z.array(z.string()).min(1, "Select at least one service type"),
      countries: z.array(z.string()).default([]),
      visaServices: z.array(z.string()).default([]),
      currency: z.string().default("GBP"),
      averagePrice: z.string().default(""),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: result.error.issues[0].message });

    const userId = (req as any).userId;
    const service = await storage.createExpertService({
      userId,
      ...result.data,
      status: "active",
      views: 0,
    });
    return res.status(201).json(service);
  });

  // DELETE /api/expert/services/:id
  app.delete("/api/expert/services/:id", requireAuth, async (req, res) => {
    const userId = (req as any).userId;
    const deleted = await storage.deleteExpertService(req.params.id, userId);
    if (!deleted) return res.status(404).json({ message: "Service not found" });
    return res.json({ message: "Service deleted" });
  });

  // ── Call Bookings ──────────────────────────────────────────────────────────

  // POST /api/call-bookings — user books a call (deducts 30 coins)
  app.post("/api/call-bookings", requireAuth, async (req, res) => {
    const schema = z.object({
      reason: z.string().min(20, "Please provide a more detailed reason"),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: result.error.issues[0].message });

    const userId = (req as any).userId;
    const user = (req as any).user;
    const CALL_COST = 30;

    if (!user.unlimitedCoins && user.coins < CALL_COST) {
      return res.status(402).json({ message: "Insufficient coins. You need at least 30 coins to book a call." });
    }

    const booking = await storage.createCallBooking({
      userId,
      reason: result.data.reason,
      coinsUsed: CALL_COST,
      status: "booked",
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
    });

    if (!user.unlimitedCoins) {
      await storage.updateUserCoins(userId, -CALL_COST);
    }

    return res.status(201).json(booking);
  });

  // GET /api/expert/call-schedule — expert views all booked calls
  app.get("/api/expert/call-schedule", requireAuth, async (req, res) => {
    const user = (req as any).user;
    if (user.role !== "expert") {
      return res.status(403).json({ message: "Expert access required" });
    }
    const bookings = await storage.getAllCallBookings();
    return res.json(bookings);
  });

  // POST /api/expert/promote — deduct coins for promotion
  app.post("/api/expert/promote", requireAuth, async (req, res) => {
    const schema = z.object({ coins: z.number().int().positive() });
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: result.error.issues[0].message });

    const userId = (req as any).userId;
    const user = (req as any).user;
    if (user.coins < result.data.coins) {
      return res.status(402).json({ message: "Insufficient coins" });
    }
    const updated = await storage.updateUserCoins(userId, -result.data.coins);
    return res.json({ coins: updated?.coins });
  });

  // ── SumUp reconciliation job ────────────────────────────────────────────────
  // Credits coins for any checkout that reached PAID status even if the customer's
  // browser never redirected back from SumUp's hosted checkout page. This makes
  // coin crediting fully independent of the client-side redirect/verify flow.
  async function reconcilePendingCoinPurchases() {
    if (!process.env.SUMUP_API_KEY) return;
    try {
      const pending = await storage.getPendingCoinPurchases();
      if (pending.length === 0) return;
      const { getCheckoutStatus } = await import("./sumup.js");

      for (const purchase of pending) {
        if (!purchase.checkoutId) continue;
        // Give the checkout at least 20s before polling, avoids racing the live verify-payment call
        const ageMs = Date.now() - new Date(purchase.createdAt).getTime();
        if (ageMs < 20_000) continue;

        try {
          const checkout = await getCheckoutStatus(purchase.checkoutId);
          if (checkout.status === "PAID") {
            const recheck = await storage.getPurchaseBySumupRef(purchase.sumupRef ?? "");
            if (recheck?.status === "completed") continue; // already credited by verify-payment
            await storage.markCoinPurchaseStatus(purchase.id, "completed");
            const updatedUser = await storage.updateUserCoins(purchase.userId, purchase.coinsAmount);
            console.log(`[SUMUP][reconcile] credited ${purchase.coinsAmount} coins to user ${purchase.userId} (ref=${purchase.sumupRef})`);

            const buyer = await storage.getUser(purchase.userId);
            if (buyer?.email) {
              const amountFormatted = `£${checkout.amount.toFixed(2)}`;
              sendCoinPurchaseEmail(buyer.email, buyer.firstName, purchase.coinsAmount, updatedUser?.coins ?? 0, amountFormatted)
                .catch((err) => console.error("[EMAIL] Failed to send reconciled coin purchase receipt:", err.message));
            }
          } else if (checkout.status === "FAILED" || checkout.status === "CANCELLED") {
            await storage.markCoinPurchaseStatus(purchase.id, "failed");
          } else if (ageMs > 60 * 60 * 1000) {
            // Give up after 1 hour of remaining PENDING — avoid polling forever
            await storage.markCoinPurchaseStatus(purchase.id, "failed");
          }
        } catch (err: any) {
          console.error(`[SUMUP][reconcile] error checking ${purchase.checkoutId}:`, err.message);
        }
      }
    } catch (err: any) {
      console.error("[SUMUP][reconcile] job error:", err.message);
    }
  }

  // Run every 30 seconds
  setInterval(() => { reconcilePendingCoinPurchases(); }, 30_000);
  // Also run shortly after startup to catch anything missed during a restart
  setTimeout(() => { reconcilePendingCoinPurchases(); }, 5_000);

  // ── Auto-apply queue processor (every 2 minutes) ──────────────────────────
  setInterval(() => { processQueuedApplications().catch(console.error); }, 2 * 60 * 1000);
  setTimeout(() => { processQueuedApplications().catch(console.error); }, 15_000);

  // ═══════════════════════════════════════════════════════════════════════════
  // ── DASHBOARD ROUTES ──────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  /** GET /api/dashboard/stats — aggregated stats for the overview page */
  app.get("/api/dashboard/stats", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const [user, profile, appStats] = await Promise.all([
        storage.getUser(userId),
        storage.getUserProfile(userId),
        storage.getUserApplicationStats(userId),
      ]);

      const matchedJobIds: string[] = profile?.matchedJobIds ?? [];
      const matchedEventIds: string[] = profile?.matchedEventIds ?? [];

      const [recentJobs, recentEvents] = await Promise.all([
        matchedJobIds.length > 0 ? storage.getJobsByIds(matchedJobIds.slice(0, 3)) : Promise.resolve([]),
        matchedEventIds.length > 0 ? storage.getEventsByIds(matchedEventIds.slice(0, 3)) : Promise.resolve([]),
      ]);

      res.json({
        coins: user?.coins ?? 0,
        profileComplete: !!profile && !!profile.industry && !!profile.jobTitle,
        totalApplications: appStats.total,
        pendingApplications: appStats.pending,
        matchedJobs: matchedJobIds.length,
        matchedEvents: matchedEventIds.length,
        recentJobs,
        recentEvents,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /** GET /api/dashboard/profile — fetch user career profile */
  app.get("/api/dashboard/profile", requireAuth, async (req: AuthRequest, res) => {
    try {
      const profile = await storage.getUserProfile(req.userId!);
      res.json(profile ?? {});
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /** POST /api/dashboard/profile — create/update user career profile */
  app.post("/api/dashboard/profile", requireAuth, async (req: AuthRequest, res) => {
    try {
      const allowed = [
        "industry", "jobTitle", "targetRoles", "skills",
        "locationCity", "locationPostcode", "salaryMin", "salaryMax",
        "workTypes", "linkedinUrl", "cvText", "yearsExperience",
      ];
      const data: Record<string, any> = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) data[key] = req.body[key];
      }
      const profile = await storage.upsertUserProfile({ userId: req.userId!, ...data });
      res.json(profile);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /** POST /api/dashboard/profile/cv — upload + parse CV file */
  app.post("/api/dashboard/profile/cv", requireAuth, upload.single("cv"), async (req: AuthRequest, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded." });

      let text = "";
      const mime = req.file.mimetype;

      if (mime === "application/pdf" || req.file.originalname.endsWith(".pdf")) {
        // Dynamically require pdf-parse to avoid startup issues with the module
        const pdfModule = await import("pdf-parse");
        const pdfParse: (buf: Buffer) => Promise<{ text: string }> = (pdfModule as any).default ?? pdfModule;
        const result = await pdfParse(req.file.buffer);
        text = result.text;
      } else if (
        mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        req.file.originalname.endsWith(".docx")
      ) {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        text = result.value;
      } else if (mime === "text/plain" || req.file.originalname.endsWith(".txt")) {
        text = req.file.buffer.toString("utf-8");
      } else {
        return res.status(400).json({ error: "Unsupported file type. Please upload PDF, DOCX, or TXT." });
      }

      text = text.slice(0, 20_000); // cap at 20k chars

      // Try AI parse for structured skills/title extraction
      let parsedSkills: string[] = [];
      let parsedTitle = "";
      try {
        const parsed = await parseCvWithAI(text);
        parsedSkills = parsed.skills ?? [];
        parsedTitle = (parsed as any).jobTitle ?? "";
      } catch (_) { /* non-fatal */ }

      // Save cvText (and any extracted fields) to the profile
      const updateData: Record<string, any> = { userId: req.userId!, cvText: text };
      if (parsedTitle) updateData.jobTitle = parsedTitle;
      if (parsedSkills.length > 0) updateData.skills = parsedSkills;
      await storage.upsertUserProfile(updateData as Parameters<typeof storage.upsertUserProfile>[0]);

      res.json({ ok: true, charCount: text.length, parsedSkills, parsedTitle });
    } catch (err: any) {
      console.error("[CV upload]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  /** GET /api/dashboard/events — paginated events with optional filters */
  app.get("/api/dashboard/events", requireAuth, async (req: AuthRequest, res) => {
    try {
      const q = typeof req.query.q === "string" ? req.query.q : undefined;
      const category = typeof req.query.category === "string" ? req.query.category : undefined;
      const city = typeof req.query.city === "string" ? req.query.city : undefined;
      const online = req.query.online === "true";
      const free = req.query.free === "true";
      const page = parseInt(String(req.query.page ?? "1"), 10);
      const limit = Math.min(parseInt(String(req.query.limit ?? "12"), 10), 50);

      // When matched=true, load the user's saved matched event IDs
      let matchedIds: string[] | undefined;
      if (req.query.matched === "true") {
        const profile = await storage.getUserProfile(req.userId!);
        matchedIds = profile?.matchedEventIds ?? [];
        if (matchedIds.length === 0) return res.json({ events: [], total: 0 });
      }

      const result = await storage.getEvents({ q, category, city, online, free, page, limit, matchedIds });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /** POST /api/dashboard/events/match — AI-rank events by user profile (2 coins) */
  app.post("/api/dashboard/events/match", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const COST = 2;

      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ error: "User not found." });
      if (!user.unlimitedCoins && (user.coins ?? 0) < COST) {
        return res.status(402).json({ error: `Not enough coins. This action costs ${COST} coins.` });
      }

      const profile = await storage.getUserProfile(userId);
      if (!profile || (!profile.industry && !profile.skills?.length)) {
        return res.status(400).json({ error: "Please complete your profile first so we can match events to you." });
      }

      // Step 1: keyword pre-screen → top 80 candidates
      const profileText = buildProfileText(profile);
      const allEvents = await storage.getEventsForMatching(5000);
      const top80 = allEvents
        .map((ev) => {
          const evText = [ev.title, ev.description ?? "", ev.category ?? "", (ev.tags ?? []).join(" ")].join(" ");
          return { ev, kwScore: keywordScore(profileText, evText) };
        })
        .filter((x) => x.kwScore > 0)
        .sort((a, b) => b.kwScore - a.kwScore)
        .slice(0, 80)
        .map((x) => x.ev);

      // Step 2: AI re-rank with GPT-4o-mini
      const profileSummary = buildProfileSummary(profile);
      const candidates = top80.map((ev) => ({
        id: ev.id,
        text: [
          ev.title,
          ev.category ?? "",
          (ev.tags ?? []).join(", "),
          ev.isOnline ? "Online" : (ev.locationCity ?? ""),
          ev.isFree ? "Free" : "Paid",
          (ev.description ?? "").slice(0, 150),
        ].filter(Boolean).join(" | "),
      }));

      const scored = await rankCandidatesWithAI(profileSummary, candidates, "event");
      const topIds = scored.slice(0, 25).map((s) => s.id);

      // Step 3: save matched IDs to profile + deduct coins
      await storage.saveMatchedEventIds(userId, topIds);
      if (!user.unlimitedCoins) await storage.updateUserCoins(userId, -COST);

      res.json({ ok: true, matched: topIds.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /** GET /api/dashboard/jobs — paginated jobs with optional filters */
  app.get("/api/dashboard/jobs", requireAuth, async (req: AuthRequest, res) => {
    try {
      const q = typeof req.query.q === "string" ? req.query.q : undefined;
      const source = typeof req.query.source === "string" ? req.query.source : undefined;
      const workType = typeof req.query.workType === "string" ? req.query.workType : undefined;
      const remote = req.query.remote === "true";
      const page = parseInt(String(req.query.page ?? "1"), 10);
      const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10), 50);

      // When matched=true, load the user's saved matched job IDs
      let matchedIds: string[] | undefined;
      if (req.query.matched === "true") {
        const profile = await storage.getUserProfile(req.userId!);
        matchedIds = profile?.matchedJobIds ?? [];
        if (matchedIds.length === 0) return res.json({ jobs: [], total: 0 });
      } else {
        matchedIds = req.query.ids ? String(req.query.ids).split(",").filter(Boolean) : undefined;
      }

      const result = await storage.getJobs({ q, source, workType, remote, page, limit, matchedIds });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /** POST /api/dashboard/jobs/match — AI-rank jobs by user profile (1 coin) */
  app.post("/api/dashboard/jobs/match", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const COST = 1;

      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ error: "User not found." });
      if (!user.unlimitedCoins && (user.coins ?? 0) < COST) {
        return res.status(402).json({ error: `Not enough coins. This action costs ${COST} coins.` });
      }

      const profile = await storage.getUserProfile(userId);
      if (!profile || (!profile.industry && !profile.skills?.length)) {
        return res.status(400).json({ error: "Please complete your profile first." });
      }

      // Step 1: keyword pre-screen → top 80 candidates
      const profileText = buildProfileText(profile);
      const allJobs = await storage.getJobsForMatching(5000);
      const top80 = allJobs
        .map((j) => {
          const jText = [j.title, j.company, j.description ?? ""].join(" ");
          return { j, kwScore: keywordScore(profileText, jText) };
        })
        .filter((x) => x.kwScore > 0)
        .sort((a, b) => b.kwScore - a.kwScore)
        .slice(0, 80)
        .map((x) => x.j);

      // Step 2: AI re-rank with GPT-4o-mini
      const profileSummary = buildProfileSummary(profile);
      const candidates = top80.map((j) => ({
        id: j.id,
        text: [
          j.title,
          `at ${j.company}`,
          j.location ?? "",
          j.isRemote ? "Remote" : "",
          j.workType ?? "",
          j.salaryMin ? `£${Math.round(j.salaryMin / 1000)}k` : "",
          (j.description ?? "").slice(0, 200),
        ].filter(Boolean).join(" | "),
      }));

      const scored = await rankCandidatesWithAI(profileSummary, candidates, "job");
      const topIds = scored.slice(0, 30).map((s) => s.id);

      // Step 3: save matched IDs to profile + deduct coins
      await storage.saveMatchedJobIds(userId, topIds);
      if (!user.unlimitedCoins) await storage.updateUserCoins(userId, -COST);

      res.json({ ok: true, matched: topIds.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /** POST /api/dashboard/jobs/apply — queue auto-apply for one or more jobs (5 coins each) */
  app.post("/api/dashboard/jobs/apply", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { jobIds } = req.body as { jobIds: string[] };
      if (!Array.isArray(jobIds) || jobIds.length === 0) {
        return res.status(400).json({ error: "Provide at least one jobId." });
      }
      if (jobIds.length > 20) return res.status(400).json({ error: "Max 20 jobs per batch." });

      const COST_PER_JOB = 5;
      const totalCost = COST_PER_JOB * jobIds.length;

      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ error: "User not found." });
      if (!user.unlimitedCoins && (user.coins ?? 0) < totalCost) {
        return res.status(402).json({
          error: `Not enough coins. ${jobIds.length} application(s) cost ${totalCost} coins; you have ${user.coins ?? 0}.`,
        });
      }

      const profile = await storage.getUserProfile(userId);
      if (!profile?.cvText) {
        return res.status(400).json({ error: "Please upload your CV first so we can tailor your applications." });
      }

      // Deduplicate — skip jobs already applied to
      const queued: string[] = [];
      for (const jobId of jobIds) {
        const existing = await storage.getApplicationByUserAndJob(userId, jobId);
        if (!existing) {
          await storage.createJobApplication({ userId, jobId, coinsSpent: COST_PER_JOB });
          queued.push(jobId);
        }
      }

      if (!user.unlimitedCoins && queued.length > 0) {
        await storage.updateUserCoins(userId, -(COST_PER_JOB * queued.length));
      }

      // Fire the queue processor async (non-blocking)
      processQueuedApplications().catch(console.error);

      res.json({ ok: true, queued: queued.length, skippedDuplicates: jobIds.length - queued.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /** GET /api/dashboard/applications — user's job applications */
  app.get("/api/dashboard/applications", requireAuth, async (req: AuthRequest, res) => {
    try {
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const apps = await storage.getUserApplications(req.userId!, status);
      res.json(apps);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /** PATCH /api/dashboard/applications/:id/status — manually update application status */
  app.patch("/api/dashboard/applications/:id/status", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body as { status: string };
      const validStatuses = ["queued", "generating_docs", "submitted", "interviewing", "rejected", "offer"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
      }
      const updated = await storage.updateApplicationStatus(id, req.userId!, status);
      if (!updated) return res.status(404).json({ error: "Application not found." });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return httpServer;
}
