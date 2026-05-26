/** MusicBrainz allows ~1 request per second. Serialize calls across portrait + contact enrichment. */
let lastMusicBrainzAt = 0;

export async function waitForMusicBrainzSlot(): Promise<void> {
  const elapsed = Date.now() - lastMusicBrainzAt;
  const waitMs = Math.max(0, 1100 - elapsed);
  if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
  lastMusicBrainzAt = Date.now();
}
