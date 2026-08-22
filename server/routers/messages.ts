import { and, desc, eq, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { messages } from "../../drizzle/schema";
import { getDb } from "../db";
import { createMessageInput } from "../messaging-contract";
import { protectedProcedure, router } from "../_core/trpc";

const conversationInput = z.object({
  otherUserId: z.number().int().positive(),
  limit: z.number().int().min(1).max(100).default(50),
});

export const messagesRouter = router({
  send: protectedProcedure
    .input(createMessageInput)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Message persistence is unavailable" });
      }
      if (ctx.user.id === input.recipientId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "sender and recipient must be different users" });
      }
      const inserted = await db.insert(messages).values({
        senderId: ctx.user.id,
        recipientId: input.recipientId,
        content: input.content,
      });
      const messageId = Number(inserted[0].insertId);
      const [message] = await db.select().from(messages).where(eq(messages.id, messageId)).limit(1);
      if (!message) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Message was not persisted" });
      }
      return message;
    }),

  conversation: protectedProcedure
    .input(conversationInput)
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Message persistence is unavailable" });
      }
      if (ctx.user.id === input.otherUserId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "conversation requires another user" });
      }
      return db
        .select()
        .from(messages)
        .where(
          or(
            and(eq(messages.senderId, ctx.user.id), eq(messages.recipientId, input.otherUserId)),
            and(eq(messages.senderId, input.otherUserId), eq(messages.recipientId, ctx.user.id)),
          ),
        )
        .orderBy(desc(messages.createdAt))
        .limit(input.limit);
    }),

  markRead: protectedProcedure
    .input(z.object({ messageId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Message persistence is unavailable" });
      }
      const updated = await db
        .update(messages)
        .set({ readAt: new Date() })
        .where(and(eq(messages.id, input.messageId), eq(messages.recipientId, ctx.user.id)));
      return { updated: Number(updated[0].affectedRows) === 1 };
    }),
});
