import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";

export const gamificationRouter = router({
  getUserPoints: protectedProcedure.query(async ({ ctx }) => ({
    userId: ctx.user.id,
    totalPoints: null as number | null,
    level: null as number | null,
    rank: null as number | null,
    streak: null as number | null,
    unavailable: true,
    error: "Gamification points are unavailable until real event accounting and user progress persistence are configured",
  })),

  addPoints: protectedProcedure
    .input(z.object({ action: z.string().min(1), amount: z.number().nonnegative() }))
    .mutation(async () => ({
      success: false,
      unavailable: true,
      pointsAdded: null as number | null,
      totalPoints: null as number | null,
      error: "Points cannot be added until verified event attribution and persistent gamification accounting are configured",
    })),

  getBadges: protectedProcedure.query(async () => ({
    badges: [],
    unavailable: true,
    error: "Badges are unavailable until achievement criteria and persistent user progress are configured",
  })),

  getAchievements: protectedProcedure.query(async () => ({
    achievements: [],
    unavailable: true,
    error: "Achievements are unavailable until verified course, social, and activity progress is configured",
  })),

  getLeaderboard: protectedProcedure
    .input(z.object({ category: z.enum(["points", "level", "wealth", "mining"]).default("points") }))
    .query(async ({ input }) => ({
      category: input.category,
      leaderboard: [],
      unavailable: true,
      error: "Leaderboards are unavailable until privacy-reviewed aggregation and verified source data are configured",
    })),

  unlockAchievement: protectedProcedure
    .input(z.object({ achievementId: z.number().int().positive() }))
    .mutation(async () => ({
      success: false,
      unavailable: true,
      achievement: null as string | null,
      reward: null as number | null,
      error: "Achievement unlocking is unavailable until verified progress and reward accounting are configured",
    })),

  claimDailyReward: protectedProcedure.mutation(async () => ({
    success: false,
    unavailable: true,
    reward: null as number | null,
    nextClaimIn: null as number | null,
    error: "Daily rewards are unavailable until persistent eligibility and reward accounting are configured",
  })),
});
