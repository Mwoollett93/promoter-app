import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1, "Password is required."),
});

export const signUpSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1, "Password is required."),
  emailRedirectTo: z.string().url().optional(),
  data: z
    .record(z.string(), z.union([z.string(), z.null()]))
    .optional(),
});

export const recoverSchema = z.object({
  email: z.string().trim().email(),
  redirectTo: z.string().url().optional(),
});

export const passwordUpdateSchema = z.object({
  password: z.string().min(1, "Password is required."),
});

export function parseJsonBody<T>(
  schema: z.ZodType<T>,
  body: unknown,
): { ok: true; data: T } | { ok: false; error: string } {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Invalid request body." };
  }
  return { ok: true, data: parsed.data };
}
