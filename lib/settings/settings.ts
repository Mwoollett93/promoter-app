import { validatePasswordPolicy } from "@/lib/auth/password-policy";

export const SETTINGS_STORAGE_KEY = "promosync:settings";
export const SETTINGS_UPDATED_EVENT = "promosync:settings-updated";

export type SettingsTabId =
  | "profile"
  | "account"
  | "team"
  | "notifications"
  | "billing"
  | "integrations"
  | "security"
  | "preferences";

export type TimeFormat = "12h" | "24h";
export type WeekStart = "sunday" | "monday";
export type AccountType = "Starter" | "Professional" | "Enterprise";
export type DefaultLandingPage = "Dashboard" | "Events" | "Event Wizard";
export type IntegrationId = "google" | "spotify" | "mailchimp" | "stripe";

export type PreferencesState = {
  timezone: string;
  language: string;
  dateFormat: string;
  timeFormat: TimeFormat;
  currency: string;
  weekStartsOn: WeekStart;
  compactTables: boolean;
};

export type NotificationPrefs = {
  eventReminders: boolean;
  lineupChanges: boolean;
  financialAlerts: boolean;
  weeklyDigest: boolean;
  marketingEmails: boolean;
};

export type ProfileSettings = {
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  company: string;
  avatarUrl: string;
  role: string;
  memberSince: string;
};

export type AccountSettings = {
  accountType: AccountType;
  defaultLandingPage: DefaultLandingPage;
  accountStatus: "active" | "deactivated";
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Promoter" | "Viewer";
  status: "Active" | "Invited";
};

export type IntegrationSettings = Record<IntegrationId, boolean>;

export type UserSession = {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current?: boolean;
};

export type ApiKeyRecord = {
  id: string;
  label: string;
  prefix: string;
  createdAt: string;
};

export type SecuritySettings = {
  twoFactorEnabled: boolean;
  sessions: UserSession[];
  apiKeys: ApiKeyRecord[];
};

export type BillingSettings = {
  plan: AccountType;
  paymentLabel: string;
  paymentExpiry: string;
};

export type AppSettings = {
  profile: ProfileSettings;
  account: AccountSettings;
  notifications: NotificationPrefs;
  preferences: PreferencesState;
  team: TeamMember[];
  integrations: IntegrationSettings;
  security: SecuritySettings;
  billing: BillingSettings;
  updatedAt: string;
};

export const TIMEZONE_OPTIONS = [
  "(UTC-8) Pacific Time (US & Canada)",
  "(UTC-5) Eastern Time (US & Canada)",
  "(UTC) Greenwich Mean Time",
  "(UTC+1) Central European Time",
  "(UTC+10) Australian Eastern Time",
  "(UTC+11) Melbourne",
];

export const LANGUAGE_OPTIONS = ["English (US)", "English (UK)", "English (AU)", "French", "German"];
export const DATE_FORMAT_OPTIONS = ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"];
export const CURRENCY_OPTIONS = ["USD ($)", "AUD ($)", "GBP (£)", "EUR (€)"];

export const INTEGRATION_META: Array<{
  id: IntegrationId;
  name: string;
  description: string;
}> = [
  { id: "google", name: "Google Calendar", description: "Sync event dates and venue holds." },
  { id: "spotify", name: "Spotify", description: "Attach artist playlists to lineup slots." },
  { id: "mailchimp", name: "Mailchimp", description: "Push ticket campaigns to email lists." },
  { id: "stripe", name: "Stripe", description: "Import payout and ticket revenue data." },
];

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=192&q=80";

