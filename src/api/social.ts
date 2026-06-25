import type { components } from "./generated";
import type { ApiClient, ApiEnvelope } from "./client";

export type SocialSummary = components["schemas"]["SocialSummary"];
export type SocialReactionResult = components["schemas"]["SocialReactionResult"];
export type SocialReactionType = "tissue" | "like";

export class SocialApi {
  constructor(private readonly client: ApiClient) {}

  getSummary(): Promise<ApiEnvelope<SocialSummary>> {
    return this.client.get<SocialSummary>("/v1/social/summary");
  }

  addFriend(friendCode: string): Promise<ApiEnvelope<SocialSummary>> {
    return this.client.post<SocialSummary>("/v1/social/friends", { friendCode });
  }

  removeFriend(userId: string): Promise<ApiEnvelope<SocialSummary>> {
    return this.client.delete<SocialSummary>(`/v1/social/friends/${userId}`);
  }

  createGroup(kind: "squad" | "company", name: string): Promise<ApiEnvelope<SocialSummary>> {
    return this.client.post<SocialSummary>(`/v1/social/${kind}`, { name });
  }

  joinGroup(kind: "squad" | "company", inviteCode: string): Promise<ApiEnvelope<SocialSummary>> {
    return this.client.post<SocialSummary>(`/v1/social/${kind}/join`, { inviteCode });
  }

  leaveGroup(kind: "squad" | "company"): Promise<ApiEnvelope<SocialSummary>> {
    return this.client.delete<SocialSummary>(`/v1/social/${kind}`);
  }

  react(recipientUserId: string, reactionType: SocialReactionType) {
    return this.client.post<SocialReactionResult>("/v1/social/reactions", {
      recipientUserId,
      reactionType
    });
  }
}
