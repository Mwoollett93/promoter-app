/** Central URLs for marketing, auth footers, and contact page. */
export const siteLinks = {
  terms: "/terms",
  privacy: "/privacy",
  /** Set when Discord server is live; hide link in UI when null. */
  discord: null as string | null,
  /** Public social profile; hide when null. */
  instagram: null as string | null,
  contactEmail: "hello@promosync.app",
} as const;
