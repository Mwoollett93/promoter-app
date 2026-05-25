export type ContactConfidence = "low" | "medium" | "high";

export type ContactType = "booking" | "management" | "press" | "general";

export type ArtistContactCandidate = {
  id: string;
  contactType: ContactType;
  email?: string;
  contactUrl?: string;
  agencyName?: string;
  agentName?: string;
  sourceDomain: string;
  sourceUrl: string;
  confidence: ContactConfidence;
  warnings: string[];
};

export type ArtistContactDiscovery = {
  bookingEmail?: string;
  managementEmail?: string;
  pressEmail?: string;
  agencyName?: string;
  agentName?: string;
  agentEmail?: string;
  website?: string;
  instagram?: string;
  soundcloud?: string;
  bandcamp?: string;
  residentAdvisor?: string;
  contactPage?: string;
  confidence: ContactConfidence;
  sources: string[];
  warnings: string[];
  candidates: ArtistContactCandidate[];
};

export function contactConfidenceLabel(confidence: ContactConfidence): string {
  if (confidence === "high") return "Verified source";
  if (confidence === "medium") return "Check before saving";
  return "Uncertain — verify manually";
}

export function contactConfidenceClasses(confidence: ContactConfidence): string {
  if (confidence === "high") return "border-[#14532D]/50 bg-[#0F2417] text-[#86EFAC]";
  if (confidence === "medium") return "border-[#8B5CF6]/30 bg-[#1A1630]/40 text-[#C4B5FD]";
  return "border-amber-500/30 bg-amber-500/10 text-amber-200";
}

export function contactTypeLabel(type: ContactType): string {
  if (type === "booking") return "Booking";
  if (type === "management") return "Management";
  if (type === "press") return "Press";
  return "General";
}
