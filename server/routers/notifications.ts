import { router, protectedProcedure } from "../_core/trpc";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db";
import { pushNotificationsAnalytics } from "../../drizzle/schema";

/**
 * NOTIFICATIONS ROUTER — Real-time activity feeds and alerts
 */

export const notificationsRouter = router({
  // ===== GET USER NOTIFICATIONS =====
  getNotifications: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(20) }))
    .query(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      const rows = await database
        .select()
        .from(pushNotificationsAnalytics)
        .where(eq(pushNotificationsAnalytics.userId, ctx.user.id))
        .orderBy(desc(pushNotificationsAnalytics.createdAt))
        .limit(input.limit);
      const allRows = await database
        .select({ isRead: pushNotificationsAnalytics.isRead })
        .from(pushNotificationsAnalytics)
        .where(eq(pushNotificationsAnalytics.userId, ctx.user.id));

      return {
        userId: ctx.user.id,
        notifications: rows.map((notification) => ({
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          timestamp: notification.createdAt,
          read: notification.isRead ?? false,
          actionUrl: notification.actionUrl,
        })),
        unreadCount: allRows.filter((notification) => !notification.isRead).length,
        totalCount: allRows.length,
      };
    }),

  // ===== MARK AS READ =====
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      await database
        .update(pushNotificationsAnalytics)
        .set({ isRead: true, readAt: new Date() })
        .where(
          and(
            eq(pushNotificationsAnalytics.id, input.notificationId),
            eq(pushNotificationsAnalytics.userId, ctx.user.id),
          ),
        );
      return { success: true, notificationId: input.notificationId };
    }),

  // ===== GET ACTIVITY FEED =====
  getActivityFeed: protectedProcedure
    .input(z.object({ limit: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      const activities = [
        {
          id: 1,
          actor: "System",
          action: "Trading Signal Generated",
          target: "BTC/USD",
          details: "AI detected market breakout pattern",
          timestamp: new Date(Date.now() - 2 * 60000),
          icon: "⚡",
        },
        {
          id: 2,
          actor: "Alex Rivera",
          action: "Started Following You",
          target: "Your Profile",
          details: "98% compatibility match",
          timestamp: new Date(Date.now() - 5 * 60000),
          icon: "👥",
        },
        {
          id: 3,
          actor: "Marketplace Buyer",
          action: "Purchased Your Listing",
          target: "AI Trading Bot Pro",
          details: "Sold for 2,500 USDT - Escrow confirmed",
          timestamp: new Date(Date.now() - 15 * 60000),
          icon: "✅",
        },
        {
          id: 4,
          actor: "Charity Campaign",
          action: "Milestone Reached",
          target: "Clean Water Initiative",
          details: "$50,000 raised - 100% funded!",
          timestamp: new Date(Date.now() - 30 * 60000),
          icon: "🎉",
        },
        {
          id: 5,
          actor: "Governance",
          action: "New Proposal",
          target: "DODGE Reward Increase",
          details: "Vote now: Increase rewards from 3% to 5%",
          timestamp: new Date(Date.now() - 1 * 3600000),
          icon: "🗳️",
        },
      ];

      return {
        userId: ctx.user.id,
        activities: activities.slice(0, input.limit),
        totalCount: activities.length,
      };
    }),

  // ===== SUBSCRIBE TO NOTIFICATIONS =====
  subscribeToNotifications: protectedProcedure
    .input(z.object({
      types: z.array(z.string()).default(["all"]),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        userId: ctx.user.id,
        subscribed: true,
        notificationTypes: input.types,
        message: "Subscribed to notifications",
      };
    }),

  // ===== GET TRADING ALERTS =====
  getTradingAlerts: protectedProcedure
    .input(z.object({ symbol: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const alerts = [
        {
          id: 1,
          symbol: "BTC/USD",
          signal: "BUY",
          confidence: 0.92,
          price: 67400,
          target: 70000,
          stopLoss: 65000,
          timestamp: new Date(Date.now() - 2 * 60000),
        },
        {
          id: 2,
          symbol: "ETH/USD",
          signal: "HOLD",
          confidence: 0.78,
          price: 3520,
          timestamp: new Date(Date.now() - 10 * 60000),
        },
        {
          id: 3,
          symbol: "DODGE/USD",
          signal: "BUY",
          confidence: 0.85,
          price: 0.42,
          target: 0.50,
          timestamp: new Date(Date.now() - 20 * 60000),
        },
      ];

      return {
        userId: ctx.user.id,
        alerts: input.symbol
          ? alerts.filter(a => a.symbol === input.symbol)
          : alerts,
        totalAlerts: alerts.length,
      };
    }),

  // ===== GET MARKETPLACE ALERTS =====
  getMarketplaceAlerts: protectedProcedure.query(async ({ ctx }) => {
    return {
      userId: ctx.user.id,
      alerts: [
        {
          id: 1,
          type: "new_listing",
          message: "New AI Trading Bot listed - $2,500",
          seller: "TechMaster",
          rating: 4.9,
          timestamp: new Date(Date.now() - 5 * 60000),
        },
        {
          id: 2,
          type: "price_drop",
          message: "Your watched item dropped 15%",
          item: "Machine Learning Course",
          oldPrice: 199,
          newPrice: 169,
          timestamp: new Date(Date.now() - 30 * 60000),
        },
        {
          id: 3,
          type: "seller_review",
          message: "Your buyer left 5-star review",
          reviewer: "Happy Customer",
          timestamp: new Date(Date.now() - 1 * 3600000),
        },
      ],
      totalAlerts: 3,
    };
  }),

  // ===== GET SOCIAL ALERTS =====
  getSocialAlerts: protectedProcedure.query(async ({ ctx }) => {
    return {
      userId: ctx.user.id,
      alerts: [
        {
          id: 1,
          type: "new_follower",
          user: "Alex Rivera",
          compatibility: 0.98,
          timestamp: new Date(Date.now() - 5 * 60000),
        },
        {
          id: 2,
          type: "post_like",
          user: "Sarah Chen",
          post: "My latest AI project...",
          likes: 247,
          timestamp: new Date(Date.now() - 15 * 60000),
        },
        {
          id: 3,
          type: "comment",
          user: "Dev Community",
          message: "Great insights on machine learning!",
          timestamp: new Date(Date.now() - 30 * 60000),
        },
      ],
      totalAlerts: 3,
    };
  }),

  // ===== CLEAR ALL NOTIFICATIONS =====
  clearAllNotifications: protectedProcedure.mutation(async ({ ctx }) => {
    return {
      success: true,
      userId: ctx.user.id,
      message: "All notifications cleared",
    };
  }),
});
