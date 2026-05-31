/** OAuth integrations require `integration_connections` + provider env vars. Off until migrated. */
export function integrationsLiveEnabled() {
  return process.env.NEXT_PUBLIC_INTEGRATIONS_ENABLED === "true";
}
