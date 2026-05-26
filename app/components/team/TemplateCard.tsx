"use client";

import { Clock, Layers } from "lucide-react";

import Button from "@/app/components/ui/Button";
import { eventTemplateMeta, taskTemplateMeta } from "@/lib/team/template-meta";
import { SECTION_CARD_INNER } from "@/lib/ui/page-surfaces";
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
    <article className={[SECTION_CARD_INNER, "flex flex-col p-4"].join(" ")}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#71717A]">
        {variant === "task" ? "Task preset" : "Event template"}
      </p>
      <h3 className="mt-1 text-[14px] font-semibold text-[#F5F5F7]">{template.name}</h3>
      {template.description ? (
        <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-[#A1A1AA]">
          {template.description}
        </p>
      ) : null}

      {meta && variant === "task" && "taskCount" in meta ? (
        <p className="mt-3 flex items-center gap-3 text-[11px] text-[#71717A]">
          <span className="inline-flex items-center gap-1">
            <Layers className="size-3" />
            {meta.taskCount} tasks
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {meta.estimatedDuration}
          </span>
        </p>
      ) : null}

      {meta && variant === "event" && "eventType" in meta ? (
        <p className="mt-3 text-[11px] text-[#71717A]">
          {meta.eventType} · {meta.capacity}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" type="button" onClick={onPreview}>
          Preview
        </Button>
        <Button variant="secondary" size="sm" type="button" onClick={onApply}>
          {variant === "task" ? "Apply" : "Use template"}
        </Button>
      </div>
    </article>
  );
}
