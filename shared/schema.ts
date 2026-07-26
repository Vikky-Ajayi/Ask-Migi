import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, index, decimal, jsonb } from "drizzle-orm/pg-core";
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
  unlimitedCoins: boolean("unlimited_coins").notNull().default(false),
  role: text("role").notNull().default("user"), // "user" | "expert"
  profilePic: text("profile_pic"), // base64 data URL or external URL
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
  userId: varchar("user_id").notNull().references(() => users.id),
  expertType: text("expert_type").notNull().default("immigration"), // immigration | travel | tour
  question: text("question").notNull(),
  country: text("country").notNull().default("United Kingdom"),
  status: text("status").notNull().default("pending"), // pending | ai_answered | answered
  analysis: text("analysis"), // short AI analysis shown to user immediately
  answer: text("answer"),
  answeredBy: text("answered_by"),
  answeredByPic: text("answered_by_pic"), // expert profile pic at time of answer
  answerEditedAt: timestamp("answer_edited_at"), // last edit timestamp
  coinsUsed: integer("coins_used").notNull().default(3),
  attachment: text("attachment"), // base64 data URL of uploaded file (e.g. CV/resume)
  attachmentName: text("attachment_name"), // original filename
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("enquiries_user_id_idx").on(t.userId),
  index("enquiries_status_idx").on(t.status),
]);

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
}, (t) => [
  index("experts_type_idx").on(t.expertType),
]);

export const insertExpertSchema = createInsertSchema(experts).omit({
  id: true,
  createdAt: true,
});

export type InsertExpert = z.infer<typeof insertExpertSchema>;
export type Expert = typeof experts.$inferSelect;

// ─── Coin Purchases ──────────────────────────────────────────────────────────
export const coinPurchases = pgTable("coin_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  coinsAmount: integer("coins_amount").notNull(),
  price: text("price").notNull(),
  status: text("status").notNull().default("completed"), // pending | completed | failed
  sumupRef: text("sumup_ref").unique(), // unique SumUp checkout reference — prevents double-grants
  checkoutId: text("checkout_id"), // SumUp checkout ID — enables server-side reconciliation independent of browser redirect
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("coin_purchases_user_id_idx").on(t.userId),
]);

export const insertCoinPurchaseSchema = createInsertSchema(coinPurchases).omit({
  id: true,
  status: true,
  createdAt: true,
}).extend({
  checkoutId: z.string().optional().nullable(),
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
}, (t) => [
  index("password_resets_email_idx").on(t.email),
]);

export type PasswordReset = typeof passwordResets.$inferSelect;

// ─── Expert Verifications ─────────────────────────────────────────────────────
export const expertVerifications = pgTable("expert_verifications", {
  userId: varchar("user_id").primaryKey().references(() => users.id),
  status: text("status").notNull().default("unverified"), // unverified | pending | verified
  personalInfo: text("personal_info"), // JSON string
  businessInfo: text("business_info"), // JSON string
  submittedAt: timestamp("submitted_at"),
});

export type ExpertVerification = typeof expertVerifications.$inferSelect;

// ─── Call Bookings ────────────────────────────────────────────────────────────
export const callBookings = pgTable("call_bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  reason: text("reason").notNull(),
  coinsUsed: integer("coins_used").notNull().default(30),
  status: text("status").notNull().default("booked"), // booked | completed | cancelled
  userName: text("user_name").notNull().default(""),
  userEmail: text("user_email").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("call_bookings_user_id_idx").on(t.userId),
]);

export const insertCallBookingSchema = createInsertSchema(callBookings).omit({
  id: true,
  createdAt: true,
});

export type InsertCallBooking = z.infer<typeof insertCallBookingSchema>;
export type CallBooking = typeof callBookings.$inferSelect;

// ─── Expert Services ──────────────────────────────────────────────────────────
export const expertServices = pgTable("expert_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  businessName: text("business_name").notNull(),
  serviceTypes: text("service_types").array().notNull().default(sql`ARRAY[]::text[]`),
  countries: text("countries").array().notNull().default(sql`ARRAY[]::text[]`),
  visaServices: text("visa_services").array().notNull().default(sql`ARRAY[]::text[]`),
  currency: text("currency").notNull().default("GBP"),
  averagePrice: text("average_price").notNull().default(""),
  status: text("status").notNull().default("active"), // active | inactive
  views: integer("views").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("expert_services_user_id_idx").on(t.userId),
]);

