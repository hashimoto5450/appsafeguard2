import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Severity enum for vulnerabilities
export const severityEnum = pgEnum("severity", ["high", "medium", "low", "safe"]);

// Status enum for tasks
export const statusEnum = pgEnum("status", ["pending", "in_progress", "completed", "deferred"]);

// Scan table schema
export const scans = pgTable("scans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  url: text("url").notNull(),
  scanLevel: text("scan_level").notNull(), // quick, standard, detailed
  crawlLimit: integer("crawl_limit").notNull(),
  useAuthentication: boolean("use_authentication").notNull().default(false),
  includeCustomRules: boolean("include_custom_rules").notNull().default(false),
  status: text("status").notNull(), // pending, running, completed, failed
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  result: json("result"),
});

// Vulnerability table schema
export const vulnerabilities = pgTable("vulnerabilities", {
  id: serial("id").primaryKey(),
  scanId: integer("scan_id").notNull().references(() => scans.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  url: text("url").notNull(),
  severity: text("severity").notNull(), // high, medium, low, safe
  category: text("category").notNull(),
  details: json("details"),
  status: text("status").notNull().default("pending"), // pending, in_progress, fixed, false_positive
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Task table schema
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  vulnerabilityId: integer("vulnerability_id").references(() => vulnerabilities.id),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, deferred
  assignedTo: integer("assigned_to").references(() => users.id),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Custom rule table schema
export const customRules = pgTable("custom_rules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  pattern: text("pattern").notNull(),
  severity: text("severity").notNull(), // high, medium, low, safe
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Report table schema
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  type: text("type").notNull(), // vulnerability, task, security
  format: text("format").notNull().default("pdf"),
  data: json("data"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Security event table schema
export const securityEvents = pgTable("security_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  type: text("type").notNull(),
  description: text("description").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
});

export const insertScanSchema = createInsertSchema(scans).pick({
  userId: true,
  url: true,
  scanLevel: true,
  crawlLimit: true,
  useAuthentication: true,
  includeCustomRules: true,
  status: true,
});

export const insertVulnerabilitySchema = createInsertSchema(vulnerabilities).pick({
  scanId: true,
  name: true,
  description: true,
  url: true,
  severity: true,
  category: true,
  details: true,
  status: true,
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  vulnerabilityId: true,
  userId: true,
  title: true,
  description: true,
  status: true,
  assignedTo: true,
  dueDate: true,
});

export const insertCustomRuleSchema = createInsertSchema(customRules).pick({
  userId: true,
  name: true,
  description: true,
  category: true,
  pattern: true,
  severity: true,
  enabled: true,
});

export const insertReportSchema = createInsertSchema(reports).pick({
  userId: true,
  title: true,
  type: true,
  format: true,
  data: true,
});

export const insertSecurityEventSchema = createInsertSchema(securityEvents).pick({
  userId: true,
  type: true,
  description: true,
  metadata: true,
});

// Define types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertScan = z.infer<typeof insertScanSchema>;
export type Scan = typeof scans.$inferSelect;

export type InsertVulnerability = z.infer<typeof insertVulnerabilitySchema>;
export type Vulnerability = typeof vulnerabilities.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertCustomRule = z.infer<typeof insertCustomRuleSchema>;
export type CustomRule = typeof customRules.$inferSelect;

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

export type InsertSecurityEvent = z.infer<typeof insertSecurityEventSchema>;
export type SecurityEvent = typeof securityEvents.$inferSelect;
