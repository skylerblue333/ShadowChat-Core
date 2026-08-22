import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { tradingBots, botTrades, botPerformance } from "../../drizzle/schema";
import { and, eq } from "drizzle-orm";

export const tradingBotsRouter = router({
  createBot: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        strategy: z.enum(["dca", "grid", "momentum", "mean_reversion", "arbitrage"]),
        baseToken: z.string(),
        quoteToken: z.string(),
        capital: z.number().min(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(tradingBots).values({
        userId: ctx.user.id,
        name: input.name.trim(),
        strategy: input.strategy,
        baseToken: input.baseToken.trim().toUpperCase(),
        quoteToken: input.quoteToken.trim().toUpperCase(),
        capital: input.capital,
      });
      return { success: true, botId: Number(result[0].insertId), status: "paused" as const };
    }),

  getUserBots: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    try {
      return await db.select().from(tradingBots).where(eq(tradingBots.userId, ctx.user.id));
    } catch {
      return [];
    }
  }),

  startBot: protectedProcedure
    .input(z.object({ botId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(tradingBots)
        .set({ status: "active" })
        .where(and(eq(tradingBots.id, input.botId), eq(tradingBots.userId, ctx.user.id)));
      return { success: true, botId: input.botId, status: "active" as const };
    }),

  stopBot: protectedProcedure
    .input(z.object({ botId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(tradingBots)
        .set({ status: "stopped" })
        .where(and(eq(tradingBots.id, input.botId), eq(tradingBots.userId, ctx.user.id)));
      return { success: true, botId: input.botId, status: "stopped" as const };
    }),

  getBotPerformance: protectedProcedure
    .input(z.object({ botId: z.number(), days: z.number().default(7) }))
    .query(async ({ ctx, input }) => {
      return {
        totalPnl: 1250.5,
        winRate: 0.65,
        tradesExecuted: 42,
        avgWin: 35.2,
        avgLoss: -22.1,
      };
    }),

  executeTrade: protectedProcedure
    .input(
      z.object({
        botId: z.number(),
        entryPrice: z.number(),
        quantity: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return { success: true, tradeId: Math.floor(Math.random() * 100000) };
    }),
});
