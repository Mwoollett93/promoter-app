"use client";

import { X } from "lucide-react";

import Button from "@/app/components/ui/Button";
import { eventTemplateMeta, taskTemplateMeta } from "@/lib/team/template-meta";
import type { EventTemplate, TaskTemplate } from "@/lib/types/collaboration";

type TemplatePreviewModalProps = {
  taskTemplate: TaskTemplate | null;
  eventTemplate: EventTemplate | null;
  onClose: () => void;
  onApply: () => void;
};

export default function TemplatePreviewModal({
  taskTemplate,
  eventTemplate,
  onClose,
  onApply,
}: TemplatePreviewModalProps) {
  const template = taskTemplate ?? eventTemplate;
  if (!template) return null;

  const isTask = Boolean(taskTemplate);
  const taskMeta = taskTemplate ? taskTemplateMeta(taskTemplate) : null;
  const eventMeta = eventTemplate ? eventTemplateMeta(eventTemplate) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#232330] bg-[#11111A] p-6 shadow-[0px_10px_40px_0px_rgba(0,0,0,0.4)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8B5CF6]">
              {isTask ? "Task preset" : "Event template"}
            </p>
            <h2 className="mt-1 text-[18px] font-semibold text-[#F5F5F7]">{template.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[#71717A] hover:bg-[#232330] hover:text-[#F5F5F7]"
          >
            <X className="size-5" />
          </button>
        </div>

        {template.description ? (
          <p className="mt-3 text-[13px] leading-5 text-[#A1A1AA]">{template.description}</p>
        ) : null}

        {isTask && taskMeta ? (
          <dl className="mt-4 space-y-2 text-[13px]">
            <div className="flex justify-between border-b border-[#232330] py-2">
              <dt className="text-[#71717A]">Tasks included</dt>
              <dd className="font-medium text-[#F5F5F7]">{taskMeta.taskCount}</dd>
            </div>
            <div className="flex justify-between border-b border-[#232330] py-2">
              <dt className="text-[#71717A]">Estimated duration</dt>
              <dd className="text-[#E4E4E7]">{taskMeta.estimatedDuration}</dd>
            </div>
            <ul className="mt-2 space-y-1 rounded-lg border border-[#232330] bg-[#0F0F17] p-3">
              {((taskTemplate!.tasksJson ?? []) as Array<{ title?: string }>).map((item, i) => (
                <li key={i} className="text-[12px] text-[#E4E4E7]">
                  · {item.title ?? "Untitled task"}
                </li>
              ))}
            </ul>
          </dl>
        ) : null}

        {!isTask && eventMeta ? (
          <dl className="mt-4 space-y-2 text-[13px]">
            {[
              ["Event type", eventMeta.eventType],
              ["Capacity", eventMeta.capacity],
              ["Workflows", eventMeta.workflows.join(", ")],
              ["Ticketing", eventMeta.ticketing],
              ["Finance defaults", eventMeta.finance],
              ["Venue requirements", eventMeta.venue],
              ["Marketing schedule", eventMeta.marketing],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-b border-[#232330] py-2">
                <dt className="text-[#71717A]">{label}</dt>
                <dd className="text-right text-[#E4E4E7]">{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="mt-6 flex gap-2">
          <Button variant="primary" size="sm" type="button" onClick={onApply}>
            {isTask ? "Apply to board" : "Use in wizard"}
          </Button>
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
