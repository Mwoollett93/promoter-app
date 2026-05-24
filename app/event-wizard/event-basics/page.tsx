"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Info } from "lucide-react";

import Stepper from "@/app/components/ui/Stepper";
import Input from "@/app/components/ui/Input";
import DateInput from "@/app/components/ui/DateInput";
import TimeInput from "@/app/components/ui/TimeInput";
import VenueDropdown from "@/app/components/ui/VenueDropdown";
import EventCard from "@/app/components/ui/EventCard";
import PromoSyncTextArea from "@/app/components/ui/TextArea";
import Button from "@/app/components/ui/Button";
import EventSummaryCard from "@/app/components/ui/EventSummaryCard";
import TipCard from "@/app/components/ui/TipCard";
import { loadWizardEventDraft, saveWizardEventDraft } from "@/lib/data";
import { hasWizardProgress } from "@/lib/event-wizard/persist-wizard-draft";
import { useWizardFlush } from "@/lib/event-wizard/use-wizard-flush";
import { getStoredSession, getSupabaseConfig } from "@/lib/supabase/browser";
import * as SupabaseBrowser from "@/lib/supabase/browser";
import type { SupabaseSession } from "@/lib/types/artist";

type VenueProfile = {
  id: string;
  name: string;
  city: string;
  country: string;
  addressLine1: string;
  maxCapacity: number;
  imageUrl?: string;
};

const venueApi = SupabaseBrowser as {
  listVenues?: (session: SupabaseSession) => Promise<VenueProfile[]>;
};

type VenueRow = {
  id: string;
  name: string;
  city: string;
  country: string;
  address_line1: string;
  max_capacity: number | null;
  image_url: string | null;
};

async function readSupabaseError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { message?: string; error_description?: string; hint?: string };
    return data.message ?? data.error_description ?? data.hint ?? fallback;
  } catch {
    return fallback;
  }
}

async function listVenuesLocal(session: SupabaseSession): Promise<VenueProfile[]> {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Missing Supabase environment variables.");

  const response = await fetch(
    `${config.url}/rest/v1/venues?select=id,name,city,country,address_line1,max_capacity,image_url&order=created_at.desc`,
    {
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(await readSupabaseError(response, "Unable to load venues."));
  }

  const rows = (await response.json()) as VenueRow[];
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    city: row.city,
    country: row.country,
    addressLine1: row.address_line1,
    maxCapacity: row.max_capacity ?? 0,
    imageUrl: row.image_url ?? undefined,
  }));
}

const listVenues = venueApi.listVenues ?? listVenuesLocal;

type Venue = {
  id: string;
  name: string;
  cityLabel: string;
  address: string;
  capacity: number;
  imageSrc?: string;
};

type EventDraft = {
  eventName: string;
  date?: Date;
  startTime: string;
  venueId: string;
  description: string;
};

const venues: Venue[] = [
  {
    id: "seed-ministry-of-sound",
    name: "Ministry of Sound",
    cityLabel: "Ministry of Sound, London",
    address: "103 Gaunt St, London, United Kingdom",
    capacity: 1500,
  },
  {
    id: "seed-printworks-london",
    name: "Printworks London",
    cityLabel: "Printworks London, London",
    address: "Surrey Quays Rd, London, United Kingdom",
    capacity: 6000,
  },
  {
    id: "seed-revolver-upstairs",
    name: "Revolver Upstairs",
    cityLabel: "Revolver Upstairs, Melbourne",
    address: "229 Chapel St, Melbourne, Australia",
    capacity: 500,
  },
];

