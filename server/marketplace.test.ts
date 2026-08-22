import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TrpcContext } from "./_core/context";

const { dbMock, notifyOwner, invokeLLM } = vi.hoisted(() => ({
  dbMock: {
    listProducts: vi.fn(),
    getProduct: vi.fn(),
    recordTransaction: vi.fn(),
    listUserTransactions: vi.fn(),
    logEvent: vi.fn(),
  },
  notifyOwner: vi.fn().mockResolvedValue(true),
  invokeLLM: vi.fn(),
}));

vi.mock("./db", () => dbMock);
vi.mock("./_core/notification", () => ({ notifyOwner }));
vi.mock("./_core/llm", () => ({ invokeLLM }));

import { marketplaceRouter } from "./routers/marketplace";

function authCtx(): TrpcContext {
  return {
    user: {
      id: 8, openId: "u8", email: null, name: "Buyer", loginMethod: "manus",
      role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

beforeEach(() => vi.clearAllMocks());

describe("marketplace.purchase", () => {
  it("refuses settlement without a verified payment provider and ledger", async () => {
    dbMock.getProduct.mockResolvedValue({ id: 4, title: "AI Trading Bot Pro", priceSky: 2400 });
    const caller = marketplaceRouter.createCaller(authCtx());
    const res = await caller.purchase({ productId: 4, currency: "DODGE" });
    expect(res.success).toBe(false);
    expect(res.unavailable).toBe(true);
    expect(dbMock.recordTransaction).not.toHaveBeenCalled();
    expect(notifyOwner).not.toHaveBeenCalled();
  });

  it("refuses small purchases without a verified payment provider", async () => {
    dbMock.getProduct.mockResolvedValue({ id: 5, title: "Sticker Pack", priceSky: 50 });
    const caller = marketplaceRouter.createCaller(authCtx());
    const res = await caller.purchase({ productId: 5, currency: "TRUMP" });
    expect(res.success).toBe(false);
    expect(res.unavailable).toBe(true);
    expect(dbMock.recordTransaction).not.toHaveBeenCalled();
    expect(notifyOwner).not.toHaveBeenCalled();
  });

  it("returns a not-found result for missing products", async () => {
    dbMock.getProduct.mockResolvedValue(undefined);
    const caller = marketplaceRouter.createCaller(authCtx());
    const res = await caller.purchase({ productId: 999, currency: "SKY444" });
    expect(res.success).toBe(false);
  });
});

describe("marketplace.recommend", () => {
  it("calls the LLM and returns markdown text", async () => {
    dbMock.listProducts.mockResolvedValue([{ id: 1, title: "Dev Kit", category: "tools", priceSky: 100, description: "x" }]);
    invokeLLM.mockResolvedValue({ choices: [{ message: { content: "**Dev Kit** fits your needs." } }] });
    const caller = marketplaceRouter.createCaller(authCtx());
    const res = await caller.recommend({ interest: "developer tooling" });
    expect(invokeLLM).toHaveBeenCalledTimes(1);
    expect(res.recommendation).toContain("Dev Kit");
  });
});
