/**
 * Wizard-only fallback when Event Basics has not set a date yet.
 */
export function getEventStartForWizard(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0, 0);
}
