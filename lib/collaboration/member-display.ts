import type { WorkspaceMember } from "@/lib/types/collaboration";

function capitalizeLocalPart(local: string) {
  const cleaned = local.replace(/[._-]+/g, " ").trim();
  if (!cleaned) return "Member";
  return cleaned
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function displayNameFromEmail(email: string | null | undefined) {
  const normalized = email?.trim().toLowerCase() ?? "";
  if (!normalized) return "Member";
  const local = normalized.split("@")[0] ?? "";
  return capitalizeLocalPart(local);
}

/** Human-friendly label for team pickers, assignees, mentions, etc. */
export function getWorkspaceMemberLabel(member: WorkspaceMember) {
  const rawName = member.displayName?.trim();
  if (rawName && !rawName.includes("@")) return rawName;

  if (member.invitedEmail?.trim()) {
    return displayNameFromEmail(member.invitedEmail);
  }

  return "Member";
}

export function normalizeWorkspaceMember(member: WorkspaceMember): WorkspaceMember {
  const label = getWorkspaceMemberLabel(member);
  if (member.displayName?.trim() === label) return member;
  return { ...member, displayName: label };
}

export function normalizeWorkspaceMembers(members: WorkspaceMember[]) {
  return members.map(normalizeWorkspaceMember);
}
