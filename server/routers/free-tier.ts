import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";

/**
 * FREE TIER ROUTER — Unlimited free access to all premium features
 * Free Will Model: No paywalls, no restrictions, full platform access
 */

export const freeTierRouter = router({
  // ===== GET USER TIER STATUS =====
  getUserTier: protectedProcedure.query(async ({ ctx }) => {
    return {
      userId: ctx.user.id,
      tier: "unavailable", // All users get premium free
      features: {
        hopeAI: { enabled: false, limit: null as string | null },
        skySchool: { enabled: false, limit: null as string | null },
        arcade: { enabled: false, limit: null as string | null },
        governance: { enabled: false, limit: null as string | null },
        charity: { enabled: false, limit: null as string | null },
        marketplace: { enabled: false, limit: null as string | null },
        analytics: { enabled: false, limit: null as string | null },
        trading: { enabled: false, limit: null as string | null },
        escrowShop: { enabled: false, limit: null as string | null },
        videoStreaming: { enabled: false, limit: null as string | null },
        socialMedia: { enabled: false, limit: null as string | null },
        aiAgents: { enabled: false, limit: null as string | null },
        voiceCommands: { enabled: false, limit: null as string | null },
        advancedSearch: { enabled: false, limit: null as string | null },
        realTimeNotifications: { enabled: false, limit: null as string | null },
        aiCodeGeneration: { enabled: false, limit: null as string | null },
        greyAreaTools: { enabled: false, limit: null as string | null },
      },
      storageQuota: null as string | null,
      apiCallsPerDay: null as string | null,
      message: "Feature availability is unavailable until entitlement policy is configured",
    };
  }),

  // ===== UNLOCK ALL FEATURES =====
  unlockAllFeatures: protectedProcedure.mutation(async ({ ctx }) => ({
    success: false,
    unavailable: true,
    userId: ctx.user.id,
    status: "unavailable" as const,
    features: [],
    error: "Feature entitlements are unavailable until real entitlement policy and billing data are configured",
  })),

  // ===== CHECK FEATURE ACCESS =====
  checkFeatureAccess: protectedProcedure
    .input(z.object({ feature: z.string() }))
    .query(async ({ input, ctx }) => {
      return {
        feature: input.feature,
        hasAccess: false,
        tier: "unavailable" as const,
        unavailable: true,
        message: "Feature access cannot be determined until a real entitlement policy is configured",
      };
    }),

  // ===== GET AVAILABLE FEATURES =====
  getAvailableFeatures: publicProcedure.query(async () => {
    return {
      totalFeatures: 17,
      categories: {
        learning: ["HopeAI", "Sky School", "Beginner Path"],
        entertainment: ["Arcade", "Video Streaming"],
        commerce: ["Marketplace", "Escrow Shop"],
        community: ["Social Media", "Governance", "Charity"],
        trading: ["Day Trade Room", "Analytics"],
        ai: ["AI Agents", "AI Code Generation", "Voice Commands"],
        tools: ["Advanced Search", "Real-time Notifications", "Grey Area Tools"],
      },
      allFeaturesUnlocked: false,
      freeWillModel: true,
      message: "Feature availability is unavailable until entitlement policy is configured",
    };
  }),

  // ===== GET FEATURE LIMITS =====
  getFeatureLimits: protectedProcedure.query(async ({ ctx }) => {
    return {
      userId: ctx.user.id,
      limits: {
        apiCallsPerDay: null as string | null,
        storageGB: null as string | null,
        videoUploadPerDay: null as string | null,
        marketplaceListings: null as string | null,
        tradingSignalsPerDay: null as string | null,
        aiGenerationsPerDay: null as string | null,
        voiceCommandsPerDay: null as string | null,
        notificationsPerDay: null as string | null,
        characterLimit: null as string | null,
      },
      message: "Feature limits are unavailable until entitlement policy is configured",
    };
  }),

  // ===== PREMIUM FEATURES LIST =====
  getPremiumFeatures: publicProcedure.query(async () => {
    return {
      premiumFeatures: [
        {
          name: "HopeAI Code Generation",
          description: "AI-powered code generation, review, and optimization",
          status: "free",
        },
        {
          name: "Sky School",
          description: "AI learning paths with personalized education",
          status: "free",
        },
        {
          name: "Arcade Gaming",
          description: "5+ games with real-time multiplayer",
          status: "free",
        },
        {
          name: "Day Trade Room",
          description: "AI trading signals with voice partner",
          status: "free",
        },
        {
          name: "Escrow Shop",
          description: "Multi-token payments with buyer/seller protection",
          status: "free",
        },
        {
          name: "Video Streaming",
          description: "Upload, stream, and monetize video content",
          status: "free",
        },
        {
          name: "Social Media",
          description: "Profile, feed, explore, messaging, followers",
          status: "free",
        },
        {
          name: "AI Agents",
          description: "Moderation, help desk, recommendations",
          status: "free",
        },
        {
          name: "Voice Commands (444+)",
          description: "Navigate with 444+ voice commands",
          status: "free",
        },
        {
          name: "Advanced Search",
          description: "Full-text search with filters and sorting",
          status: "free",
        },
        {
          name: "Real-time Notifications",
          description: "Activity feeds, alerts, and updates",
          status: "free",
        },
        {
          name: "AI Code Quality Scoring",
          description: "Auto-evaluate and rank generated code",
          status: "free",
        },
        {
          name: "Grey Area Tools",
          description: "Content moderation, age verification, admin controls",
          status: "free",
        },
      ],
      allPremiumFeaturesAreFree: false,
      freeWillModel: "Unavailable until entitlement policy is configured",
    };
  }),

  // ===== UPGRADE TO PREMIUM =====
  upgradeToPremium: protectedProcedure.mutation(async ({ ctx }) => ({
    success: false,
    unavailable: true,
    tier: null as string | null,
    features: [],
    cost: null as string | null,
    error: "Premium upgrades are unavailable until real plan, billing, and entitlement services are configured",
  })),
});
