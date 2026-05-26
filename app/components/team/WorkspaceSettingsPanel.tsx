"use client";

import * as React from "react";

import { loadSettings, saveSettings } from "@/lib/settings/settings";
import {
  FIELD_LABEL,
  INPUT_SURFACE,
  SECTION_CARD,
  SECTION_CARD_PADDING,
  SECTION_DESCRIPTION,
  SECTION_TITLE,
} from "@/lib/ui/page-surfaces";

const WORKSPACE_PREFS_KEY = "promosync:workspace-team-prefs";

type WorkspaceTeamPrefs = {
  allowMemberInvites: boolean;
  defaultInviteRole: string;
  taskAutomationHints: boolean;
  workspaceNotifications: boolean;
};

function loadWorkspacePrefs(): WorkspaceTeamPrefs {
  const defaults: WorkspaceTeamPrefs = {
    allowMemberInvites: false,
    defaultInviteRole: "promoter",
    taskAutomationHints: true,
    workspaceNotifications: true,
  };
  if (typeof window === "undefined") return defaults;
  try {
    return { ...defaults, ...JSON.parse(window.localStorage.getItem(WORKSPACE_PREFS_KEY) ?? "{}") };
  } catch {
    return defaults;
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
    <section className={[SECTION_CARD, SECTION_CARD_PADDING].join(" ")}>
      <h2 className={SECTION_TITLE}>Workspace settings</h2>
      <p className={SECTION_DESCRIPTION}>
        Defaults for invites, automation, and notifications across your crew.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#E4E4E7]">
          <input
            type="checkbox"
            checked={prefs.taskAutomationHints}
            onChange={(e) => updatePrefs({ taskAutomationHints: e.target.checked })}
            className="size-4 rounded border-[#3F3F46] accent-[#7C3AED]"
          />
          Show operational task suggestions
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#E4E4E7]">
          <input
            type="checkbox"
            checked={prefs.workspaceNotifications}
            onChange={(e) => updatePrefs({ workspaceNotifications: e.target.checked })}
            className="size-4 rounded border-[#3F3F46] accent-[#7C3AED]"
          />
          Workspace alert panel on Team page
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#71717A]">
          <input
            type="checkbox"
            checked={prefs.allowMemberInvites}
            onChange={(e) => updatePrefs({ allowMemberInvites: e.target.checked })}
            disabled
            className="size-4 rounded border-[#3F3F46] accent-[#7C3AED]"
          />
          Allow promoters to invite (coming soon)
        </label>
        <label className="block sm:col-span-2">
          <span className={FIELD_LABEL}>Timezone</span>
          <input
            value={appPrefs.timezone}
            onChange={(e) => updateTimezone(e.target.value)}
            className={`${INPUT_SURFACE} mt-1 max-w-md`}
          />
        </label>
      </div>
    </section>
  );
}
