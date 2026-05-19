"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CreditCard,
  Globe,
  Pencil,
  Plug,
  Shield,
  User,
  UserCog,
  Users,
} from "lucide-react";

import PageContent from "@/app/components/layout/PageContent";
import Button from "@/app/components/ui/Button";
import { GRID_CARD_GAP, PAGE_STACK_GAP } from "@/lib/layout/page-layout";
import { useSettings } from "@/lib/settings/SettingsProvider";
import {
  CURRENCY_OPTIONS,
  DATE_FORMAT_OPTIONS,
  INTEGRATION_META,
  LANGUAGE_OPTIONS,
  TIMEZONE_OPTIONS,
  clearPromoSyncLocalData,
  createTeamMember,
  deactivateAccount,
  downloadJson,
  exportAppData,
  generateApiKey,
  type NotificationPrefs,
  type PreferencesState,
  type SettingsTabId,
  validatePasswordChange,
} from "@/lib/settings/settings";
import { signOutOfSupabase } from "@/lib/supabase/browser";

type SettingsTab = {
  id: SettingsTabId;
  label: string;
  icon: LucideIcon;
};

const TABS: SettingsTab[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "account", label: "Account", icon: UserCog },
  { id: "team", label: "Team", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "security", label: "Security", icon: Shield },
  { id: "preferences", label: "Preferences", icon: Globe },
];

