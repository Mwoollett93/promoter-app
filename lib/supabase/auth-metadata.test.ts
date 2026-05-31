import { describe, expect, it } from "vitest";

import { normalizeSupabaseUserMetadata } from "./auth-metadata";

describe("normalizeSupabaseUserMetadata", () => {
  it("maps Google-style name fields", () => {
    expect(
      normalizeSupabaseUserMetadata({
        name: "Jane Doe",
        picture: "https://example.com/avatar.jpg",
      }),
    ).toEqual({
      full_name: "Jane Doe",
      company_name: null,
      team_size: null,
      avatar_url: "https://example.com/avatar.jpg",
    });
  });

  it("prefers full_name over name", () => {
    expect(
      normalizeSupabaseUserMetadata({
        full_name: "Full Name",
        name: "Display Name",
      }).full_name,
    ).toBe("Full Name");
  });

  it("composes given and family names", () => {
    expect(
      normalizeSupabaseUserMetadata({
        given_name: "Jane",
        family_name: "Doe",
      }).full_name,
    ).toBe("Jane Doe");
  });
});
