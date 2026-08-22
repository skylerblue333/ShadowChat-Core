import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const { dbMock } = vi.hoisted(() => ({
  dbMock: { select: vi.fn() },
}));

vi.mock("../db", () => ({ getDb: vi.fn().mockResolvedValue(dbMock) }));

import { phase21RealtimeRouter } from "./phase21-realtime";

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

describe("phase21.getRealtimeFeed", () => {
  it("returns persisted posts and a truthful hasMore value", async () => {
    const rows = [
      { id: 1, author: "Alice", content: "first", likes: 2, timestamp: new Date("2026-01-01" ) },
      { id: 2, author: null, content: "second", likes: 0, timestamp: new Date("2025-12-31") },
    ];
    dbMock.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              offset: vi.fn().mockResolvedValue(rows),
            }),
          }),
        }),
      }),
    });

    const result = await phase21RealtimeRouter.createCaller(authCtx()).getRealtimeFeed({ limit: 1, offset: 0 });

    expect(result.hasMore).toBe(true);
    expect(result.posts).toEqual([{
      id: 1,
      author: "Alice",
      content: "first",
      likes: 2,
      timestamp: new Date("2026-01-01"),
      isLiked: false,
    }]);
    expect(result.nextUpdate).toBeNull();
  });
});