function isSettingsTab(value: string | null): value is SettingsTabId {
  return TABS.some((tab) => tab.id === value);
}

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: SettingsTabId = isSettingsTab(tabParam) ? tabParam : "profile";

  const { settings, patchSettings } = useSettings();
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const [passwords, setPasswords] = React.useState({
    current: "",
    next: "",
    confirm: "",
  });

  const [apiKeyLabel, setApiKeyLabel] = React.useState("Production sync");
  const [generatedKey, setGeneratedKey] = React.useState<string | null>(null);

  function setActiveTab(tab: SettingsTabId) {
    router.replace(tab === "profile" ? "/settings" : `/settings?tab=${tab}`, { scroll: false });
  }

  function notify(message: string, isError = false) {
    if (isError) {
      setErrorMessage(message);
      setSaveMessage(null);
      window.setTimeout(() => setErrorMessage(null), 3500);
      return;
    }

    setErrorMessage(null);
    setSaveMessage(message);
    window.setTimeout(() => setSaveMessage(null), 2500);
  }

  function saveProfile() {
    patchSettings({
      profile: {
        ...settings.profile,
        memberSince: settings.profile.memberSince || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      },
    });
    notify("Profile saved.");
  }

  function savePassword() {
    const result = validatePasswordChange(passwords);
    if (!result.ok) {
      notify(result.message, true);
      return;
    }

    setPasswords({ current: "", next: "", confirm: "" });
    notify("Password updated.");
  }

  async function handleDeactivate() {
    if (!window.confirm("Deactivate your account? You can sign in again to reactivate.")) return;
    deactivateAccount();
    await signOutOfSupabase();
    router.replace("/?view=login");
  }

  async function handleDeleteAccount() {
    if (!window.confirm("Permanently delete your account and all local PromoSync data? This cannot be undone.")) {
      return;
    }

    clearPromoSyncLocalData();
    await signOutOfSupabase();
    router.replace("/");
  }

  function handleExportData() {
    downloadJson(`promosync-export-${new Date().toISOString().slice(0, 10)}.json`, exportAppData());
    notify("Data export started.");
  }

  function handlePrivacyReport() {
    downloadJson(`promosync-privacy-${new Date().toISOString().slice(0, 10)}.json`, {
      profile: settings.profile,
      account: settings.account,
      notifications: settings.notifications,
      exportedAt: new Date().toISOString(),
    });
    notify("Privacy report downloaded.");
  }

  return (
    <PageContent maxWidth={1180}>
      <header>
        <h1 className="text-[32px] font-bold leading-9 tracking-tight text-[#F5F5F7]">Settings</h1>
        <p className="mt-1 text-[14px] leading-5 text-[#A1A1AA]">
          Manage your account, team, and preferences.
        </p>
      </header>

      {saveMessage ? (
        <div className="mt-4 rounded-lg border border-[#14532D] bg-[#0F2417] px-4 py-2.5 text-[13px] text-[#86EFAC]">
          {saveMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-[13px] text-red-200">
          {errorMessage}
        </div>
      ) : null}

      <nav
        className="mt-6 flex gap-6 overflow-x-auto border-b border-[#232330] pb-px"
        aria-label="Settings sections"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                "inline-flex shrink-0 items-center gap-2 border-b-2 pb-3 text-[14px] font-medium transition-colors",
                active
                  ? "border-[#8B5CF6] text-[#F5F5F7]"
                  : "border-transparent text-[#A1A1AA] hover:text-[#F5F5F7]",
              ].join(" ")}
            >
              <Icon
                className={`size-4 ${active ? "text-[#A78BFA]" : "text-[#71717A]"}`}
                strokeWidth={2}
                aria-hidden
              />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-6">
        {activeTab === "profile" ? (
          <ProfileTab
            profile={settings.profile}
            passwords={passwords}
            preferences={settings.preferences}
            onProfileChange={(patch) => patchSettings({ profile: { ...settings.profile, ...patch } })}
            onAvatarChange={(avatarUrl) => patchSettings({ profile: { ...settings.profile, avatarUrl } })}
            onPasswordChange={setPasswords}
            onSaveProfile={saveProfile}
            onSavePassword={savePassword}
            onDeactivate={handleDeactivate}
            onDeleteAccount={handleDeleteAccount}
            onGoToPreferences={() => setActiveTab("preferences")}
          />
        ) : null}

        {activeTab === "account" ? (
          <AccountTab
            account={settings.account}
            onChange={(patch) => patchSettings({ account: { ...settings.account, ...patch } })}
            onSave={() => notify("Account settings saved.")}
            onExport={handleExportData}
            onPrivacyReport={handlePrivacyReport}
          />
        ) : null}

        {activeTab === "team" ? (
          <TeamTab
            members={settings.team}
            onInvite={(member) => {
              patchSettings({ team: [...settings.team, member] });
              notify(`Invitation sent to ${member.email}.`);
            }}
            onRemove={(id) => {
              patchSettings({ team: settings.team.filter((member) => member.id !== id) });
              notify("Team member removed.");
            }}
          />
        ) : null}

        {activeTab === "notifications" ? (
          <NotificationsTab
            prefs={settings.notifications}
            onChange={(patch) =>
              patchSettings({ notifications: { ...settings.notifications, ...patch } })
            }
            onSave={() => notify("Notification preferences saved.")}
          />
        ) : null}

        {activeTab === "billing" ? (
          <BillingTab
            billing={settings.billing}
            onPlanChange={(plan) => {
              patchSettings({
                billing: { ...settings.billing, plan },
                account: { ...settings.account, accountType: plan },
              });
              notify(`Plan updated to ${plan}.`);
            }}
          />
        ) : null}

        {activeTab === "integrations" ? (
          <IntegrationsTab
            integrations={settings.integrations}
            onToggle={(id, connected) => {
              patchSettings({
                integrations: { ...settings.integrations, [id]: connected },
              });
              notify(connected ? `${id} connected.` : `${id} disconnected.`);
            }}
          />
        ) : null}

        {activeTab === "security" ? (
          <SecurityTab
            security={settings.security}
            apiKeyLabel={apiKeyLabel}
            generatedKey={generatedKey}
            onApiKeyLabelChange={setApiKeyLabel}
            onToggle2fa={(enabled) => {
              patchSettings({
                security: { ...settings.security, twoFactorEnabled: enabled },
              });
              notify(enabled ? "Two-factor authentication enabled." : "Two-factor authentication disabled.");
            }}
            onRevokeSession={(id) => {
              patchSettings({
                security: {
                  ...settings.security,
                  sessions: settings.security.sessions.filter((session) => session.id !== id),
                },
              });
              notify("Session revoked.");
            }}
            onSignOutAll={() => {
              patchSettings({
                security: {
                  ...settings.security,
                  sessions: settings.security.sessions.filter((session) => session.current),
                },
              });
              notify("All other devices have been signed out. You are still signed in here.");
            }}
            onGenerateKey={() => {
              const created = generateApiKey(apiKeyLabel);
              patchSettings({
                security: {
                  ...settings.security,
                  apiKeys: [
                    {
                      id: created.id,
                      label: created.label,
                      prefix: created.prefix,
                      createdAt: created.createdAt,
                    },
                    ...settings.security.apiKeys,
                  ],
                },
              });
              setGeneratedKey(created.token);
              notify("API key generated. Copy it now — it won't be shown again.");
            }}
            onDeleteKey={(id) => {
              patchSettings({
                security: {
                  ...settings.security,
                  apiKeys: settings.security.apiKeys.filter((key) => key.id !== id),
                },
              });
              notify("API key removed.");
            }}
          />
        ) : null}

        {activeTab === "preferences" ? (
          <PreferencesTab
            prefs={settings.preferences}
            onChange={(patch) =>
              patchSettings({ preferences: { ...settings.preferences, ...patch } })
            }
            onSave={() => notify("Preferences saved.")}
          />
        ) : null}
      </div>
    </PageContent>
  );
}

