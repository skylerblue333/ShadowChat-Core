import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { products, courses, proposals, charityCampaigns, socialPosts, videoContent } from "../../drizzle/schema";
import { like, or, and, sql } from "drizzle-orm";

export const advancedSearchRouter = router({
  /**
   * Global search across all modules
   */
  globalSearch: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(200),
        category: z.enum(["all", "marketplace", "school", "governance", "charity", "social", "video"]).optional(),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }: any) => {
      const { query, category, limit } = input;
      const searchTerm = `%${query}%`;
      const results: any[] = [];

      try {
        const db = await getDb();
        if (!db) return { success: false, error: "Database unavailable", results: [], totalResults: 0 };

        // Search marketplace products
        if (!category || category === "all" || category === "marketplace") {
          const productResults = await db
            .select()
            .from(products)
            .where(
              or(
                like(products.title, searchTerm),
                like(products.description, searchTerm),
                like(products.category, searchTerm)
              )
            )
            .limit(limit);

          results.push(
            ...productResults.map((p: any) => ({
              type: "marketplace",
              id: p.id,
              title: p.title,
              description: p.description,
              category: p.category,
              price: p.priceSky,
              icon: "ShoppingBag",
              href: "/marketplace",
            }))
          );
        }

        // Search courses
        if (!category || category === "all" || category === "school") {
          const courseResults = await db
            .select()
            .from(courses)
            .where(
              or(
                like(courses.title, searchTerm),
                like(courses.description, searchTerm),
                like(courses.category, searchTerm)
              )
            )
            .limit(limit);

          results.push(
            ...courseResults.map((c: any) => ({
              type: "school",
              id: c.id,
              title: c.title,
              description: c.description,
              category: c.category,
              level: c.level,
              icon: "BookOpen",
              href: "/school",
            }))
          );
        }

        // Search governance proposals
        if (!category || category === "all" || category === "governance") {
          const proposalResults = await db
            .select()
            .from(proposals)
            .where(
              or(
                like(proposals.title, searchTerm),
                like(proposals.description, searchTerm)
              )
            )
            .limit(limit);

          results.push(
            ...proposalResults.map((p: any) => ({
              type: "governance",
              id: p.id,
              title: p.title,
              description: p.description,
              status: p.status,
              votesFor: p.votesFor,
              votesAgainst: p.votesAgainst,
              icon: "Vote",
              href: "/governance",
            }))
          );
        }

        // Search charity campaigns
        if (!category || category === "all" || category === "charity") {
          const charityResults = await db
            .select()
            .from(charityCampaigns)
            .where(
              or(
                like(charityCampaigns.title, searchTerm),
                like(charityCampaigns.description, searchTerm),
                like(charityCampaigns.goalAmount, searchTerm)
              )
            )
            .limit(limit);

          results.push(
            ...charityResults.map((c: any) => ({
              type: "charity",
              id: c.id,
              title: c.title,
              description: c.description,
              raised: c.raisedAmount,
              goal: c.goalAmount,
              icon: "Heart",
              href: "/charity",
            }))
          );
        }

        // Search social posts
        if (!category || category === "all" || category === "social") {
          const socialResults = await db
            .select()
            .from(socialPosts)
            .where(
              or(
                like(socialPosts.content, searchTerm),
                like(socialPosts.imageUrl, searchTerm)
              )
            )
            .limit(limit);

          results.push(
            ...socialResults.map((s: any) => ({
              type: "social",
              id: s.id,
              title: s.content.substring(0, 60),
              content: s.content,
              likes: s.likes,
              icon: "Users",
              href: "/social",
            }))
          );
        }

        // Search video content
        if (!category || category === "all" || category === "video") {
          const videoResults = await db
            .select()
            .from(videoContent)
            .where(
              or(
                like(videoContent.title, searchTerm),
                like(videoContent.description, searchTerm),
                like(videoContent.category, searchTerm)
              )
            )
            .limit(limit);

          results.push(
            ...videoResults.map((v: any) => ({
              type: "video",
              id: v.id,
              title: v.title,
              description: v.description,
              category: v.category,
              viewers: v.viewers,
              icon: "Video",
              href: "/video",
            }))
          );
        }

        return {
          success: true,
          query,
          category,
          totalResults: results.length,
          results: results.slice(0, limit),
        };
      } catch (error) {
        return {
          success: false,
          error: "Search failed",
          results: [],
          totalResults: 0,
        };
      }
    }),

  /**
   * Trending searches across all modules
   */
  trendingSearches: publicProcedure.query(async () => ({
    trending: [],
    unavailable: true,
    error: "Trending searches are unavailable until measured search-event analytics are configured",
  })),

  /**
   * Search suggestions based on partial query
   */
  searchSuggestions: publicProcedure
    .input(z.object({ query: z.string().min(1).max(100) }))
    .query(async ({ input }: any) => {
      const { query } = input;
      const searchTerm = `${query}%`;

      try {
        const db = await getDb();
        if (!db) return { query, suggestions: [] };

        const suggestions: string[] = [];

        // Get product titles
        const products_data = await db
          .select({ title: products.title })
          .from(products)
          .where(like(products.title, searchTerm))
          .limit(3);

        suggestions.push(...products_data.map((p: any) => p.title));

        // Get course titles
        const courses_data = await db
          .select({ title: courses.title })
          .from(courses)
          .where(like(courses.title, searchTerm))
          .limit(3);

        suggestions.push(...courses_data.map((c: any) => c.title));

        // Get proposal titles
        const proposals_data = await db
          .select({ title: proposals.title })
          .from(proposals)
          .where(like(proposals.title, searchTerm))
          .limit(2);

        suggestions.push(...proposals_data.map((p: any) => p.title));

        return {
          query,
          suggestions: Array.from(new Set(suggestions)).slice(0, 10),
        };
      } catch (error) {
        return {
          query,
          suggestions: [],
        };
      }
    }),

  /**
   * Advanced filters for marketplace search
   */
  marketplaceAdvancedSearch: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        categories: z.array(z.string()).optional(),
        sortBy: z.enum(["newest", "popular", "price_low", "price_high", "rating"]).optional(),
      })
    )
    .query(async ({ input }: any) => {
      const { query, minPrice, maxPrice, categories, sortBy } = input;

      try {
        const db = await getDb();
        if (!db) return { success: false, error: "Database unavailable", results: [], totalResults: 0 };

        let whereConditions: any[] = [];

        if (query) {
          whereConditions.push(
            or(
              like(products.title, `%${query}%`),
              like(products.description, `%${query}%`)
            )
          );
        }

        if (minPrice !== undefined) {
          whereConditions.push(sql`${products.priceSky} >= ${minPrice}`);
        }

        if (maxPrice !== undefined) {
          whereConditions.push(sql`${products.priceSky} <= ${maxPrice}`);
        }

        if (categories && categories.length > 0) {
          whereConditions.push(sql`${products.category} IN (${categories.map((c: any) => `'${c}'`).join(",")})`);
        }

        let query_builder: any = db.select().from(products);

        if (whereConditions.length > 0) {
          query_builder = query_builder.where(and(...whereConditions));
        }

        // Apply sorting
        if (sortBy === "price_low") {
          query_builder = query_builder.orderBy(products.priceSky);
        } else if (sortBy === "price_high") {
          query_builder = query_builder.orderBy(sql`${products.priceSky} DESC`);
        } else if (sortBy === "newest") {
          query_builder = query_builder.orderBy(sql`${products.createdAt} DESC`);
        }

        const results = await query_builder.limit(50);

        return {
          success: true,
          results,
          totalResults: results.length,
        };
      } catch (error) {
        return {
          success: false,
          error: "Advanced search failed",
          results: [],
          totalResults: 0,
        };
      }
    }),
});
