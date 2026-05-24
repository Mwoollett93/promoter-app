export function buildContactFormEmail(input: {
  name: string;
  email: string;
  intent: string;
  message: string;
}) {
  const subject = `PromoSync contact — ${input.intent}`;
  const html = `
    <h2>New contact form submission</h2>
    <p><strong>Name:</strong> ${escapeHtml(input.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
    <p><strong>Intent:</strong> ${escapeHtml(input.intent)}</p>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(input.message).replace(/\n/g, "<br />")}</p>
  `;
  return { subject, html };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