function ProfileTab({
  profile,
  passwords,
  preferences,
  onProfileChange,
  onAvatarChange,
  onPasswordChange,
  onSaveProfile,
  onSavePassword,
  onDeactivate,
  onDeleteAccount,
  onGoToPreferences,
}: {
  profile: {
    fullName: string;
    email: string;
    phone: string;
    jobTitle: string;
    company: string;
    avatarUrl: string;
    role: string;
    memberSince: string;
  };
  passwords: { current: string; next: string; confirm: string };
  preferences: import("@/lib/settings/settings").PreferencesState;
  onProfileChange: (patch: Partial<typeof profile>) => void;
  onAvatarChange: (avatarUrl: string) => void;
  onPasswordChange: React.Dispatch<React.SetStateAction<typeof passwords>>;
  onSaveProfile: () => void;
  onSavePassword: () => void;
  onDeactivate: () => void;
  onDeleteAccount: () => void;
  onGoToPreferences: () => void;
}) {
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  function handleAvatarFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onAvatarChange(reader.result);
    };
    reader.readAsDataURL(file);
  }
  return (
    <div className={`grid xl:grid-cols-[minmax(0,1fr)_320px] ${GRID_CARD_GAP}`}>
      <div className={`flex flex-col ${PAGE_STACK_GAP}`}>
        <SettingsCard title="Profile Information">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="relative shrink-0">
              <div
                className="h-24 w-24 rounded-full bg-cover bg-center ring-2 ring-[#3F3F46]"
                style={{ backgroundImage: `url(${profile.avatarUrl})` }}
              />
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleAvatarFile(event.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 inline-flex size-8 items-center justify-center rounded-full border border-[#8B5CF6]/50 bg-[#7C3AED] text-white"
                aria-label="Edit profile photo"
              >
                <Pencil className="size-3.5" strokeWidth={2} aria-hidden />
              </button>
            </div>

            <div className="min-w-0 flex-1 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <SettingsInput
                  label="Full Name"
                  value={profile.fullName}
                  onChange={(value) => onProfileChange({ fullName: value })}
                />
                <SettingsInput
                  label="Email Address"
                  type="email"
                  value={profile.email}
                  onChange={(value) => onProfileChange({ email: value })}
                />
                <SettingsInput
                  label="Phone Number"
                  value={profile.phone}
                  onChange={(value) => onProfileChange({ phone: value })}
                />
                <SettingsInput
                  label="Job Title"
                  value={profile.jobTitle}
                  onChange={(value) => onProfileChange({ jobTitle: value })}
                />
              </div>
              <SettingsInput
                label="Company / Promoter Name"
                value={profile.company}
                onChange={(value) => onProfileChange({ company: value })}
              />
              <div className="flex justify-end">
                <Button variant="primary" size="sm" type="button" onClick={onSaveProfile} className="px-8">
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard title="Change Password">
          <div className="grid gap-4 lg:grid-cols-3">
            <PasswordInput
              label="Current Password"
              value={passwords.current}
              onChange={(value) => onPasswordChange((p) => ({ ...p, current: value }))}
            />
            <PasswordInput
              label="New Password"
              value={passwords.next}
              onChange={(value) => onPasswordChange((p) => ({ ...p, next: value }))}
            />
            <PasswordInput
              label="Confirm New Password"
              value={passwords.confirm}
              onChange={(value) => onPasswordChange((p) => ({ ...p, confirm: value }))}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="secondary" size="sm" type="button" onClick={onSavePassword} className="px-8">
              Update Password
            </Button>
          </div>
        </SettingsCard>
      </div>

      <div className={`flex flex-col ${PAGE_STACK_GAP}`}>
        <SettingsCard title="Profile Summary">
          <dl className="space-y-3 text-[13px]">
            <SummaryRow label="Role" value={profile.role} />
            <SummaryRow label="Member Since" value={profile.memberSince} />
            <SummaryRow label="Time Zone" value={preferences.timezone} />
            <SummaryRow label="Language" value={preferences.language} />
          </dl>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={onGoToPreferences}
            className="mt-4 w-full px-6"
          >
            Edit Preferences
          </Button>
        </SettingsCard>

        <SettingsCard title="Danger Zone" danger>
          <div className="space-y-4">
            <DangerAction
              title="Deactivate Account"
              description="Temporarily disable your account. You can reactivate by signing in again."
              actionLabel="Deactivate"
              onAction={onDeactivate}
            />
            <DangerAction
              title="Delete Account"
              description="Permanently remove your account and all associated data. This cannot be undone."
              actionLabel="Delete Account"
              destructive
              onAction={onDeleteAccount}
            />
          </div>
        </SettingsCard>
      </div>
    </div>
  );
}

function AccountTab({
  account,
  onChange,
  onSave,
  onExport,
  onPrivacyReport,
}: {
  account: import("@/lib/settings/settings").AccountSettings;
  onChange: (patch: Partial<typeof account>) => void;
  onSave: () => void;
  onExport: () => void;
  onPrivacyReport: () => void;
}) {
  return (
    <div className={`grid lg:grid-cols-2 ${GRID_CARD_GAP}`}>
      <SettingsCard title="Account Details">
        <div className="space-y-4">
          <SettingsInput label="Account ID" value="acc_8f2c91a4" onChange={() => {}} disabled />
          <SettingsSelect
            label="Account Type"
            value={account.accountType}
            options={["Starter", "Professional", "Enterprise"]}
            onChange={(value) =>
              onChange({ accountType: value as typeof account.accountType })
            }
          />
          <SettingsSelect
            label="Default Landing Page"
            value={account.defaultLandingPage}
            options={["Dashboard", "Events", "Event Wizard"]}
            onChange={(value) =>
              onChange({ defaultLandingPage: value as typeof account.defaultLandingPage })
            }
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="primary" size="sm" type="button" onClick={onSave} className="px-8">
            Save Changes
          </Button>
        </div>
      </SettingsCard>

      <SettingsCard title="Connected Sign-in Methods">
        <div className="space-y-3">
          <ConnectionRow provider="Email & Password" status="Primary" connected />
          <ConnectionRow provider="Google" status="Connected" connected />
          <ConnectionRow provider="Apple" status="Not connected" connected={false} />
          <ConnectionRow provider="GitHub" status="Connected" connected />
        </div>
      </SettingsCard>

      <SettingsCard title="Data & Privacy" className="lg:col-span-2">
        <p className="text-[13px] leading-5 text-[#A1A1AA]">
          Export your events, venues, and artist data, or request a copy of stored personal information.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="secondary" size="sm" type="button" className="px-6" onClick={onExport}>
            Export Data
          </Button>
          <Button variant="ghost" size="sm" type="button" className="px-6" onClick={onPrivacyReport}>
            Download Privacy Report
          </Button>
        </div>
      </SettingsCard>
    </div>
  );
}

function TeamTab({
  members,
  onInvite,
  onRemove,
}: {
  members: import("@/lib/settings/settings").TeamMember[];
  onInvite: (member: import("@/lib/settings/settings").TeamMember) => void;
  onRemove: (id: string) => void;
}) {
  function handleInvite() {
    const name = window.prompt("Team member name");
    if (!name?.trim()) return;

    const email = window.prompt("Email address");
    if (!email?.trim()) return;

    const roleInput = window.prompt("Role (Admin, Promoter, or Viewer)", "Promoter");
    const role =
      roleInput === "Admin" || roleInput === "Viewer" ? roleInput : ("Promoter" as const);

    onInvite(createTeamMember({ name, email, role }));
  }

  return (
    <SettingsCard
      title="Team Members"
      action={
        <Button variant="primary" size="sm" type="button" className="px-6" onClick={handleInvite}>
          Invite Member
        </Button>
      }
    >
      <div className="overflow-x-auto">
        <table className="min-w-[640px] w-full text-left text-[13px]">
          <thead className="text-[11px] uppercase tracking-[0.08em] text-[#71717A]">
            <tr>
              <th className="pb-3 font-medium">Name</th>
              <th className="pb-3 font-medium">Email</th>
              <th className="pb-3 font-medium">Role</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-[#F5F5F7]">
            {members.map((member) => (
              <tr key={member.id} className="border-t border-[#232330]">
                <td className="py-3 font-medium">{member.name}</td>
                <td className="py-3 text-[#A1A1AA]">{member.email}</td>
                <td className="py-3">{member.role}</td>
                <td className="py-3">
                  <span
                    className={[
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      member.status === "Active"
                        ? "bg-[#14532D] text-[#86EFAC]"
                        : "bg-[#27272F] text-[#A1A1AA]",
                    ].join(" ")}
                  >
                    {member.status}
                  </span>
                </td>
                <td className="py-3 text-right">
                  {member.role !== "Admin" ? (
                    <button
                      type="button"
                      onClick={() => onRemove(member.id)}
                      className="text-[12px] text-[#FCA5A5] hover:text-red-300"
                    >
                      Remove
                    </button>
                  ) : (
                    <span className="text-[12px] text-[#71717A]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SettingsCard>
  );
}

function NotificationsTab({
  prefs,
  onChange,
  onSave,
}: {
  prefs: NotificationPrefs;
  onChange: (patch: Partial<NotificationPrefs>) => void;
  onSave: () => void;
}) {
  return (
    <SettingsCard title="Email & In-app Notifications">
      <div className="space-y-1">
        <ToggleRow
          label="Event reminders"
          description="Alerts before doors open, curfew, and ticket on-sale dates."
          checked={prefs.eventReminders}
          onChange={(checked) => onChange({ eventReminders: checked })}
        />
        <ToggleRow
          label="Lineup changes"
          description="Notify when artists are added, removed, or rescheduled."
          checked={prefs.lineupChanges}
          onChange={(checked) => onChange({ lineupChanges: checked })}
        />
        <ToggleRow
          label="Financial alerts"
          description="Updates when forecasts change or costs exceed thresholds."
          checked={prefs.financialAlerts}
          onChange={(checked) => onChange({ financialAlerts: checked })}
        />
        <ToggleRow
          label="Weekly digest"
          description="Summary of upcoming events, tasks, and revenue performance."
          checked={prefs.weeklyDigest}
          onChange={(checked) => onChange({ weeklyDigest: checked })}
        />
        <ToggleRow
          label="Product updates & tips"
          description="Occasional emails about new PromoSync features."
          checked={prefs.marketingEmails}
          onChange={(checked) => onChange({ marketingEmails: checked })}
        />
      </div>
      <div className="mt-4 flex justify-end">
        <Button variant="primary" size="sm" type="button" onClick={onSave} className="px-8">
          Save Preferences
        </Button>
      </div>
    </SettingsCard>
  );
}

function BillingTab({
  billing,
  onPlanChange,
}: {
  billing: import("@/lib/settings/settings").BillingSettings;
  onPlanChange: (plan: import("@/lib/settings/settings").AccountType) => void;
}) {
  const planPrices: Record<string, string> = {
    Starter: "$19 / month",
    Professional: "$49 / month",
    Enterprise: "Custom pricing",
  };

  return (
    <div className={`grid lg:grid-cols-2 ${GRID_CARD_GAP}`}>
      <SettingsCard title="Current Plan">
        <p className="text-[22px] font-bold text-[#F5F5F7]">{billing.plan}</p>
        <p className="mt-1 text-[13px] text-[#A1A1AA]">{planPrices[billing.plan]} · billed annually</p>
        <ul className="mt-4 space-y-2 text-[13px] text-[#D4D4D8]">
          <li>Unlimited events & forecasts</li>
          <li>Up to 10 team members</li>
          <li>Venue & artist libraries</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          {(["Starter", "Professional", "Enterprise"] as const).map((plan) => (
            <Button
              key={plan}
              variant={billing.plan === plan ? "primary" : "secondary"}
              size="sm"
              type="button"
              className="px-4"
              onClick={() => onPlanChange(plan)}
            >
              {plan}
            </Button>
          ))}
        </div>
      </SettingsCard>

      <SettingsCard title="Payment Method">
        <p className="text-[13px] text-[#A1A1AA]">{billing.paymentLabel}</p>
        <p className="mt-1 text-[13px] text-[#71717A]">Expires {billing.paymentExpiry}</p>
        <Button variant="ghost" size="sm" type="button" className="mt-4 px-6">
          Update Card
        </Button>
      </SettingsCard>

      <SettingsCard title="Billing History" className="lg:col-span-2">
        <div className="space-y-2">
          {["Apr 1, 2026 — $49.00", "Mar 1, 2026 — $49.00", "Feb 1, 2026 — $49.00"].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between rounded-lg border border-[#232330] bg-[#0B0B10] px-3 py-2.5 text-[13px]"
            >
              <span className="text-[#F5F5F7]">{row}</span>
              <button type="button" className="text-[#8B5CF6] hover:text-[#A78BFA]">
                Download
              </button>
            </div>
          ))}
        </div>
      </SettingsCard>
    </div>
  );
}

function IntegrationsTab({
  integrations,
  onToggle,
}: {
  integrations: import("@/lib/settings/settings").IntegrationSettings;
  onToggle: (id: import("@/lib/settings/settings").IntegrationId, connected: boolean) => void;
}) {
  return (
    <div className={`grid md:grid-cols-2 ${GRID_CARD_GAP}`}>
      {INTEGRATION_META.map((item) => {
        const connected = integrations[item.id];
        return (
          <SettingsCard key={item.id} title={item.name}>
            <p className="text-[13px] leading-5 text-[#A1A1AA]">{item.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <span
                className={[
                  "text-[12px] font-medium",
                  connected ? "text-[#86EFAC]" : "text-[#71717A]",
                ].join(" ")}
              >
                {connected ? "Connected" : "Not connected"}
              </span>
              <Button
                variant={connected ? "ghost" : "secondary"}
                size="sm"
                type="button"
                className="px-5"
                onClick={() => onToggle(item.id, !connected)}
              >
                {connected ? "Disconnect" : "Connect"}
              </Button>
            </div>
          </SettingsCard>
        );
      })}
    </div>
  );
}

function SecurityTab({
  security,
  apiKeyLabel,
  generatedKey,
  onApiKeyLabelChange,
  onToggle2fa,
  onRevokeSession,
  onSignOutAll,
  onGenerateKey,
  onDeleteKey,
}: {
  security: import("@/lib/settings/settings").SecuritySettings;
  apiKeyLabel: string;
  generatedKey: string | null;
  onApiKeyLabelChange: (value: string) => void;
  onToggle2fa: (enabled: boolean) => void;
  onRevokeSession: (id: string) => void;
  onSignOutAll: () => void;
  onGenerateKey: () => void;
  onDeleteKey: (id: string) => void;
}) {
  return (
    <div className={`grid lg:grid-cols-2 ${GRID_CARD_GAP}`}>
      <SettingsCard title="Two-factor Authentication">
        <p className="text-[13px] leading-5 text-[#A1A1AA]">
          Add an extra layer of security to your account using an authenticator app.
        </p>
        <Button
          variant="secondary"
          size="sm"
          type="button"
          className="mt-4 px-6"
          onClick={() => onToggle2fa(!security.twoFactorEnabled)}
        >
          {security.twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
        </Button>
      </SettingsCard>

      <SettingsCard title="Active Sessions">
        <div className="space-y-3 text-[13px]">
          {security.sessions.map((session) => (
            <SessionRow
              key={session.id}
              device={session.device}
              location={session.location}
              current={session.current}
              onRevoke={session.current ? undefined : () => onRevokeSession(session.id)}
            />
          ))}
        </div>
        <Button variant="ghost" size="sm" type="button" className="mt-4 px-6" onClick={onSignOutAll}>
          Sign out other devices
        </Button>
      </SettingsCard>

      <SettingsCard title="API Access" className="lg:col-span-2">
        <p className="text-[13px] text-[#A1A1AA]">
          Generate keys for custom integrations. Keys are shown once and stored securely.
        </p>
        <SettingsInput label="API Key Label" value={apiKeyLabel} onChange={onApiKeyLabelChange} className="mt-4" />
        {generatedKey ? (
          <p className="mt-3 rounded-lg border border-[#8B5CF6]/40 bg-[#151320] px-3 py-2 font-mono text-[12px] text-[#C4B5FD]">
            {generatedKey}
          </p>
        ) : null}
        {security.apiKeys.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {security.apiKeys.map((key) => (
              <li
                key={key.id}
                className="flex items-center justify-between rounded-lg border border-[#232330] bg-[#0B0B10] px-3 py-2 text-[13px]"
              >
                <div>
                  <p className="font-medium text-[#F5F5F7]">{key.label}</p>
                  <p className="text-[12px] text-[#71717A]">{key.prefix}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteKey(key.id)}
                  className="text-[12px] text-[#FCA5A5] hover:text-red-300"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <Button variant="primary" size="sm" type="button" className="mt-4 px-6" onClick={onGenerateKey}>
          Generate New Key
        </Button>
      </SettingsCard>
    </div>
  );
}

function PreferencesTab({
  prefs,
  onChange,
  onSave,
}: {
  prefs: PreferencesState;
  onChange: (patch: Partial<PreferencesState>) => void;
  onSave: () => void;
}) {
  return (
    <div className={`grid lg:grid-cols-2 ${GRID_CARD_GAP}`}>
      <SettingsCard title="Regional Settings">
        <div className="space-y-4">
          <SettingsSelect
            label="Time Zone"
            value={prefs.timezone}
            options={TIMEZONE_OPTIONS}
            onChange={(value) => onChange({ timezone: value })}
          />
          <SettingsSelect
            label="Language"
            value={prefs.language}
            options={LANGUAGE_OPTIONS}
            onChange={(value) => onChange({ language: value })}
          />
          <SettingsSelect
            label="Date Format"
            value={prefs.dateFormat}
            options={DATE_FORMAT_OPTIONS}
            onChange={(value) => onChange({ dateFormat: value })}
          />
          <SettingsSelect
            label="Time Format"
            value={prefs.timeFormat === "12h" ? "12-hour (AM/PM)" : "24-hour"}
            options={["12-hour (AM/PM)", "24-hour"]}
            onChange={(value) => onChange({ timeFormat: value.startsWith("12") ? "12h" : "24h" })}
          />
        </div>
      </SettingsCard>

      <SettingsCard title="Display & Defaults">
        <div className="space-y-4">
          <SettingsSelect
            label="Currency"
            value={prefs.currency}
            options={CURRENCY_OPTIONS}
            onChange={(value) => onChange({ currency: value })}
          />
          <SettingsSelect
            label="Week Starts On"
            value={prefs.weekStartsOn === "sunday" ? "Sunday" : "Monday"}
            options={["Sunday", "Monday"]}
            onChange={(value) =>
              onChange({ weekStartsOn: value === "Sunday" ? "sunday" : "monday" })
            }
          />
          <ToggleRow
            label="Compact tables"
            description="Use denser row spacing across events, artists, and venues."
            checked={prefs.compactTables}
            onChange={(checked) => onChange({ compactTables: checked })}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="primary" size="sm" type="button" onClick={onSave} className="px-8">
            Save Preferences
          </Button>
        </div>
      </SettingsCard>
    </div>
  );
}

function SettingsCard({
  title,
  children,
  action,
  danger,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  danger?: boolean;
  className?: string;
}) {
  return (
    <section
      className={[
        "rounded-[12px] border bg-[#11111A] p-5",
        danger ? "border-[#7F1D1D]/60" : "border-[#232330]",
        className,
      ].join(" ")}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className={`text-[16px] font-semibold ${danger ? "text-[#FCA5A5]" : "text-[#F5F5F7]"}`}>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function SettingsInput({
  label,
  value,
  onChange,
  type = "text",
  disabled,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[13px] font-medium text-[#F5F5F7]">{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-3 text-[13px] text-[#F5F5F7] outline-none transition-colors focus:border-[#8B5CF6] disabled:cursor-not-allowed disabled:text-[#71717A]"
      />
    </label>
  );
}

function SettingsSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-[#F5F5F7]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-3 text-[13px] text-[#F5F5F7] outline-none transition-colors focus:border-[#8B5CF6]"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-[#11111A]">
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = React.useState(false);

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-[#F5F5F7]">{label}</span>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-3 pr-10 text-[13px] text-[#F5F5F7] outline-none focus:border-[#8B5CF6]"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[12px] text-[#71717A] hover:text-[#F5F5F7]"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#232330] pb-2 last:border-0 last:pb-0">
      <dt className="text-[#A1A1AA]">{label}</dt>
      <dd className="text-right font-medium text-[#F5F5F7]">{value}</dd>
    </div>
  );
}

function DangerAction({
  title,
  description,
  actionLabel,
  destructive,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  destructive?: boolean;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#232330] pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[14px] font-medium text-[#F5F5F7]">{title}</p>
        <p className="mt-1 max-w-md text-[12px] leading-5 text-[#A1A1AA]">{description}</p>
      </div>
      <Button
        variant={destructive ? "danger" : "ghost"}
        size="sm"
        type="button"
        className="shrink-0 px-5"
        onClick={onAction}
      >
        {actionLabel}
      </Button>
    </div>
  );
}

function ConnectionRow({
  provider,
  status,
  connected,
}: {
  provider: string;
  status: string;
  connected: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[#232330] bg-[#0B0B10] px-3 py-2.5">
      <div>
        <p className="text-[13px] font-medium text-[#F5F5F7]">{provider}</p>
        <p className="text-[12px] text-[#71717A]">{status}</p>
      </div>
      <span className={`text-[12px] ${connected ? "text-[#86EFAC]" : "text-[#71717A]"}`}>
        {connected ? "Linked" : "Available"}
      </span>
    </div>
  );
}

function SessionRow({
  device,
  location,
  current,
  onRevoke,
}: {
  device: string;
  location: string;
  current?: boolean;
  onRevoke?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[#232330] bg-[#0B0B10] px-3 py-2.5">
      <div>
        <p className="font-medium text-[#F5F5F7]">{device}</p>
        <p className="text-[12px] text-[#71717A]">{location}</p>
      </div>
      {current ? (
        <span className="text-[11px] font-medium text-[#86EFAC]">Current</span>
      ) : (
        <button type="button" onClick={onRevoke} className="text-[12px] text-[#8B5CF6] hover:text-[#A78BFA]">
          Revoke
        </button>
      )}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#232330] py-3 last:border-0">
      <div>
        <p className="text-[14px] font-medium text-[#F5F5F7]">{label}</p>
        <p className="mt-0.5 text-[12px] leading-5 text-[#A1A1AA]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-[#7C3AED]" : "bg-[#3F3F46]",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 size-5 rounded-full bg-white transition-transform",
            checked ? "left-[22px]" : "left-0.5",
          ].join(" ")}
        />
      </button>
    </div>
  );
}
