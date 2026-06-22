import { createRequestId, createTraceId } from "../observability/ids";
import { captureError, logEvent } from "../observability/logger";

export type ApiEnvelope<T> = {
  data: T | null;
  error: {
    code: string;
    message: string;
    requestId?: string;
    traceId?: string;
  } | null;
};

export type ApiClientOptions = {
  baseUrl: string;
  getAccessToken?: () => Promise<string | null>;
};

export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  async get<T>(path: string): Promise<ApiEnvelope<T>> {
    return this.request<T>(path, { method: "GET" });
  }

  async post<T>(path: string, body?: unknown): Promise<ApiEnvelope<T>> {
    return this.request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  }

  private async request<T>(
    path: string,
    init: RequestInit
  ): Promise<ApiEnvelope<T>> {
    const token = await this.options.getAccessToken?.();
    const requestId = createRequestId();
    const traceId = createTraceId();

    let response: Response;
    try {
      const headers: Record<string, string> = {
        "X-Request-Id": requestId,
        "X-Trace-Id": traceId,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...((init.headers as Record<string, string> | undefined) ?? {})
      };
      if (init.body) {
        headers["Content-Type"] = "application/json";
      }

      response = await fetch(`${this.options.baseUrl}${path}`, {
        ...init,
        headers
      });
    } catch (error) {
      captureError(error, "api.request.network_error", {
        requestId,
        traceId,
        route: path
      });
      return {
        data: null,
        error: {
          code: "NETWORK_ERROR",
          message: "Network request failed",
          requestId,
          traceId
        }
      };
    }

    const envelope = await readEnvelope<T>(response, requestId, traceId, path);
    if (envelope.error) {
      logEvent("warn", "api.request.error_response", {
        requestId: envelope.error.requestId ?? requestId,
        traceId: envelope.error.traceId ?? traceId,
        route: path,
        statusCode: response.status,
        errorCode: envelope.error.code
      });
    }

    return envelope;
  }
}

async function readEnvelope<T>(
  response: Response,
  requestId: string,
  traceId: string,
  path: string
): Promise<ApiEnvelope<T>> {
  try {
    return (await response.json()) as ApiEnvelope<T>;
  } catch (error) {
    captureError(error, "api.response.invalid_json", {
      requestId,
      traceId,
      route: path,
      statusCode: response.status
    });
    return {
      data: null,
      error: {
        code: "INVALID_RESPONSE",
        message: "API response was not valid JSON",
        requestId,
        traceId
      }
    };
  }
}
