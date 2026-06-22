import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClient } from "./client";

describe("ApiClient", () => {
  const originalFetch = globalThis.fetch;
  const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("adds trace headers and bearer token without a content type for GET", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ data: { ok: true }, error: null }), {
        status: 200
      })
    );
    globalThis.fetch = fetchMock as typeof fetch;

    const client = new ApiClient({
      baseUrl: "http://api.test",
      getAccessToken: async () => "token-123"
    });

    const response = await client.get<{ ok: boolean }>("/v1/check-ins/active");

    expect(response.data).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://api.test/v1/check-ins/active");
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer token-123"
    });
    expect((init?.headers as Record<string, string>)["Content-Type"]).toBeUndefined();
    expect((init?.headers as Record<string, string>)["X-Request-Id"]).toMatch(/^req_/);
    expect((init?.headers as Record<string, string>)["X-Trace-Id"]).toMatch(/^trc_/);
  });

  it("omits the JSON content type for a bodyless POST", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ data: { ok: true }, error: null }), {
        status: 200
      })
    );
    globalThis.fetch = fetchMock as typeof fetch;

    const client = new ApiClient({ baseUrl: "http://api.test" });
    await client.post("/v1/activities/random");

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(init.body).toBeUndefined();
    expect(headers["Content-Type"]).toBeUndefined();
  });

  it("sets the JSON content type when a POST has a body", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ data: { ok: true }, error: null }), {
        status: 200
      })
    );
    globalThis.fetch = fetchMock as typeof fetch;

    const client = new ApiClient({ baseUrl: "http://api.test" });
    await client.post("/v1/check-ins", { idempotencyKey: "start-test-key" });

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(init.body).toBe(JSON.stringify({ idempotencyKey: "start-test-key" }));
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("omits authorization when no token is available", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ data: { ok: true }, error: null }), {
        status: 200
      })
    );
    globalThis.fetch = fetchMock as typeof fetch;

    const client = new ApiClient({
      baseUrl: "http://api.test",
      getAccessToken: async () => null
    });

    await client.get("/health");

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it("returns a network envelope when fetch fails", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error("offline");
    }) as typeof fetch;

    const client = new ApiClient({ baseUrl: "http://api.test" });

    const response = await client.get("/health");

    expect(response.data).toBeNull();
    expect(response.error).toMatchObject({
      code: "NETWORK_ERROR",
      message: "Network request failed"
    });
  });

  afterEach(() => {
    consoleSpy.mockClear();
    warnSpy.mockClear();
    errorSpy.mockClear();
  });
});
