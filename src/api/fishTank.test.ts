import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { ApiClient } from "./client";
import { FishTankApi } from "./fishTank";

describe("FishTankApi", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function mockFetch(response: object, status = 200) {
    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify(response), { status })
    ) as typeof fetch;
  }

  function createApi() {
    const client = new ApiClient({ baseUrl: "http://api.test" });
    return new FishTankApi(client);
  }

  it("GET /v1/fish-tank returns summary envelope", async () => {
    const summary = {
      initialized: true,
      fish: [
        {
          id: "fish-1",
          definitionId: "def-1",
          name: "摸摸",
          rarity: "common",
          theme: "office",
          personality: "吐泡泡",
          artKey: "fish-tank-fish",
          acquiredSource: "starter",
          createdAt: new Date().toISOString()
        }
      ],
      careAvailability: {
        feed: { available: true, nextAvailableAt: null, cooldownRemainingSeconds: 0 }
      },
      moodCopy: "小鱼正在假装工作。",
      nextAction: "feed"
    };
    mockFetch({ data: summary, error: null });

    const api = createApi();
    const response = await api.getSummary();

    expect(response.data).toEqual(summary);
    expect(response.error).toBeNull();
    const [url] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("http://api.test/v1/fish-tank");
  });

  it("POST /v1/fish-tank/initialize returns summary envelope", async () => {
    const summary = {
      initialized: true,
      fish: [],
      careAvailability: {
        feed: { available: false, nextAvailableAt: null, cooldownRemainingSeconds: 0 }
      },
      moodCopy: "小鱼入缸。",
      nextAction: "wait"
    };
    mockFetch({ data: summary, error: null });

    const api = createApi();
    const response = await api.initializeTank();

    expect(response.data).toEqual(summary);
    expect(response.error).toBeNull();
    const [url, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("http://api.test/v1/fish-tank/initialize");
    expect(init.method).toBe("POST");
    expect(init.body).toBeUndefined();
  });

  it("POST /v1/fish-tank/interactions sends feed interaction with idempotency key", async () => {
    const result = {
      success: true,
      resultCopy: "投喂成功。",
      tank: {
        initialized: true,
        fish: [],
        careAvailability: {
          feed: { available: false, nextAvailableAt: null, cooldownRemainingSeconds: 0 }
        },
        moodCopy: "吃饱了。",
        nextAction: "wait"
      }
    };
    mockFetch({ data: result, error: null });

    const api = createApi();
    const response = await api.interact("feed");

    expect(response.data).toEqual(result);
    expect(response.error).toBeNull();
    const [url, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("http://api.test/v1/fish-tank/interactions");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body);
    expect(body.interactionType).toBe("feed");
    expect(body.idempotencyKey).toMatch(/^fish_tank_feed_/);
  });

  it("returns a network envelope when fetch fails", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error("offline");
    }) as typeof fetch;

    const api = createApi();
    const response = await api.getSummary();

    expect(response.data).toBeNull();
    expect(response.error).toMatchObject({
      code: "NETWORK_ERROR",
      message: "Network request failed"
    });
  });
});
