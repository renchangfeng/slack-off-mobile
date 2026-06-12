import { describe, expect, it } from "vitest";
import { readAuthParams } from "./deepLinkParams";

describe("readAuthParams", () => {
  it("reads auth code from query parameters", () => {
    expect(readAuthParams("slackoff://auth/callback?code=abc123")).toEqual({
      code: "abc123"
    });
  });

  it("reads implicit session tokens from hash parameters", () => {
    expect(
      readAuthParams(
        "slackoff://auth/callback#access_token=access&refresh_token=refresh&expires_in=3600"
      )
    ).toEqual({
      access_token: "access",
      refresh_token: "refresh",
      expires_in: "3600"
    });
  });

  it("keeps hash values when query and hash are both present", () => {
    expect(readAuthParams("slackoff://auth/callback?type=magiclink#code=restored")).toEqual({
      type: "magiclink",
      code: "restored"
    });
  });
});
