export type PasswordStrength = "weak" | "medium" | "strong";

export function getPasswordStrength(password: string): {
  label: PasswordStrength;
  score: number;
  filledSegments: number;
} {
  if (!password) {
    return { label: "weak", score: 0, filledSegments: 0 };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const label: PasswordStrength = score <= 2 ? "weak" : score <= 3 ? "medium" : "strong";
  const filledSegments = label === "weak" ? 1 : label === "medium" ? 2 : 4;

  return { label, score, filledSegments };
}

export function strengthLabelText(label: PasswordStrength) {
  return label.charAt(0).toUpperCase() + label.slice(1);
}
