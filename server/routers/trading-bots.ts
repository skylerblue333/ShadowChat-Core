import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { tradingBots, botTrades, botPerformance } from "../../drizzle/schema";
import { and, eq, gte } from "drizzle-orm";

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

      const result = await db
        .update(tradingBots)
        .set({ status: "active" })
        .where(and(eq(tradingBots.id, input.botId), eq(tradingBots.userId, ctx.user.id)));
      if (Number(result[0].affectedRows ?? 0) === 0) {
        return { success: false, botId: input.botId, error: "Trading bot not found" };
      }
      return { success: true, botId: input.botId, status: "active" as const };
    }),

  stopBot: protectedProcedure
    .input(z.object({ botId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .update(tradingBots)
        .set({ status: "stopped" })
        .where(and(eq(tradingBots.id, input.botId), eq(tradingBots.userId, ctx.user.id)));
      if (Number(result[0].affectedRows ?? 0) === 0) {
        return { success: false, botId: input.botId, error: "Trading bot not found" };
      }
      return { success: true, botId: input.botId, status: "stopped" as const };
    }),

  getBotPerformance: protectedProcedure
    .input(z.object({ botId: z.number().int().positive(), days: z.number().int().min(1).max(365).default(7) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const cutoff = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
      const rows = await db
        .select()
        .from(botPerformance)
        .where(
          and(
            eq(botPerformance.botId, input.botId),
            eq(botPerformance.userId, ctx.user.id),
            gte(botPerformance.date, cutoff),
          ),
        );
      const tradesExecuted = rows.reduce((sum, row) => sum + row.tradesExecuted, 0);
      const wins = rows.reduce((sum, row) => sum + row.winCount, 0);
      const losses = rows.reduce((sum, row) => sum + row.lossCount, 0);
      return {
        botId: input.botId,
        days: input.days,
        totalPnl: rows.reduce((sum, row) => sum + row.dailyPnl, 0),
        winRate: wins + losses > 0 ? wins / (wins + losses) : 0,
        tradesExecuted,
        avgWin: null,
        avgLoss: null,
        dataPoints: rows.length,
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
    .mutation(async () => ({
      success: false,
      unavailable: true,
      error: "Trade execution is unavailable until a verified exchange integration is configured",
    })),
});
