import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { cryptoWallets, miningOperations, stakingPositions, burningEvents, swapOrders, priceFeeds, cryptoTransactions, tokenSupply, miningDifficulty, CRYPTO_TOKENS } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

const TokenEnum = z.enum(CRYPTO_TOKENS);

export const cryptoRouter = router({
  // ============ WALLET MANAGEMENT ============
  getWallet: protectedProcedure
    .input(z.object({ token: TokenEnum }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      const wallet = await db
        .select()
        .from(cryptoWallets)
        .where(and(eq(cryptoWallets.userId, ctx.user.id), eq(cryptoWallets.token, input.token)))
        .limit(1);

      return wallet[0] || null;
    }),

  getAllWallets: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(cryptoWallets)
      .where(eq(cryptoWallets.userId, ctx.user.id));
  }),

  initializeWallet: protectedProcedure
    .input(z.object({ token: TokenEnum, initialBalance: z.number().nonnegative().default(0) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      try {
        if (input.initialBalance !== 0) {
          return { success: false, error: "Initial balances must come from a verified deposit" };
        }

        const existing = await db
          .select({ id: cryptoWallets.id })
          .from(cryptoWallets)
          .where(and(eq(cryptoWallets.userId, ctx.user.id), eq(cryptoWallets.token, input.token)))
          .limit(1);
        if (existing[0]) return { success: false, error: "Wallet already initialized" };

        await db.insert(cryptoWallets).values({
          userId: ctx.user.id,
          token: input.token,
          balance: 0,
        });
        return { success: true };
      } catch {
        return { success: false };
      }
    }),

  // ============ MINING ============
  startMining: protectedProcedure
    .input(z.object({ token: TokenEnum, hashRate: z.number().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "DB unavailable" };

      try {
        // Get current difficulty
        const difficulty = await db
          .select()
          .from(miningDifficulty)
          .where(eq(miningDifficulty.token, input.token))
          .limit(1);

        const currentDiff = difficulty[0]?.currentDifficulty || 1;
        const reward = 10 / (currentDiff / 100); // Reward inversely proportional to difficulty

        const result = await db.insert(miningOperations).values({
          userId: ctx.user.id,
          token: input.token,
          difficulty: currentDiff,
          hashRate: input.hashRate,
          rewardAmount: reward,
          status: "active",
        });

        return { success: true, operationId: (result as any).insertId || 0, reward };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  completeMining: protectedProcedure
    .input(z.object({ operationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      try {
        const operation = await db
          .select()
          .from(miningOperations)
          .where(and(eq(miningOperations.id, input.operationId), eq(miningOperations.userId, ctx.user.id)))
          .limit(1);

        if (!operation[0]) return { success: false, error: "Operation not found" };

        const op = operation[0];

        // Update mining operation
        await db
          .update(miningOperations)
          .set({ status: "completed", completedAt: new Date() })
          .where(eq(miningOperations.id, input.operationId));

        // Add reward to wallet
        const wallet = await db
          .select()
          .from(cryptoWallets)
          .where(and(eq(cryptoWallets.userId, ctx.user.id), eq(cryptoWallets.token, op.token)))
          .limit(1);

        if (wallet[0]) {
          await db
            .update(cryptoWallets)
            .set({
              balance: wallet[0].balance + op.rewardAmount,
              totalMined: wallet[0].totalMined + op.rewardAmount,
            })
            .where(eq(cryptoWallets.id, wallet[0].id));
        }

        // Record transaction
        await db.insert(cryptoTransactions).values({
          userId: ctx.user.id,
          token: op.token,
          type: "mining",
          amount: op.rewardAmount,
          relatedId: input.operationId,
          description: `Mining reward: ${op.rewardAmount} ${op.token}`,
        });

        return { success: true, reward: op.rewardAmount };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  getMiningOperations: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(miningOperations)
      .where(eq(miningOperations.userId, ctx.user.id))
      .orderBy(desc(miningOperations.startedAt));
  }),

  // ============ STAKING ============
  startStaking: protectedProcedure
    .input(z.object({ token: TokenEnum, amount: z.number().min(1), lockPeriodDays: z.number().min(1).max(365) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      try {
        const wallet = await db
          .select()
          .from(cryptoWallets)
          .where(and(eq(cryptoWallets.userId, ctx.user.id), eq(cryptoWallets.token, input.token)))
          .limit(1);

        if (!wallet[0] || wallet[0].balance < input.amount) {
          return { success: false, error: "Insufficient balance" };
        }

        // Calculate APY based on lock period (longer lock = higher APY)
        const apy = 5 + (input.lockPeriodDays / 365) * 15; // 5-20% APY

        const unlocksAt = new Date();
        unlocksAt.setDate(unlocksAt.getDate() + input.lockPeriodDays);

        const result = await db.insert(stakingPositions).values({
          userId: ctx.user.id,
          token: input.token,
          amount: input.amount,
          apy,
          lockPeriodDays: input.lockPeriodDays,
          unlocksAt,
        });

        // Deduct from balance, add to staked
        await db
          .update(cryptoWallets)
          .set({
            balance: wallet[0].balance - input.amount,
            stakedBalance: wallet[0].stakedBalance + input.amount,
          })
          .where(eq(cryptoWallets.id, wallet[0].id));

        return { success: true, positionId: (result as any).insertId || 0, apy };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  unstake: protectedProcedure
    .input(z.object({ positionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      try {
        const position = await db
          .select()
          .from(stakingPositions)
          .where(and(eq(stakingPositions.id, input.positionId), eq(stakingPositions.userId, ctx.user.id)))
          .limit(1);

        if (!position[0]) return { success: false, error: "Position not found" };

        const pos = position[0];
        if (new Date() < pos.unlocksAt) {
          return { success: false, error: "Staking period not complete" };
        }

        // Calculate rewards
        const daysPassed = Math.floor((Date.now() - pos.startedAt.getTime()) / (1000 * 60 * 60 * 24));
        const rewards = (pos.amount * pos.apy * daysPassed) / (365 * 100);

        // Update position
        await db
          .update(stakingPositions)
          .set({ status: "unstaked", rewardsClaimed: rewards })
          .where(eq(stakingPositions.id, input.positionId));

        // Return funds + rewards to wallet
        const wallet = await db
          .select()
          .from(cryptoWallets)
          .where(and(eq(cryptoWallets.userId, ctx.user.id), eq(cryptoWallets.token, pos.token)))
          .limit(1);

        if (wallet[0]) {
          await db
            .update(cryptoWallets)
            .set({
              balance: wallet[0].balance + pos.amount + rewards,
              stakedBalance: wallet[0].stakedBalance - pos.amount,
            })
            .where(eq(cryptoWallets.id, wallet[0].id));
        }

        // Record transaction
        await db.insert(cryptoTransactions).values({
          userId: ctx.user.id,
          token: pos.token,
          type: "staking_reward",
          amount: rewards,
          relatedId: input.positionId,
          description: `Staking reward: ${rewards} ${pos.token}`,
        });

        return { success: true, rewards, totalReturned: pos.amount + rewards };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  getStakingPositions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(stakingPositions)
      .where(eq(stakingPositions.userId, ctx.user.id))
      .orderBy(desc(stakingPositions.startedAt));
  }),

  // ============ BURNING ============
  burnTokens: protectedProcedure
    .input(z.object({ token: TokenEnum, amount: z.number().min(1), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      try {
        const wallet = await db
          .select()
          .from(cryptoWallets)
          .where(and(eq(cryptoWallets.userId, ctx.user.id), eq(cryptoWallets.token, input.token)))
          .limit(1);

        if (!wallet[0] || wallet[0].balance < input.amount) {
          return { success: false, error: "Insufficient balance" };
        }

        // Record burning event
        await db.insert(burningEvents).values({
          userId: ctx.user.id,
          token: input.token,
          amount: input.amount,
          reason: input.reason || "manual",
          supplyReduction: input.amount,
        });

        // Update wallet
        await db
          .update(cryptoWallets)
          .set({
            balance: wallet[0].balance - input.amount,
            totalBurned: wallet[0].totalBurned + input.amount,
          })
          .where(eq(cryptoWallets.id, wallet[0].id));

        // Update token supply
        const supply = await db
          .select()
          .from(tokenSupply)
          .where(eq(tokenSupply.token, input.token))
          .limit(1);

        if (supply[0]) {
          await db
            .update(tokenSupply)
            .set({
              circulatingSupply: supply[0].circulatingSupply - input.amount,
              burnedSupply: supply[0].burnedSupply + input.amount,
            })
            .where(eq(tokenSupply.id, supply[0].id));
        }

        // Record transaction
        await db.insert(cryptoTransactions).values({
          userId: ctx.user.id,
          token: input.token,
          type: "burn",
          amount: input.amount,
          description: `Burned ${input.amount} ${input.token}`,
        });

        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  // ============ SWAPPING ============
  getSwapRate: protectedProcedure
    .input(z.object({ fromToken: TokenEnum, toToken: TokenEnum, amount: z.number().min(0.001) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { rate: null, toAmount: null, unavailable: true, reason: "Verified price data is unavailable" };

      try {
        const prices = await db.select().from(priceFeeds).where(eq(priceFeeds.token, input.fromToken));
        const toPrices = await db.select().from(priceFeeds).where(eq(priceFeeds.token, input.toToken));

        const fromPrice = prices[0]?.priceUsd;
        const toPrice = toPrices[0]?.priceUsd;
        if (fromPrice == null || toPrice == null || toPrice <= 0) {
          return { rate: null, toAmount: null, unavailable: true, reason: "Verified price data is unavailable" };
        }

        const rate = fromPrice / toPrice;
        const toAmount = input.amount * rate * 0.99; // 1% slippage

        return { rate, toAmount, slippage: 0.01, unavailable: false };
      } catch {
        return { rate: null, toAmount: null, unavailable: true, reason: "Verified price data is unavailable" };
      }
    }),

  swap: protectedProcedure
    .input(z.object({ fromToken: TokenEnum, toToken: TokenEnum, fromAmount: z.number().min(0.001) }))
    .mutation(async () => ({
      success: false,
      unavailable: true,
      toAmount: null as number | null,
      error: "Token swaps are unavailable until verified pricing and exchange settlement are configured",
    })),

  getSwapHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(swapOrders)
      .where(eq(swapOrders.userId, ctx.user.id))
      .orderBy(desc(swapOrders.createdAt));
  }),

  // ============ PRICES & SUPPLY ============
  getPrices: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return db.select().from(priceFeeds);
  }),

  getTokenSupply: protectedProcedure
    .input(z.object({ token: TokenEnum }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      const supply = await db
        .select()
        .from(tokenSupply)
        .where(eq(tokenSupply.token, input.token))
        .limit(1);

      return supply[0] || null;
    }),

  // ============ TRANSACTION HISTORY ============
  getTransactionHistory: protectedProcedure
    .input(z.object({ token: TokenEnum.optional(), limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      let whereConditions = [eq(cryptoTransactions.userId, ctx.user.id)];
      if (input.token) {
        whereConditions.push(eq(cryptoTransactions.token, input.token));
      }

      return db
        .select()
        .from(cryptoTransactions)
        .where(and(...whereConditions))
        .orderBy(desc(cryptoTransactions.createdAt))
        .limit(input.limit);
    }),

  // ============ PORTFOLIO ============
  getPortfolio: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { wallets: [], totalValueUsd: 0 };

    const wallets = await db.select().from(cryptoWallets).where(eq(cryptoWallets.userId, ctx.user.id));

    const prices = await db.select().from(priceFeeds);

    let totalValueUsd = 0;
    const enriched = wallets.map((w) => {
      const price = prices.find((p) => p.token === w.token)?.priceUsd || 0;
      const valueUsd = (w.balance + w.stakedBalance) * price;
      totalValueUsd += valueUsd;
      return { ...w, price, valueUsd };
    });

    return { wallets: enriched, totalValueUsd };
  }),
});
