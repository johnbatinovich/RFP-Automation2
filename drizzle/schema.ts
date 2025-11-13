import { mysqlEnum, mysqlTable, text, timestamp, varchar, int } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// RFP Automation Tables
export const rfps = mysqlTable("rfps", {
  id: varchar("id", { length: 64 }).primaryKey(),
  title: text("title").notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  dueDate: timestamp("dueDate").notNull(),
  value: varchar("value", { length: 50 }),
  status: mysqlEnum("status", ["new", "in_progress", "under_review", "completed"]).default("new").notNull(),
  progress: varchar("progress", { length: 10 }).default("0"),
  owner: varchar("owner", { length: 255 }),
  rfpDocumentUrl: text("rfpDocumentUrl"),
  rfpDocumentName: varchar("rfpDocumentName", { length: 255 }),
  extractedQuestions: text("extractedQuestions"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type RFP = typeof rfps.$inferSelect;
export type InsertRFP = typeof rfps.$inferInsert;

export const proposals = mysqlTable("proposals", {
  id: varchar("id", { length: 64 }).primaryKey(),
  rfpId: varchar("rfpId", { length: 64 }).notNull(),
  content: text("content"),
  qualityScore: varchar("qualityScore", { length: 10 }),
  completeness: varchar("completeness", { length: 10 }),
  relevance: varchar("relevance", { length: 10 }),
  clarity: varchar("clarity", { length: 10 }),
  competitiveDiff: varchar("competitiveDiff", { length: 10 }),
  alignment: varchar("alignment", { length: 10 }),
  improvementSuggestion: text("improvementSuggestion"),
  status: mysqlEnum("status", ["draft", "pending_review", "approved", "sent"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = typeof proposals.$inferInsert;

export const knowledgeBase = mysqlTable("knowledgeBase", {
  id: varchar("id", { length: 64 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["audience_data", "ad_formats", "pricing", "case_studies"]).notNull(),
  content: text("content"),
  fileUrl: text("fileUrl"),
  fileType: varchar("fileType", { length: 100 }),
  fileSize: int("fileSize"),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBase = typeof knowledgeBase.$inferInsert;

export const teamMembers = mysqlTable("teamMembers", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }),
  status: mysqlEnum("status", ["online", "offline", "away"]).default("offline").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

export const rfpAssignments = mysqlTable("rfpAssignments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  rfpId: varchar("rfpId", { length: 64 }).notNull(),
  memberId: varchar("memberId", { length: 64 }).notNull(),
  assignedAt: timestamp("assignedAt").defaultNow(),
});

export type RFPAssignment = typeof rfpAssignments.$inferSelect;
export type InsertRFPAssignment = typeof rfpAssignments.$inferInsert;

export const analytics = mysqlTable("analytics", {
  id: varchar("id", { length: 64 }).primaryKey(),
  metric: varchar("metric", { length: 100 }).notNull(),
  value: varchar("value", { length: 50 }).notNull(),
  date: timestamp("date").defaultNow(),
});

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = typeof analytics.$inferInsert;


// Team Collaboration Tables
export const tasks = mysqlTable("tasks", {
  id: varchar("id", { length: 64 }).primaryKey(),
  rfpId: varchar("rfpId", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  assignedTo: varchar("assignedTo", { length: 64 }),
  status: mysqlEnum("status", ["todo", "in_progress", "review", "completed"]).default("todo").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  dueDate: timestamp("dueDate"),
  createdBy: varchar("createdBy", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

export const comments = mysqlTable("comments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  rfpId: varchar("rfpId", { length: 64 }).notNull(),
  taskId: varchar("taskId", { length: 64 }),
  authorId: varchar("authorId", { length: 64 }).notNull(),
  authorName: varchar("authorName", { length: 255 }).notNull(),
  content: text("content").notNull(),
  parentId: varchar("parentId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

export const activities = mysqlTable("activities", {
  id: varchar("id", { length: 64 }).primaryKey(),
  rfpId: varchar("rfpId", { length: 64 }),
  userId: varchar("userId", { length: 64 }).notNull(),
  userName: varchar("userName", { length: 255 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  description: text("description").notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;

export const notifications = mysqlTable("notifications", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["info", "success", "warning", "error"]).default("info").notNull(),
  isRead: mysqlEnum("isRead", ["yes", "no"]).default("no").notNull(),
  link: varchar("link", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export const sharedFiles = mysqlTable("sharedFiles", {
  id: varchar("id", { length: 64 }).primaryKey(),
  rfpId: varchar("rfpId", { length: 64 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileType: varchar("fileType", { length: 100 }),
  fileSize: int("fileSize"),
  uploadedBy: varchar("uploadedBy", { length: 64 }).notNull(),
  uploadedByName: varchar("uploadedByName", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type SharedFile = typeof sharedFiles.$inferSelect;
export type InsertSharedFile = typeof sharedFiles.$inferInsert;
