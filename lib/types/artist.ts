export type ArtistStatus = "active" | "inactive" | "archived";
export type ArtistReach = "local" | "national" | "international";
export type ArtistSocialPlatform = "instagram" | "tiktok" | "spotify" | "soundcloud" | "youtube";

export type ArtistSocialLink = {
  id?: string;
  platform: ArtistSocialPlatform;
  url: string;
};

export type ArtistDocument = {
  id?: string;
  artistId?: string;
  category: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
};

export type ArtistProfile = {
  id: string;
  name: string;
  artistType: string;
  genres: string[];
  status: ArtistStatus;
  classification?: string;
  city?: string;
  country?: string;
  reach: ArtistReach;
  bio?: string;
  promoImageUrl?: string;
  contactName?: string;
  contactRole?: string;
  email?: string;
  phone?: string;
  preferredContactMethod?: string;
  agencyName?: string;
  managementCompany?: string;
  territory?: string;
  representedArtists: string[];
  internalNotes?: string;
  reliabilityRating?: number;
  typicalFeeCents: number;
  depositRequired: boolean;
  depositAmountCents: number;
  bookingNotes?: string;
  tags: string[];
  addedDate: string;
  createdAt: string;
  updatedAt: string;
  socialLinks: ArtistSocialLink[];
  documents: ArtistDocument[];
};

export type ArtistDraft = {
  name: string;
  artistType: string;
  genres: string[];
  status: ArtistStatus;
  classification: string;
  city: string;
  country: string;
  reach: ArtistReach;
  bio: string;
  promoImageUrl: string;
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  preferredContactMethod: string;
  agencyName: string;
  managementCompany: string;
  territory: string;
  representedArtists: string[];
  internalNotes: string;
  reliabilityRating: number;
  typicalFeeCents: number;
  depositRequired: boolean;
  depositAmountCents: number;
  bookingNotes: string;
  tags: string[];
  socialLinks: ArtistSocialLink[];
  documents: ArtistDocument[];
};

export type SupabaseSession = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  /** Local demo session — no Supabase API calls. */
  demo?: boolean;
  user: {
    id: string;
    email?: string;
    metadata?: {
      full_name?: string | null;
      company_name?: string | null;
      team_size?: string | null;
    };
  };
};
