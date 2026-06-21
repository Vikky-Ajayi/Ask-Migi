import {
  type User, type InsertUser,
  type Enquiry, type InsertEnquiry,
  type Expert, type InsertExpert,
  type CoinPurchase, type InsertCoinPurchase,
  type PasswordReset,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { pbkdf2Sync, randomBytes } from "crypto";

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

// ─── Expert Service ───────────────────────────────────────────────────────────
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
  getEnquiry(id: string): Promise<Enquiry | undefined>;
  createEnquiry(enquiry: InsertEnquiry): Promise<Enquiry>;
  updateEnquiryAnswer(id: string, answer: string, answeredBy: string): Promise<Enquiry | undefined>;

  // Experts (directory)
  getExperts(type?: string): Promise<Expert[]>;
  getExpert(id: string): Promise<Expert | undefined>;

  // Coin Purchases
  createCoinPurchase(purchase: InsertCoinPurchase): Promise<CoinPurchase>;
  getCoinPurchases(userId: string): Promise<CoinPurchase[]>;

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

// ─── In-memory storage ────────────────────────────────────────────────────────
export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private enquiries = new Map<string, Enquiry>();
  private experts = new Map<string, Expert>();
  private coinPurchases = new Map<string, CoinPurchase>();
  private passwordResets = new Map<string, PasswordReset>();
  private expertVerifications = new Map<string, ExpertVerificationData>();
  private expertServices = new Map<string, ExpertService>();

  constructor() {
    this.seed();
  }

  private seed() {
    const expertData: Array<{
      name: string; location: string; expertType: string;
      countries: string[]; visaServices: string[]; services: string[]; bio: string;
    }> = [
      {
        name: "Global Journeys Travel",
        location: "United States",
        expertType: "travel",
        countries: ["USA", "UK", "Canada", "Australia"],
        visaServices: ["Tourist Visa", "Business Visa", "Transit Visa"],
        services: ["Visa & Passport", "Travel Booking", "Student Travel"],
        bio: "Expert travel agency specializing in North American and Commonwealth immigration routes.",
      },
      {
        name: "Meridian Immigration Ltd.",
        location: "United Kingdom",
        expertType: "travel",
        countries: ["UK", "Ireland", "Germany", "France"],
        visaServices: ["Work Visa", "Student Visa", "Family Visa"],
        services: ["Visa & Passport", "Relocation", "Settlement"],
        bio: "UK-based immigration consultancy with 15+ years of experience.",
      },
      {
        name: "Pacific Gateway Travel",
        location: "Australia",
        expertType: "travel",
        countries: ["Australia", "New Zealand", "Singapore", "Japan"],
        visaServices: ["Tourist Visa", "Work Permit", "PR Application"],
        services: ["Immigration", "Travel Booking", "PR Support"],
        bio: "Asia-Pacific specialist helping clients navigate complex immigration systems.",
      },
      {
        name: "Amara Osei",
        location: "Ghana",
        expertType: "immigration",
        countries: ["UK", "USA", "Canada"],
        visaServices: ["Skilled Worker Visa", "Family Visa", "Student Visa"],
        services: ["Immigration Advice", "Document Review", "Application Support"],
        bio: "Certified immigration consultant with expertise in UK and North American visas.",
      },
      {
        name: "Elena Marchetti",
        location: "Italy",
        expertType: "immigration",
        countries: ["EU", "Switzerland", "Norway", "USA"],
        visaServices: ["EU Blue Card", "Digital Nomad Visa", "Entrepreneur Visa"],
        services: ["EU Immigration", "Business Setup", "Residency"],
        bio: "European immigration expert specializing in Schengen and EU settlement pathways.",
      },
      {
        name: "City Explorers Tours",
        location: "Kenya",
        expertType: "tour",
        countries: ["Kenya", "Tanzania", "Rwanda", "Ethiopia"],
        visaServices: ["Tourist Visa", "E-Visa", "Visa on Arrival"],
        services: ["Safari Tours", "Cultural Tours", "Adventure Travel"],
        bio: "East Africa tour specialist with 200+ guided expeditions.",
      },
    ];

    for (const data of expertData) {
      const id = randomUUID();
      const expert: Expert = { id, ...data, bio: data.bio ?? null, createdAt: new Date() };
      this.experts.set(id, expert);
    }

    const demoId = randomUUID();
    const demoUser: User = {
      id: demoId,
      email: "demo@askmigi.com",
      firstName: "Demo",
      lastName: "User",
      password: hashPassword("demo123"),
      coins: 50,
      role: "user",
      createdAt: new Date(),
    };
    this.users.set(demoId, demoUser);

    const enquiryData = [
      { question: "How can I move to the United Kingdom from Nigeria?", status: "answered", answer: "To move to the UK from Nigeria, you'll need to apply for the appropriate visa based on your purpose of travel. For work, the Skilled Worker visa is most common — you'll need a job offer from a licensed sponsor. For study, apply for a Student visa..." },
      { question: "How can I move to the United States for work?", status: "pending", answer: null },
      { question: "What documents do I need for a Canadian PR?", status: "pending", answer: null },
    ];

    for (const data of enquiryData) {
      const id = randomUUID();
      const enquiry: Enquiry = {
        id,
        userId: demoId,
        expertType: "immigration",
        question: data.question,
        country: "United Kingdom",
        status: data.status,
        answer: data.answer,
        answeredBy: data.status === "answered" ? "Expert Team" : null,
        coinsUsed: 3,
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 7),
      };
      this.enquiries.set(id, enquiry);
    }
  }

  // ── Users ────────────────────────────────────────────────────────────────

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(data: { email: string; firstName: string; lastName: string; password: string; coins?: number; role?: string }): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      password: data.password,
      coins: data.coins ?? 5,
      role: data.role ?? "user",
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserCoins(userId: string, delta: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    const updated = { ...user, coins: Math.max(0, user.coins + delta) };
    this.users.set(userId, updated);
    return updated;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    this.users.set(userId, { ...user, password: hashedPassword });
    return true;
  }

  // ── Enquiries ────────────────────────────────────────────────────────────

  async getEnquiries(userId: string): Promise<Enquiry[]> {
    return Array.from(this.enquiries.values())
      .filter((e) => e.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getEnquiry(id: string): Promise<Enquiry | undefined> {
    return this.enquiries.get(id);
  }

  async createEnquiry(data: InsertEnquiry): Promise<Enquiry> {
    const id = randomUUID();
    const enquiry: Enquiry = {
      id,
      userId: data.userId,
      expertType: data.expertType ?? "immigration",
      question: data.question,
      country: data.country ?? "United Kingdom",
      status: "pending",
      answer: null,
      answeredBy: null,
      coinsUsed: data.coinsUsed ?? 3,
      createdAt: new Date(),
    };
    this.enquiries.set(id, enquiry);
    return enquiry;
  }

  async updateEnquiryAnswer(id: string, answer: string, answeredBy: string): Promise<Enquiry | undefined> {
    const enquiry = this.enquiries.get(id);
    if (!enquiry) return undefined;
    const updated = { ...enquiry, answer, answeredBy, status: "answered" };
    this.enquiries.set(id, updated);
    return updated;
  }

  // ── Experts (directory) ──────────────────────────────────────────────────

  async getExperts(type?: string): Promise<Expert[]> {
    const all = Array.from(this.experts.values());
    if (!type || type === "all") return all;
    return all.filter((e) => e.expertType === type);
  }

  async getExpert(id: string): Promise<Expert | undefined> {
    return this.experts.get(id);
  }

  // ── Coin Purchases ───────────────────────────────────────────────────────

  async createCoinPurchase(data: InsertCoinPurchase): Promise<CoinPurchase> {
    const id = randomUUID();
    const purchase: CoinPurchase = {
      id,
      userId: data.userId,
      coinsAmount: data.coinsAmount,
      price: data.price,
      status: "completed",
      createdAt: new Date(),
    };
    this.coinPurchases.set(id, purchase);
    return purchase;
  }

  async getCoinPurchases(userId: string): Promise<CoinPurchase[]> {
    return Array.from(this.coinPurchases.values())
      .filter((p) => p.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // ── Password Resets ──────────────────────────────────────────────────────

  async createPasswordReset(email: string, otp: string): Promise<PasswordReset> {
    const id = randomUUID();
    const reset: PasswordReset = {
      id,
      email,
      otp,
      used: false,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      createdAt: new Date(),
    };
    this.passwordResets.set(id, reset);
    return reset;
  }

  async getPasswordReset(email: string, otp: string): Promise<PasswordReset | undefined> {
    return Array.from(this.passwordResets.values()).find(
      (r) => r.email === email && r.otp === otp && !r.used && r.expiresAt > new Date()
    );
  }

  async markPasswordResetUsed(id: string): Promise<void> {
    const reset = this.passwordResets.get(id);
    if (reset) this.passwordResets.set(id, { ...reset, used: true });
  }

  // ── Expert Verification ──────────────────────────────────────────────────

  async getExpertVerification(userId: string): Promise<ExpertVerificationData> {
    return this.expertVerifications.get(userId) ?? { userId, status: "unverified" };
  }

  async updateExpertVerification(userId: string, data: Partial<ExpertVerificationData>): Promise<ExpertVerificationData> {
    const existing = this.expertVerifications.get(userId) ?? { userId, status: "unverified" as const };
    const updated: ExpertVerificationData = { ...existing, ...data, userId };
    this.expertVerifications.set(userId, updated);
    return updated;
  }

  // ── Expert Services ──────────────────────────────────────────────────────

  async getExpertServices(userId: string): Promise<ExpertService[]> {
    return Array.from(this.expertServices.values())
      .filter((s) => s.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createExpertService(data: Omit<ExpertService, "id" | "createdAt">): Promise<ExpertService> {
    const id = randomUUID();
    const service: ExpertService = { ...data, id, createdAt: new Date() };
    this.expertServices.set(id, service);
    return service;
  }

  async deleteExpertService(id: string, userId: string): Promise<boolean> {
    const service = this.expertServices.get(id);
    if (!service || service.userId !== userId) return false;
    this.expertServices.delete(id);
    return true;
  }

  async updateExpertServiceViews(id: string, delta: number): Promise<void> {
    const service = this.expertServices.get(id);
    if (service) this.expertServices.set(id, { ...service, views: service.views + delta });
  }
}

export const storage = new MemStorage();

// ── Auth token store ──────────────────────────────────────────────────────────
const authTokens = new Map<string, string>();

export function createAuthToken(userId: string): string {
  const token = randomUUID();
  authTokens.set(token, userId);
  return token;
}

export function getUserIdFromToken(token: string): string | undefined {
  return authTokens.get(token);
}

export function deleteAuthToken(token: string): void {
  authTokens.delete(token);
}
