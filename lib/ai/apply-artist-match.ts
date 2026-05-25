import { parseLocation } from "@/lib/ai/artist-text";
import type { ArtistMatch } from "@/lib/ai/artistSchema";
import type { ArtistDraft, ArtistSocialLink } from "@/lib/types/artist";

export type ArtistFieldConflict = {
  field: string;
  current: string;
  suggested: string;
};

const CONTACT_ROLES = ["Artist", "Agent", "Manager", "Tour Manager"];

function hasText(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function normalizeContactRole(value: string | undefined): string {
  if (!value?.trim()) return "Agent";
  const lower = value.trim().toLowerCase();
  for (const role of CONTACT_ROLES) {
    if (lower === role.toLowerCase() || lower.includes(role.toLowerCase())) return role;
  }
  if (lower.includes("manager")) return "Manager";
  if (lower.includes("agent")) return "Agent";
  if (lower.includes("tour")) return "Tour Manager";
  return "Agent";
}

function setSocialUrl(links: ArtistSocialLink[], platform: ArtistSocialLink["platform"], url: string): ArtistSocialLink[] {
  const trimmed = url.trim();
  if (!trimmed) return links;
  return links.map((link) => (link.platform === platform ? { ...link, url: trimmed } : link));
}

export function listArtistFieldConflicts(draft: ArtistDraft, match: ArtistMatch): ArtistFieldConflict[] {
  const { city, country } = parseLocation(match.location);
  const conflicts: ArtistFieldConflict[] = [];

  const checks: Array<{ field: string; current: string; suggested: string }> = [
    { field: "Bio", current: draft.bio, suggested: match.description },
    { field: "City", current: draft.city, suggested: city },
    { field: "Country", current: draft.country, suggested: country },
    { field: "Classification", current: draft.classification, suggested: match.classification ?? "" },
    { field: "Email", current: draft.email, suggested: match.bookingEmail ?? "" },
    { field: "Promo image URL", current: draft.promoImageUrl, suggested: match.imageUrl ?? "" },
    { field: "Agency", current: draft.agencyName, suggested: match.agencyName ?? "" },
    { field: "Management company", current: draft.managementCompany, suggested: match.managementCompany ?? "" },
    { field: "Contact name", current: draft.contactName, suggested: match.contactName ?? "" },
    { field: "Contact phone", current: draft.phone, suggested: match.contactPhone ?? "" },
    {
      field: "Instagram",
      current: draft.socialLinks.find((l) => l.platform === "instagram")?.url ?? "",
      suggested: match.instagram ?? "",
    },
    {
      field: "Spotify",
      current: draft.socialLinks.find((l) => l.platform === "spotify")?.url ?? "",
      suggested: match.spotify ?? "",
    },
    {
      field: "SoundCloud",
      current: draft.socialLinks.find((l) => l.platform === "soundcloud")?.url ?? "",
      suggested: match.soundcloud ?? "",
    },
  ];

  for (const check of checks) {
    if (hasText(check.current) && hasText(check.suggested) && check.current.trim() !== check.suggested.trim()) {
      conflicts.push(check);
    }
  }

  if (draft.genres.length > 0 && match.genres.length > 0) {
    const current = draft.genres.join(", ");
    const suggested = match.genres.join(", ");
    if (current !== suggested) {
      conflicts.push({ field: "Genres", current, suggested });
    }
  }

  return conflicts;
}

/** Apply a selected match. Empty draft fields are always filled; existing values need overwrite=true. */
export function applyArtistMatch(
  draft: ArtistDraft,
  match: ArtistMatch,
  options: { overwrite: boolean },
): ArtistDraft {
  const { city, country } = parseLocation(match.location);
  const overwrite = options.overwrite;

  const next: ArtistDraft = { ...draft };

  if (match.artistName.trim() && (!hasText(draft.name) || overwrite)) {
    next.name = match.artistName.trim();
  }

  if (match.description && (!hasText(draft.bio) || overwrite)) {
    next.bio = match.description;
  }

  if (match.genres.length > 0 && (draft.genres.length === 0 || overwrite)) {
    next.genres = [...new Set(match.genres)];
  }

  if (city && (!hasText(draft.city) || overwrite)) next.city = city;
  if (country && (!hasText(draft.country) || overwrite)) next.country = country;

  if (match.classification && (!hasText(draft.classification) || overwrite)) {
    next.classification = match.classification;
  }

  if (match.bookingEmail && (!hasText(draft.email) || overwrite)) {
    next.email = match.bookingEmail;
  }

  if (match.imageUrl && (!hasText(draft.promoImageUrl) || overwrite)) {
    next.promoImageUrl = match.imageUrl;
  }

  if (match.agencyName && (!hasText(draft.agencyName) || overwrite)) {
    next.agencyName = match.agencyName;
  }

  if (match.managementCompany && (!hasText(draft.managementCompany) || overwrite)) {
    next.managementCompany = match.managementCompany;
  }

  if (match.contactName && (!hasText(draft.contactName) || overwrite)) {
    next.contactName = match.contactName;
    if (!hasText(draft.contactRole) || overwrite) {
      next.contactRole = normalizeContactRole(match.contactRole);
    }
  } else if (match.contactRole && (!hasText(draft.contactRole) || overwrite)) {
    next.contactRole = normalizeContactRole(match.contactRole);
  }

  if (match.contactPhone && (!hasText(draft.phone) || overwrite)) {
    next.phone = match.contactPhone;
  }

  if (match.website && (!hasText(draft.internalNotes) || overwrite)) {
    next.internalNotes = hasText(draft.internalNotes)
      ? draft.internalNotes
      : `Official website: ${match.website}`;
  }

  let socialLinks = [...draft.socialLinks];
  if (match.instagram && (!hasText(socialLinks.find((l) => l.platform === "instagram")?.url) || overwrite)) {
    socialLinks = setSocialUrl(socialLinks, "instagram", match.instagram);
  }
  if (match.spotify && (!hasText(socialLinks.find((l) => l.platform === "spotify")?.url) || overwrite)) {
    socialLinks = setSocialUrl(socialLinks, "spotify", match.spotify);
  }
  if (match.soundcloud && (!hasText(socialLinks.find((l) => l.platform === "soundcloud")?.url) || overwrite)) {
    socialLinks = setSocialUrl(socialLinks, "soundcloud", match.soundcloud);
  }
  next.socialLinks = socialLinks;

  if (!hasText(draft.artistType) && match.genres.length > 0) {
    next.artistType = "DJ / Producer";
  }

  return next;
}
