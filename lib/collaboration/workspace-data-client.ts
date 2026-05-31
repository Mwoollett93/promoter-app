"use client";

import useSWR, { mutate as globalMutate, type SWRConfiguration } from "swr";

import type {
  WorkspaceDataInclude,
  WorkspaceDataResponse,
} from "@/lib/collaboration/workspace-data-types";
import { getValidSession } from "@/lib/supabase/browser";
import { shouldUseLocalCollaboration } from "@/lib/collaboration/storage-mode";
import type { SupabaseSession } from "@/lib/types/artist";

const SWR_OPTIONS: SWRConfiguration = {
  dedupingInterval: 30_000,
  revalidateOnFocus: false,
  revalidateIfStale: true,
  keepPreviousData: true,
};

async function fetchWorkspaceData(
  session: SupabaseSession,
  includes: WorkspaceDataInclude[],
): Promise<WorkspaceDataResponse> {
  const response = await fetch(`/api/workspace-data?include=${includes.join(",")}`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  });

  if (response.status === 404) {
    const payload = (await response.json().catch(() => ({}))) as { needsBootstrap?: boolean };
    if (payload.needsBootstrap) {
      throw new WorkspaceBootstrapRequiredError();
    }
  }

  if (!response.ok) {
    throw new Error("Unable to load workspace data.");
  }

  return (await response.json()) as WorkspaceDataResponse;
}

export class WorkspaceBootstrapRequiredError extends Error {
  constructor() {
    super("Workspace bootstrap required.");
    this.name = "WorkspaceBootstrapRequiredError";
  }
}

export function workspaceDataKey(workspaceId: string | null, includes: WorkspaceDataInclude[]) {
  if (!workspaceId) return null;
  return ["workspace-data", workspaceId, ...includes.slice().sort()] as const;
}

export function useWorkspaceDataSWR(
  session: SupabaseSession | null,
  includes: WorkspaceDataInclude[],
  usingLocalFallback: boolean,
) {
  const sortedIncludes = includes.slice().sort();
  const key =
    session && !usingLocalFallback
      ? workspaceDataKey(session.user.id, sortedIncludes)
      : null;

  return useSWR(
    key,
    async () => {
      if (!session) throw new Error("Missing session.");
      return fetchWorkspaceData(session, sortedIncludes);
    },
    SWR_OPTIONS,
  );
}

export async function revalidateWorkspaceData(workspaceId: string, includes?: WorkspaceDataInclude[]) {
  const keys = includes
    ? [workspaceDataKey(workspaceId, includes)]
    : ([
        ["workspace-data", workspaceId],
      ] as const);

  await Promise.all(keys.map((key) => globalMutate(key)));
}

export async function prefetchWorkspaceData(
  session: SupabaseSession,
  includes: WorkspaceDataInclude[],
) {
  const sortedIncludes = includes.slice().sort();
  const key = workspaceDataKey(session.user.id, sortedIncludes);
  if (!key) return null;
  return globalMutate(key, () => fetchWorkspaceData(session, sortedIncludes), {
    revalidate: false,
  });
}

export async function getValidSessionForWorkspaceFetch() {
  return getValidSession();
}
