/**
 * Optional email delivery for in-app notifications.
 */

export async function sendNotificationEmail(input: {
  to: string;
  subject: string;
  html: string;
}) {
  const response = await fetch("/api/notifications/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? "Failed to send email");
  }
}
