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
    .input(z.object({ limit: z.number().int().min(1).max(100).default(30) }))
    .query(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      const notifications = await database
        .select()
        .from(pushNotificationsAnalytics)
        .where(eq(pushNotificationsAnalytics.userId, ctx.user.id))
        .orderBy(desc(pushNotificationsAnalytics.createdAt))
        .limit(input.limit);

      return {
        userId: ctx.user.id,
        activities: notifications.map((notification) => ({
          id: notification.id,
          actor: "System",
          action: notification.type,
          target: notification.title,
          details: notification.message,
          timestamp: notification.createdAt,
          icon: null,
        })),
        totalCount: notifications.length,
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
    .input(z.object({ symbol: z.string().trim().min(1).max(32).optional() }))
    .query(async ({ ctx }) => ({
      userId: ctx.user.id,
      alerts: [],
      totalAlerts: 0,
      unavailable: true,
      reason: "No verified market-data provider is configured",
    })),

  // ===== GET MARKETPLACE ALERTS =====
  getMarketplaceAlerts: protectedProcedure.query(async ({ ctx }) => ({
    userId: ctx.user.id,
    alerts: [],
    totalAlerts: 0,
    unavailable: true,
    reason: "Marketplace event notifications are not configured",
  })),

  // ===== GET SOCIAL ALERTS =====
  getSocialAlerts: protectedProcedure.query(async ({ ctx }) => ({
    userId: ctx.user.id,
    alerts: [],
    totalAlerts: 0,
    unavailable: true,
    reason: "Social event notifications are not configured",
  })),

  // ===== CLEAR ALL NOTIFICATIONS =====
  clearAllNotifications: protectedProcedure.mutation(async ({ ctx }) => {
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    await database
      .delete(pushNotificationsAnalytics)
      .where(eq(pushNotificationsAnalytics.userId, ctx.user.id));
    return { success: true, userId: ctx.user.id };
  }),
});
