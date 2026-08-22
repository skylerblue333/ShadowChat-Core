import { describe, expect, it } from "vitest";
import { canReadMessage, createMessageInput, createMessageRecord } from "./messaging-contract";

describe("messaging contract", () => {
  it("accepts bounded non-empty content", () => {
    expect(createMessageInput.parse({ recipientId: 2, content: " hello " })).toEqual({
      recipientId: 2,
      content: "hello",
    });
  });

  it("rejects empty and oversized content", () => {
    expect(() => createMessageInput.parse({ recipientId: 2, content: "   " })).toThrow();
    expect(() => createMessageInput.parse({ recipientId: 2, content: "x".repeat(2_001) })).toThrow();
  });

  it("creates a typed record with stable supplied identity and time", () => {
    const now = new Date("2026-08-22T12:00:00.000Z");
    const record = createMessageRecord(1, { recipientId: 2, content: "hello" }, now, "message-1");
    expect(record).toEqual({
      id: "message-1",
      senderId: 1,
      recipientId: 2,
      content: "hello",
      createdAt: now,
    });
  });

  it("rejects self-messaging and restricts reads to participants", () => {
    expect(() => createMessageRecord(1, { recipientId: 1, content: "hello" })).toThrow("different users");
    const message = { senderId: 1, recipientId: 2 };
    expect(canReadMessage(1, message)).toBe(true);
    expect(canReadMessage(2, message)).toBe(true);
    expect(canReadMessage(3, message)).toBe(false);
  });
});
