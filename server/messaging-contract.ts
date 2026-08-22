import { z } from "zod";

const messageContent = z.string().trim().min(1).max(2_000);

export const createMessageInput = z.object({
  recipientId: z.number().int().positive(),
  content: messageContent,
});

export type CreateMessageInput = z.infer<typeof createMessageInput>;

export interface MessageRecord {
  id: string;
  senderId: number;
  recipientId: number;
  content: string;
  createdAt: Date;
}

export function createMessageRecord(
  senderId: number,
  input: CreateMessageInput,
  now = new Date(),
  id = crypto.randomUUID(),
): MessageRecord {
  if (!Number.isInteger(senderId) || senderId < 1) {
    throw new Error("senderId must be a positive integer");
  }
  if (senderId === input.recipientId) {
    throw new Error("sender and recipient must be different users");
  }
  return {
    id,
    senderId,
    recipientId: input.recipientId,
    content: input.content,
    createdAt: now,
  };
}

export function canReadMessage(userId: number, message: Pick<MessageRecord, "senderId" | "recipientId">): boolean {
  return userId === message.senderId || userId === message.recipientId;
}
