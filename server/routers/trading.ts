import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { tradeSessions, tradingSignals } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

export const tradingRouter = router({
  // Get AI trading signals for a symbol
  getSignals: publicProcedure
    .input(z.object({ symbol: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const signals = await db
        .select()
        .from(tradingSignals)
        .where(eq(tradingSignals.symbol, input.symbol))
        .orderBy(desc(tradingSignals.createdAt))
        .limit(10);
      return signals;
    }),

  // Generate AI trading signal (server-side LLM)
  generateSignal: publicProcedure
    .input(z.object({ symbol: z.string(), currentPrice: z.number() }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a trading analyst. Provide a BUY, SELL, or HOLD signal with confidence 0-1 and brief analysis.",
          } as any,
          {
            role: "user",
            content: `Analyze ${input.symbol} at $${input.currentPrice}. Provide signal and confidence.`,
          } as any,
        ],
      });

      const contentMsg = response.choices[0]?.message.content;
      const content = typeof contentMsg === "string" ? contentMsg : "";
      const signal = content.includes("BUY")
        ? "buy"
        : content.includes("SELL")
          ? "sell"
          : "hold";
      const confidenceMatch = content.match(/confidence\\s*[:=]?\\s*(0(?:\\.\\d+)?|1(?:\\.0)?)/i);
      if (!confidenceMatch) {
        throw new Error("Model response did not include a verifiable confidence value");
      }
      const confidence = Number(confidenceMatch[1]);
      if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
        throw new Error("Model confidence value is outside the valid range");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.insert(tradingSignals).values([
        {
          symbol: input.symbol,
          signal: signal as "buy" | "sell" | "hold",
          confidence,
          price: input.currentPrice,
          prediction: content as string,
        },
      ]);

      return { signal, confidence, prediction: content as string, created: true };
    }),

  // Create trade session
  openTrade: protectedProcedure
    .input(
      z.object({
        symbol: z.string(),
        entryPrice: z.number(),
        quantity: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.insert(tradeSessions).values([
        {
          userId: ctx.user!.id,
          symbol: input.symbol,
          entryPrice: input.entryPrice,
          quantity: input.quantity,
          status: "open",
        },
      ]);
      return { status: "open", created: true };
    }),

  // Close trade and calculate P&L
  closeTrade: protectedProcedure
    .input(z.object({ tradeId: z.number(), exitPrice: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const trade = await db
        .select()
        .from(tradeSessions)
        .where(eq(tradeSessions.id, input.tradeId))
        .then((r: typeof tradeSessions.$inferSelect[]) => r[0]);

      if (!trade || trade.userId !== ctx.user!.id) {
        throw new Error("Trade not found");
      }

      const profitLoss = (input.exitPrice - trade.entryPrice) * trade.quantity;

      await db
        .update(tradeSessions)
        .set({
          exitPrice: input.exitPrice,
          profitLoss: profitLoss,
          status: "closed" as const,
          closedAt: new Date(),
        })
        .where(eq(tradeSessions.id, input.tradeId));

      return { profitLoss, status: "closed" };
    }),

  // Get user's trade history
  getTradeHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const trades = await db
      .select()
      .from(tradeSessions)
      .where(eq(tradeSessions.userId, ctx.user!.id))
      .orderBy(desc(tradeSessions.createdAt));
    return trades;
  }),
});
