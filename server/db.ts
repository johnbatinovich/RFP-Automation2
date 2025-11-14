import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role === undefined) {
      if (user.id === ENV.ownerId) {
        user.role = 'admin';
        values.role = 'admin';
        updateSet.role = 'admin';
      }
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// RFP Automation Queries
import { analytics, InsertAnalytics, InsertKnowledgeBase, InsertProposal, InsertRFP, InsertRFPAssignment, InsertTeamMember, knowledgeBase, proposals, rfpAssignments, rfps, teamMembers } from "../drizzle/schema";
import { desc } from "drizzle-orm";

export async function createRFP(data: InsertRFP) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(rfps).values(data);
  return data;
}

export async function getAllRFPs() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(rfps).orderBy(desc(rfps.createdAt));
}

export async function getRFPById(id: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(rfps).where(eq(rfps.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateRFP(id: string, data: Partial<InsertRFP>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(rfps).set({ ...data, updatedAt: new Date() }).where(eq(rfps.id, id));
}

export async function createProposal(data: InsertProposal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(proposals).values(data);
  return data;
}

export async function getProposalByRFPId(rfpId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(proposals).where(eq(proposals.rfpId, rfpId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateProposal(id: string, data: Partial<InsertProposal>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(proposals).set({ ...data, updatedAt: new Date() }).where(eq(proposals.id, id));
}

export async function getAllKnowledgeBase() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(knowledgeBase).orderBy(desc(knowledgeBase.updatedAt));
}

export async function createKnowledgeBase(data: InsertKnowledgeBase) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(knowledgeBase).values(data);
  return data;
}

export async function getAllTeamMembers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(teamMembers);
}

export async function createTeamMember(data: InsertTeamMember) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(teamMembers).values(data);
  return data;
}

export async function getAssignmentsByRFPId(rfpId: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(rfpAssignments).where(eq(rfpAssignments.rfpId, rfpId));
}

export async function createAssignment(data: InsertRFPAssignment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(rfpAssignments).values(data);
  return data;
}

export async function getAnalytics() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(analytics).orderBy(desc(analytics.date));
}

export async function createAnalytics(data: InsertAnalytics) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(analytics).values(data);
  return data;
}

// Team Collaboration Queries
import { activities, comments, InsertActivity, InsertComment, InsertNotification, InsertSharedFile, InsertTask, notifications, sharedFiles, tasks } from "../drizzle/schema";

// Team Members (use existing getTeamMembers and createTeamMember functions above)
export async function getTeamMemberById(id: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(teamMembers).where(eq(teamMembers.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateTeamMember(id: string, data: Partial<InsertTeamMember>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(teamMembers).set(data).where(eq(teamMembers.id, id));
}

export async function deleteTeamMember(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(teamMembers).where(eq(teamMembers.id, id));
}

// Tasks
export async function getTasks(rfpId?: string) {
  const db = await getDb();
  if (!db) return [];
  if (rfpId) {
    return await db.select().from(tasks).where(eq(tasks.rfpId, rfpId)).orderBy(desc(tasks.createdAt));
  }
  return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
}

export async function createTask(data: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(tasks).values(data);
  return data;
}

export async function updateTask(id: string, data: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(tasks).set({ ...data, updatedAt: new Date() }).where(eq(tasks.id, id));
}

export async function deleteTask(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(tasks).where(eq(tasks.id, id));
}

// Comments
export async function getComments(rfpId?: string, taskId?: string) {
  const db = await getDb();
  if (!db) return [];
  
  if (taskId) {
    return await db.select().from(comments).where(eq(comments.taskId, taskId)).orderBy(desc(comments.createdAt));
  }
  if (rfpId) {
    return await db.select().from(comments).where(eq(comments.rfpId, rfpId)).orderBy(desc(comments.createdAt));
  }
  return await db.select().from(comments).orderBy(desc(comments.createdAt));
}

export async function createComment(data: InsertComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(comments).values(data);
  return data;
}

export async function deleteComment(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(comments).where(eq(comments.id, id));
}

// Activities
export async function getActivities(rfpId?: string, limit?: number) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(activities);
  
  if (rfpId) {
    query = query.where(eq(activities.rfpId, rfpId)) as any;
  }
  
  query = query.orderBy(desc(activities.createdAt)) as any;
  
  if (limit) {
    query = query.limit(limit) as any;
  }
  
  return await query;
}

export async function createActivity(data: InsertActivity) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(activities).values(data);
  return data;
}

// Notifications
export async function getNotifications(userId: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(notifications).values(data);
  return data;
}

export async function markNotificationRead(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: "yes" }).where(eq(notifications.id, id));
}

// Shared Files
export async function getSharedFiles(rfpId: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(sharedFiles)
    .where(eq(sharedFiles.rfpId, rfpId))
    .orderBy(desc(sharedFiles.createdAt));
}

export async function createSharedFile(data: InsertSharedFile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(sharedFiles).values(data);
  return data;
}

export async function deleteSharedFile(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(sharedFiles).where(eq(sharedFiles.id, id));
}
