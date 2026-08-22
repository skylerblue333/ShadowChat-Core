import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  courses, lessons, progress, learningPaths,
  proposals, votes, staking,
  gameSessions,
  charityCampaigns, donations,
  products, transactions,
  analyticsEvents,
  cryptoWallets, miningOperations, stakingPositions, burningEvents, swapOrders, priceFeeds, cryptoTransactions, tokenSupply, miningDifficulty,
  directMessages,
  CRYPTO_TOKENS,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Export db instance for use in routers
export const db = drizzle(process.env.DATABASE_URL || '');

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
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
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
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function countUsers(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const r = await db.select({ c: sql<number>`count(*)` }).from(users);
  return Number(r[0]?.c ?? 0);
}

/* ===================== SKY SCHOOL ===================== */
export async function listCourses() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(courses).orderBy(desc(courses.createdAt));
}

export async function getCourse(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  return r[0];
}

export async function listLessons(courseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lessons).where(eq(lessons.courseId, courseId)).orderBy(lessons.orderIndex);
}

export async function getLesson(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
  return r[0];
}

export async function markProgress(userId: number, courseId: number, lessonId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(progress)
    .where(and(eq(progress.userId, userId), eq(progress.lessonId, lessonId))).limit(1);
  if (existing.length > 0) {
    await db.update(progress).set({ completed: true, completedAt: new Date() })
      .where(eq(progress.id, existing[0].id));
  } else {
    await db.insert(progress).values({ userId, courseId, lessonId, completed: true, completedAt: new Date() });
  }
}

export async function getUserProgress(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(progress).where(eq(progress.userId, userId));
}

export async function saveLearningPath(userId: number, goal: string, pathJson: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(learningPaths).values({ userId, goal, pathJson });
}

export async function listLearningPaths(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(learningPaths).where(eq(learningPaths.userId, userId)).orderBy(desc(learningPaths.createdAt));
}

export async function insertCourse(data: typeof courses.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(courses).values(data);
}
export async function insertLesson(data: typeof lessons.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(lessons).values(data);
}

/* ===================== GOVERNANCE ===================== */
export async function listProposals(ecosystem?: "DODGE" | "TRUMP") {
  const db = await getDb();
  if (!db) return [];
  if (ecosystem) {
    return db.select().from(proposals).where(eq(proposals.ecosystem, ecosystem)).orderBy(desc(proposals.createdAt));
  }
  return db.select().from(proposals).orderBy(desc(proposals.createdAt));
}

export async function getProposal(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(proposals).where(eq(proposals.id, id)).limit(1);
  return r[0];
}

export async function hasVoted(userId: number, proposalId: number) {
  const db = await getDb();
  if (!db) return false;
  const r = await db.select().from(votes)
    .where(and(eq(votes.userId, userId), eq(votes.proposalId, proposalId))).limit(1);
  return r.length > 0;
}

export async function castVote(userId: number, proposalId: number, choice: "for" | "against", power: number) {
  const db = await getDb();
  if (!db) return;
  await db.insert(votes).values({ userId, proposalId, choice, power });
  if (choice === "for") {
    await db.update(proposals).set({ votesFor: sql`${proposals.votesFor} + ${power}` }).where(eq(proposals.id, proposalId));
  } else {
    await db.update(proposals).set({ votesAgainst: sql`${proposals.votesAgainst} + ${power}` }).where(eq(proposals.id, proposalId));
  }
}

export async function getStakingPower(userId: number, ecosystem: "DODGE" | "TRUMP" | "SKY444") {
  const db = await getDb();
  if (!db) return 0;
  const r = await db.select().from(staking)
    .where(and(eq(staking.userId, userId), eq(staking.ecosystem, ecosystem))).limit(1);
  return r[0]?.amount ?? 0;
}

export async function listUserStaking(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(staking).where(eq(staking.userId, userId));
}

export async function setStaking(userId: number, ecosystem: "DODGE" | "TRUMP" | "SKY444", amount: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(staking)
    .where(and(eq(staking.userId, userId), eq(staking.ecosystem, ecosystem))).limit(1);
  if (existing.length > 0) {
    await db.update(staking).set({ amount }).where(eq(staking.id, existing[0].id));
  } else {
    await db.insert(staking).values({ userId, ecosystem, amount });
  }
}

export async function insertProposal(data: typeof proposals.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(proposals).values(data);
}

export async function setProposalStatus(id: number, status: "active" | "passed" | "rejected") {
  const db = await getDb();
  if (!db) return;
  await db.update(proposals).set({ status }).where(eq(proposals.id, id));
}

/* ===================== GAMING ===================== */
export async function recordGameSession(data: typeof gameSessions.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(gameSessions).values(data);
}

export async function getLeaderboard(game?: string) {
  const db = await getDb();
  if (!db) return [];
  const base = db.select({
    userId: gameSessions.userId,
    name: users.name,
    totalScore: sql<number>`sum(${gameSessions.score})`,
    games: sql<number>`count(*)`,
    donated: sql<number>`sum(${gameSessions.charityDonation})`,
  }).from(gameSessions).leftJoin(users, eq(users.id, gameSessions.userId));
  const q = game
    ? base.where(eq(gameSessions.game, game as any))
    : base;
  return q.groupBy(gameSessions.userId, users.name).orderBy(sql`sum(${gameSessions.score}) desc`).limit(20);
}

