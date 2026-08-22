import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { directMessages, users } from "../../drizzle/schema";
import { createMessageInput } from "../messaging-contract";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const listMessagesInput = z.object({
  participantId: z.number().int().positive(),
  limit: z.number().int().min(1).max(100).default(50),
});

export const messagesRouter = router({
  send: protectedProcedure
    .input(createMessageInput)
    .mutation(async ({ ctx, input }) => {
      if (input.recipientId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot message yourself" });
      }

      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const recipient = await database
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, input.recipientId))
        .limit(1);
      if (recipient.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Recipient not found" });
      }

      const inserted = await database.insert(directMessages).values({
        senderId: ctx.user.id,
        recipientId: input.recipientId,
        content: input.content,
      });
      const messageId = Number(inserted[0].insertId);
      const message = await database
        .select()
        .from(directMessages)
        .where(eq(directMessages.id, messageId))
        .limit(1);

      if (message.length === 0) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Message was not persisted" });
      }
      return message[0];
    }),

  conversation: protectedProcedure
    .input(listMessagesInput)
    .query(async ({ ctx, input }) => {
      if (input.participantId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Conversation participant must differ from current user" });
      }

      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const participant = await database
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, input.participantId))
        .limit(1);
      if (participant.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Conversation participant not found" });
      }

      return database
        .select()
        .from(directMessages)
        .where(
          and(
            eq(directMessages.senderId, ctx.user.id),
            eq(directMessages.recipientId, input.participantId),
          ),
        )
        .orderBy(directMessages.createdAt, directMessages.id)
        .limit(input.limit);
    }),
});
