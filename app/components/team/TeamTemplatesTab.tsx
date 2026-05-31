"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import TemplateCompactRow from "@/app/components/team/TemplateCompactRow";
import TemplatePreviewModal from "@/app/components/team/TemplatePreviewModal";
import { ManagementTableCard } from "@/app/components/management/ManagementTable";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import {
  applyTaskTemplate,
  beginEventWizardFromTemplate,
  listEventTemplates,
  listTaskTemplates,
} from "@/lib/collaboration/templates";
import { PAGE_STACK_GAP } from "@/lib/layout/page-layout";
import { INPUT_SURFACE, SECTION_DESCRIPTION, SECTION_TITLE } from "@/lib/ui/page-surfaces";
import type { EventTemplate, TaskTemplate } from "@/lib/types/collaboration";

type TemplateFilter = "all" | "task" | "event";

export default function TeamTemplatesTab() {
  const router = useRouter();
  const { session, workspace } = useWorkspace();
  const [message, setMessage] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<TemplateFilter>("all");
  const [previewTask, setPreviewTask] = React.useState<TaskTemplate | null>(null);
  const [previewEvent, setPreviewEvent] = React.useState<EventTemplate | null>(null);

  if (!workspace) return null;

  const taskTemplates = listTaskTemplates(workspace.id);
  const eventTemplates = listEventTemplates(workspace.id);
  const needle = search.trim().toLowerCase();

  const filteredTasks = taskTemplates.filter((t) => {
    if (filter === "event") return false;
    if (!needle) return true;
    return [t.name, t.description ?? ""].join(" ").toLowerCase().includes(needle);
  });

  const filteredEvents = eventTemplates.filter((t) => {
    if (filter === "task") return false;
    if (!needle) return true;
    return [t.name, t.description ?? ""].join(" ").toLowerCase().includes(needle);
  });

  async function applyTask(template: TaskTemplate) {
    if (!session) return;
    await applyTaskTemplate(session, workspace!.id, template);
    setMessage(`Applied "${template.name}" — tasks added to your board.`);
    setPreviewTask(null);
  }

  function applyEvent(template: EventTemplate) {
    beginEventWizardFromTemplate(template);
    setMessage(`Applied "${template.name}" — opening event wizard.`);
    setPreviewEvent(null);
    router.push("/event-wizard/event-basics");
  }

  return (
    <div className={`flex flex-col ${PAGE_STACK_GAP}`}>
      <div>
        <h2 className={SECTION_TITLE}>Workflow templates</h2>
        <p className={SECTION_DESCRIPTION}>
          Task presets and event blueprints — preview before applying to your workspace.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-[12px]">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#71717A]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates…"
            className={`${INPUT_SURFACE} pl-9`}
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-[#232330] bg-[#11111A] p-0.5">
          {(
            [
              { id: "all", label: "All" },
              { id: "task", label: "Task presets" },
              { id: "event", label: "Event templates" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={[
                "rounded-md px-2.5 py-1.5 text-[12px] font-medium",
                filter === f.id
                  ? "bg-[#1A1630] text-[#C4B5FD]"
                  : "text-[#71717A] hover:text-[#A1A1AA]",
              ].join(" ")}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {message ? (
        <p className="rounded-lg border border-[#14532D]/40 bg-[#14532D]/15 px-3 py-2 text-[13px] text-[#86EFAC]">
          {message}
        </p>
      ) : null}

      {(filter === "all" || filter === "task") && filteredTasks.length > 0 ? (
        <ManagementTableCard>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#71717A]">
            Task presets
          </p>
          <div className="overflow-hidden rounded-lg border border-[#232330] bg-[#0B0B10]">
            {filteredTasks.map((template) => (
              <TemplateCompactRow
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
        </ManagementTableCard>
      ) : null}

      {(filter === "all" || filter === "event") && filteredEvents.length > 0 ? (
        <ManagementTableCard>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#71717A]">
            Event templates
          </p>
          <div className="overflow-hidden rounded-lg border border-[#232330] bg-[#0B0B10]">
            {filteredEvents.map((template) => (
              <TemplateCompactRow
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
        </ManagementTableCard>
      ) : null}

      {filteredTasks.length === 0 && filteredEvents.length === 0 ? (
        <p className="text-[13px] text-[#71717A]">No templates match your search.</p>
      ) : null}

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
    </div>
  );
}
