"use client";

import * as React from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import { getSupabaseConfig, getSupabaseRealtimeClient } from "@/lib/supabase/browser";

type PresenceUser = {
  userId: string;
  name: string;
};

export default function EventPresence({ eventId }: { eventId: string }) {
  const { session, members } = useWorkspace();
  const [viewers, setViewers] = React.useState<PresenceUser[]>([]);

  const displayName = React.useMemo(() => {
    if (!session) return "You";
    return (
      members.find((m) => m.userId === session.user.id)?.displayName ??
      session.user.email?.split("@")[0] ??
      "You"
    );
  }, [session, members]);

  React.useEffect(() => {
    if (!session) return;

    const self: PresenceUser = { userId: session.user.id, name: displayName };

    const config = getSupabaseConfig();
    if (!config || session.demo) {
      setViewers([self]);
      return;
    }

    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    async function subscribe() {
      try {
        const client = getSupabaseRealtimeClient();
        await client.realtime.setAuth(session!.accessToken);

        const ch = client.channel(`presence:event:${eventId}`, {
          config: { presence: { key: session!.user.id } },
        });

        ch.on("presence", { event: "sync" }, () => {
          if (cancelled) return;
          const state = ch.presenceState() as Record<string, Array<{ name?: string }>>;
          const list: PresenceUser[] = [];
          for (const [userId, payloads] of Object.entries(state)) {
            list.push({
              userId,
              name: payloads[0]?.name ?? userId.slice(0, 8),
            });
          }
          setViewers(list.length > 0 ? list : [self]);
        });

        await ch.subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await ch.track({ name: displayName });
          }
        });

        channel = ch;
      } catch {
        if (!cancelled) setViewers([self]);
      }
    }

    void subscribe();

    return () => {
      cancelled = true;
      if (channel) {
        void channel.unsubscribe();
      }
    };
  }, [session, eventId, displayName]);

  if (viewers.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] uppercase tracking-wide text-[#71717A]">Viewing</span>
      {viewers.map((viewer) => (
        <span
          key={viewer.userId}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#3F3F46] bg-[#11111A] px-2.5 py-1 text-[11px] text-[#E4E4E7]"
        >
          <span className="size-1.5 rounded-full bg-[#86EFAC]" />
          {viewer.name}
        </span>
      ))}
    </div>
  );
}
