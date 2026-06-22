import {
  type User, type InsertUser,
  type Enquiry, type InsertEnquiry,
  type Expert, type InsertExpert,
  type CoinPurchase, type InsertCoinPurchase,
  type PasswordReset,
  users, enquiries, experts, coinPurchases, passwordResets,
  expertVerifications, expertServices,
} from "@shared/schema";
import { randomUUID, pbkdf2Sync, randomBytes, createHmac } from "crypto";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { db } from "./db";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const newHash = pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return hash === newHash;
}

// ─── Expert Service (matches DB schema) ───────────────────────────────────────
export interface ExpertService {
  id: string;
  userId: string;
  businessName: string;
  serviceTypes: string[];
  countries: string[];
  visaServices: string[];
  currency: string;
  averagePrice: string;
  status: "active" | "inactive";
  views: number;
  createdAt: Date;
}

// ─── Expert Verification ──────────────────────────────────────────────────────
export interface ExpertVerificationData {
  userId: string;
  status: "unverified" | "pending" | "verified";
  personalInfo?: Record<string, string>;
  businessInfo?: Record<string, string>;
  submittedAt?: Date;
}

// ─── Storage interface ────────────────────────────────────────────────────────
export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<InsertUser, "password"> & { password: string; role?: string }): Promise<User>;
  updateUserCoins(userId: string, delta: number): Promise<User | undefined>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<boolean>;

  // Enquiries
  getEnquiries(userId: string): Promise<Enquiry[]>;
  getAllPendingEnquiries(): Promise<Enquiry[]>;
  getEnquiry(id: string): Promise<Enquiry | undefined>;
  createEnquiry(enquiry: InsertEnquiry): Promise<Enquiry>;
  updateEnquiryAnswer(id: string, answer: string, answeredBy: string, status?: string): Promise<Enquiry | undefined>;

  // Experts (directory)
  getExperts(type?: string): Promise<Expert[]>;
  getExpert(id: string): Promise<Expert | undefined>;

  // Coin Purchases
  createCoinPurchase(purchase: InsertCoinPurchase): Promise<CoinPurchase>;
  getCoinPurchases(userId: string): Promise<CoinPurchase[]>;
  getPurchaseBySumupRef(sumupRef: string): Promise<CoinPurchase | undefined>;

  // Password Resets
  createPasswordReset(email: string, otp: string): Promise<PasswordReset>;
  getPasswordReset(email: string, otp: string): Promise<PasswordReset | undefined>;
  markPasswordResetUsed(id: string): Promise<void>;

  // Expert Verification
  getExpertVerification(userId: string): Promise<ExpertVerificationData>;
  updateExpertVerification(userId: string, data: Partial<ExpertVerificationData>): Promise<ExpertVerificationData>;

  // Expert Services (owned by expert users)
  getExpertServices(userId: string): Promise<ExpertService[]>;
  createExpertService(data: Omit<ExpertService, "id" | "createdAt">): Promise<ExpertService>;
  deleteExpertService(id: string, userId: string): Promise<boolean>;
  updateExpertServiceViews(id: string, delta: number): Promise<void>;
}

// ─── Database storage ─────────────────────────────────────────────────────────
class DatabaseStorage implements IStorage {

  // ── Users ──────────────────────────────────────────────────────────────────

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async createUser(data: { email: string; firstName: string; lastName: string; password: string; coins?: number; role?: string }): Promise<User> {
    const [user] = await db.insert(users).values({
      email: data.email.toLowerCase(),
      firstName: data.firstName,
      lastName: data.lastName,
      password: data.password,
      coins: data.coins ?? 5,
      role: data.role ?? "user",
    }).returning();
    return user;
  }

