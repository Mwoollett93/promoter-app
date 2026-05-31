import { describe, expect, it } from "vitest";

import { validatePasswordPolicy } from "./password-policy";

describe("validatePasswordPolicy", () => {
  it("rejects short passwords", () => {
    expect(validatePasswordPolicy("abc")).toEqual({
      ok: false,
      message: "Password must be at least 8 characters.",
    });
  });

  it("rejects passwords with fewer than 3 character classes", () => {
    expect(validatePasswordPolicy("password")).toEqual({
      ok: false,
      message:
        "Password must include at least 3 of: uppercase, lowercase, number, and special character.",
    });
  });

  it("accepts strong passwords", () => {
    expect(validatePasswordPolicy("Password1!")).toEqual({ ok: true });
  });
});