function formatDateLabel(date?: Date) {
  if (!date) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTimeLabel(time24?: string) {
  if (!time24) return "—";
  const [hRaw, mRaw] = time24.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (Number.isNaN(h) || Number.isNaN(m)) return time24;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${suffix}`;
}

export default function EventBasicsPage() {
  const router = useRouter();
  const [availableVenues, setAvailableVenues] = React.useState<Venue[]>(venues);
  const [draft, setDraft] = React.useState<EventDraft>({
    eventName: "ABYSSAL 007",
    date: new Date(2026, 4, 5),
    startTime: "22:00",
    venueId: venues[0]?.id ?? "",
    description: "",
  });

  React.useEffect(() => {
    const stored = getStoredSession();
    if (!stored || !getSupabaseConfig()) return;

    listVenues(stored)
      .then((rows) => {
        if (!rows || rows.length === 0) return;
        const mapped = rows.map(mapVenueOption);
        setAvailableVenues(mapped);
      })
      .catch(() => undefined);
  }, []);

  React.useEffect(() => {
    if (!availableVenues.some((venue) => venue.id === draft.venueId)) {
      setDraft((current) => ({ ...current, venueId: availableVenues[0]?.id ?? "" }));
    }
  }, [availableVenues, draft.venueId]);

  const selectedVenue = availableVenues.find((v) => v.id === draft.venueId) ?? availableVenues[0];

  React.useEffect(() => {
    const stored = loadWizardEventDraft();
    if (!stored) return;

    const [year, month, day] = stored.dateKey.split("-").map(Number);
    const parsedDate =
      Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)
        ? new Date(year, month - 1, day)
        : undefined;

    setDraft((current) => ({
      ...current,
      eventName: stored.eventName ?? current.eventName,
      date: parsedDate ?? current.date,
      startTime: stored.startTime || current.startTime,
      venueId: stored.venueId ?? current.venueId,
      description: stored.description ?? current.description,
    }));
  }, []);

  const flushDraftToStorage = React.useCallback(() => {
    if (!draft.date || !selectedVenue) return;
    saveWizardEventDraft({
      date: draft.date,
      startTime: draft.startTime,
      eventName: draft.eventName,
      venueId: selectedVenue.id,
      venueName: selectedVenue.name,
      venueCapacity: selectedVenue.capacity,
      description: draft.description,
    });
  }, [draft, selectedVenue]);

  useWizardFlush(flushDraftToStorage);

  function handleCancel() {
    if (
      hasWizardProgress() &&
      !window.confirm(
        "Leave the event wizard? Your progress stays in this browser until you finish or save a draft.",
      )
    ) {
      return;
    }
    router.push("/events");
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex w-full justify-center">
        <Stepper state="Event Basics" />
      </div>

      <div className="flex w-full items-start justify-end gap-3">
        <section className="min-w-0 flex-1 rounded-[16px] border border-[#181824] bg-gradient-to-b from-[#11111A] to-[#0D0D14] p-5 shadow-[0px_10px_40px_0px_rgba(0,0,0,0.4)]">
          <h2 className="text-[24px] font-bold leading-[28px] text-[#F5F5F7]">
            Event Basics
          </h2>
          <p className="mt-1 text-[12px] leading-4 text-[#A1A1AA]">
            Add the key details about your event.
          </p>

          <div className="mt-3 space-y-3">
            <Input
              state="default"
              label="Event Name"
              required
              value={draft.eventName}
              onChange={(v: string) =>
                setDraft((prev) => ({ ...prev, eventName: v }))
              }
              helperText="This is how your event will appear to your audience."
            />

            <div className="grid grid-cols-2 gap-3">
              <DateInput
                label="Date"
                required
                value={draft.date}
                onChange={(d) => setDraft((prev) => ({ ...prev, date: d }))}
              />
              <TimeInput
                label="Start Time"
                required
                value={draft.startTime}
                onChange={(t) => setDraft((prev) => ({ ...prev, startTime: t }))}
              />
            </div>

            <Input
              state="inactive"
              label="End Time"
              required={false}
              value="Calculate automatically"
              helperText="End time will be calculated from your lineup"
            />

            <VenueDropdown
              label="Venue"
              required
              value={draft.venueId}
              onChange={(id) => setDraft((prev) => ({ ...prev, venueId: id }))}
              options={availableVenues.map((v) => ({ value: v.id, label: v.cityLabel }))}
            />

            <EventCard
              venueName={selectedVenue.name}
              address={selectedVenue.address}
              capacity={selectedVenue.capacity}
              imageSrc={selectedVenue.imageSrc}
              editHref={draft.venueId.startsWith("seed-") ? "/venues/new" : `/venues/new?venueId=${selectedVenue.id}`}
              className="max-w-none"
            />

            <div className="flex items-center gap-1.5 text-[14px] leading-5 text-[#A1A1AA]">
              <Info className="h-4 w-4 shrink-0" />
              <span>
                Selecting a venue will auto-fill capacity and base costs.
              </span>
            </div>

            <PromoSyncTextArea
              label="Description"
              required={false}
              value={draft.description}
              onChange={(v: string) =>
                setDraft((prev) => ({ ...prev, description: v }))
              }
              maxLength={500}
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Button variant="ghost" size="md" type="button" onClick={handleCancel}>
              Cancel
            </Button>
            <div className="ml-auto">
              <Button
                variant="primary"
                size="md"
                type="button"
                onClick={() => {
                  saveWizardEventDraft({
                    date: draft.date,
                    startTime: draft.startTime,
                    eventName: draft.eventName,
                    venueId: selectedVenue.id,
                    venueName: selectedVenue.name,
                    venueCapacity: selectedVenue.capacity,
                    description: draft.description,
                  });
                  router.push("/event-wizard/lineup-&-schedule");
                }}
              >
                <span className="inline-flex items-center gap-2">
                  Continue
                  <ArrowRight
                    className="h-5 w-5 shrink-0"
                    strokeWidth={2}
                    aria-hidden
                  />
                </span>
              </Button>
            </div>
          </div>
        </section>

        <aside className="flex w-fit max-w-[411px] shrink-0 flex-col gap-3">
          <EventSummaryCard
            title={draft.eventName || "Untitled Event"}
            dateLabel={formatDateLabel(draft.date)}
            timeLabel={formatTimeLabel(draft.startTime)}
            venueLabel={selectedVenue.cityLabel}
            capacityLabel={`Capacity: ${selectedVenue.capacity}`}
            description={
              draft.description?.trim()
                ? draft.description
                : "Add a description to preview it here."
            }
            imageSrc={selectedVenue.imageSrc}
          />
          <TipCard />
        </aside>
      </div>
    </div>
  );
}

function mapVenueOption(venue: VenueProfile): Venue {
  return {
    id: venue.id,
    name: venue.name,
    cityLabel: `${venue.name}, ${venue.city}`,
    address: [venue.addressLine1, venue.city, venue.country].filter(Boolean).join(", "),
    capacity: venue.maxCapacity,
    imageSrc: venue.imageUrl,
  };
}