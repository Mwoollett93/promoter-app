import type { ArtistContactCandidate, ArtistContactDiscovery } from "@/lib/ai/artist-contact-types";
import type { ArtistMatch } from "@/lib/ai/artistSchema";
import type { ArtistDraft, ArtistSocialLink } from "@/lib/types/artist";

function hasText(value: string | undefined): boolean {
  return Boolean(value?.trim());
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

function appendSourceUrls(existing: string[], next: string[]): string[] {
  return [...new Set([...existing, ...next].filter(Boolean))];
}

/** Apply a user-selected contact candidate (never use for low-confidence without explicit selection). */
export function applyArtistContactSelection(
  draft: ArtistDraft,
  match: ArtistMatch,
  candidate: ArtistContactCandidate,
  discovery: ArtistContactDiscovery,
): ArtistDraft {
  if (candidate.confidence === "low") return draft;

  const next: ArtistDraft = { ...draft };
  const sourceUrls = appendSourceUrls(draft.sourceUrls, [candidate.sourceUrl]);

  next.sourceUrls = sourceUrls;
  next.contactConfidence = candidate.confidence;

  if (discovery.contactPage) next.contactPage = discovery.contactPage;

  if (candidate.agencyName) next.agencyName = candidate.agencyName;

  if (candidate.email) {
    if (candidate.contactType === "booking") {
      next.bookingEmail = candidate.email;
      if (!hasText(next.email)) next.email = candidate.email;
    } else if (candidate.contactType === "management") {
      next.managementEmail = candidate.email;
    } else if (candidate.contactType === "press") {
      next.pressEmail = candidate.email;
    } else if (!hasText(next.email)) {
      next.email = candidate.email;
    }
  }

  if (discovery.website && !hasText(next.contactPage)) {
    next.contactPage = discovery.contactPage ?? discovery.website;
  }

  if (match.instagram ?? discovery.instagram) {
    next.socialLinks = setSocialUrl(
      next.socialLinks,
      "instagram",
      match.instagram ?? discovery.instagram ?? "",
    );
  }
  if (match.soundcloud ?? discovery.soundcloud) {
    next.socialLinks = setSocialUrl(
      next.socialLinks,
      "soundcloud",
      match.soundcloud ?? discovery.soundcloud ?? "",
    );
  }
  if (match.spotify) {
    next.socialLinks = setSocialUrl(next.socialLinks, "spotify", match.spotify);
  }

  if (discovery.bandcamp) {
    const note = `Bandcamp: ${discovery.bandcamp}`;
    next.internalNotes = hasText(next.internalNotes)
      ? `${next.internalNotes}\n${note}`
      : note;
  }
  if (discovery.residentAdvisor) {
    const note = `Resident Advisor: ${discovery.residentAdvisor}`;
    next.internalNotes = hasText(next.internalNotes)
      ? `${next.internalNotes}\n${note}`
      : note;
  }

  return next;
}

/** Apply top discovery fields when user skips the panel (medium+ only, never low). */
export function applyArtistContactDiscovery(
  draft: ArtistDraft,
  discovery: ArtistContactDiscovery,
): ArtistDraft {
  if (discovery.confidence === "low") return draft;

  const next: ArtistDraft = { ...draft };
  next.contactConfidence = discovery.confidence;
  next.sourceUrls = appendSourceUrls(draft.sourceUrls, discovery.sources);

  if (discovery.contactPage) next.contactPage = discovery.contactPage;
  if (discovery.agencyName) next.agencyName = discovery.agencyName;
  if (discovery.bookingEmail) {
    next.bookingEmail = discovery.bookingEmail;
    if (!hasText(next.email)) next.email = discovery.bookingEmail;
  }
  if (discovery.managementEmail) next.managementEmail = discovery.managementEmail;
  if (discovery.pressEmail) next.pressEmail = discovery.pressEmail;

  return next;
}
