import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";

export const aiRouter = router({
  chat: publicProcedure
    .input(z.object({ message: z.string().min(1) }))
    .mutation(async ({ input }) => ({
      success: false,
      unavailable: true,
      response: null as string | null,
      message: input.message,
      error: "Core AI chat is unavailable until a verified model integration is configured; use the HopeAI service for supported AI interactions",
    })),
  getOutputs: publicProcedure
    .input(z.array(z.string()).optional())
    .query(async () => ({
      outputs: [],
      unavailable: true,
      error: "AI output history is unavailable until persistent model-output storage is configured",
    })),
});