export async function getUserGameStats(userId: number) {
  const db = await getDb();
  if (!db) return { totalScore: 0, games: 0, donated: 0 };
  const r = await db.select({
    totalScore: sql<number>`coalesce(sum(${gameSessions.score}),0)`,
    games: sql<number>`count(*)`,
    donated: sql<number>`coalesce(sum(${gameSessions.charityDonation}),0)`,
  }).from(gameSessions).where(eq(gameSessions.userId, userId));
  return { totalScore: Number(r[0]?.totalScore ?? 0), games: Number(r[0]?.games ?? 0), donated: Number(r[0]?.donated ?? 0) };
}

/* ===================== CHARITY ===================== */
export async function listCampaigns() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(charityCampaigns).orderBy(desc(charityCampaigns.createdAt));
}

export async function getCampaign(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(charityCampaigns).where(eq(charityCampaigns.id, id)).limit(1);
  return r[0];
}

export async function addDonation(campaignId: number, amount: number, userId?: number, source = "manual") {
  const db = await getDb();
  if (!db) return undefined;
  await db.insert(donations).values({ campaignId, amount, userId: userId ?? null, source });
  await db.update(charityCampaigns)
    .set({ raisedAmount: sql`${charityCampaigns.raisedAmount} + ${amount}` })
    .where(eq(charityCampaigns.id, campaignId));
  return getCampaign(campaignId);
}

export async function markMilestoneNotified(campaignId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(charityCampaigns).set({ milestoneNotified: true }).where(eq(charityCampaigns.id, campaignId));
}

export async function totalDonated(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const r = await db.select({ t: sql<number>`coalesce(sum(${donations.amount}),0)` }).from(donations);
  return Number(r[0]?.t ?? 0);
}

export async function insertCampaign(data: typeof charityCampaigns.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(charityCampaigns).values(data);
}

/* ===================== MARKETPLACE ===================== */
export async function listProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).orderBy(desc(products.createdAt));
}

export async function getProduct(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return r[0];
}

export async function insertProduct(data: typeof products.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(products).values(data);
}

export async function recordTransaction(data: typeof transactions.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(transactions).values(data);
}

export async function listUserTransactions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt));
}

export async function createDirectMessage(data: typeof directMessages.$inferInsert) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const result = await database.insert(directMessages).values(data);
  const insertedId = Number(result[0].insertId);
  const rows = await database.select().from(directMessages).where(eq(directMessages.id, insertedId)).limit(1);
  return rows[0];
}

export async function listDirectMessages(userId: number, participantId: number, limit: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  return database
    .select()
    .from(directMessages)
    .where(
      and(
        eq(directMessages.senderId, userId),
        eq(directMessages.recipientId, participantId),
      ),
    )
    .orderBy(desc(directMessages.createdAt), desc(directMessages.id))
    .limit(limit);
}

export async function listConversationMessages(userId: number, participantId: number, limit: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  return database
    .select()
    .from(directMessages)
    .where(
      sql`(${directMessages.senderId} = ${userId} AND ${directMessages.recipientId} = ${participantId}) OR (${directMessages.senderId} = ${participantId} AND ${directMessages.recipientId} = ${userId})`,
    )
    .orderBy(desc(directMessages.createdAt), desc(directMessages.id))
    .limit(limit);
}

export async function marketplaceVolume(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const r = await db.select({ t: sql<number>`coalesce(sum(${transactions.amount}),0)` }).from(transactions);
  return Number(r[0]?.t ?? 0);
}

/* ===================== ANALYTICS ===================== */
export async function logEvent(eventType: string, module?: string, value = 0, userId?: number) {
  const db = await getDb();
  if (!db) return;
  await db.insert(analyticsEvents).values({ eventType, module: module ?? null, value, userId: userId ?? null });
}

export async function analyticsSummary() {
  const db = await getDb();
  if (!db) return { totalEvents: 0, byModule: [] as { module: string; count: number }[] };
  const total = await db.select({ c: sql<number>`count(*)` }).from(analyticsEvents);
  const byModule = await db.select({
    module: sql<string>`coalesce(${analyticsEvents.module}, 'other')`,
    count: sql<number>`count(*)`,
  }).from(analyticsEvents).groupBy(analyticsEvents.module);
  return {
    totalEvents: Number(total[0]?.c ?? 0),
    byModule: byModule.map(m => ({ module: m.module, count: Number(m.count) })),
  };
}

export async function recentTransactionsForTrend() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    day: sql<string>`date(${transactions.createdAt})`,
    revenue: sql<number>`sum(${transactions.amount})`,
  }).from(transactions).groupBy(sql`date(${transactions.createdAt})`).orderBy(sql`date(${transactions.createdAt})`).limit(30);
}
