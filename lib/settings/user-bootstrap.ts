import { loadManagedEvents, saveManagedEvents } from "@/lib/data/events";
import {
  type AppSettings,
  type PreferencesState,
  type ProfileSettings,
  DEFAULT_SETTINGS,
  loadSettings,
  mergeSettings,
  patchSettings,
  saveSettings,
} from "@/lib/settings/settings";

export const SETTINGS_USER_BINDING_KEY = "promosync:settings-user-id";

export type AuthUserMetadata = {
  full_name?: string | null;
  name?: string | null;
  company_name?: string | null;
  team_size?: string | null;
  avatar_url?: string | null;
};

export type AuthProfileInput = {
  userId: string;
  email?: string;
  fullName?: string;
  companyName?: string;
  metadata?: AuthUserMetadata;
};

function metadataString(value: string | null | undefined) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function resolveProfileFields(input: AuthProfileInput) {
  const fullName =
    metadataString(input.fullName) ??
    metadataString(input.metadata?.full_name) ??
    metadataString(input.metadata?.name) ??
    "";
  const email = input.email?.trim().toLowerCase() ?? "";
  const company =
    metadataString(input.companyName) ??
    metadataString(input.metadata?.company_name) ??
    "";
  const avatarUrl = metadataString(input.metadata?.avatar_url) ?? "";

  return { fullName, email, company, avatarUrl };
}

function formatMemberSince(date = new Date()) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function locationLabelFromTimezone(timezone: string) {
  if (timezone.includes("Australia")) return "Australia";
  if (timezone === "Europe/London") return "United Kingdom";
  if (timezone.startsWith("Europe/")) return "Europe";
  return "United States";
}

/** Infer regional preferences from browser locale and timezone. */
export function detectRegionalDefaults(): Pick<
  PreferencesState,
  "timezone" | "language" | "dateFormat" | "currency" | "weekStartsOn"
> {
  if (typeof window === "undefined") {
    return { ...DEFAULT_SETTINGS.preferences };
  }

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const lang = (navigator.language || "en-US").toLowerCase();

  if (tz.includes("Australia") || lang === "en-au" || lang.endsWith("-au")) {
    return {
      timezone: "(UTC+11) Melbourne",
      language: "English (AU)",
      dateFormat: "DD/MM/YYYY",
      currency: "AUD ($)",
      weekStartsOn: "monday",
    };
  }

  if (tz === "Europe/London" || lang === "en-gb" || lang.endsWith("-gb")) {
    return {
      timezone: "(UTC) Greenwich Mean Time",
      language: "English (UK)",
      dateFormat: "DD/MM/YYYY",
      currency: "GBP (£)",
      weekStartsOn: "monday",
    };
  }

  const europeanLangs = ["de", "fr", "es", "it", "nl", "pt", "pl", "sv"];
  const langPrefix = lang.split("-")[0];
  if (
    (tz.startsWith("Europe/") && tz !== "Europe/London") ||
    europeanLangs.includes(langPrefix)
  ) {
    return {
      timezone: "(UTC+1) Central European Time",
      language: langPrefix === "fr" ? "French" : langPrefix === "de" ? "German" : "English (UK)",
      dateFormat: "DD/MM/YYYY",
      currency: "EUR (€)",
      weekStartsOn: "monday",
    };
  }

  return {
    timezone: "(UTC-5) Eastern Time (US & Canada)",
    language: "English (US)",
    dateFormat: "MM/DD/YYYY",
    currency: "USD ($)",
    weekStartsOn: "sunday",
  };
}

function isFactoryDemoProfile(profile: ProfileSettings) {
  return (
    profile.email === DEFAULT_SETTINGS.profile.email ||
    profile.fullName === DEFAULT_SETTINGS.profile.fullName
  );
}

export function removeSeedManagedEvents() {
  if (typeof window === "undefined") return;

  const events = loadManagedEvents().filter((event) => !event.id.startsWith("seed-"));
  saveManagedEvents(events);
}

export function createInitialSettings(input: AuthProfileInput): AppSettings {
  const { fullName, email, company, avatarUrl } = resolveProfileFields(input);
  const regional = detectRegionalDefaults();
  const memberSince = formatMemberSince();
  const displayName = fullName || email.split("@")[0] || "User";

  const profile: ProfileSettings = {
    fullName: displayName,
    email,
    phone: "",
    jobTitle: "",
    company,
    avatarUrl,
    role: "Admin",
    memberSince,
  };

  return mergeSettings({
    profile,
    account: {
      accountType: "Starter",
      defaultLandingPage: "Dashboard",
      accountStatus: "active",
    },
    preferences: {
      ...DEFAULT_SETTINGS.preferences,
      ...regional,
    },
    team: profile.email
      ? [
          {
            id: `tm_${input.userId}`,
            name: displayName,
            email: profile.email,
            role: "Admin",
            status: "Active",
          },
        ]
      : [],
    integrations: {
      google: false,
      spotify: false,
      mailchimp: false,
      stripe: false,
    },
    security: {
      twoFactorEnabled: false,
      sessions: [
        {
          id: "sess_current",
          device: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 80) : "Browser",
          location: locationLabelFromTimezone(regional.timezone),
          lastActive: new Date().toISOString(),
          current: true,
        },
      ],
      apiKeys: [],
    },
    billing: {
      plan: "Starter",
      paymentLabel: "",
      paymentExpiry: "",
    },
  });
}

/** Apply signup/sign-in details to settings and clear demo seed data. */
export function bootstrapSettingsFromAuth(input: AuthProfileInput) {
  if (typeof window === "undefined") return;

  const boundUserId = window.localStorage.getItem(SETTINGS_USER_BINDING_KEY);
  const current = loadSettings();
  const { fullName, email, company, avatarUrl } = resolveProfileFields(input);
  const isNewAccount = !boundUserId || boundUserId !== input.userId;
  const stillOnDemoProfile = isFactoryDemoProfile(current.profile);

  removeSeedManagedEvents();

  if (isNewAccount || stillOnDemoProfile) {
    const initial = createInitialSettings(input);
    saveSettings(initial);
    window.localStorage.setItem(SETTINGS_USER_BINDING_KEY, input.userId);
    return;
  }

  patchSettings({
    profile: {
      ...current.profile,
      email: email || current.profile.email,
      fullName: fullName || current.profile.fullName,
      company: company || current.profile.company,
      avatarUrl: avatarUrl || current.profile.avatarUrl,
    },
  });

  window.localStorage.setItem(SETTINGS_USER_BINDING_KEY, input.userId);
}
