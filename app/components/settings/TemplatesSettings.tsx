"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import Button from "@/app/components/ui/Button";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import {
  applyEventTemplate,
  applyTaskTemplate,
  listEventTemplates,
  listTaskTemplates,
} from "@/lib/collaboration/templates";

export default function TemplatesSettings() {
  const router = useRouter();
  const { session, workspace } = useWorkspace();
  const [message, setMessage] = React.useState<string | null>(null);

  if (!workspace) return null;

  const taskTemplates = listTaskTemplates(workspace.id);
  const eventTemplates = listEventTemplates(workspace.id);

  async function applyTemplate(templateId: string) {
    if (!session || !workspace) return;
    const template = taskTemplates.find((t) => t.id === templateId);
    if (!template) return;
    await applyTaskTemplate(session, workspace.id, template);
    setMessage(`Applied "${template.name}" — tasks added to your workspace board.`);
  }

  function useEventTemplate(templateId: string) {
    const template = eventTemplates.find((t) => t.id === templateId);
    if (!template) return;
    applyEventTemplate(template);
    setMessage(`Applied "${template.name}" — opening event wizard with template defaults.`);
    router.push("/event-wizard/event-basics");
  }

  return (
    <section className="rounded-[16px] border border-[#232330] bg-[#11111A] p-6">
      <h2 className="text-[18px] font-semibold text-[#F5F5F7]">Templates (V2)</h2>
      <p className="mt-2 text-[13px] text-[#A1A1AA]">
        Recurring task presets and event blueprints for faster show planning.
      </p>
      {message ? <p className="mt-3 text-[13px] text-[#86EFAC]">{message}</p> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-[14px] font-medium text-[#E4E4E7]">Task presets</h3>
          <ul className="mt-3 space-y-2">
            {taskTemplates.map((template) => (
              <li
                key={template.id}
                className="flex items-center justify-between rounded-lg border border-[#232330] bg-[#0B0B10] px-3 py-2"
              >
                <div>
                  <p className="text-[13px] font-medium text-[#F5F5F7]">{template.name}</p>
                  {template.description ? (
                    <p className="text-[11px] text-[#71717A]">{template.description}</p>
                  ) : null}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => void applyTemplate(template.id)}
                >
                  Apply
                </Button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-[14px] font-medium text-[#E4E4E7]">Event templates</h3>
          <ul className="mt-3 space-y-2">
            {eventTemplates.map((template) => (
              <li
                key={template.id}
                className="flex items-center justify-between rounded-lg border border-[#232330] bg-[#0B0B10] px-3 py-2"
              >
                <div>
                  <p className="text-[13px] font-medium text-[#F5F5F7]">{template.name}</p>
                  {template.description ? (
                    <p className="text-[11px] text-[#71717A]">{template.description}</p>
                  ) : null}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => useEventTemplate(template.id)}
                >
                  Use template
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
