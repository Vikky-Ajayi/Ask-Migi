import {
  type User, type InsertUser,
  type Enquiry, type InsertEnquiry,
  type Expert, type InsertExpert,
  type CoinPurchase, type InsertCoinPurchase,
  type CallBooking, type InsertCallBooking,
  type PasswordReset,
  type UserProfile, type InsertUserProfile,
  type Event, type Job, type JobApplication, type InsertJobApplication,
  users, enquiries, experts, coinPurchases, passwordResets,
  expertVerifications, expertServices, callBookings,
  userProfiles, events, jobs, jobApplications,
} from "@shared/schema";
import { randomUUID, pbkdf2Sync, randomBytes, createHmac } from "crypto";
import { eq, and, desc, sql, inArray, ilike, or, lt, gte } from "drizzle-orm";
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
  updateUserRole(userId: string, role: string): Promise<void>;
  updateUserProfilePic(userId: string, profilePic: string): Promise<User | undefined>;
  setUserUnlimitedCoins(userId: string, unlimited: boolean): Promise<User | undefined>;
  setUserCoinsByEmail(email: string, coins: number): Promise<User | undefined>;

  // Matched IDs persistence
  saveMatchedJobIds(userId: string, ids: string[]): Promise<void>;
  saveMatchedEventIds(userId: string, ids: string[]): Promise<void>;

  // Enquiries
  getEnquiries(userId: string): Promise<Enquiry[]>;
  getAllPendingEnquiries(): Promise<Enquiry[]>;
  getAllAnsweredEnquiries(): Promise<Enquiry[]>;
  getEnquiry(id: string): Promise<Enquiry | undefined>;
  createEnquiry(enquiry: InsertEnquiry): Promise<Enquiry>;
  updateEnquiryAnswer(id: string, answer: string, answeredBy: string, status?: string, answeredByPic?: string | null): Promise<Enquiry | undefined>;

  // Experts (directory)
  getExperts(type?: string): Promise<Expert[]>;
  getExpert(id: string): Promise<Expert | undefined>;

  // Coin Purchases
  createCoinPurchase(purchase: InsertCoinPurchase): Promise<CoinPurchase>;
  createPendingCoinPurchase(purchase: InsertCoinPurchase): Promise<CoinPurchase>;
  getCoinPurchases(userId: string): Promise<CoinPurchase[]>;
  getPurchaseBySumupRef(sumupRef: string): Promise<CoinPurchase | undefined>;
  getPendingCoinPurchases(): Promise<CoinPurchase[]>;
  markCoinPurchaseStatus(id: string, status: "completed" | "failed"): Promise<CoinPurchase | undefined>;

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

  // Call Bookings
  createCallBooking(data: InsertCallBooking): Promise<CallBooking>;
  getAllCallBookings(): Promise<CallBooking[]>;
  getUserCallBookings(userId: string): Promise<CallBooking[]>;
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

  async updateUserRole(userId: string, role: string): Promise<void> {
    await db.update(users).set({ role }).where(eq(users.id, userId));
  }

  async updateUserProfilePic(userId: string, profilePic: string): Promise<User | undefined> {
    const [user] = await db.update(users).set({ profilePic }).where(eq(users.id, userId)).returning();
    return user;
  }

  async setUserUnlimitedCoins(userId: string, unlimited: boolean): Promise<User | undefined> {
    const [user] = await db.update(users).set({ unlimitedCoins: unlimited }).where(eq(users.id, userId)).returning();
    return user;
  }

  async setUserCoinsByEmail(email: string, coins: number): Promise<User | undefined> {
    const [user] = await db.update(users).set({ coins }).where(eq(users.email, email.toLowerCase())).returning();
    return user;
  }

  // ── Enquiries ──────────────────────────────────────────────────────────────

  async getEnquiries(userId: string): Promise<Enquiry[]> {
    return db.select().from(enquiries)
      .where(eq(enquiries.userId, userId))
      .orderBy(desc(enquiries.createdAt));
  }

  async getAllPendingEnquiries(): Promise<Enquiry[]> {
    return db.select().from(enquiries)
      .where(inArray(enquiries.status, ["pending", "ai_draft"]))
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
      analysis: data.analysis ?? null,
    }).returning();
    return enquiry;
  }

  async updateEnquiryAnswer(id: string, answer: string, answeredBy: string, status: string = "answered", answeredByPic?: string | null): Promise<Enquiry | undefined> {
    const [enquiry] = await db.update(enquiries)
      .set({ answer, answeredBy, status, ...(answeredByPic !== undefined ? { answeredByPic } : {}), answerEditedAt: new Date() })
      .where(eq(enquiries.id, id))
      .returning();
    return enquiry;
  }

  async getAllAnsweredEnquiries(): Promise<Enquiry[]> {
    return db.select().from(enquiries)
      .where(eq(enquiries.status, "answered"))
      .orderBy(desc(enquiries.createdAt));
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
      checkoutId: data.checkoutId ?? null,
    }).returning();
    return purchase;
  }

  async createPendingCoinPurchase(data: InsertCoinPurchase): Promise<CoinPurchase> {
    const [purchase] = await db.insert(coinPurchases).values({
      userId: data.userId,
      coinsAmount: data.coinsAmount,
      price: data.price,
      sumupRef: data.sumupRef ?? null,
      checkoutId: data.checkoutId ?? null,
      status: "pending",
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

  async getPendingCoinPurchases(): Promise<CoinPurchase[]> {
    return db.select().from(coinPurchases)
      .where(eq(coinPurchases.status, "pending"));
  }

  async markCoinPurchaseStatus(id: string, status: "completed" | "failed"): Promise<CoinPurchase | undefined> {
    const [row] = await db.update(coinPurchases)
      .set({ status })
      .where(eq(coinPurchases.id, id))
      .returning();
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

  // ── Call Bookings ──────────────────────────────────────────────────────────

  async createCallBooking(data: InsertCallBooking): Promise<CallBooking> {
    const [booking] = await db.insert(callBookings).values({
      userId: data.userId,
      reason: data.reason,
      coinsUsed: data.coinsUsed ?? 30,
      status: data.status ?? "booked",
      userName: data.userName ?? "",
      userEmail: data.userEmail ?? "",
    }).returning();
    return booking;
  }

  async getAllCallBookings(): Promise<CallBooking[]> {
    return db.select().from(callBookings).orderBy(desc(callBookings.createdAt));
  }

  async getUserCallBookings(userId: string): Promise<CallBooking[]> {
    return db.select().from(callBookings)
      .where(eq(callBookings.userId, userId))
      .orderBy(desc(callBookings.createdAt));
  }

  // ── User Profiles ──────────────────────────────────────────────────────────

  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [row] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return row;
  }

  async saveMatchedJobIds(userId: string, ids: string[]): Promise<void> {
    await db.insert(userProfiles)
      .values({ userId, matchedJobIds: ids, updatedAt: new Date() } as any)
      .onConflictDoUpdate({ target: userProfiles.userId, set: { matchedJobIds: ids, updatedAt: new Date() } });
  }

  async saveMatchedEventIds(userId: string, ids: string[]): Promise<void> {
    await db.insert(userProfiles)
      .values({ userId, matchedEventIds: ids, updatedAt: new Date() } as any)
      .onConflictDoUpdate({ target: userProfiles.userId, set: { matchedEventIds: ids, updatedAt: new Date() } });
  }

  async upsertUserProfile(data: Partial<UserProfile> & { userId: string }): Promise<UserProfile> {
    const [row] = await db
      .insert(userProfiles)
      .values({ ...data, updatedAt: new Date() } as any)
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: { ...data, updatedAt: new Date() },
      })
      .returning();
    return row;
  }

  // ── Events ─────────────────────────────────────────────────────────────────

  async getEvents(opts: {
    q?: string; category?: string; online?: boolean; free?: boolean;
    city?: string; page?: number; limit?: number; matchedIds?: string[];
    lat?: number; lng?: number; radiusMiles?: number;
  }): Promise<{ events: Event[]; total: number }> {
    const { q, category, online, free, city, page = 1, limit = 24, matchedIds, lat, lng, radiusMiles } = opts;
    const offset = (page - 1) * limit;

    let query = db.select().from(events).$dynamic();
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(events).$dynamic();

    const conditions: any[] = [sql`status = 'active'`, sql`start_date > NOW()`];

    if (q) {
      conditions.push(sql`(title ILIKE ${'%' + q + '%'} OR description ILIKE ${'%' + q + '%'})`);
    }
    if (category && category !== "All") conditions.push(eq(events.category, category));
    if (online) conditions.push(eq(events.isOnline, true));
    if (free) conditions.push(eq(events.isFree, true));
    if (city) conditions.push(eq(events.locationCity, city));
    if (matchedIds && matchedIds.length > 0) conditions.push(inArray(events.id, matchedIds));

    // Radius filter using Haversine formula (events with lat/lng)
    if (lat != null && lng != null && radiusMiles != null) {
      conditions.push(sql`(
        lat IS NULL OR lng IS NULL OR
        (3959 * acos(LEAST(1.0,
          cos(radians(${lat})) * cos(radians(lat::float)) *
          cos(radians(lng::float) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(lat::float))
        ))) <= ${radiusMiles}
      )`);
    }

    const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);

    const [{ count }] = await countQuery.where(whereClause);
    const rows = await query
      .where(whereClause)
      .orderBy(events.startDate)
      .limit(limit)
      .offset(offset);

    return { events: rows, total: Number(count) };
  }

  async getEventsByIds(ids: string[]): Promise<Event[]> {
    if (ids.length === 0) return [];
    return db.select().from(events).where(inArray(events.id, ids));
  }

  async getEventsForMatching(limit = 5000): Promise<Event[]> {
    return db.select().from(events)
      .where(and(sql`status = 'active'`, sql`start_date > NOW()`))
      .orderBy(events.startDate)
      .limit(limit);
  }

  async getTotalEvents(): Promise<number> {
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(events);
    return Number(count);
  }

  // ── Jobs ───────────────────────────────────────────────────────────────────

  async getJobs(opts: {
    q?: string; source?: string; workType?: string; remote?: boolean;
    page?: number; limit?: number; matchedIds?: string[];
  }): Promise<{ jobs: Job[]; total: number }> {
    const { q, source, workType, remote, page = 1, limit = 20, matchedIds } = opts;
    const offset = (page - 1) * limit;

    const conditions: any[] = [eq(jobs.status, "active")];

    if (q) {
      conditions.push(sql`(title ILIKE ${'%' + q + '%'} OR company ILIKE ${'%' + q + '%'} OR description ILIKE ${'%' + q + '%'})`);
    }
    if (source && source !== "All") conditions.push(eq(jobs.source, source));
    if (workType && workType !== "All") conditions.push(eq(jobs.workType, workType));
    if (remote) conditions.push(eq(jobs.isRemote, true));
    if (matchedIds && matchedIds.length > 0) conditions.push(inArray(jobs.id, matchedIds));

    const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);

    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(jobs).where(whereClause);
    const rows = await db.select().from(jobs)
      .where(whereClause)
      .orderBy(desc(jobs.postedAt))
      .limit(limit)
      .offset(offset);

    return { jobs: rows, total: Number(count) };
  }

  async getJobById(id: string): Promise<Job | undefined> {
    const [row] = await db.select().from(jobs).where(eq(jobs.id, id));
    return row;
  }

  async getJobsByIds(ids: string[]): Promise<Job[]> {
    if (ids.length === 0) return [];
    return db.select().from(jobs).where(inArray(jobs.id, ids));
  }

  async getJobsForMatching(limit = 10000): Promise<Job[]> {
    return db.select().from(jobs)
      .where(eq(jobs.status, "active"))
      .orderBy(desc(jobs.postedAt))
      .limit(limit);
  }

  async getTotalJobs(): Promise<number> {
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(jobs);
    return Number(count);
  }

  // ── Job Applications ───────────────────────────────────────────────────────

  async createJobApplication(data: {
    userId: string; jobId: string; coinsSpent?: number;
  }): Promise<JobApplication> {
    const [row] = await db.insert(jobApplications)
      .values({ ...data, status: "queued", coinsSpent: data.coinsSpent ?? 5 })
      .returning();
    return row;
  }

  async getUserApplications(userId: string, statusFilter?: string): Promise<(JobApplication & { job?: Job })[]> {
    const conditions: any[] = [eq(jobApplications.userId, userId)];
    if (statusFilter && statusFilter !== "all") {
      if (statusFilter === "active") {
        conditions.push(inArray(jobApplications.status, ["queued", "generating_docs", "applying", "submitted"]));
      } else {
        conditions.push(eq(jobApplications.status, statusFilter));
      }
    }

    const apps = await db.select().from(jobApplications)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(jobApplications.createdAt));

    // Enrich with job data
    const jobIds = Array.from(new Set(apps.map((a) => a.jobId)));
    const jobRows = await this.getJobsByIds(jobIds);
    const jobMap = new Map(jobRows.map((j) => [j.id, j]));

    return apps.map((a) => ({ ...a, job: jobMap.get(a.jobId) }));
  }

  async updateApplicationStatus(
    id: string,
    userId: string,
    status: string
  ): Promise<JobApplication | undefined> {
    const [row] = await db.update(jobApplications)
      .set({ status, statusUpdatedAt: new Date(), ...(status === "submitted" ? { appliedAt: new Date() } : {}) })
      .where(and(eq(jobApplications.id, id), eq(jobApplications.userId, userId)))
      .returning();
    return row;
  }

  async getApplicationByUserAndJob(userId: string, jobId: string): Promise<JobApplication | undefined> {
    const [row] = await db.select().from(jobApplications)
      .where(and(eq(jobApplications.userId, userId), eq(jobApplications.jobId, jobId)));
    return row;
  }

  async getUserApplicationStats(userId: string): Promise<{
    total: number; pending: number;
  }> {
    const apps = await db.select({ status: jobApplications.status })
      .from(jobApplications)
      .where(eq(jobApplications.userId, userId));
    const pending = apps.filter((a) => ["queued", "generating_docs", "applying"].includes(a.status)).length;
    return { total: apps.length, pending };
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
