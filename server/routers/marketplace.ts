import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { listProducts, getProduct, recordTransaction, listUserTransactions, logEvent } from "../db";
import { notifyOwner } from "../_core/notification";

const LARGE_TX_THRESHOLD = 1000;

export const marketplaceRouter = router({
  products: publicProcedure.query(() => listProducts()),

  product: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getProduct(input.id)),

  recommend: protectedProcedure
    .input(z.object({ interest: z.string().min(2) }))
    .mutation(async ({ input, ctx }) => {
      const products = await listProducts();
      const catalog = products.map(p => `#${p.id} ${p.title} [${p.category}] ${p.priceSky} SKY444 — ${p.description ?? ""}`).join("\n");
      const res = await invokeLLM({
        messages: [
          { role: "system", content: "You are SKYCOIN4444's marketplace AI. Recommend the most relevant products for the user's interest from the catalog. Respond in concise markdown with product names and why each fits." },
          { role: "user", content: `INTEREST: ${input.interest}\n\nCATALOG:\n${catalog || "(catalog empty)"}` },
        ],
        maxTokens: 800,
      });
      await logEvent("ai_recommendation", "marketplace", 1, ctx.user.id);
      const content = res.choices?.[0]?.message?.content;
      return { recommendation: typeof content === "string" ? content : "" };
    }),

  purchase: protectedProcedure
    .input(z.object({ productId: z.number(), currency: z.enum(["SKY444", "DODGE", "TRUMP"]) }))
    .mutation(async ({ input, ctx }) => {
      const product = await getProduct(input.productId);
      if (!product) return { success: false, message: "Product not found." };
      return {
        success: false,
        unavailable: true,
        productId: product.id,
        amount: product.priceSky,
        currency: input.currency,
        error: "Marketplace purchase is unavailable until a verified payment provider and settlement ledger are configured",
      };
    }),

  myTransactions: protectedProcedure.query(({ ctx }) => listUserTransactions(ctx.user.id)),
});
