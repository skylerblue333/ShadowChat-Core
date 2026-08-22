import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const { dbMock } = vi.hoisted(() => ({
  dbMock: {
    update: vi.fn(),
    select: vi.fn(),
  },
}));

vi.mock("../db", () => ({ getDb: vi.fn().mockResolvedValue(dbMock) }));

import { socialRouter } from "./social";

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

describe("social.updateProfile", () => {
  it("persists and returns the updated profile fields", async () => {
    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn().mockReturnValue({ where });
    dbMock.update.mockReturnValue({ set });
    dbMock.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: 8, bio: "Builder", avatarUrl: "https://example.com/avatar.png" }]),
      }),
    });

    const result = await socialRouter.createCaller(authCtx()).updateProfile({
      bio: "Builder",
      avatarUrl: "https://example.com/avatar.png",
    });

    expect(set).toHaveBeenCalledWith({ bio: "Builder", avatarUrl: "https://example.com/avatar.png" });
    expect(where).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      success: true,
      profile: { id: 8, bio: "Builder", avatarUrl: "https://example.com/avatar.png" },
    });
  });

  it("rejects an empty profile update", async () => {
    const caller = socialRouter.createCaller(authCtx());
    await expect(caller.updateProfile({})).rejects.toThrow("At least one profile field is required");
  });
});
