import type { IntegrationId } from "@/lib/settings/settings";

export type IntegrationProviderConfig = {
  id: IntegrationId;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientIdEnv: string;
  clientSecretEnv: string;
};

export const INTEGRATION_PROVIDERS: Record<IntegrationId, IntegrationProviderConfig | null> = {
  google: {
    id: "google",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    clientIdEnv: "GOOGLE_INTEGRATION_CLIENT_ID",
    clientSecretEnv: "GOOGLE_INTEGRATION_CLIENT_SECRET",
  },
  spotify: {
    id: "spotify",
    authUrl: "https://accounts.spotify.com/authorize",
    tokenUrl: "https://accounts.spotify.com/api/token",
    scopes: ["user-read-email", "playlist-read-private"],
    clientIdEnv: "SPOTIFY_CLIENT_ID",
    clientSecretEnv: "SPOTIFY_CLIENT_SECRET",
  },
  mailchimp: null,
  stripe: {
    id: "stripe",
    authUrl: "https://connect.stripe.com/oauth/authorize",
    tokenUrl: "https://connect.stripe.com/oauth/token",
    scopes: ["read_only"],
    clientIdEnv: "STRIPE_CONNECT_CLIENT_ID",
    clientSecretEnv: "STRIPE_SECRET_KEY",
  },
};

export function integrationEnvReady(id: IntegrationId): boolean {
  const config = INTEGRATION_PROVIDERS[id];
  if (!config) return false;
  return Boolean(
    process.env[config.clientIdEnv]?.trim() && process.env[config.clientSecretEnv]?.trim(),
  );
}
