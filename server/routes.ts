import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import {
  storage,
  hashPassword,
  verifyPassword,
  createAuthToken,
  getUserIdFromToken,
  deleteAuthToken,
} from "./storage";
import { randomInt } from "crypto";
import { generateAIResponse } from "./ai";
import { sendOTPEmail, sendWelcomeEmail, sendExpertWelcomeEmail, sendExpertReplyEmail } from "./email";

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

  // POST /api/enquiries
  app.post("/api/enquiries", requireAuth, async (req, res) => {
    const schema = z.object({
      question: z.string().min(10, "Question must be at least 10 characters"),
      expertType: z.enum(["immigration", "travel", "tour"]).default("immigration"),
      country: z.string().default("United Kingdom"),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: result.error.issues[0].message });

    const userId = (req as any).userId;
    const user = (req as any).user;
    const coinsNeeded = 3;

    if (user.coins < coinsNeeded) {
      return res.status(402).json({ message: "Insufficient coins. Please purchase more coins." });
    }

    // Create enquiry first
    const enquiry = await storage.createEnquiry({
      userId,
      expertType: result.data.expertType,
      question: result.data.question,
      country: result.data.country,
      coinsUsed: coinsNeeded,
    });

    await storage.updateUserCoins(userId, -coinsNeeded);

    // Generate AI response asynchronously (don't block the HTTP response)
    generateAIResponse(result.data.question, result.data.expertType, result.data.country)
      .then(async (aiAnswer) => {
        const updated = await storage.updateEnquiryAnswer(enquiry.id, aiAnswer, "AI + Expert Review", "ai_answered");
        // Send notification email to user
        if (updated) {
          sendExpertReplyEmail(user.email, user.firstName, result.data.question, enquiry.id).catch(
            (err) => console.error("[EMAIL] Failed to send expert reply email:", err.message)
          );
        }
      })
      .catch((err) => {
        console.error("[AI] Failed to generate AI response:", err.message);
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

  // ── Expert Questions Feed ──────────────────────────────────────────────────

  // GET /api/expert/questions — all pending enquiries for the live feed
  app.get("/api/expert/questions", requireAuth, async (req, res) => {
    const user = (req as any).user;
    if (user.role !== "expert") return res.status(403).json({ message: "Experts only" });
    const all = await storage.getAllPendingEnquiries();
    return res.json(all);
  });

  // PATCH /api/expert/questions/:id/answer — expert submits an answer
  app.patch("/api/expert/questions/:id/answer", requireAuth, async (req, res) => {
    const user = (req as any).user;
    if (user.role !== "expert") return res.status(403).json({ message: "Experts only" });
    const schema = z.object({ answer: z.string().min(10, "Answer too short") });
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: result.error.issues[0].message });

    const enquiry = await storage.getEnquiry(req.params.id);
    if (!enquiry) return res.status(404).json({ message: "Not found" });
    if (enquiry.status === "answered") return res.status(400).json({ message: "Already answered" });

    const answeredBy = `${user.firstName} ${user.lastName}`;
    const updated = await storage.updateEnquiryAnswer(req.params.id, result.data.answer, answeredBy);

    const enquiryUser = await storage.getUser(enquiry.userId);
    if (enquiryUser) {
      sendExpertReplyEmail(enquiryUser.email, enquiryUser.firstName, enquiry.question, enquiry.id).catch(() => {});
    }
    return res.json(updated);
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

  // POST /api/coins/purchase
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

  return httpServer;
}
