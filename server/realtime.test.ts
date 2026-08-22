import { describe, expect, it } from "vitest";
import { publishDirectMessage, subscribeToMessages, subscriberCount } from "./realtime";
import type { Message } from "../drizzle/schema";

const message: Message = {
  id: 1,
  senderId: 10,
  recipientId: 20,
  content: "hello",
  createdAt: new Date("2026-08-22T13:00:00.000Z"),
};

describe("realtime message hub", () => {
  it("delivers a persisted message to both participants", () => {
    const sender: Message[] = [];
    const recipient: Message[] = [];
    const unsubscribeSender = subscribeToMessages(10, value => sender.push(value));
    const unsubscribeRecipient = subscribeToMessages(20, value => recipient.push(value));

    publishDirectMessage(message);

    expect(sender).toEqual([message]);
    expect(recipient).toEqual([message]);
    expect(subscriberCount()).toBe(2);

    unsubscribeSender();
    unsubscribeRecipient();
  });

  it("stops delivery after unsubscribe", () => {
    const received: Message[] = [];
    const unsubscribe = subscribeToMessages(10, value => received.push(value));
    unsubscribe();
    publishDirectMessage(message);
    expect(received).toEqual([]);
    expect(subscriberCount(10)).toBe(0);
  });
});
