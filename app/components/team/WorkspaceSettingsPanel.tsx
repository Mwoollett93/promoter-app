"use client";

import * as React from "react";

import { loadSettings, saveSettings } from "@/lib/settings/settings";

const WORKSPACE_PREFS_KEY = "promosync:workspace-team-prefs";

type WorkspaceTeamPrefs = {
  allowMemberInvites: boolean;
  defaultInviteRole: string;
  taskAutomationHints: boolean;
  workspaceNotifications: boolean;
};

function loadWorkspacePrefs(): WorkspaceTeamPrefs {
  if (typeof window === "undefined") {
    return {
      allowMemberInvites: false,
      defaultInviteRole: "promoter",
      taskAutomationHints: true,
      workspaceNotifications: true,
    };
  }
  try {
    return {
      allowMemberInvites: false,
      defaultInviteRole: "promoter",
      taskAutomationHints: true,
      workspaceNotifications: true,
      ...JSON.parse(window.localStorage.getItem(WORKSPACE_PREFS_KEY) ?? "{}"),
    };
  } catch {
    return {
      allowMemberInvites: false,
      defaultInviteRole: "promoter",
      taskAutomationHints: true,
      workspaceNotifications: true,
    };
  }
}

export default function WorkspaceSettingsPanel() {
  const [prefs, setPrefs] = React.useState<WorkspaceTeamPrefs>(() => loadWorkspacePrefs());
  const [appPrefs, setAppPrefs] = React.useState(() => loadSettings().preferences);

  function updatePrefs(patch: Partial<WorkspaceTeamPrefs>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(WORKSPACE_PREFS_KEY, JSON.stringify(next));
    }
  }

  function updateTimezone(timezone: string) {
    const settings = loadSettings();
    const next = { ...settings, preferences: { ...settings.preferences, timezone } };
    saveSettings(next);
    setAppPrefs(next.preferences);
  }

  return (
    <section className="rounded-xl border border-[#232330]/90 bg-[#0F0F17]/60 p-4">
      <h2 className="text-[16px] font-semibold text-[#F5F5F7]">Workspace settings</h2>
      <p className="mt-1 text-[12px] text-[#71717A]">
        Defaults for invites, automation, and notifications across your crew.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#E4E4E7]">
          <input
            type="checkbox"
            checked={prefs.taskAutomationHints}
            onChange={(e) => updatePrefs({ taskAutomationHints: e.target.checked })}
            className="size-4 accent-[#7C3AED]"
          />
          Show operational task suggestions
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#E4E4E7]">
          <input
            type="checkbox"
            checked={prefs.workspaceNotifications}
            onChange={(e) => updatePrefs({ workspaceNotifications: e.target.checked })}
            className="size-4 accent-[#7C3AED]"
          />
          Workspace alert panel on Team page
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#A1A1AA]">
          <input
            type="checkbox"
            checked={prefs.allowMemberInvites}
            onChange={(e) => updatePrefs({ allowMemberInvites: e.target.checked })}
            disabled
            className="size-4 accent-[#7C3AED]"
          />
          Allow promoters to invite (coming soon)
        </label>
        <label className="block sm:col-span-2">
          <span className="text-[11px] uppercase text-[#71717A]">Timezone</span>
          <input
            value={appPrefs.timezone}
            onChange={(e) => updateTimezone(e.target.value)}
            className="mt-1 w-full max-w-md rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-3 py-2 text-[13px] text-[#F5F5F7]"
          />
        </label>
      </div>
    </section>
  );
}
