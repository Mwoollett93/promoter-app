/** Normalize Supabase user_metadata across email signup and OAuth providers (Google, etc.). */
export function normalizeSupabaseUserMetadata(meta: Record<string, unknown> | null | undefined) {
  const source = meta ?? {};

  const givenName = typeof source.given_name === "string" ? source.given_name.trim() : "";
  const familyName = typeof source.family_name === "string" ? source.family_name.trim() : "";
  const composedName = [givenName, familyName].filter(Boolean).join(" ").trim();

  const fullName =
    (typeof source.full_name === "string" && source.full_name.trim()) ||
    (typeof source.name === "string" && source.name.trim()) ||
    composedName ||
    null;

  const avatarUrl =
    (typeof source.avatar_url === "string" && source.avatar_url.trim()) ||
    (typeof source.picture === "string" && source.picture.trim()) ||
    null;

  return {
    full_name: fullName,
    company_name: typeof source.company_name === "string" ? source.company_name : null,
    team_size: typeof source.team_size === "string" ? source.team_size : null,
    avatar_url: avatarUrl,
  };
}
