"use client";

import { Clock, Copy, Eye, Layers } from "lucide-react";

import Button from "@/app/components/ui/Button";
import { eventTemplateMeta, taskTemplateMeta } from "@/lib/team/template-meta";
import type { EventTemplate, TaskTemplate } from "@/lib/types/collaboration";

type TemplateCardProps = {
  variant: "task" | "event";
  taskTemplate?: TaskTemplate;
  eventTemplate?: EventTemplate;
  onPreview: () => void;
  onApply: () => void;
};

export default function TemplateCard({
  variant,
  taskTemplate,
  eventTemplate,
  onPreview,
  onApply,
}: TemplateCardProps) {
  const template = taskTemplate ?? eventTemplate!;
  const meta =
    variant === "task" && taskTemplate
      ? taskTemplateMeta(taskTemplate)
      : eventTemplate
        ? eventTemplateMeta(eventTemplate)
        : null;

  return (
    <article className="flex flex-col rounded-xl border border-[#232330]/90 bg-gradient-to-b from-[#14141F] to-[#11111A] p-4 transition-all hover:border-[#3F3F46] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex size-9 items-center justify-center rounded-lg bg-[#1A1630] text-[#C4B5FD]">
          <Layers className="size-4" />
        </div>
        <span className="rounded-md border border-[#3F3F46] px-1.5 py-0.5 text-[9px] uppercase text-[#71717A]">
          {variant === "task" ? "Task preset" : "Event blueprint"}
        </span>
      </div>
      <h3 className="mt-3 text-[14px] font-semibold text-[#F5F5F7]">{template.name}</h3>
      {template.description ? (
        <p className="mt-1 line-clamp-2 text-[12px] text-[#71717A]">{template.description}</p>
      ) : null}

      {meta && variant === "task" && "taskCount" in meta ? (
        <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-[#A1A1AA]">
          <span className="inline-flex items-center gap-1">
            <Layers className="size-3" />
            {meta.taskCount} tasks
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {meta.estimatedDuration}
          </span>
        </div>
      ) : null}

      {meta && variant === "event" && "eventType" in meta ? (
        <p className="mt-3 text-[10px] text-[#71717A]">
          {meta.eventType} · {meta.capacity}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" type="button" onClick={onPreview}>
          <Eye className="mr-1 size-3.5" />
          Preview
        </Button>
        <Button variant="primary" size="sm" type="button" onClick={onApply}>
          Apply
        </Button>
        <button
          type="button"
          title="Duplicate (coming soon)"
          disabled
          className="inline-flex size-8 cursor-not-allowed items-center justify-center rounded-lg border border-[#232330] text-[#52525B]"
        >
          <Copy className="size-3.5" />
        </button>
      </div>
    </article>
  );
}