export type ExpertService = typeof expertServices.$inferSelect;

// ─── User Profiles (career dashboard) ────────────────────────────────────────
export const userProfiles = pgTable("user_profiles", {
  userId: varchar("user_id").primaryKey().references(() => users.id),
  industry: text("industry"),
  jobTitle: text("job_title"),
  yearsExperience: integer("years_experience"),
  skills: text("skills").array().notNull().default(sql`ARRAY[]::text[]`),
  cvText: text("cv_text"),
  cvFilename: text("cv_filename"),
  locationCity: text("location_city"),
  locationPostcode: text("location_postcode"),
  linkedinUrl: text("linkedin_url"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  workTypes: text("work_types").array().notNull().default(sql`ARRAY[]::text[]`),
  targetRoles: text("target_roles").array().notNull().default(sql`ARRAY[]::text[]`),
  dealBreakers: text("deal_breakers"),
  profileComplete: boolean("profile_complete").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("user_profiles_user_id_idx").on(t.userId),
]);

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ updatedAt: true });
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;

// ─── Events (scraped from Eventbrite) ────────────────────────────────────────
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventbriteId: text("eventbrite_id").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  locationCity: text("location_city"),
  locationPostcode: text("location_postcode"),
  locationVenue: text("location_venue"),
  locationAddress: text("location_address"),
  lat: decimal("lat", { precision: 10, scale: 6 }),
  lng: decimal("lng", { precision: 10, scale: 6 }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  url: text("url"),
  organizerName: text("organizer_name"),
  isFree: boolean("is_free").notNull().default(false),
  isOnline: boolean("is_online").notNull().default(false),
  thumbnailUrl: text("thumbnail_url"),
  status: text("status").notNull().default("active"), // active | expired | cancelled
  scrapedAt: timestamp("scraped_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("events_status_idx").on(t.status),
  index("events_start_date_idx").on(t.startDate),
  index("events_city_idx").on(t.locationCity),
  index("events_category_idx").on(t.category),
]);

export type Event = typeof events.$inferSelect;

// ─── Jobs (scraped from job boards) ──────────────────────────────────────────
export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  source: text("source").notNull(), // linkedin | reed | remotive | weworkremotely | greenhouse | himalayas
  sourceId: text("source_id"),
  sourceUrl: text("source_url").notNull().unique(),
  applyUrl: text("apply_url"),
  atsType: text("ats_type"), // greenhouse | lever | workable | linkedin_easy | indeed_easy | direct
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location"),
  isRemote: boolean("is_remote").notNull().default(false),
  workType: text("work_type"), // remote | hybrid | onsite
  description: text("description"),
  requirements: text("requirements"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  currency: text("currency").default("GBP"),
  contractType: text("contract_type"), // full_time | part_time | contract | freelance
  status: text("status").notNull().default("active"), // active | expired
  postedAt: timestamp("posted_at"),
  scrapedAt: timestamp("scraped_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
}, (t) => [
  index("jobs_status_idx").on(t.status),
  index("jobs_source_idx").on(t.source),
  index("jobs_posted_at_idx").on(t.postedAt),
  index("jobs_remote_idx").on(t.isRemote),
]);

export type Job = typeof jobs.$inferSelect;

// ─── Job Applications ─────────────────────────────────────────────────────────
export const jobApplications = pgTable("job_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  jobId: varchar("job_id").notNull().references(() => jobs.id),
  status: text("status").notNull().default("queued"), // queued | generating_docs | applying | submitted | failed | viewed | interview | rejected | offer
  tailoredCvText: text("tailored_cv_text"),
  coverLetter: text("cover_letter"),
  failureReason: text("failure_reason"),
  coinsSpent: integer("coins_spent").notNull().default(5),
  notes: text("notes"),
  appliedAt: timestamp("applied_at"),
  statusUpdatedAt: timestamp("status_updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("job_apps_user_id_idx").on(t.userId),
  index("job_apps_status_idx").on(t.status),
]);

export const insertJobApplicationSchema = createInsertSchema(jobApplications).omit({
  id: true, statusUpdatedAt: true, createdAt: true,
});
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type JobApplication = typeof jobApplications.$inferSelect;
