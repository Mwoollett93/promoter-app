"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

import ArtistMatchReviewModal from "@/app/components/artists/ArtistMatchReviewModal";
import ArtistOverwriteConfirmDialog from "@/app/components/artists/ArtistOverwriteConfirmDialog";
import Button from "@/app/components/ui/Button";
import { applyArtistMatch, listArtistFieldConflicts } from "@/lib/ai/apply-artist-match";
import type { ArtistMatch } from "@/lib/ai/artistSchema";
import { readJsonResponse } from "@/lib/api/read-json-response";
import { getStoredSession } from "@/lib/supabase/browser";
import type { ArtistDraft } from "@/lib/types/artist";

type ArtistAiFillButtonProps = {
  artistName: string;
  draft: ArtistDraft;
  onApply: (next: ArtistDraft) => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
};

export default function ArtistAiFillButton({
  artistName,
  draft,
  onApply,
  onError,
  onSuccess,
}: ArtistAiFillButtonProps) {
  const [loading, setLoading] = React.useState(false);
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [matches, setMatches] = React.useState<ArtistMatch[]>([]);
  const [reviewError, setReviewError] = React.useState<string | null>(null);
  const [pendingMatch, setPendingMatch] = React.useState<ArtistMatch | null>(null);
  const [overwriteOpen, setOverwriteOpen] = React.useState(false);
  const [conflicts, setConflicts] = React.useState<ReturnType<typeof listArtistFieldConflicts>>([]);

  const disabled = !artistName.trim() || loading;

  async function handleFindArtist() {
    const name = artistName.trim();
    if (!name) return;

    const session = getStoredSession();
    if (!session?.accessToken) {
      onError("Sign in to use AI artist lookup.");
      return;
    }

    setLoading(true);
    setReviewError(null);
    setMatches([]);
    setReviewOpen(true);

    try {
      const response = await fetch("/api/ai/artist-fill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ artistName: name }),
      });

      const payload = await readJsonResponse<{ error?: string; matches?: ArtistMatch[] }>(response);
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to find artist matches.");
      }

      const nextMatches = payload.matches ?? [];
      if (nextMatches.length === 0) {
        setReviewError("No confident match found. Try a more specific artist name.");
        return;
      }

      setMatches(nextMatches);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Artist lookup failed.";
      setReviewError(message);
      onError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectMatch(match: ArtistMatch) {
    const fieldConflicts = listArtistFieldConflicts(draft, match);
    if (fieldConflicts.length > 0) {
      setPendingMatch(match);
      setConflicts(fieldConflicts);
      setOverwriteOpen(true);
      return;
    }
    finishApply(match, false);
  }

  function finishApply(match: ArtistMatch, overwrite: boolean) {
    const next = applyArtistMatch(draft, match, { overwrite });
    onApply(next);
    setReviewOpen(false);
    setOverwriteOpen(false);
    setPendingMatch(null);
    setConflicts([]);
    onSuccess(`Applied profile for ${match.artistName}. Review each step before saving.`);
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        type="button"
        disabled={disabled}
        onClick={() => void handleFindArtist()}
        className="shrink-0 gap-1.5 px-4"
        title={disabled ? "Enter an artist name first" : "Find artist profile with AI"}
      >
        <Sparkles className="size-4" aria-hidden />
        {loading ? "Finding…" : "Find Artist"}
      </Button>

      <ArtistMatchReviewModal
        open={reviewOpen}
        artistQuery={artistName.trim()}
        matches={matches}
        loading={loading}
        error={reviewError}
        onClose={() => {
          if (!loading) {
            setReviewOpen(false);
            setReviewError(null);
          }
        }}
        onSelect={handleSelectMatch}
      />

      <ArtistOverwriteConfirmDialog
        open={overwriteOpen}
        artistName={pendingMatch?.artistName ?? ""}
        conflicts={conflicts}
        onCancel={() => {
          if (pendingMatch) finishApply(pendingMatch, false);
          setOverwriteOpen(false);
          setPendingMatch(null);
        }}
        onConfirm={() => {
          if (pendingMatch) finishApply(pendingMatch, true);
        }}
      />
    </>
  );
}
