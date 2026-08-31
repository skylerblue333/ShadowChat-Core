import { z } from "zod";

const messageContent = z.string().trim().min(1).max(2_000);
const messageId = z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9._:-]+$/);

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

  const parsedInput = createMessageInput.parse(input);
  const parsedId = messageId.parse(id);
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new Error("createdAt must be a valid Date");
  }
  if (senderId === parsedInput.recipientId) {
    throw new Error("sender and recipient must be different users");
  }

  return {
    id: parsedId,
    senderId,
    recipientId: parsedInput.recipientId,
    content: parsedInput.content,
    createdAt: new Date(now.getTime()),
  };
}

export function canReadMessage(userId: number, message: Pick<MessageRecord, "senderId" | "recipientId">): boolean {
  if (!Number.isInteger(userId) || userId < 1) return false;
  return userId === message.senderId || userId === message.recipientId;
}
