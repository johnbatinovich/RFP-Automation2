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
