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
import { LINK_ACCENT, SECTION_CARD, SECTION_CARD_PADDING, SECTION_DESCRIPTION, SECTION_TITLE } from "@/lib/ui/page-surfaces";
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
    <section className={[SECTION_CARD, SECTION_CARD_PADDING].join(" ")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className={SECTION_TITLE}>Workflow templates</h2>
          <p className={SECTION_DESCRIPTION}>
            Reusable task presets and event blueprints for faster show planning.
          </p>
        </div>
        <button
          type="button"
          className={LINK_ACCENT}
          onClick={() => {
            document.getElementById("team-templates")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          Browse all templates →
        </button>
      </div>

      {message ? (
        <p className="mt-3 rounded-lg border border-[#14532D]/40 bg-[#14532D]/15 px-3 py-2 text-[13px] text-[#86EFAC]">
          {message}
        </p>
      ) : null}

      <div id="team-templates" className="mt-5">
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
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
