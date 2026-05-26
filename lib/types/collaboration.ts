export type WorkspaceRole =
  | "admin"
  | "promoter"
  | "marketing"
  | "finance"
  | "guest_list"
  | "read_only";

export type MemberStatus = "invited" | "active";

export type TaskColumn = "backlog" | "todo" | "in_progress" | "waiting" | "complete";

export type CommentTarget = "event" | "artist" | "venue" | "task";

export type ActivityEntity =
  | "event"
  | "artist"
  | "venue"
  | "task"
  | "finance"
  | "lineup"
  | "comment";

export type NotificationType =
  | "task_assigned"
  | "mention"
  | "artist_updated"
  | "forecast_negative"
  | "venue_contract_uploaded"
  | "event_deadline"
  | "venue_changed"
  | "lineup_incomplete";

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceMember = {
  id: string;
  workspaceId: string;
  userId: string | null;
  invitedEmail: string | null;
  role: WorkspaceRole;
  status: MemberStatus;
  displayName: string | null;
  joinedAt: string | null;
  createdAt: string;
};

export type WorkspaceInvite = {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  expiresAt: string;
  acceptedAt: string | null;
  invitedBy?: string | null;
  createdAt: string;
};

export type EventMemberOverride = {
  id: string;
  eventId: string;
  userId: string;
  canEditFinance: boolean | null;
  canEditLineup: boolean | null;
  canUploadDocs: boolean | null;
  commentOnly: boolean;
};

export type WorkspaceEvent = {
  id: string;
  workspaceId: string;
  createdBy: string;
  name: string;
  status: "draft" | "active" | "canceled" | "completed";
  venueId: string | null;
  venueName: string;
  description: string | null;
  dateKey: string | null;
  startTime: string | null;
  startsAt: string | null;
  artistCount: number;
  slotCount: number;
  b2bCount: number;
  ticketInventory: number;
  expectedRevenue: number;
  totalCosts: number;
  projectedProfit: number;
  scheduleJson: unknown[];
  financeJson: Record<string, unknown>;
  planningJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ActivityLogEntry = {
  id: string;
  workspaceId: string;
  eventId: string | null;
  entityType: ActivityEntity;
  entityId: string | null;
  actorId: string;
  actorName?: string;
  verb: string;
  summary: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type Comment = {
  id: string;
  workspaceId: string;
  targetType: CommentTarget;
  targetId: string;
  parentId: string | null;
  body: string;
  mentionUserIds: string[];
  authorId: string;
  authorName?: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type Task = {
  id: string;
  workspaceId: string;
  eventId: string | null;
  artistId: string | null;
  venueId: string | null;
  bookingId: string | null;
  column: TaskColumn;
  position: number;
  title: string;
  description: string | null;
  assigneeId: string | null;
  assigneeName?: string;
  dueAt: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  labels: string[];
  checklist: TaskChecklistItem[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type AppNotification = {
  id: string;
  userId: string;
  workspaceId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkPath: string | null;
  metadata: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

export type TaskTemplate = {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  tasksJson: unknown[];
  createdAt: string;
};

export type EventTemplate = {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  templateJson: Record<string, unknown>;
  createdAt: string;
};

export const WORKSPACE_ROLE_LABELS: Record<WorkspaceRole, string> = {
  admin: "Admin",
  promoter: "Promoter",
  marketing: "Marketing",
  finance: "Finance",
  guest_list: "Guest list manager",
  read_only: "Read-only",
};

export const TASK_COLUMNS: TaskColumn[] = [
  "backlog",
  "todo",
  "in_progress",
  "waiting",
  "complete",
];

export const TASK_COLUMN_LABELS: Record<TaskColumn, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  waiting: "Waiting",
  complete: "Complete",
};
