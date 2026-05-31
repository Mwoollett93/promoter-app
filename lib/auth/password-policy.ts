export type PasswordValidationResult =
  | { ok: true }
  | { ok: false; message: string };

function characterClassCount(password: string) {
  let count = 0;
  if (/[A-Z]/.test(password)) count += 1;
  if (/[a-z]/.test(password)) count += 1;
  if (/\d/.test(password)) count += 1;
  if (/[^A-Za-z0-9]/.test(password)) count += 1;
  return count;
}

/** Minimum 8 chars and at least 3 of 4 character classes. */
export function validatePasswordPolicy(password: string): PasswordValidationResult {
  const value = password.trim();
  if (!value) {
    return { ok: false, message: "Enter a password." };
  }

  if (value.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters." };
  }

  if (characterClassCount(value) < 3) {
    return {
      ok: false,
      message:
        "Password must include at least 3 of: uppercase, lowercase, number, and special character.",
    };
  }

  return { ok: true };
}
