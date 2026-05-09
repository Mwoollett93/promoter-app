"use client";

import * as React from "react";
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
    id: "sub-club",
    name: "Sub Club",
    cityLabel: "Sub Club, Melbourne",
    address: "22-24 King St, Melbourne VIC 3000",
    capacity: 250,
    imageSrc:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "revolver",
    name: "Revolver Upstairs",
    cityLabel: "Revolver Upstairs, Melbourne",
    address: "229 Chapel St, Prahran VIC 3181",
    capacity: 400,
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
  const [draft, setDraft] = React.useState<EventDraft>({
    eventName: "ABYSSAL 007",
    date: new Date(2026, 4, 5),
    startTime: "22:00",
    venueId: "sub-club",
    description: "",
  });

  const selectedVenue = venues.find((v) => v.id === draft.venueId) ?? venues[0];

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
              options={venues.map((v) => ({ value: v.id, label: v.cityLabel }))}
            />

            <EventCard
              venueName={selectedVenue.name}
              address={selectedVenue.address}
              capacity={selectedVenue.capacity}
              imageSrc={selectedVenue.imageSrc}
              editHref="#"
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
            <Button variant="ghost" size="md" type="button">
              Cancel
            </Button>
            <div className="ml-auto">
              <Button variant="primary" size="md" type="button">
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