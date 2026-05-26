"use client";

import Button from "@/app/components/ui/Button";
import { eventTemplateMeta, taskTemplateMeta } from "@/lib/team/template-meta";
import type { EventTemplate, TaskTemplate } from "@/lib/types/collaboration";

type TemplateCompactRowProps = {
  variant: "task" | "event";
  taskTemplate?: TaskTemplate;
  eventTemplate?: EventTemplate;
  onPreview: () => void;
  onApply: () => void;
};

export default function TemplateCompactRow({
  variant,
  taskTemplate,
  eventTemplate,
  onPreview,
  onApply,
}: TemplateCompactRowProps) {
  const template = taskTemplate ?? eventTemplate!;
  const meta =
    variant === "task" && taskTemplate
      ? taskTemplateMeta(taskTemplate)
      : eventTemplate
        ? eventTemplateMeta(eventTemplate)
        : null;

  const subtitle =
    meta && "taskCount" in meta
      ? `${meta.taskCount} tasks · ${meta.estimatedDuration}`
      : meta && "eventType" in meta
        ? `${meta.eventType} · ${meta.capacity}`
        : "";

  return (
    <div className="flex items-center gap-3 border-b border-[#232330] px-3 py-2.5 last:border-b-0 hover:bg-[#18181F]/60">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-[#F5F5F7]">{template.name}</p>
        <p className="truncate text-[11px] text-[#71717A]">
          {subtitle}
          {template.description ? ` · ${template.description}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 gap-1.5">
        <Button variant="ghost" size="sm" type="button" onClick={onPreview}>
          Preview
        </Button>
        <Button variant="secondary" size="sm" type="button" onClick={onApply}>
          {variant === "task" ? "Apply" : "Use"}
        </Button>
      </div>
    </div>
  );
}
