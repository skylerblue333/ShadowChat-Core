import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const { dbMock } = vi.hoisted(() => ({
  dbMock: { select: vi.fn() },
}));

vi.mock("../db", () => ({ getDb: vi.fn().mockResolvedValue(dbMock) }));

import { messagesRouter } from "./messages";

function authCtx(): TrpcContext {
  return {
    user: {
      id: 8,
      openId: "u8",
      email: null,
      name: "User",
      loginMethod: "test",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("messages.conversation", () => {
  it("loads a conversation containing both directions", async () => {
    const rows = [
      { id: 1, senderId: 8, recipientId: 9, content: "hello", createdAt: new Date("2026-01-01") },
      { id: 2, senderId: 9, recipientId: 8, content: "hi", createdAt: new Date("2026-01-01T00:01:00Z") },
    ];
    const participantLookup = {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([{ id: 9 }]) }),
      }),
    };
    const conversationQuery = {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue(rows) }),
        }),
      }),
    };
    dbMock.select
      .mockReturnValueOnce(participantLookup)
      .mockReturnValueOnce(conversationQuery);

    const result = await messagesRouter.createCaller(authCtx()).conversation({ participantId: 9, limit: 50 });

    expect(result).toEqual(rows);
    expect(conversationQuery.from().where).toHaveBeenCalledTimes(1);
  });
});
