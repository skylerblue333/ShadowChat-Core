import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const { dbMock } = vi.hoisted(() => ({
  dbMock: {
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("../db", () => ({ getDb: vi.fn().mockResolvedValue(dbMock) }));

import { tradingBotsRouter } from "./trading-bots";

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

describe("tradingBotsRouter", () => {
  it("persists a bot and returns its database id", async () => {
    const values = vi.fn().mockResolvedValue([{ insertId: 41 }]);
    dbMock.insert.mockReturnValue({ values });

    const result = await tradingBotsRouter.createCaller(authCtx()).createBot({
      name: "Daily DCA",
      strategy: "dca",
      baseToken: "sky444",
      quoteToken: "usdt",
      capital: 100,
    });

    expect(values).toHaveBeenCalledWith({
      userId: 8,
      name: "Daily DCA",
      strategy: "dca",
      baseToken: "SKY444",
      quoteToken: "USDT",
      capital: 100,
    });
    expect(result).toEqual({ success: true, botId: 41, status: "paused" });
  });

  it("updates lifecycle state only when the bot belongs to the user", async () => {
    const where = vi.fn().mockResolvedValue([{ affectedRows: 1 }]);
    const set = vi.fn().mockReturnValue({ where });
    dbMock.update.mockReturnValue({ set });

    const result = await tradingBotsRouter.createCaller(authCtx()).startBot({ botId: 41 });

    expect(set).toHaveBeenCalledWith({ status: "active" });
    expect(where).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ success: true, botId: 41, status: "active" });
  });
});

