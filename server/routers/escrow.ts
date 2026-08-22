import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { escrowListings, escrowTransactions } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

export const escrowRouter = router({
  // List active escrow items
  listListings: publicProcedure
    .input(z.object({ category: z.string().optional(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      if (input.category) {
        return await db
          .select()
          .from(escrowListings)
          .where(
            and(
              eq(escrowListings.status, "active"),
              eq(escrowListings.category, input.category)
            )
          )
          .limit(input.limit);
      }
      return await db
        .select()
        .from(escrowListings)
        .where(eq(escrowListings.status, "active"))
        .limit(input.limit);
    }),

  // Get listing details
  getListing: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const listing = await db
        .select()
        .from(escrowListings)
        .where(eq(escrowListings.id, input.id))
        .then((r: any[]) => r[0]);
      return listing || null;
    }),

  // Create listing (seller)
  createListing: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        imageUrl: z.string().optional(),
        imageKey: z.string().optional(),
        priceSky: z.number(),
        priceDodge: z.number(),
        priceTrump: z.number(),
        quantity: z.number().default(1),
        category: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.insert(escrowListings).values([
        {
          sellerId: ctx.user!.id,
          title: input.title,
          description: input.description,
          imageUrl: input.imageUrl,
          imageKey: input.imageKey,
          priceSky: input.priceSky,
          priceDodge: input.priceDodge,
          priceTrump: input.priceTrump,
          quantity: input.quantity,
          category: input.category,
          status: "active",
        },
      ]);
      return { success: true };
    }),

  // Initiate escrow transaction
  initiateTransaction: protectedProcedure
    .input(
      z.object({
        listingId: z.number(),
        currency: z.enum(["SKY444", "DODGE", "TRUMP"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const listing = await db
        .select()
        .from(escrowListings)
        .where(eq(escrowListings.id, input.listingId))
        .then((r: any[]) => r[0]);

      if (!listing) throw new Error("Listing not found");

      const priceMap = {
        SKY444: listing.priceSky,
        DODGE: listing.priceDodge,
        TRUMP: listing.priceTrump,
      };

      const amount = priceMap[input.currency];

      await db.insert(escrowTransactions).values([
        {
          buyerId: ctx.user!.id,
          sellerId: listing.sellerId,
          listingId: input.listingId,
          amount,
          currency: input.currency,
          status: "pending",
        },
      ]);

      return { success: true, amount };
    }),

  // Buyer confirms receipt
  buyerConfirm: protectedProcedure
    .input(z.object({ transactionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const tx = await db
        .select()
        .from(escrowTransactions)
        .where(eq(escrowTransactions.id, input.transactionId))
        .then((r: any[]) => r[0]);

      if (!tx || tx.buyerId !== ctx.user!.id) throw new Error("Transaction not found");

      await db
        .update(escrowTransactions)
        .set({ buyerConfirmed: true })
        .where(eq(escrowTransactions.id, input.transactionId));

      // Confirmation is persisted, but funds remain pending until a verified settlement ledger exists.
      return { success: true, settlementStatus: "pending_settlement" as const };
    }),

  // Seller confirms shipment
  sellerConfirm: protectedProcedure
    .input(z.object({ transactionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const tx = await db
        .select()
        .from(escrowTransactions)
        .where(eq(escrowTransactions.id, input.transactionId))
        .then((r: any[]) => r[0]);

      if (!tx || tx.sellerId !== ctx.user!.id) throw new Error("Transaction not found");

      await db
        .update(escrowTransactions)
        .set({ sellerConfirmed: true })
        .where(eq(escrowTransactions.id, input.transactionId));

      // Confirmation is persisted, but funds remain pending until a verified settlement ledger exists.
      return { success: true, settlementStatus: "pending_settlement" as const };
    }),

  // Get user's transactions
  getTransactions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const buyerTxs = await db
      .select()
      .from(escrowTransactions)
      .where(eq(escrowTransactions.buyerId, ctx.user!.id))
      .orderBy(desc(escrowTransactions.createdAt));
    const sellerTxs = await db
      .select()
      .from(escrowTransactions)
      .where(eq(escrowTransactions.sellerId, ctx.user!.id))
      .orderBy(desc(escrowTransactions.createdAt));
    return [...buyerTxs, ...sellerTxs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }),
});