export const DEFAULT_SETTINGS: AppSettings = {
  profile: {
    fullName: "Alex Carter",
    email: "alex.carter@promosync.com",
    phone: "+1 (555) 123-4567",
    jobTitle: "Event Director",
    company: "Carter Events",
    avatarUrl: DEFAULT_AVATAR,
    role: "Admin",
    memberSince: "Jan 15, 2024",
  },
  account: {
    accountType: "Professional",
    defaultLandingPage: "Dashboard",
    accountStatus: "active",
  },
  notifications: {
    eventReminders: true,
    lineupChanges: true,
    financialAlerts: true,
    weeklyDigest: false,
    marketingEmails: false,
  },
  preferences: {
    timezone: "(UTC-5) Eastern Time (US & Canada)",
    language: "English (US)",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    currency: "USD ($)",
    weekStartsOn: "sunday",
    compactTables: false,
  },
  team: [
    { id: "tm_1", name: "Alex Carter", email: "alex.carter@promosync.com", role: "Admin", status: "Active" },
    { id: "tm_2", name: "Maya Thompson", email: "maya@promosync.com", role: "Promoter", status: "Active" },
    { id: "tm_3", name: "James Reid", email: "james@promosync.com", role: "Viewer", status: "Invited" },
  ],
  integrations: {
    google: true,
    spotify: false,
    mailchimp: false,
    stripe: true,
  },
  security: {
    twoFactorEnabled: false,
    sessions: [
      {
        id: "sess_current",
        device: "Windows · Chrome",
        location: "Melbourne, AU",
        lastActive: new Date().toISOString(),
        current: true,
      },
      {
        id: "sess_mobile",
        device: "iPhone · Safari",
        location: "Melbourne, AU",
        lastActive: new Date(Date.now() - 86_400_000).toISOString(),
      },
    ],
    apiKeys: [],
  },
  billing: {
    plan: "Professional",
    paymentLabel: "Visa ending in 4242",
    paymentExpiry: "08/2028",
  },
  updatedAt: new Date(0).toISOString(),
};

let cachedSettings: AppSettings | null = null;

function cloneSettings(settings: AppSettings): AppSettings {
  return JSON.parse(JSON.stringify(settings)) as AppSettings;
}

export function loadSettings(): AppSettings {
  if (cachedSettings) return cloneSettings(cachedSettings);

  if (typeof window === "undefined") {
    return cloneSettings(DEFAULT_SETTINGS);
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      cachedSettings = cloneSettings(DEFAULT_SETTINGS);
      return cloneSettings(cachedSettings);
    }

    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    cachedSettings = mergeSettings(parsed);
    return cloneSettings(cachedSettings);
  } catch {
    cachedSettings = cloneSettings(DEFAULT_SETTINGS);
    return cloneSettings(cachedSettings);
  }
}

export function mergeSettings(partial: Partial<AppSettings>): AppSettings {
  return {
    profile: { ...DEFAULT_SETTINGS.profile, ...partial.profile },
    account: { ...DEFAULT_SETTINGS.account, ...partial.account },
    notifications: { ...DEFAULT_SETTINGS.notifications, ...partial.notifications },
    preferences: { ...DEFAULT_SETTINGS.preferences, ...partial.preferences },
    team: Array.isArray(partial.team) ? partial.team : DEFAULT_SETTINGS.team,
    integrations: { ...DEFAULT_SETTINGS.integrations, ...partial.integrations },
    security: {
      ...DEFAULT_SETTINGS.security,
      ...partial.security,
      sessions: partial.security?.sessions?.length
        ? partial.security.sessions
        : DEFAULT_SETTINGS.security.sessions,
      apiKeys: partial.security?.apiKeys ?? DEFAULT_SETTINGS.security.apiKeys,
    },
    billing: { ...DEFAULT_SETTINGS.billing, ...partial.billing },
    updatedAt: partial.updatedAt ?? new Date().toISOString(),
  };
}

export function saveSettings(settings: AppSettings) {
  const next = {
    ...settings,
    updatedAt: new Date().toISOString(),
  };

  cachedSettings = cloneSettings(next);

  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED_EVENT, { detail: next }));
    applyDocumentPreferences(next.preferences);
  } catch {
    /* ignore quota errors */
  }
}

export function patchSettings(patch: Partial<AppSettings>) {
  const current = loadSettings();
  saveSettings(mergeSettings({ ...current, ...patch }));
}

export function resetSettingsCache() {
  cachedSettings = null;
}

