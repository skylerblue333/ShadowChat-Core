import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint, double, json, date, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/* ===================== SKY SCHOOL ===================== */
export const courses = mysqlTable("courses", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  level: mysqlEnum("level", ["beginner", "intermediate", "advanced"]).default("beginner").notNull(),
  imageUrl: text("imageUrl"),
  imageKey: varchar("imageKey", { length: 512 }),
  lessonCount: int("lessonCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const lessons = mysqlTable("lessons", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  orderIndex: int("orderIndex").default(0).notNull(),
  durationMin: int("durationMin").default(10).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const progress = mysqlTable("progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  lessonId: int("lessonId").notNull(),
  courseId: int("courseId").notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completedAt"),
});

export const learningPaths = mysqlTable("learningPaths", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  goal: text("goal").notNull(),
  pathJson: text("pathJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/* ===================== GOVERNANCE ===================== */
export const proposals = mysqlTable("proposals", {
  id: int("id").autoincrement().primaryKey(),
  ecosystem: mysqlEnum("ecosystem", ["DODGE", "TRUMP"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["active", "passed", "rejected"]).default("active").notNull(),
  votesFor: int("votesFor").default(0).notNull(),
  votesAgainst: int("votesAgainst").default(0).notNull(),
  endsAt: timestamp("endsAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const votes = mysqlTable("votes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  proposalId: int("proposalId").notNull(),
  choice: mysqlEnum("choice", ["for", "against"]).notNull(),
  power: int("power").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const staking = mysqlTable("staking", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  ecosystem: mysqlEnum("ecosystem", ["DODGE", "TRUMP", "SKY444"]).notNull(),
  amount: double("amount").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/* ===================== GAMING ===================== */
export const gameSessions = mysqlTable("gameSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  game: mysqlEnum("game", ["blackjack", "roulette", "tictactoe", "dice", "snake"]).notNull(),
  score: int("score").default(0).notNull(),
  result: varchar("result", { length: 32 }),
  charityDonation: double("charityDonation").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/* ===================== CHARITY ===================== */
export const charityCampaigns = mysqlTable("charityCampaigns", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  goalAmount: double("goalAmount").default(0).notNull(),
  raisedAmount: double("raisedAmount").default(0).notNull(),
  mediaUrl: text("mediaUrl"),
  mediaKey: varchar("mediaKey", { length: 512 }),
  milestoneNotified: boolean("milestoneNotified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const donations = mysqlTable("donations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  campaignId: int("campaignId").notNull(),
  amount: double("amount").notNull(),
  source: varchar("source", { length: 64 }).default("manual").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/* ===================== MARKETPLACE ===================== */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  priceSky: double("priceSky").notNull(),
  imageUrl: text("imageUrl"),
  imageKey: varchar("imageKey", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  amount: double("amount").notNull(),
  currency: mysqlEnum("currency", ["SKY444", "DODGE", "TRUMP"]).notNull(),
  status: mysqlEnum("status", ["completed", "pending"]).default("completed").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/* ===================== ANALYTICS ===================== */
export const analyticsEvents = mysqlTable("analyticsEvents", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  userId: int("userId"),
  eventType: varchar("eventType", { length: 64 }).notNull(),
  module: varchar("module", { length: 64 }),
  value: double("value").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Course = typeof courses.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Proposal = typeof proposals.$inferSelect;
export type Product = typeof products.$inferSelect;
export type CharityCampaign = typeof charityCampaigns.$inferSelect;
export type GameSession = typeof gameSessions.$inferSelect;

/* ===================== DAY TRADE ROOM ===================== */
export const tradeSessions = mysqlTable("tradeSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  symbol: varchar("symbol", { length: 32 }).notNull(), // BTC, ETH, DODGE, SKY444, TRUMP
  entryPrice: double("entryPrice").notNull(),
  exitPrice: double("exitPrice"),
  quantity: double("quantity").notNull(),
  profitLoss: double("profitLoss").default(0).notNull(),
  status: mysqlEnum("status", ["open", "closed"]).default("open").notNull(),
  aiSignalConfidence: double("aiSignalConfidence").default(0).notNull(), // 0-1 confidence score
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  closedAt: timestamp("closedAt"),
});

export const tradingSignals = mysqlTable("tradingSignals", {
  id: int("id").autoincrement().primaryKey(),
  symbol: varchar("symbol", { length: 32 }).notNull(),
  signal: mysqlEnum("signal", ["buy", "sell", "hold"]).notNull(),
  confidence: double("confidence").notNull(), // 0-1
  price: double("price").notNull(),
  prediction: text("prediction"), // AI analysis
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/* ===================== ESCROW SHOP ===================== */
export const escrowListings = mysqlTable("escrowListings", {
  id: int("id").autoincrement().primaryKey(),
  sellerId: int("sellerId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  imageKey: varchar("imageKey", { length: 512 }),
  priceSky: double("priceSky").notNull(),
  priceDodge: double("priceDodge").notNull(),
  priceTrump: double("priceTrump").notNull(),
  quantity: int("quantity").default(1).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  status: mysqlEnum("status", ["active", "sold", "delisted"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const escrowTransactions = mysqlTable("escrowTransactions", {
  id: int("id").autoincrement().primaryKey(),
  buyerId: int("buyerId").notNull(),
  sellerId: int("sellerId").notNull(),
  listingId: int("listingId").notNull(),
  amount: double("amount").notNull(),
  currency: mysqlEnum("currency", ["SKY444", "DODGE", "TRUMP"]).notNull(),
  status: mysqlEnum("status", ["pending", "released", "disputed", "refunded"]).default("pending").notNull(),
  buyerConfirmed: boolean("buyerConfirmed").default(false).notNull(),
  sellerConfirmed: boolean("sellerConfirmed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

/* ===================== VIDEO AREA ===================== */
export const videoContent = mysqlTable("videoContent", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  videoUrl: text("videoUrl").notNull(),
  videoKey: varchar("videoKey", { length: 512 }),
  thumbnailUrl: text("thumbnailUrl"),
  thumbnailKey: varchar("thumbnailKey", { length: 512 }),
  category: varchar("category", { length: 100 }).notNull(), // tutorial, stream, entertainment, news
  views: int("views").default(0).notNull(),
  likes: int("likes").default(0).notNull(),
  duration: int("duration"), // seconds
  isLive: boolean("isLive").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const videoComments = mysqlTable("videoComments", {
  id: int("id").autoincrement().primaryKey(),
  videoId: int("videoId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  likes: int("likes").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/* ===================== SOCIAL MEDIA ===================== */
export const socialPosts = mysqlTable("socialPosts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  imageUrl: text("imageUrl"),
  imageKey: varchar("imageKey", { length: 512 }),
  likes: int("likes").default(0).notNull(),
  shares: int("shares").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const socialComments = mysqlTable("socialComments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  likes: int("likes").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const userFollows = mysqlTable("userFollows", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId").notNull(),
  followingId: int("followingId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Per-user post likes (enables real like/unlike toggling)
export const postLikes = mysqlTable("postLikes", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TradeSession = typeof tradeSessions.$inferSelect;
export type TradingSignal = typeof tradingSignals.$inferSelect;
export type EscrowListing = typeof escrowListings.$inferSelect;
export type EscrowTransaction = typeof escrowTransactions.$inferSelect;
export type VideoContent = typeof videoContent.$inferSelect;
export type SocialPost = typeof socialPosts.$inferSelect;

/* ===================== CRYPTO SYSTEM ===================== */

// Supported tokens
export const CRYPTO_TOKENS = ["SKY444", "DODGE", "TRUMP", "BTC", "USDT", "MONERO"] as const;
export type CryptoToken = typeof CRYPTO_TOKENS[number];

// User wallets for each token
export const cryptoWallets = mysqlTable("cryptoWallets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: mysqlEnum("token", CRYPTO_TOKENS).notNull(),
  balance: double("balance").default(0).notNull(),
  stakedBalance: double("stakedBalance").default(0).notNull(),
  totalMined: double("totalMined").default(0).notNull(),
  totalBurned: double("totalBurned").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Mining operations
export const miningOperations = mysqlTable("miningOperations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: mysqlEnum("token", CRYPTO_TOKENS).notNull(),
  difficulty: double("difficulty").notNull(),
  hashRate: double("hashRate").notNull(), // hashes per second
  rewardAmount: double("rewardAmount").notNull(),
  status: mysqlEnum("status", ["active", "completed", "failed"]).default("active").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

// Staking positions
export const stakingPositions = mysqlTable("stakingPositions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: mysqlEnum("token", CRYPTO_TOKENS).notNull(),
  amount: double("amount").notNull(),
  apy: double("apy").notNull(), // Annual Percentage Yield
  lockPeriodDays: int("lockPeriodDays").notNull(),
  rewardsClaimed: double("rewardsClaimed").default(0).notNull(),
  status: mysqlEnum("status", ["active", "completed", "unstaked"]).default("active").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  unlocksAt: timestamp("unlocksAt").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Burning events
export const burningEvents = mysqlTable("burningEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: mysqlEnum("token", CRYPTO_TOKENS).notNull(),
  amount: double("amount").notNull(),
  reason: varchar("reason", { length: 255 }), // "manual", "fee", "penalty"
  supplyReduction: double("supplyReduction").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// DEX swap orders
export const swapOrders = mysqlTable("swapOrders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fromToken: mysqlEnum("fromToken", CRYPTO_TOKENS).notNull(),
  toToken: mysqlEnum("toToken", CRYPTO_TOKENS).notNull(),
  fromAmount: double("fromAmount").notNull(),
  toAmount: double("toAmount").notNull(),
  exchangeRate: double("exchangeRate").notNull(),
  slippage: double("slippage").default(0).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "cancelled"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

// Price feeds for each token
export const priceFeeds = mysqlTable("priceFeeds", {
  id: int("id").autoincrement().primaryKey(),
  token: mysqlEnum("token", CRYPTO_TOKENS).notNull(),
  priceUsd: double("priceUsd").notNull(),
  priceChange24h: double("priceChange24h").notNull(),
  marketCap: double("marketCap"),
  volume24h: double("volume24h"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Mining difficulty tracker
export const miningDifficulty = mysqlTable("miningDifficulty", {
  id: int("id").autoincrement().primaryKey(),
  token: mysqlEnum("token", CRYPTO_TOKENS).notNull(),
  currentDifficulty: double("currentDifficulty").notNull(),
  targetDifficulty: double("targetDifficulty").notNull(),
  adjustmentFactor: double("adjustmentFactor").default(1).notNull(),
  lastAdjustedAt: timestamp("lastAdjustedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Transaction history
export const cryptoTransactions = mysqlTable("cryptoTransactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: mysqlEnum("token", CRYPTO_TOKENS).notNull(),
  type: mysqlEnum("type", ["mining", "staking_reward", "swap", "burn", "transfer", "receive"]).notNull(),
  amount: double("amount").notNull(),
  relatedId: int("relatedId"), // ID of mining/staking/swap operation
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Global token supply tracker
export const tokenSupply = mysqlTable("tokenSupply", {
  id: int("id").autoincrement().primaryKey(),
  token: mysqlEnum("token", CRYPTO_TOKENS).notNull(),
  totalSupply: double("totalSupply").notNull(),
  circulatingSupply: double("circulatingSupply").notNull(),
  burnedSupply: double("burnedSupply").default(0).notNull(),
  stakedSupply: double("stakedSupply").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CryptoWallet = typeof cryptoWallets.$inferSelect;
export type MiningOperation = typeof miningOperations.$inferSelect;
export type StakingPosition = typeof stakingPositions.$inferSelect;
export type BurningEvent = typeof burningEvents.$inferSelect;
export type SwapOrder = typeof swapOrders.$inferSelect;
export type PriceFeed = typeof priceFeeds.$inferSelect;
export type CryptoTransaction = typeof cryptoTransactions.$inferSelect;
export type TokenSupply = typeof tokenSupply.$inferSelect;

/* ===================== NFT ACHIEVEMENTS ===================== */
export const nftAchievements = mysqlTable("nftAchievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  achievementType: varchar("achievementType", { length: 100 }).notNull(), // "top_miner", "top_staker", "top_burner", "wealthy", etc.
  tier: mysqlEnum("tier", ["bronze", "silver", "gold", "platinum", "diamond"]).default("bronze").notNull(),
  nftId: varchar("nftId", { length: 255 }).unique(), // Blockchain NFT ID
  mintedAt: timestamp("mintedAt"),
  expiresAt: timestamp("expiresAt"), // Weekly badges expire
  metadata: json("metadata"), // { rank: 1, value: 1000, week: "2026-06-10" }
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const achievementBadges = mysqlTable("achievementBadges", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  icon: text("icon"), // SVG or URL
  criteria: json("criteria"), // { type: "mining", threshold: 1000 }
  rarity: mysqlEnum("rarity", ["common", "rare", "epic", "legendary"]).default("common").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/* ===================== REFERRAL SYSTEM ===================== */
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(),
  referredUserId: int("referredUserId").notNull(),
  referralCode: varchar("referralCode", { length: 50 }).unique().notNull(),
  status: mysqlEnum("status", ["pending", "active", "completed"]).default("pending").notNull(),
  rewardAmount: double("rewardAmount").default(0).notNull(),
  rewardToken: varchar("rewardToken", { length: 50 }).default("SKY444").notNull(),
  claimedAt: timestamp("claimedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const referralStats = mysqlTable("referralStats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  totalReferrals: int("totalReferrals").default(0).notNull(),
  activeReferrals: int("activeReferrals").default(0).notNull(),
  totalRewardsEarned: double("totalRewardsEarned").default(0).notNull(),
  totalRewardsClaimed: double("totalRewardsClaimed").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/* ===================== TRADING BOTS ===================== */
export const tradingBots = mysqlTable("tradingBots", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  strategy: mysqlEnum("strategy", ["dca", "grid", "momentum", "mean_reversion", "arbitrage"]).notNull(),
  status: mysqlEnum("status", ["active", "paused", "stopped", "error"]).default("paused").notNull(),
  baseToken: varchar("baseToken", { length: 50 }).notNull(),
  quoteToken: varchar("quoteToken", { length: 50 }).notNull(),
  config: json("config"), // { buyThreshold: 0.05, sellThreshold: 0.1, gridLevels: 10 }
  capital: double("capital").notNull(),
  profitLoss: double("profitLoss").default(0).notNull(),
  winRate: double("winRate").default(0).notNull(), // 0-1
  totalTrades: int("totalTrades").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const botTrades = mysqlTable("botTrades", {
  id: int("id").autoincrement().primaryKey(),
  botId: int("botId").notNull(),
  userId: int("userId").notNull(),
  entryPrice: double("entryPrice").notNull(),
  exitPrice: double("exitPrice"),
  quantity: double("quantity").notNull(),
  pnl: double("pnl").default(0).notNull(),
  status: mysqlEnum("status", ["open", "closed", "cancelled"]).default("open").notNull(),
  enteredAt: timestamp("enteredAt").defaultNow().notNull(),
  exitedAt: timestamp("exitedAt"),
});

export const botPerformance = mysqlTable("botPerformance", {
  id: int("id").autoincrement().primaryKey(),
  botId: int("botId").notNull(),
  userId: int("userId").notNull(),
  date: date("date").notNull(),
  dailyPnl: double("dailyPnl").default(0).notNull(),
  tradesExecuted: int("tradesExecuted").default(0).notNull(),
  winCount: int("winCount").default(0).notNull(),
  lossCount: int("lossCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/* ===================== TYPES ===================== */
export type NFTAchievement = typeof nftAchievements.$inferSelect;
export type AchievementBadge = typeof achievementBadges.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
export type ReferralStats = typeof referralStats.$inferSelect;
export type TradingBot = typeof tradingBots.$inferSelect;
export type BotTrade = typeof botTrades.$inferSelect;
export type BotPerformance = typeof botPerformance.$inferSelect;

// Analytics & Metrics Tables
export const userAnalytics = mysqlTable('user_analytics', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull(),
  featureName: varchar('feature_name', { length: 255 }).notNull(),
  actionType: varchar('action_type', { length: 50 }).notNull(),
  duration: int('duration'),
  timestamp: timestamp('timestamp').notNull(),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const referralRewardsAnalytics = mysqlTable('referral_rewards_analytics', {
  id: int('id').autoincrement().primaryKey(),
  referrerId: int('referrer_id').notNull(),
  referredId: int('referred_id').notNull(),
  rewardAmount: double('reward_amount').notNull(),
  rewardToken: varchar('reward_token', { length: 50 }).notNull(),
  status: mysqlEnum('status', ['pending', 'claimed', 'expired']).notNull(),
  claimedAt: timestamp('claimed_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// tradingSignals already defined above - using existing table

export const seasonalCompetitions = mysqlTable('seasonal_competitions', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  prizePool: double('prize_pool').notNull(),
  prizeToken: varchar('prize_token', { length: 50 }).notNull(),
  status: mysqlEnum('status', ['active', 'completed']).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const competitionScores = mysqlTable('competition_scores', {
  id: int('id').autoincrement().primaryKey(),
  competitionId: int('competition_id').notNull(),
  userId: int('user_id').notNull(),
  score: double('score').notNull(),
  rank: int('rank'),
  prizeEarned: double('prize_earned'),
  claimedAt: timestamp('claimed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pushNotificationsAnalytics = mysqlTable('push_notifications_analytics', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  actionUrl: varchar('action_url', { length: 500 }),
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// AI Code Marketplace Tables
export const codeListings = mysqlTable('code_listings', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().autoincrement(),
  userId: bigint('user_id', { mode: 'bigint' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  code: text('code').notNull(),
  language: varchar('language', { length: 50 }).default('typescript'),
  category: varchar('category', { length: 100 }).notNull(),
  price: decimal('price', { precision: 18, scale: 8 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('SKY444'),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0'),
  reviews: int('reviews').default(0),
  downloads: int('downloads').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const codeSales = mysqlTable('code_sales', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().autoincrement(),
  listingId: bigint('listing_id', { mode: 'bigint' }).notNull(),
  buyerId: bigint('buyer_id', { mode: 'bigint' }).notNull(),
  sellerId: bigint('seller_id', { mode: 'bigint' }).notNull(),
  amount: decimal('amount', { precision: 18, scale: 8 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('SKY444'),
  sellerRoyalty: decimal('seller_royalty', { precision: 18, scale: 8 }).notNull(),
  platformFee: decimal('platform_fee', { precision: 18, scale: 8 }).notNull(),
  status: varchar('status', { length: 20 }).default('completed'),
  transactionHash: varchar('transaction_hash', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const codeReviews = mysqlTable('code_reviews', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().autoincrement(),
  listingId: bigint('listing_id', { mode: 'bigint' }).notNull(),
  reviewerId: bigint('reviewer_id', { mode: 'bigint' }).notNull(),
  rating: int('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const performanceBenchmarks = mysqlTable('performance_benchmarks', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().autoincrement(),
  codeId: bigint('code_id', { mode: 'bigint' }).notNull(),
  executionTime: decimal('execution_time', { precision: 10, scale: 4 }).notNull(),
  memoryUsage: decimal('memory_usage', { precision: 10, scale: 2 }).notNull(),
  cpuUsage: decimal('cpu_usage', { precision: 5, scale: 2 }).notNull(),
  optimizationScore: int('optimization_score').notNull(),
  suggestions: json('suggestions'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const collaborativeSessions = mysqlTable('collaborative_sessions', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().autoincrement(),
  sessionId: varchar('session_id', { length: 255 }).unique().notNull(),
  participants: json('participants'),
  codeContent: text('code_content'),
  language: varchar('language', { length: 50 }).default('typescript'),
  startedAt: timestamp('started_at').defaultNow(),
  endedAt: timestamp('ended_at'),
  status: varchar('status', { length: 20 }).default('active'),
});

// Phase 20 — Referral Tournaments Tables
export const referralTournaments = mysqlTable('referral_tournaments', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  prizePool: decimal('prize_pool', { precision: 18, scale: 8 }).notNull(),
  prizeToken: varchar('prize_token', { length: 50 }).default('SKY444'),
  status: varchar('status', { length: 20 }).default('active'),
  creatorId: bigint('creator_id', { mode: 'bigint' }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const referralTournamentScores = mysqlTable('referral_tournament_scores', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().autoincrement(),
  tournamentId: bigint('tournament_id', { mode: 'bigint' }).notNull(),
  userId: bigint('user_id', { mode: 'bigint' }).notNull(),
  referrals: int('referrals').default(0),
  conversions: int('conversions').default(0),
  score: int('score').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Phase 20 — NFT Marketplace Tables
export const nftListings = mysqlTable('nft_listings', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().autoincrement(),
  creatorId: bigint('creator_id', { mode: 'bigint' }).notNull(),
  ownerId: bigint('owner_id', { mode: 'bigint' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  imageUrl: varchar('image_url', { length: 500 }),
  rarity: varchar('rarity', { length: 20 }).default('common'),
  attributes: json('attributes'),
  price: decimal('price', { precision: 18, scale: 8 }),
  currency: varchar('currency', { length: 50 }).default('SKY444'),
  status: varchar('status', { length: 20 }).default('owned'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const nftAuctions = mysqlTable('nft_auctions', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().autoincrement(),
  nftId: bigint('nft_id', { mode: 'bigint' }).notNull(),
  creatorId: bigint('creator_id', { mode: 'bigint' }).notNull(),
  startPrice: decimal('start_price', { precision: 18, scale: 8 }).notNull(),
  currentBid: decimal('current_bid', { precision: 18, scale: 8 }).notNull(),
  highestBidderId: bigint('highest_bidder_id', { mode: 'bigint' }),
  endDate: date('end_date').notNull(),
  currency: varchar('currency', { length: 50 }).default('SKY444'),
  status: varchar('status', { length: 20 }).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const nftTransactions = mysqlTable('nft_transactions', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().autoincrement(),
  nftId: bigint('nft_id', { mode: 'bigint' }).notNull(),
  fromUserId: bigint('from_user_id', { mode: 'bigint' }).notNull(),
  toUserId: bigint('to_user_id', { mode: 'bigint' }).notNull(),
  price: decimal('price', { precision: 18, scale: 8 }),
  currency: varchar('currency', { length: 50 }).default('SKY444'),
  transactionType: varchar('transaction_type', { length: 20 }).default('sale'),
  transactionHash: varchar('transaction_hash', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});


// 1000 AI Agents System
export const aiAgents = mysqlTable('ai_agents', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 100 }).notNull(), // 'coder', 'analyst', 'trader', 'teacher', 'support', 'moderator', 'creative', 'researcher', 'strategist', 'specialist'
  specialization: varchar('specialization', { length: 255 }).notNull(),
  description: text('description'),
  capabilities: json('capabilities').$type<string[]>().default([]),
  performanceScore: decimal('performance_score', { precision: 5, scale: 2 }).default('0'),
  tasksCompleted: int('tasks_completed').default(0),
  successRate: decimal('success_rate', { precision: 5, scale: 2 }).default('0'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
});

export const agentTasks = mysqlTable('agent_tasks', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().autoincrement(),
  agentId: bigint('agent_id', { mode: 'bigint' }).notNull(),
  userId: bigint('user_id', { mode: 'bigint' }).notNull(),
  taskType: varchar('task_type', { length: 100 }).notNull(),
  description: text('description').notNull(),
  input: json('input'),
  output: json('output'),
  status: varchar('status', { length: 50 }).default('pending'), // 'pending', 'processing', 'completed', 'failed'
  result: text('result'),
  executionTime: int('execution_time'), // milliseconds
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});

export const agentAnalytics = mysqlTable('agent_analytics', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().autoincrement(),
  agentId: bigint('agent_id', { mode: 'bigint' }).notNull(),
  dailyTasks: int('daily_tasks').default(0),
  dailySuccess: int('daily_success').default(0),
  averageExecutionTime: decimal('average_execution_time', { precision: 10, scale: 2 }).default('0'),
  totalEarnings: decimal('total_earnings', { precision: 18, scale: 8 }).default('0'),
  date: date('date').notNull(),
});
