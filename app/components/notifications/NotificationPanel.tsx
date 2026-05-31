"use client";

import Link from "next/link";
import * as React from "react";
import useSWR from "swr";
import { Bell } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/collaboration/notifications";
import { getStoredSession } from "@/lib/supabase/session-store";
import type { AppNotification } from "@/lib/types/collaboration";

async function fetchNotifications() {
  const session = getStoredSession();
  if (!session) return [] as AppNotification[];
  return listNotifications(session);
}

export default function NotificationPanel() {
  const [open, setOpen] = React.useState(false);

  const { data: items = [], mutate } = useSWR(
    open ? "workspace-notifications" : null,
    fetchNotifications,
    {
      dedupingInterval: 30_000,
      revalidateOnFocus: false,
    },
  );

  const unread = items.filter((n) => !n.readAt).length;

  React.useEffect(() => {
    const onUpdated = () => {
      void mutate();
    };
    window.addEventListener("promosync:notifications-updated", onUpdated);
    return () => window.removeEventListener("promosync:notifications-updated", onUpdated);
  }, [mutate]);

  async function handleRead(id: string) {
    const session = getStoredSession();
    if (!session) return;
    await markNotificationRead(session, id);
    await mutate();
  }

  async function handleReadAll() {
    const session = getStoredSession();
    if (!session) return;
    await markAllNotificationsRead(session);
    await mutate();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative flex size-10 items-center justify-center rounded-lg border border-[#3F3F46] text-[#E4E4E7] hover:border-[#52525B]"
          aria-label="Notifications"
        >
          <Bell className="size-[18px]" />
          {unread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-[#7C3AED] text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[360px] border-[#232330] bg-[#11111A] p-0 text-[#F5F5F7]"
      >
        <div className="flex items-center justify-between border-b border-[#232330] px-4 py-3">
          <p className="text-[14px] font-semibold">Notifications</p>
          {unread > 0 ? (
            <button
              type="button"
              onClick={() => void handleReadAll()}
              className="text-[12px] text-[#8B5CF6] hover:text-[#C4B5FD]"
            >
              Mark all read
            </button>
          ) : null}
        </div>
        <ul className="max-h-[360px] overflow-y-auto">
          {items.length === 0 ? (
            <li className="px-4 py-6 text-center text-[13px] text-[#71717A]">All caught up</li>
          ) : (
            items.map((item) => (
              <li
                key={item.id}
                className={[
                  "border-b border-[#232330]/80 px-4 py-3",
                  !item.readAt ? "bg-[#1A1630]/40" : "",
                ].join(" ")}
              >
                {item.linkPath ? (
                  <Link
                    href={item.linkPath}
                    onClick={() => {
                      void handleRead(item.id);
                      setOpen(false);
                    }}
                    className="block"
                  >
                    <NotificationBody item={item} />
                  </Link>
                ) : (
                  <button type="button" className="block w-full text-left" onClick={() => void handleRead(item.id)}>
                    <NotificationBody item={item} />
                  </button>
                )}
              </li>
            ))
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function NotificationBody({ item }: { item: AppNotification }) {
  return (
    <>
      <p className="text-[13px] font-medium text-[#F5F5F7]">{item.title}</p>
      <p className="mt-0.5 text-[12px] text-[#A1A1AA]">{item.body}</p>
      <p className="mt-1 text-[11px] text-[#71717A]">
        {new Date(item.createdAt).toLocaleString()}
      </p>
    </>
  );
}
