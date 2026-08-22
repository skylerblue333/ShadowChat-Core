import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";

export const phase30GatewayRouter = router({
  checkRateLimit: publicProcedure.input(z.object({ endpoint: z.string().min(1) })).query(async ({ input }) => ({
    endpoint: input.endpoint,
    remaining: null as number | null,
    limit: null as number | null,
    resetAt: null as Date | null,
    unavailable: true,
    error: "Rate-limit state is unavailable until measured gateway counters are configured",
  })),
  getGatewayStatus: publicProcedure.query(async () => ({
    status: "unavailable" as const,
    uptime: null as number | null,
    requestsPerSecond: null as number | null,
    unavailable: true,
    error: "Gateway status is unavailable until measured health and traffic telemetry are configured",
  })),
});
