import { describe, expect, it } from "vitest";
import { healthCheck } from "./health";

describe("healthCheck", () => {
  it("returns a healthy status with measured runtime fields", async () => {
    const result = await healthCheck();

    expect(result.status).toBe("healthy");
    expect(Number.isFinite(result.uptime)).toBe(true);
    expect(result.uptime).toBeGreaterThanOrEqual(0);
    expect(result.memory).toHaveProperty("rss");
    expect(result.timestamp).toMatch(/Z$/);
  });
});
