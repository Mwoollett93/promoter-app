"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import { LogOut, Settings, Users, MapPin, Mic2 } from "lucide-react";

import { MOBILE_MORE_ITEMS } from "@/lib/layout/mobile-nav";
import { useSettings } from "@/lib/settings/SettingsProvider";
import { signOutOfSupabase } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

const moreIcons: Record<string, typeof Users> = {
  Team: Users,
  Venues: MapPin,
  Artists: Mic2,
  Settings: Settings,
};

type MobileMoreSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function MobileMoreSheet({ open, onOpenChange }: MobileMoreSheetProps) {
  const router = useRouter();
  const { settings } = useSettings();

  async function handleSignOut() {
    onOpenChange(false);
    await signOutOfSupabase();
    router.replace("/login");
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-40 bg-[#0B0B10]/70 backdrop-blur-sm md:hidden",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 max-h-[min(85dvh,520px)] overflow-hidden rounded-t-2xl border border-[#232330] bg-[#11111A] md:hidden",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          )}
          style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
        >
          <DialogPrimitive.Title className="sr-only">More</DialogPrimitive.Title>
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[#3F3F46]" aria-hidden />

          <div className="border-b border-[#232330] px-5 py-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#71717A]">Account</p>
            <div className="mt-2 flex items-center gap-3">
              <div
                className="size-11 shrink-0 rounded-full bg-cover bg-center ring-2 ring-[#232330]"
                style={{ backgroundImage: `url(${settings.profile.avatarUrl})` }}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-[#F5F5F7]">
                  {settings.profile.fullName}
                </p>
                <p className="truncate text-[12px] text-[#8B5CF6]">{settings.profile.role}</p>
              </div>
            </div>
          </div>

          <nav className="overflow-y-auto px-3 py-2" aria-label="More">
            <ul className="space-y-1">
              {MOBILE_MORE_ITEMS.map((item) => {
                const Icon = moreIcons[item.label] ?? Settings;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => onOpenChange(false)}
                      className="flex min-h-[52px] items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-[#181824]"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#0F0F17] text-[#A78BFA]">
                        <Icon className="size-4" strokeWidth={2} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-medium text-[#F5F5F7]">{item.label}</span>
                        {item.description ? (
                          <span className="block text-[12px] text-[#71717A]">{item.description}</span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t border-[#232330] px-3 py-2">
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="flex min-h-[48px] w-full items-center gap-3 rounded-xl px-3 text-[14px] font-medium text-[#F87171] transition-colors hover:bg-[#7F1D1D]/20"
            >
              <LogOut className="size-4 shrink-0" aria-hidden />
              Sign out
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