export function dispatchSettingsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED_EVENT, { detail: loadSettings() }));
}

export function getProfileFirstName(settings = loadSettings()) {
  const first = settings.profile.fullName.trim().split(/\s+/)[0];
  return first || "there";
}

export function getLandingPagePath(page: DefaultLandingPage = loadSettings().account.defaultLandingPage) {
  switch (page) {
    case "Events":
      return "/events";
    case "Event Wizard":
      return "/event-wizard/event-basics";
    default:
      return "/dashboard";
  }
}

export function isAccountActive(settings = loadSettings()) {
  return settings.account.accountStatus === "active";
}

export function currencyCodeFromLabel(label: string) {
  if (label.includes("AUD")) return "AUD";
  if (label.includes("GBP")) return "GBP";
  if (label.includes("EUR")) return "EUR";
  return "USD";
}

export type CurrencyMeta = {
  code: "USD" | "AUD" | "GBP" | "EUR";
  symbol: string;
  region: string;
};

export function currencyMetaFromLabel(label: string): CurrencyMeta {
  const code = currencyCodeFromLabel(label);
  switch (code) {
    case "AUD":
      return { code, symbol: "$", region: "AU" };
    case "GBP":
      return { code, symbol: "£", region: "GB" };
    case "EUR":
      return { code, symbol: "€", region: "EU" };
    default:
      return { code: "USD", symbol: "$", region: "US" };
  }
}

export function localeFromLanguage(language: string) {
  if (language.includes("UK")) return "en-GB";
  if (language.includes("AU")) return "en-AU";
  if (language.startsWith("French")) return "fr-FR";
  if (language.startsWith("German")) return "de-DE";
  return "en-US";
}

export function applyDocumentPreferences(prefs: PreferencesState) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.compactTables = prefs.compactTables ? "true" : "false";
  document.documentElement.lang = localeFromLanguage(prefs.language).slice(0, 2);
}

export function validatePasswordChange(input: {
  current: string;
  next: string;
  confirm: string;
}) {
  if (!input.next.trim()) {
    return { ok: false as const, message: "Enter a new password." };
  }

  const policy = validatePasswordPolicy(input.next);
  if (!policy.ok) {
    return { ok: false as const, message: policy.message };
  }

  if (input.next !== input.confirm) {
    return { ok: false as const, message: "New passwords do not match." };
  }

  if (input.current && input.current === input.next) {
    return { ok: false as const, message: "New password must be different from the current password." };
  }

  return { ok: true as const };
}

export function createTeamMember(input: {
  name: string;
  email: string;
  role: TeamMember["role"];
}) {
  return {
    id: `tm_${Date.now()}`,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: input.role,
    status: "Invited" as const,
  };
}

export function generateApiKey(label: string) {
  const token = `ps_${crypto.randomUUID().replace(/-/g, "")}`;
  return {
    id: `key_${Date.now()}`,
    label: label.trim() || "API key",
    prefix: `${token.slice(0, 8)}…${token.slice(-4)}`,
    createdAt: new Date().toISOString(),
    token,
  };
}

export function exportAppData() {
  const payload: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    settings: loadSettings(),
  };

  if (typeof window !== "undefined") {
    const managedEvents = window.localStorage.getItem("promosync:managed-events");
    if (managedEvents) payload.events = JSON.parse(managedEvents);
  }

  return payload;
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function clearPromoSyncLocalData() {
  if (typeof window === "undefined") return;

  const keys = Object.keys(window.localStorage).filter((key) => key.startsWith("promosync:"));
  for (const key of keys) {
    window.localStorage.removeItem(key);
  }

  resetSettingsCache();
}

export function deactivateAccount() {
  patchSettings({
    account: {
      ...loadSettings().account,
      accountStatus: "deactivated",
    },
  });
}

export function reactivateAccount() {
  const settings = loadSettings();
  if (settings.account.accountStatus === "deactivated") {
    patchSettings({
      account: {
        ...settings.account,
        accountStatus: "active",
      },
    });
  }
}
