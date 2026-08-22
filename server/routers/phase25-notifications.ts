import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";

export const phase25NotificationsRouter = router({
  subscribeNotifications: protectedProcedure.input(z.object({ channels: z.array(z.string()) })).query(async ({ input }) => ({
    subscribed: input.channels,
    active: false,
    unavailable: true,
    error: "Notification subscriptions are unavailable until a verified delivery provider is configured",
  })),
  sendNotification: protectedProcedure.input(z.object({ userId: z.string(), message: z.string().min(1) })).mutation(async () => ({
    success: false,
    unavailable: true,
    notificationId: null as string | null,
    error: "Notification delivery is unavailable until a verified provider and user authorization policy are configured",
  })),
  getNotificationHistory: protectedProcedure.query(async () => ({
    notifications: [],
    unavailable: true,
    error: "Notification history is unavailable until a real notification store is connected",
  })),
});
