export function betaFeedbackInbox() {
  return (
    process.env.CONTACT_INBOX?.trim() ||
    process.env.RESEND_CONTACT_TO?.trim() ||
    "hello@promosync.app"
  );
}
