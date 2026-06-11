import type { components } from "./generated";
import type { ApiClient, ApiEnvelope } from "./client";

export type Bean = components["schemas"]["Bean"];
export type BeanCollection = components["schemas"]["BeanCollection"];
export type BeanDrawResult = components["schemas"]["BeanDrawResult"];

export class BeanApi {
  constructor(private readonly client: ApiClient) {}

  getCollection(): Promise<ApiEnvelope<BeanCollection>> {
    return this.client.get<BeanCollection>("/v1/beans/collection");
  }

  draw(): Promise<ApiEnvelope<BeanDrawResult>> {
    return this.client.post<BeanDrawResult>("/v1/beans/draw", {
      idempotencyKey: createIdempotencyKey("bean_draw")
    });
  }
}

function createIdempotencyKey(action: string): string {
  return `${action}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
