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
      mood: { code: "idle", title: "一起发呆", copy: "小鱼正在假装工作。", ambientArtKey: "tank-mood-idle" },
      nextAction: "feed",
      decorations: {
        equipped: [],
        inventory: []
      }
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
      mood: { code: "idle", title: "空缸待机", copy: "小鱼入缸。", ambientArtKey: "tank-mood-idle" },
      nextAction: "wait",
      decorations: {
        equipped: [],
        inventory: []
      }
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
        mood: { code: "cozy", title: "吃饱发呆", copy: "吃饱了。", ambientArtKey: "tank-mood-cozy" },
        nextAction: "wait",
        decorations: {
          equipped: [],
          inventory: []
        }
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

  it("POST /v1/fish-tank/interactions sends bubble interaction with idempotency key", async () => {
    const result = {
      success: true,
      replayed: false,
      outcomeCode: "BUBBLED",
      resultCopy: "吹了一个气泡。",
      resourceType: "bubble",
      cost: 1,
      resourceBalance: 1,
      tank: {
        initialized: true,
        fish: [],
        careAvailability: {
          feed: { available: true, nextAvailableAt: null, cooldownRemainingSeconds: 0 },
          bubble: { available: false, nextAvailableAt: null, cooldownRemainingSeconds: 3600 }
        },
        mood: { code: "sparkly", title: "气泡闪闪", copy: "气泡让鱼缸亮了一点。", ambientArtKey: "tank-mood-sparkly" },
        nextAction: "feed",
        decorations: { equipped: [], inventory: [] }
      }
    };
    mockFetch({ data: result, error: null });

    const api = createApi();
    const response = await api.interact("bubble");

    expect(response.data).toEqual(result);
    expect(response.error).toBeNull();
    const [url, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("http://api.test/v1/fish-tank/interactions");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body);
    expect(body.interactionType).toBe("bubble");
    expect(body.idempotencyKey).toMatch(/^fish_tank_bubble_/);
  });

  it("POST /v1/fish-tank/displayed-fish/reorder sends ordered ids with idempotency key", async () => {
    const result = {
      success: true,
      replayed: false,
      outcomeCode: "REORDERED",
      resultCopy: "展示顺序已更新。",
      displayedFish: [],
      tank: {
        initialized: true,
        fish: [],
        displayedFish: [],
        eligibleFish: [],
        careAvailability: {
          feed: { available: true, nextAvailableAt: null, cooldownRemainingSeconds: 0 },
          bubble: { available: true, nextAvailableAt: null, cooldownRemainingSeconds: 0 }
        },
        mood: { code: "idle", title: "一起发呆", copy: "小鱼正在假装工作。", ambientArtKey: "tank-mood-idle" },
        nextAction: "feed",
        decorations: { equipped: [], inventory: [] },
        resourceSummary: { resources: [], totalFood: 0, totalBubbles: 0, totalHatchProgress: 0 },
        costs: { feed: 1, bubble: 1 },
        guidance: { foodSource: "draw", bubbleSource: "draw" }
      }
    };
    mockFetch({ data: result, error: null });

    const api = createApi();
    const response = await api.reorderDisplayedFish(["fish-3", "fish-1"]);

    expect(response.data).toEqual(result);
    expect(response.error).toBeNull();
    const [url, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("http://api.test/v1/fish-tank/displayed-fish/reorder");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body);
    expect(body.displayedFishIds).toEqual(["fish-3", "fish-1"]);
    expect(body.idempotencyKey).toMatch(/^fish_tank_reorder_/);
  });

  it("POST /v1/fish-tank/hatch sends idempotency key and returns result", async () => {
    const result = {
      success: true,
      replayed: false,
      discoveredFish: {
        id: "fish-2",
        definitionId: "def-2",
        name: "打印机和平贝塔",
        rarity: "common",
        theme: "office",
        personality: "宽容卡纸的",
        artKey: "fish-tank-fish",
        acquiredSource: "hatch",
        createdAt: new Date().toISOString()
      },
      cost: 3,
      outcomeCode: "DISCOVERED",
      resultTitle: "新鱼登场",
      resultCopy: "打印机和平贝塔 从进度里游了出来。",
      nextHint: "返回鱼缸看看新邻居。",
      tank: {
        initialized: true,
        fish: [],
        careAvailability: {
          feed: { available: true, nextAvailableAt: null, cooldownRemainingSeconds: 0 }
        },
        mood: { code: "sparkly", title: "新鱼光临", copy: "鱼缸又热闹了一点。", ambientArtKey: "tank-mood-sparkly" },
        nextAction: "feed",
        decorations: {
          equipped: [],
          inventory: []
        }
      }
    };
    mockFetch({ data: result, error: null });

    const api = createApi();
    const response = await api.hatch("fish_tank_hatch_abc123");

    expect(response.data).toEqual(result);
    expect(response.error).toBeNull();
    const [url, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("http://api.test/v1/fish-tank/hatch");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body);
    expect(body.idempotencyKey).toBe("fish_tank_hatch_abc123");
  });

  it("POST /v1/fish-tank/decorations/equip sends slot, decoration id and idempotency key", async () => {
    const result = {
      success: true,
      replayed: false,
      outcomeCode: "EQUIPPED",
      resultTitle: "装扮已更换",
      resultCopy: "工位窗景 已经放进鱼缸的 背景 位置。",
      equipped: {
        slot: "background",
        definitionId: "def-decor-1",
        code: "office_window_background",
        name: "工位窗景",
        type: "background",
        rarity: "rare",
        artKey: "tank-bg-office-window"
      },
      tank: {
        initialized: true,
        fish: [],
        careAvailability: {
          feed: { available: true, nextAvailableAt: null, cooldownRemainingSeconds: 0 }
        },
        mood: { code: "idle", title: "一起发呆", copy: "小鱼游得很慢。", ambientArtKey: "tank-mood-idle" },
        nextAction: "feed",
        decorations: {
          equipped: [
            {
              slot: "background",
              definitionId: "def-decor-1",
              code: "office_window_background",
              name: "工位窗景",
              type: "background",
              rarity: "rare",
              artKey: "tank-bg-office-window"
            }
          ],
          inventory: []
        }
      }
    };
    mockFetch({ data: result, error: null });

    const api = createApi();
    const response = await api.equipDecoration("background", "def-decor-1", "equip-bg-1");

    expect(response.data).toEqual(result);
    expect(response.error).toBeNull();
    const [url, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("http://api.test/v1/fish-tank/decorations/equip");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body);
    expect(body.slot).toBe("background");
    expect(body.decorationDefinitionId).toBe("def-decor-1");
    expect(body.idempotencyKey).toBe("equip-bg-1");
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
