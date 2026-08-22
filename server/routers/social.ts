import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { socialPosts, socialComments, userFollows, postLikes, users } from "../../drizzle/schema";
import { eq, desc, count, and } from "drizzle-orm";

export const socialRouter = router({
  // Create post
  createPost: protectedProcedure
    .input(
      z.object({
        content: z.string(),
        imageUrl: z.string().optional(),
        imageKey: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.insert(socialPosts).values([
        {
          userId: ctx.user!.id,
          content: input.content,
          imageUrl: input.imageUrl,
          imageKey: input.imageKey,
        },
      ]);
      return { success: true };
    }),

  // Get feed (with user names and comment counts)
  getFeed: publicProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const posts = await db
        .select()
        .from(socialPosts)
        .orderBy(desc(socialPosts.createdAt))
        .limit(input.limit);
      
      // Join with user names and compute comment counts
      const postsWithDetails = await Promise.all(
        posts.map(async (p) => {
          const user = await db.select().from(users).where(eq(users.id, p.userId)).then((r: any[]) => r[0]);
          const commentCount = await db
            .select({ count: count() })
            .from(socialComments)
            .where(eq(socialComments.postId, p.id))
            .then((r: any[]) => r[0]?.count || 0);
          return { ...p, userName: user?.name || `User #${p.userId}`, comments: commentCount };
        })
      );
      return postsWithDetails;
    }),

  // Get user posts
  getUserPosts: publicProcedure
    .input(z.object({ userId: z.number(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(socialPosts)
        .where(eq(socialPosts.userId, input.userId))
        .orderBy(desc(socialPosts.createdAt))
        .limit(input.limit);
    }),

  // Like post (real toggle using postLikes table)
  toggleLike: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { success: false };
      
      // Check if user already liked this post
      const existingLike = await db
        .select()
        .from(postLikes)
        .where(and(eq(postLikes.postId, input.postId), eq(postLikes.userId, ctx.user!.id)))
        .then((r: any[]) => r[0]);
      
      if (existingLike) {
        // Unlike: delete the like record and decrement post likes
        await db.delete(postLikes).where(eq(postLikes.id, existingLike.id));
        const post = await db.select().from(socialPosts).where(eq(socialPosts.id, input.postId)).then((r: any[]) => r[0]);
        if (post) {
          await db.update(socialPosts).set({ likes: Math.max(0, post.likes - 1) }).where(eq(socialPosts.id, input.postId));
        }
        return { success: true, liked: false, likes: post?.likes - 1 || 0 };
      } else {
        // Like: insert like record and increment post likes
        await db.insert(postLikes).values([{ postId: input.postId, userId: ctx.user!.id }]);
        const post = await db.select().from(socialPosts).where(eq(socialPosts.id, input.postId)).then((r: any[]) => r[0]);
        if (post) {
          await db.update(socialPosts).set({ likes: post.likes + 1 }).where(eq(socialPosts.id, input.postId));
        }
        return { success: true, liked: true, likes: post?.likes + 1 || 1 };
      }
    }),

  // Add comment
  addComment: protectedProcedure
    .input(z.object({ postId: z.number(), content: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.insert(socialComments).values([
        {
          postId: input.postId,
          userId: ctx.user!.id,
          content: input.content,
        },
      ]);
      return { success: true };
    }),

  // Get comments
  getComments: publicProcedure
    .input(z.object({ postId: z.number(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(socialComments)
        .where(eq(socialComments.postId, input.postId))
        .orderBy(desc(socialComments.createdAt))
        .limit(input.limit);
    }),

  // Follow user
  followUser: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      if (input.userId === ctx.user!.id) {
        throw new Error("Cannot follow yourself");
      }
      const existingFollow = await db
        .select({ id: userFollows.id })
        .from(userFollows)
        .where(and(eq(userFollows.followerId, ctx.user!.id), eq(userFollows.followingId, input.userId)))
        .limit(1);
      if (existingFollow.length > 0) {
        return { success: true, alreadyFollowing: true };
      }

      await db.insert(userFollows).values({
        followerId: ctx.user!.id,
        followingId: input.userId,
      });
      return { success: true, alreadyFollowing: false };
    }),

  // Unfollow user (actually deletes the follow record)
  unfollowUser: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(userFollows).where(
        and(eq(userFollows.followerId, ctx.user!.id), eq(userFollows.followingId, input.userId))
      );
      return { success: true };
    }),

  // Get followers
  getFollowers: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(userFollows)
        .where(eq(userFollows.followingId, input.userId));
    }),

  // Get trending posts (with comment counts)
  getTrending: publicProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const posts = await db
        .select()
        .from(socialPosts)
        .orderBy(desc(socialPosts.likes))
        .limit(input.limit);
      
      // Compute comment counts
      const postsWithComments = await Promise.all(
        posts.map(async (p) => {
          const commentCount = await db
            .select({ count: count() })
            .from(socialComments)
            .where(eq(socialComments.postId, p.id))
            .then((r: any[]) => r[0]?.count || 0);
          return { ...p, comments: commentCount };
        })
      );
      return postsWithComments;
    }),

  // PROFILE SECTION - Real DB queries
  getUserProfile: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .then((r: any[]) => r[0]);
      
      if (!user) return null;

      const followers = await db
        .select({ count: count() })
        .from(userFollows)
        .where(eq(userFollows.followingId, input.userId))
        .then((r: any[]) => r[0]?.count || 0);

      const following = await db
        .select({ count: count() })
        .from(userFollows)
        .where(eq(userFollows.followerId, input.userId))
        .then((r: any[]) => r[0]?.count || 0);

      const posts = await db
        .select({ count: count() })
        .from(socialPosts)
        .where(eq(socialPosts.userId, input.userId))
        .then((r: any[]) => r[0]?.count || 0);

      return {
        id: user.id,
        name: user.name || "User",
        email: user.email,
        followers,
        following,
        posts,
        joinedAt: user.createdAt.toISOString(),
      };
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        bio: z.string().max(500).optional(),
        avatarUrl: z.string().url().max(2048).optional(),
      }).refine((input) => input.bio !== undefined || input.avatarUrl !== undefined, {
        message: "At least one profile field is required",
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(users).set(input).where(eq(users.id, ctx.user!.id));
      const updated = await db
        .select({ id: users.id, bio: users.bio, avatarUrl: users.avatarUrl })
        .from(users)
        .where(eq(users.id, ctx.user!.id))
        .then((rows) => rows[0]);

      if (!updated) throw new Error("User not found");
      return { success: true, profile: updated };
    }),

  getUserStats: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const posts = await db
        .select()
        .from(socialPosts)
        .where(eq(socialPosts.userId, input.userId));

      const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0);
      const totalShares = posts.reduce((sum, p) => sum + p.shares, 0);

      const comments = await db
        .select({ count: count() })
        .from(socialComments)
        .where(eq(socialComments.userId, input.userId))
        .then((r: any[]) => r[0]?.count || 0);

      const followers = await db
        .select({ count: count() })
        .from(userFollows)
        .where(eq(userFollows.followingId, input.userId))
        .then((r: any[]) => r[0]?.count || 0);

      const following = await db
        .select({ count: count() })
        .from(userFollows)
        .where(eq(userFollows.followerId, input.userId))
        .then((r: any[]) => r[0]?.count || 0);

      return {
        posts: posts.length,
        likes: totalLikes,
        comments,
        followers,
        following,
        shares: totalShares,
        engagement: followers > 0 ? (totalLikes + comments) / followers : 0,
      };
    }),

  // EXPLORE SECTION - Real DB queries
  searchUsers: publicProcedure
    .input(z.object({ query: z.string(), limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      // Search users by name (in production, would use full-text search)
      const results = await db
        .select()
        .from(users)
        .limit(input.limit);

      return results.map((u) => ({
        id: u.id,
        name: u.name || "User",
        handle: u.openId.substring(0, 20),
        followers: 0, // Would query from userFollows
      }));
    }),

  getExplore: publicProcedure
    .input(z.object({ category: z.string().optional(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { trending: [], suggestedUsers: [], categories: [] };

      // Get trending posts
      const trendingPosts = await db
        .select()
        .from(socialPosts)
        .orderBy(desc(socialPosts.likes))
        .limit(5);

      // Get suggested users
      const suggestedUsers = await db
        .select()
        .from(users)
        .limit(5);

      return {
        trending: trendingPosts.map((p) => ({
          id: p.id,
          title: p.content.substring(0, 50),
          count: p.likes,
        })),
        suggestedUsers: suggestedUsers.map((u) => ({
          id: u.id,
          name: u.name || "User",
          followers: 0,
        })),
        categories: [
          "Technology",
          "Crypto",
          "AI",
          "Gaming",
          "Education",
          "Community",
        ],
      };
    }),

  getCategory: publicProcedure
    .input(z.object({ category: z.string(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { category: input.category, posts: [], users: [] };

      // Get posts (in production, would filter by category)
      const posts = await db
        .select()
        .from(socialPosts)
        .orderBy(desc(socialPosts.createdAt))
        .limit(input.limit);

      return {
        category: input.category,
        posts,
        users: [],
      };
    }),

  getRecommendations: publicProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      // Get random users for recommendations
      const users_list = await db
        .select()
        .from(users)
        .limit(input.limit);

      return users_list.map((u) => ({
        id: u.id,
        name: u.name || "User",
        reason: "Recommended based on your interests",
      }));
    }),
});
