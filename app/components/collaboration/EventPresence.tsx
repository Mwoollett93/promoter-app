"use client";

import * as React from "react";

import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import { getSupabaseConfig } from "@/lib/supabase/browser";

type PresenceUser = {
  userId: string;
  name: string;
};

export default function EventPresence({ eventId }: { eventId: string }) {
  const { session, members } = useWorkspace();
  const [viewers, setViewers] = React.useState<PresenceUser[]>([]);

  React.useEffect(() => {
    if (!session) return;

    const displayName =
      members.find((m) => m.userId === session.user.id)?.displayName ??
      session.user.email?.split("@")[0] ??
      "You";

    const self: PresenceUser = { userId: session.user.id, name: displayName };

    const config = getSupabaseConfig();
    if (!config || session.demo) {
      setViewers([self]);
      return;
    }

    let channel: { track: (s: object) => void; unsubscribe: () => void } | null = null;

    async function subscribe() {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const client = createClient(config!.url, config!.anonKey, {
          auth: { persistSession: false },
        });
        await client.realtime.setAuth(session!.accessToken);

        const ch = client.channel(`presence:event:${eventId}`, {
          config: { presence: { key: session!.user.id } },
        });

        ch.on("presence", { event: "sync" }, () => {
          const state = ch.presenceState() as Record<string, Array<{ name?: string }>>;
          const list: PresenceUser[] = [];
          for (const [userId, payloads] of Object.entries(state)) {
            list.push({
              userId,
              name: payloads[0]?.name ?? userId.slice(0, 8),
            });
          }
          setViewers(list);
        });

        await ch.subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await ch.track({ name: displayName });
          }
        });

        channel = ch;
      } catch {
        setViewers([self]);
      }
    }

    void subscribe();

    return () => {
      channel?.unsubscribe();
    };
  }, [session, eventId, members]);

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
