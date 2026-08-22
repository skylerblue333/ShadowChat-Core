import { directMessages } from "../drizzle/schema";

export type Message = typeof directMessages.$inferSelect;
type Subscriber = (message: Message) => void;

const subscribers = new Map<number, Set<Subscriber>>();

export function subscribeToMessages(userId: number, subscriber: Subscriber): () => void {
  const userSubscribers = subscribers.get(userId) ?? new Set<Subscriber>();
  userSubscribers.add(subscriber);
  subscribers.set(userId, userSubscribers);
  return () => {
    userSubscribers.delete(subscriber);
    if (userSubscribers.size === 0) subscribers.delete(userId);
  };
}

export function publishDirectMessage(message: Message): void {
  [message.senderId, message.recipientId].forEach(userId => {
    subscribers.get(userId)?.forEach(subscriber => subscriber(message));
  });
}

export function subscriberCount(userId?: number): number {
  if (userId !== undefined) return subscribers.get(userId)?.size ?? 0;
  let count = 0;
  subscribers.forEach(userSubscribers => { count += userSubscribers.size; });
  return count;
}
