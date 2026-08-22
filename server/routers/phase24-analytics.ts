import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";

export const phase24AnalyticsRouter = router({
  getDetailedAnalytics: publicProcedure.query(async () => ({
    unavailable: true,
    error: "Detailed analytics are unavailable until real event instrumentation and verified aggregation queries are configured",
  })),
  getCustomReport: protectedProcedure.input(z.object({ metrics: z.array(z.string()).min(1) })).query(async ({ input }) => ({
    requestedMetrics: input.metrics,
    unavailable: true,
    error: "Custom analytics reports are unavailable until requested metrics are backed by verified data sources",
  })),
  exportAnalytics: protectedProcedure.input(z.object({ format: z.enum(["csv", "json", "pdf"]) })).mutation(async ({ input }) => ({
    format: input.format,
    unavailable: true,
    error: "Analytics export is unavailable until a verified report generator and storage target are configured",
  })),
});
