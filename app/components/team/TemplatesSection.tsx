"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import TemplateCard from "@/app/components/team/TemplateCard";
import TemplatePreviewModal from "@/app/components/team/TemplatePreviewModal";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import {
  applyEventTemplate,
  applyTaskTemplate,
  listEventTemplates,
  listTaskTemplates,
} from "@/lib/collaboration/templates";
import type { EventTemplate, TaskTemplate } from "@/lib/types/collaboration";

export default function TemplatesSection() {
  const router = useRouter();
  const { session, workspace } = useWorkspace();
  const [message, setMessage] = React.useState<string | null>(null);
  const [previewTask, setPreviewTask] = React.useState<TaskTemplate | null>(null);
  const [previewEvent, setPreviewEvent] = React.useState<EventTemplate | null>(null);

  if (!workspace) return null;

  const taskTemplates = listTaskTemplates(workspace.id);
  const eventTemplates = listEventTemplates(workspace.id);

  async function applyTask(template: TaskTemplate) {
    if (!session) return;
    await applyTaskTemplate(session, workspace!.id, template);
    setMessage(`Applied "${template.name}" — tasks added to your board.`);
    setPreviewTask(null);
  }

  function applyEvent(template: EventTemplate) {
    applyEventTemplate(template);
    setMessage(`Applied "${template.name}" — opening event wizard.`);
    setPreviewEvent(null);
    router.push("/event-wizard/event-basics");
  }

  return (
    <section className="rounded-xl border border-[#232330]/90 bg-[#0F0F17]/60 p-4">
      <h2 className="text-[16px] font-semibold text-[#F5F5F7]">Workflow templates</h2>
      <p className="mt-1 text-[12px] text-[#71717A]">
        Reusable task presets and event blueprints for faster show planning.
      </p>
      {message ? (
        <p className="mt-3 rounded-lg border border-[#14532D]/40 bg-[#14532D]/20 px-3 py-2 text-[12px] text-[#86EFAC]">
          {message}
        </p>
      ) : null}

      <div className="mt-5">
        <h3 className="text-[12px] font-semibold uppercase tracking-wide text-[#71717A]">
          Task presets
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {taskTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              variant="task"
              taskTemplate={template}
              onPreview={() => {
                setPreviewEvent(null);
                setPreviewTask(template);
              }}
              onApply={() => void applyTask(template)}
            />
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-[12px] font-semibold uppercase tracking-wide text-[#71717A]">
          Event templates
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {eventTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              variant="event"
              eventTemplate={template}
              onPreview={() => {
                setPreviewTask(null);
                setPreviewEvent(template);
              }}
              onApply={() => applyEvent(template)}
            />
          ))}
        </div>
      </div>

      {(previewTask || previewEvent) && (
        <TemplatePreviewModal
          taskTemplate={previewTask}
          eventTemplate={previewEvent}
          onClose={() => {
            setPreviewTask(null);
            setPreviewEvent(null);
          }}
          onApply={() => {
            if (previewTask) void applyTask(previewTask);
            if (previewEvent) applyEvent(previewEvent);
          }}
        />
      )}
    </section>
  );
}
