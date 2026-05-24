import type { EventMemberOverride, WorkspaceRole } from "@/lib/types/collaboration";

export type EventCapabilities = {
  canEditFinance: boolean;
  canEditLineup: boolean;
  canUploadDocs: boolean;
  canComment: boolean;
  canManageTeam: boolean;
  canManageWorkspace: boolean;
};

const ROLE_DEFAULTS: Record<WorkspaceRole, EventCapabilities> = {
  admin: {
    canEditFinance: true,
    canEditLineup: true,
    canUploadDocs: true,
    canComment: true,
    canManageTeam: true,
    canManageWorkspace: true,
  },
  promoter: {
    canEditFinance: true,
    canEditLineup: true,
    canUploadDocs: true,
    canComment: true,
    canManageTeam: false,
    canManageWorkspace: false,
  },
  marketing: {
    canEditFinance: false,
    canEditLineup: false,
    canUploadDocs: true,
    canComment: true,
    canManageTeam: false,
    canManageWorkspace: false,
  },
  finance: {
    canEditFinance: true,
    canEditLineup: false,
    canUploadDocs: true,
    canComment: true,
    canManageTeam: false,
    canManageWorkspace: false,
  },
  guest_list: {
    canEditFinance: false,
    canEditLineup: false,
    canUploadDocs: true,
    canComment: true,
    canManageTeam: false,
    canManageWorkspace: false,
  },
  read_only: {
    canEditFinance: false,
    canEditLineup: false,
    canUploadDocs: false,
    canComment: true,
    canManageTeam: false,
    canManageWorkspace: false,
  },
};

export function resolveEventCapabilities(
  role: WorkspaceRole,
  override?: EventMemberOverride | null,
): EventCapabilities {
  const base = { ...ROLE_DEFAULTS[role] };

  if (!override) return base;

  if (override.commentOnly) {
    return {
      canEditFinance: false,
      canEditLineup: false,
      canUploadDocs: false,
      canComment: true,
      canManageTeam: false,
      canManageWorkspace: false,
    };
  }

  if (override.canEditFinance !== null) base.canEditFinance = override.canEditFinance;
  if (override.canEditLineup !== null) base.canEditLineup = override.canEditLineup;
  if (override.canUploadDocs !== null) base.canUploadDocs = override.canUploadDocs;

  return base;
}

export function canInviteMembers(role: WorkspaceRole) {
  return role === "admin";
}
