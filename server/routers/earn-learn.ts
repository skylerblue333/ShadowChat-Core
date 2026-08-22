import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";

export const earnLearnRouter = router({
  getCourseRewards: protectedProcedure.query(async () => ({
    rewards: [],
    unavailable: true,
    error: "Course rewards are unavailable until verified course completion and reward accounting are configured",
  })),

  completeCourse: protectedProcedure
    .input(z.object({ courseId: z.number().int().positive() }))
    .mutation(async () => ({
      success: false,
      unavailable: true,
      reward: null as number | null,
      token: null as string | null,
      error: "Course completion rewards are unavailable until real enrollment and completion records are configured",
    })),

  getCertifications: protectedProcedure.query(async () => ({
    certifications: [],
    unavailable: true,
    error: "Certifications are unavailable until verified issuance and credential storage are configured",
  })),

  claimCertificationReward: protectedProcedure
    .input(z.object({ certId: z.number().int().positive() }))
    .mutation(async () => ({
      success: false,
      unavailable: true,
      reward: null as number | null,
      token: null as string | null,
      error: "Certification rewards are unavailable until verified credentials and reward accounting are configured",
    })),

  getLearningStreak: protectedProcedure.query(async () => ({
    streak: null as number | null,
    totalLearningHours: null as number | null,
    nextReward: null as number | null,
    unavailable: true,
    error: "Learning streaks are unavailable until real activity events are persisted",
  })),

  claimDailyLearningBonus: protectedProcedure.mutation(async () => ({
    success: false,
    unavailable: true,
    bonus: null as number | null,
    token: null as string | null,
    error: "Daily learning bonuses are unavailable until persistent eligibility and reward accounting are configured",
  })),

  getReferralEarnings: protectedProcedure.query(async () => ({
    totalEarned: null as number | null,
    pending: null as number | null,
    referrals: null as number | null,
    commissionRate: null as number | null,
    unavailable: true,
    error: "Referral earnings are unavailable until verified attribution and ledger data are configured",
  })),

  withdrawEarnings: protectedProcedure
    .input(z.object({ amount: z.number().positive(), token: z.string().min(1) }))
    .mutation(async () => ({
      success: false,
      unavailable: true,
      txHash: null as string | null,
      error: "Earnings withdrawal is unavailable until a verified ledger, signer, and network integration are configured",
    })),
});