  async updateUserCoins(userId: string, delta: number): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ coins: sql`GREATEST(0, ${users.coins} + ${delta})` })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<boolean> {
    const result = await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId))
      .returning();
    return result.length > 0;
  }

  // ── Enquiries ──────────────────────────────────────────────────────────────

  async getEnquiries(userId: string): Promise<Enquiry[]> {
    return db.select().from(enquiries)
      .where(eq(enquiries.userId, userId))
      .orderBy(desc(enquiries.createdAt));
  }

  async getAllPendingEnquiries(): Promise<Enquiry[]> {
    return db.select().from(enquiries)
      .where(inArray(enquiries.status, ["pending", "ai_answered"]))
      .orderBy(desc(enquiries.createdAt));
  }

  async getEnquiry(id: string): Promise<Enquiry | undefined> {
    const [enquiry] = await db.select().from(enquiries).where(eq(enquiries.id, id));
    return enquiry;
  }

  async createEnquiry(data: InsertEnquiry): Promise<Enquiry> {
    const [enquiry] = await db.insert(enquiries).values({
      userId: data.userId,
      expertType: data.expertType ?? "immigration",
      question: data.question,
      country: data.country ?? "United Kingdom",
      coinsUsed: data.coinsUsed ?? 3,
    }).returning();
    return enquiry;
  }

  async updateEnquiryAnswer(id: string, answer: string, answeredBy: string, status: string = "answered"): Promise<Enquiry | undefined> {
    const [enquiry] = await db.update(enquiries)
      .set({ answer, answeredBy, status })
      .where(eq(enquiries.id, id))
      .returning();
    return enquiry;
  }

  // ── Experts (directory) ────────────────────────────────────────────────────

  async getExperts(type?: string): Promise<Expert[]> {
    if (!type || type === "all") {
      return db.select().from(experts);
    }
    return db.select().from(experts).where(eq(experts.expertType, type));
  }

  async getExpert(id: string): Promise<Expert | undefined> {
    const [expert] = await db.select().from(experts).where(eq(experts.id, id));
    return expert;
  }

  // ── Coin Purchases ─────────────────────────────────────────────────────────

  async createCoinPurchase(data: InsertCoinPurchase): Promise<CoinPurchase> {
    const [purchase] = await db.insert(coinPurchases).values({
      userId: data.userId,
      coinsAmount: data.coinsAmount,
      price: data.price,
      sumupRef: data.sumupRef ?? null,
    }).returning();
    return purchase;
  }

  async getCoinPurchases(userId: string): Promise<CoinPurchase[]> {
    return db.select().from(coinPurchases)
      .where(eq(coinPurchases.userId, userId))
      .orderBy(desc(coinPurchases.createdAt));
  }

  async getPurchaseBySumupRef(sumupRef: string): Promise<CoinPurchase | undefined> {
    const [row] = await db.select().from(coinPurchases)
      .where(eq(coinPurchases.sumupRef, sumupRef));
    return row;
  }

  // ── Password Resets ────────────────────────────────────────────────────────

  async createPasswordReset(email: string, otp: string): Promise<PasswordReset> {
    const [reset] = await db.insert(passwordResets).values({
      email,
      otp,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    }).returning();
    return reset;
  }

  async getPasswordReset(email: string, otp: string): Promise<PasswordReset | undefined> {
    const [reset] = await db.select().from(passwordResets)
      .where(and(
        eq(passwordResets.email, email),
        eq(passwordResets.otp, otp),
        eq(passwordResets.used, false),
      ));
    if (!reset || reset.expiresAt < new Date()) return undefined;
    return reset;
  }

  async markPasswordResetUsed(id: string): Promise<void> {
    await db.update(passwordResets).set({ used: true }).where(eq(passwordResets.id, id));
  }

  // ── Expert Verification ────────────────────────────────────────────────────

  async getExpertVerification(userId: string): Promise<ExpertVerificationData> {
    const [row] = await db.select().from(expertVerifications).where(eq(expertVerifications.userId, userId));
    if (!row) return { userId, status: "unverified" };
    return {
      userId: row.userId,
      status: row.status as ExpertVerificationData["status"],
      personalInfo: row.personalInfo ? JSON.parse(row.personalInfo) : undefined,
      businessInfo: row.businessInfo ? JSON.parse(row.businessInfo) : undefined,
      submittedAt: row.submittedAt ?? undefined,
    };
  }

  async updateExpertVerification(userId: string, data: Partial<ExpertVerificationData>): Promise<ExpertVerificationData> {
    const existing = await this.getExpertVerification(userId);
    const merged: ExpertVerificationData = { ...existing, ...data, userId };

    await db.insert(expertVerifications).values({
      userId,
      status: merged.status,
      personalInfo: merged.personalInfo ? JSON.stringify(merged.personalInfo) : null,
      businessInfo: merged.businessInfo ? JSON.stringify(merged.businessInfo) : null,
      submittedAt: merged.submittedAt ?? null,
    }).onConflictDoUpdate({
      target: expertVerifications.userId,
      set: {
        status: merged.status,
        personalInfo: merged.personalInfo ? JSON.stringify(merged.personalInfo) : null,
        businessInfo: merged.businessInfo ? JSON.stringify(merged.businessInfo) : null,
        submittedAt: merged.submittedAt ?? null,
      },
    });

    return merged;
  }

  // ── Expert Services ────────────────────────────────────────────────────────

  async getExpertServices(userId: string): Promise<ExpertService[]> {
    const rows = await db.select().from(expertServices)
      .where(eq(expertServices.userId, userId))
      .orderBy(desc(expertServices.createdAt));
    return rows.map((r) => ({ ...r, status: r.status as "active" | "inactive" }));
  }

  async createExpertService(data: Omit<ExpertService, "id" | "createdAt">): Promise<ExpertService> {
    const [row] = await db.insert(expertServices).values({
      userId: data.userId,
      businessName: data.businessName,
      serviceTypes: data.serviceTypes,
      countries: data.countries,
      visaServices: data.visaServices,
      currency: data.currency,
      averagePrice: data.averagePrice,
      status: data.status,
      views: data.views,
    }).returning();
    return { ...row, status: row.status as "active" | "inactive" };
  }

  async deleteExpertService(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(expertServices)
      .where(and(eq(expertServices.id, id), eq(expertServices.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async updateExpertServiceViews(id: string, delta: number): Promise<void> {
    await db.update(expertServices)
      .set({ views: sql`${expertServices.views} + ${delta}` })
      .where(eq(expertServices.id, id));
  }
}

export const storage = new DatabaseStorage();

// ── Auth token store (HMAC-signed, survives restarts) ─────────────────────────
const isProd = process.env.NODE_ENV === "production";
if (isProd && !process.env.TOKEN_SECRET) {
  throw new Error("TOKEN_SECRET environment variable must be set in production.");
}
const TOKEN_SECRET = process.env.TOKEN_SECRET || "askmigi-dev-secret-changeme";
const invalidatedTokens = new Set<string>();

export function createAuthToken(userId: string): string {
  const nonce = randomUUID();
  const payload = `${userId}.${nonce}`;
  const sig = createHmac("sha256", TOKEN_SECRET).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function getUserIdFromToken(token: string): string | undefined {
  if (invalidatedTokens.has(token)) return undefined;
  // Token format: "userId.nonce.sig" — UUIDs contain no dots, so lastDot is before sig
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return undefined;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expected = createHmac("sha256", TOKEN_SECRET).update(payload).digest("hex");
  if (sig !== expected) return undefined;
  // payload = "userId.nonce" — userId is before the first dot
  const firstDot = payload.indexOf(".");
  if (firstDot === -1) return undefined;
  return payload.slice(0, firstDot);
}

export function deleteAuthToken(token: string): void {
  invalidatedTokens.add(token);
}
