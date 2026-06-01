function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildBetaFeedbackEmail(input: {
  name: string;
  email: string;
  category: string;
  page: string;
  message: string;
  screenshotNote?: string;
  userId?: string;
  workspaceId?: string;
}) {
  const subject = `[Beta Feedback] ${input.category} — ${input.name}`;
  const html = `
    <h2>Beta feedback</h2>
    <p><strong>Name:</strong> ${escapeHtml(input.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
    <p><strong>Category:</strong> ${escapeHtml(input.category)}</p>
    <p><strong>Page / route:</strong> ${escapeHtml(input.page || "—")}</p>
    ${input.userId ? `<p><strong>User ID:</strong> ${escapeHtml(input.userId)}</p>` : ""}
    ${input.workspaceId ? `<p><strong>Workspace ID:</strong> ${escapeHtml(input.workspaceId)}</p>` : ""}
    ${input.screenshotNote ? `<p><strong>Screenshot note:</strong> ${escapeHtml(input.screenshotNote)}</p>` : ""}
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(input.message).replace(/\n/g, "<br />")}</p>
  `;
  return { subject, html };
}

export function buildBetaSurveyEmail(input: {
  name: string;
  email: string;
  rating: number;
  workedWell: string;
  blockers: string;
  wouldUseWeekly: string;
  extraNotes?: string;
  userId?: string;
  workspaceId?: string;
}) {
  const subject = `[Beta Survey] ${input.rating}/5 — ${input.name}`;
  const html = `
    <h2>Beta tester survey</h2>
    <p><strong>Name:</strong> ${escapeHtml(input.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
    <p><strong>Overall rating:</strong> ${input.rating} / 5</p>
    <p><strong>Would use weekly:</strong> ${escapeHtml(input.wouldUseWeekly)}</p>
    ${input.userId ? `<p><strong>User ID:</strong> ${escapeHtml(input.userId)}</p>` : ""}
    ${input.workspaceId ? `<p><strong>Workspace ID:</strong> ${escapeHtml(input.workspaceId)}</p>` : ""}
    <p><strong>What worked well:</strong></p>
    <p>${escapeHtml(input.workedWell).replace(/\n/g, "<br />")}</p>
    <p><strong>What blocked you:</strong></p>
    <p>${escapeHtml(input.blockers).replace(/\n/g, "<br />")}</p>
    ${
      input.extraNotes
        ? `<p><strong>Additional notes:</strong></p><p>${escapeHtml(input.extraNotes).replace(/\n/g, "<br />")}</p>`
        : ""
    }
  `;
  return { subject, html };
}
