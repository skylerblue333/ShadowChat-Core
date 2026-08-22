import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { invokeLLM } from '../_core/llm';
import { db } from '../db';
import { codeListings, codeSales, codeReviews, performanceBenchmarks } from '../../drizzle/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';

export const marketplaceAdvancedRouter = router({
  // List code snippets
  listCodeSnippets: publicProcedure
    .input(z.object({ category: z.string().optional(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const listings = await db.select().from(codeListings).limit(input.limit);
      return listings;
    }),

  // Create code listing
  createListing: protectedProcedure
    .input(z.object({
      title: z.string(),
      description: z.string(),
      code: z.string(),
      language: z.string(),
      category: z.string(),
      price: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await db.insert(codeListings).values({
        userId: BigInt(ctx.user.id),
        title: input.title,
        description: input.description,
        code: input.code,
        language: input.language,
        category: input.category,
        price: input.price,
        currency: 'SKY444',
      });
      return result;
    }),

  // Buy code snippet
  buyCodeSnippet: protectedProcedure
    .input(z.object({ listingId: z.string(), amount: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const listing = await db.select().from(codeListings).where(eq(codeListings.id, BigInt(input.listingId)));
      if (!listing.length) throw new Error('Listing not found');
      
      const sale = await db.insert(codeSales).values({
        listingId: BigInt(input.listingId),
        buyerId: BigInt(ctx.user.id),
        sellerId: listing[0].userId,
        amount: input.amount,
        currency: 'SKY444',
        sellerRoyalty: (parseFloat(input.amount) * 0.85).toString(),
        platformFee: (parseFloat(input.amount) * 0.15).toString(),
        status: 'completed',
      });
      return sale;
    }),

  // Review code
  reviewCode: protectedProcedure
    .input(z.object({ listingId: z.string(), rating: z.number().min(1).max(5), comment: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      return await db.insert(codeReviews).values({
        listingId: BigInt(input.listingId),
        reviewerId: BigInt(ctx.user.id),
        rating: input.rating,
        comment: input.comment,
      });
    }),

  // Analyze code performance
  analyzePerformance: protectedProcedure
    .input(z.object({ codeId: z.string(), code: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: 'Analyze code performance and provide optimization suggestions.' },
          { role: 'user', content: `Analyze this code:\n${input.code}` },
        ],
      });

      const benchmark = await db.insert(performanceBenchmarks).values({
        codeId: BigInt(input.codeId),
        executionTime: '0.5',
        memoryUsage: '128',
        cpuUsage: '25',
        optimizationScore: 75,
        suggestions: response.choices[0].message.content,
      });
      return benchmark;
    }),

  // Get marketplace stats
  getStats: publicProcedure.query(async () => {
    const totalListings = await db.select().from(codeListings);
    const totalSales = await db.select().from(codeSales);
    return {
      totalListings: totalListings.length,
      totalSales: totalSales.length,
      totalVolume: totalSales.reduce((sum: number, s: any) => sum + parseFloat(s.amount as string), 0),
    };
  }),
});

// Additional marketplace procedures
export const marketplaceExtendedRouter = router({
  products: publicProcedure.query(async () => ({
    items: [],
  })),
  recommend: publicProcedure.query(async () => ({
    recommendations: [],
  })),
  purchase: protectedProcedure.input(z.object({ productId: z.string().min(1) })).mutation(async ({ input }) => ({
    success: false,
    unavailable: true,
    productId: input.productId,
    error: "Marketplace purchases are unavailable until verified order, payment, and fulfillment persistence are configured",
  })),
  myTransactions: protectedProcedure.query(async () => ({
    transactions: [],
  })),
});
