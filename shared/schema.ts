import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  password: text("password").notNull(),
  coins: integer("coins").notNull().default(0),
  role: text("role").notNull().default("user"), // "user" | "expert"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ─── Enquiries ───────────────────────────────────────────────────────────────
export const enquiries = pgTable("enquiries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  expertType: text("expert_type").notNull().default("immigration"), // immigration | travel | tour
  question: text("question").notNull(),
  country: text("country").notNull().default("United Kingdom"),
  status: text("status").notNull().default("pending"), // pending | answered
  answer: text("answer"),
  answeredBy: text("answered_by"),
  coinsUsed: integer("coins_used").notNull().default(3),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEnquirySchema = createInsertSchema(enquiries).omit({
  id: true,
  status: true,
  answer: true,
  answeredBy: true,
  createdAt: true,
});

export type InsertEnquiry = z.infer<typeof insertEnquirySchema>;
export type Enquiry = typeof enquiries.$inferSelect;

// ─── Experts ─────────────────────────────────────────────────────────────────
export const experts = pgTable("experts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  location: text("location").notNull(),
  expertType: text("expert_type").notNull(), // immigration | travel | tour
  countries: text("countries").array().notNull().default(sql`ARRAY[]::text[]`),
  visaServices: text("visa_services").array().notNull().default(sql`ARRAY[]::text[]`),
  services: text("services").array().notNull().default(sql`ARRAY[]::text[]`),
  bio: text("bio"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertExpertSchema = createInsertSchema(experts).omit({
  id: true,
  createdAt: true,
});

export type InsertExpert = z.infer<typeof insertExpertSchema>;
export type Expert = typeof experts.$inferSelect;

// ─── Coin Purchases ──────────────────────────────────────────────────────────
export const coinPurchases = pgTable("coin_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  coinsAmount: integer("coins_amount").notNull(),
  price: text("price").notNull(),
  status: text("status").notNull().default("completed"), // pending | completed
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCoinPurchaseSchema = createInsertSchema(coinPurchases).omit({
  id: true,
  status: true,
  createdAt: true,
});

export type InsertCoinPurchase = z.infer<typeof insertCoinPurchaseSchema>;
export type CoinPurchase = typeof coinPurchases.$inferSelect;

// ─── Password Resets ─────────────────────────────────────────────────────────
export const passwordResets = pgTable("password_resets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  otp: text("otp").notNull(),
  used: boolean("used").notNull().default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PasswordReset = typeof passwordResets.$inferSelect;

// ─── Expert Verifications ─────────────────────────────────────────────────────
export const expertVerifications = pgTable("expert_verifications", {
  userId: varchar("user_id").primaryKey(),
  status: text("status").notNull().default("unverified"), // unverified | pending | verified
  personalInfo: text("personal_info"), // JSON string
  businessInfo: text("business_info"), // JSON string
  submittedAt: timestamp("submitted_at"),
});

export type ExpertVerification = typeof expertVerifications.$inferSelect;

// ─── Expert Services ──────────────────────────────────────────────────────────
export const expertServices = pgTable("expert_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  businessName: text("business_name").notNull(),
  serviceTypes: text("service_types").array().notNull().default(sql`ARRAY[]::text[]`),
  countries: text("countries").array().notNull().default(sql`ARRAY[]::text[]`),
  visaServices: text("visa_services").array().notNull().default(sql`ARRAY[]::text[]`),
  currency: text("currency").notNull().default("GBP"),
  averagePrice: text("average_price").notNull().default(""),
  status: text("status").notNull().default("active"), // active | inactive
  views: integer("views").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ExpertService = typeof expertServices.$inferSelect;
