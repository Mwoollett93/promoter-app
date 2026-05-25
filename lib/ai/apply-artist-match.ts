import { applyArtistContactSelection } from "@/lib/ai/apply-artist-contact";
import type { ArtistContactCandidate } from "@/lib/ai/artist-contact-types";
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

function setSocialUrl(
  links: ArtistSocialLink[],
  platform: ArtistSocialLink["platform"],
  url: string,
): ArtistSocialLink[] {
  const trimmed = url.trim();
  if (!trimmed) return links;
  return links.map((link) => (link.platform === platform ? { ...link, url: trimmed } : link));
}

function pushConflict(
  conflicts: ArtistFieldConflict[],
  field: string,
  current: string,
  suggested: string,
) {
  if (hasText(current) && hasText(suggested) && current.trim() !== suggested.trim()) {
    conflicts.push({ field, current, suggested });
  }
}

export function listArtistFieldConflicts(draft: ArtistDraft, proposed: ArtistDraft): ArtistFieldConflict[] {
  const conflicts: ArtistFieldConflict[] = [];

  pushConflict(conflicts, "Bio", draft.bio, proposed.bio);
  pushConflict(conflicts, "City", draft.city, proposed.city);
  pushConflict(conflicts, "Country", draft.country, proposed.country);
  pushConflict(conflicts, "Classification", draft.classification, proposed.classification);
  pushConflict(conflicts, "Email", draft.email, proposed.email);
  pushConflict(conflicts, "Booking email", draft.bookingEmail, proposed.bookingEmail);
  pushConflict(conflicts, "Management email", draft.managementEmail, proposed.managementEmail);
  pushConflict(conflicts, "Press email", draft.pressEmail, proposed.pressEmail);
  pushConflict(conflicts, "Promo image URL", draft.promoImageUrl, proposed.promoImageUrl);
  pushConflict(conflicts, "Agency", draft.agencyName, proposed.agencyName);
  pushConflict(conflicts, "Management company", draft.managementCompany, proposed.managementCompany);
  pushConflict(conflicts, "Contact name", draft.contactName, proposed.contactName);
  pushConflict(conflicts, "Contact phone", draft.phone, proposed.phone);
  pushConflict(conflicts, "Contact page", draft.contactPage, proposed.contactPage);

  const draftIg = draft.socialLinks.find((l) => l.platform === "instagram")?.url ?? "";
  const proposedIg = proposed.socialLinks.find((l) => l.platform === "instagram")?.url ?? "";
  pushConflict(conflicts, "Instagram", draftIg, proposedIg);

  const draftSp = draft.socialLinks.find((l) => l.platform === "spotify")?.url ?? "";
  const proposedSp = proposed.socialLinks.find((l) => l.platform === "spotify")?.url ?? "";
  pushConflict(conflicts, "Spotify", draftSp, proposedSp);

  const draftSc = draft.socialLinks.find((l) => l.platform === "soundcloud")?.url ?? "";
  const proposedSc = proposed.socialLinks.find((l) => l.platform === "soundcloud")?.url ?? "";
  pushConflict(conflicts, "SoundCloud", draftSc, proposedSc);

  if (draft.genres.length > 0 && proposed.genres.length > 0) {
    const current = draft.genres.join(", ");
    const suggested = proposed.genres.join(", ");
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

  const mayApplyImage =
    Boolean(match.imageUrl) &&
    match.imageConfidence !== "low" &&
    match.imageSource !== "manual_required";

  if (mayApplyImage && (!hasText(draft.promoImageUrl) || overwrite)) {
    next.promoImageUrl = match.imageUrl!;
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

export function buildAppliedArtistDraft(
  draft: ArtistDraft,
  match: ArtistMatch,
  contact: ArtistContactCandidate | null,
  options: { overwrite: boolean },
): ArtistDraft {
  let next = applyArtistMatch(draft, match, options);
  if (contact && match.contactDiscovery) {
    next = applyArtistContactSelection(next, match, contact, match.contactDiscovery);
  }
  return next;
}
