"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Download,
  Edit3,
  ExternalLink,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Music,
  Plus,
  Search,
  Trash2,
  UserCircle,
  X,
} from "lucide-react";
import PageContent from "@/app/components/layout/PageContent";
import ActionComingSoonTile from "@/app/components/ui/ActionComingSoonTile";
import ArtistImportDialog from "@/app/components/artists/ArtistImportDialog";
import CurrencyText from "@/app/components/ui/CurrencyText";
import FilterPopover from "@/app/components/ui/FilterPopover";
import {
  ManagementTableCard,
  ManagementTableCell,
  ManagementTableEmptyState,
  ManagementTableHead,
  ManagementTableHeaderCell,
  ManagementTablePagination,
  ManagementTableViewport,
  SortableManagementHeader,
  managementTableRowClass,
} from "@/app/components/management/ManagementTable";
import { MANAGEMENT_TABLE_PAGE_SIZE_ARTISTS, PAGE_STACK_GAP } from "@/lib/layout/page-layout";

import {
  createArtist,
  createSignedDocumentUrl,
  getStoredSession,
  getSupabaseConfig,
  listArtists,
  signOutOfSupabase,
  startGithubSignIn,
  updateArtist,
} from "@/lib/supabase/browser";
import type { ArtistDraft, ArtistProfile, ArtistStatus, SupabaseSession } from "@/lib/types/artist";

type SortKey = "name" | "artistType" | "genres" | "status" | "location" | "addedDate";

const statusFilters: Array<ArtistStatus | "all"> = ["all", "active", "inactive", "archived"];
const pageSize = MANAGEMENT_TABLE_PAGE_SIZE_ARTISTS;
const showSeedAction = process.env.NODE_ENV !== "production";
const seedArtistTemplates = [
  ["Maya Thompson", "Vocalist", ["House", "Pop"], "Manchester", "England"],
  ["The Midnight Kids", "Live Band", ["Indie", "Rock"], "Glasgow", "Scotland"],
  ["Luna Rivers", "DJ", ["Tech House"], "Bristol", "England"],
  ["Echo Collective", "Band", ["Indie", "Alternative"], "Leeds", "England"],
  ["Doze", "DJ / Producer", ["Drum & Bass"], "Birmingham", "England"],
  ["Sophie Lane", "Vocalist", ["Pop", "R&B"], "London", "England"],
  ["Neon Chapters", "Live Band", ["Synthwave"], "Berlin", "Germany"],
  ["Kairo Vale", "DJ / Producer", ["Deep House", "Organic House"], "Lisbon", "Portugal"],
  ["Ari Sol", "DJ", ["Afro House"], "Barcelona", "Spain"],
  ["Northline", "Live Band", ["Post-Club", "Ambient"], "Copenhagen", "Denmark"],
  ["Juno Grey", "Producer", ["Electro", "Breaks"], "Amsterdam", "Netherlands"],
  ["Velvet Unit", "Band", ["Disco", "Cosmic Disco"], "Paris", "France"],
  ["Mika Vale", "DJ", ["Minimal Techno"], "Tokyo", "Japan"],
  ["Low Orbit", "DJ / Producer", ["Dub Techno", "Ambient Techno"], "Reykjavik", "Iceland"],
  ["Ivy Bloom", "Vocalist", ["Downtempo", "Trip-Hop"], "Dublin", "Ireland"],
  ["Rift Signal", "Producer", ["IDM", "Glitch"], "Brighton", "England"],
  ["Cassia Moon", "DJ", ["Progressive House"], "Melbourne", "Australia"],
  ["The Glass Hours", "Live Band", ["Balearic", "Chillout"], "Bristol", "England"],
  ["Nova Saint", "Vocalist", ["Garage", "UK Funky"], "London", "England"],
  ["Parcel Nine", "DJ / Producer", ["Bassline", "2-Step"], "Sheffield", "England"],
  ["Atlas Bloom", "DJ", ["Trance", "Progressive Trance"], "Prague", "Czechia"],
  ["Blue Static", "Band", ["EBM", "Industrial"], "Manchester", "England"],
  ["Talia North", "Producer", ["Liquid DnB"], "Cardiff", "Wales"],
  ["Oro Kin", "DJ / Producer", ["Amapiano", "Afro-Tech"], "Cape Town", "South Africa"],
  ["Sable Room", "DJ", ["House", "Deep House"], "New York", "USA"],
] as const;

export default function ArtistManagementPage() {
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [artists, setArtists] = useState<ArtistProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ArtistStatus | "all">("all");
  const [artistTypeFilter, setArtistTypeFilter] = useState<string | "all">("all");
  const [reachFilter, setReachFilter] = useState<string | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("addedDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [profileArtist, setProfileArtist] = useState<ArtistProfile | null>(null);
  const [actionMenuArtist, setActionMenuArtist] = useState<ArtistProfile | null>(null);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [rowDraft, setRowDraft] = useState<Pick<ArtistDraft, "name" | "genres" | "status"> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const hasSupabaseConfig = Boolean(getSupabaseConfig());

  useEffect(() => {
    const stored = getStoredSession();
    setSession(stored);

    if (!stored) {
      setLoading(false);
      return;
    }

    setLoading(true);
    listArtists(stored)
      .then((rows) => {
        setArtists(rows);
        setSelectedId(rows[0]?.id ?? null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Unable to load artists.");
      })
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    return {
      all: artists.length,
      active: artists.filter((artist) => artist.status === "active").length,
      inactive: artists.filter((artist) => artist.status === "inactive").length,
      archived: artists.filter((artist) => artist.status === "archived").length,
    };
  }, [artists]);

  const artistTypeOptions = useMemo(() => {
    const types = [...new Set(artists.map((a) => a.artistType).filter(Boolean))].sort();
    return types.map((t) => ({ value: t, label: t }));
  }, [artists]);

  const reachOptions = useMemo(() => {
    const reaches = [...new Set(artists.map((a) => a.reach).filter(Boolean))].sort();
    return reaches.map((r) => ({ value: r, label: r }));
  }, [artists]);

  const advancedFilterCount =
    (artistTypeFilter !== "all" ? 1 : 0) + (reachFilter !== "all" ? 1 : 0);

  const filteredArtists = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const next = artists.filter((artist) => {
      const matchesStatus = status === "all" || artist.status === status;
      const matchesType = artistTypeFilter === "all" || artist.artistType === artistTypeFilter;
      const matchesReach = reachFilter === "all" || artist.reach === reachFilter;
      const haystack = [
        artist.name,
        artist.artistType,
        artist.city,
        artist.country,
        artist.reach,
        ...artist.genres,
        ...artist.tags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && matchesType && matchesReach && (!needle || haystack.includes(needle));
    });

    return [...next].sort((a, b) => {
      const aValue = sortableValue(a, sortKey);
      const bValue = sortableValue(b, sortKey);
      const comparison = aValue.localeCompare(bValue);
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [artists, query, sortDirection, sortKey, status, artistTypeFilter, reachFilter]);

  useEffect(() => {
    setPage(1);
  }, [query, status, artistTypeFilter, reachFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredArtists.length / pageSize));
  const paginatedArtists = filteredArtists.slice((page - 1) * pageSize, page * pageSize);
  const selectedArtist = selectedId ? artists.find((artist) => artist.id === selectedId) ?? null : null;

  useEffect(() => {
    setPage(1);
  }, [query, status]);

  useEffect(() => {
    if (selectedId && !filteredArtists.some((artist) => artist.id === selectedId)) {
      setSelectedId(filteredArtists[0]?.id ?? null);
    }
  }, [filteredArtists, selectedId]);

  function handleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection("asc");
  }

  async function handleDownload(documentPath: string) {
    if (!session) return;
    try {
      const url = await createSignedDocumentUrl(documentPath, session);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to open document.");
    }
  }

  async function handleSignOut() {
    await signOutOfSupabase();
    setSession(null);
    setArtists([]);
    setSelectedId(null);
  }

  async function handleSeedArtists() {
    if (!session || seeding) return;

    setSeeding(true);
    setError(null);

    try {
      for (const draft of buildSeedArtistDrafts()) {
        await createArtist(draft, session);
      }

      const rows = await listArtists(session);
      setArtists(rows);
      setSelectedId(rows[0]?.id ?? null);
      setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to seed test artists.");
    } finally {
      setSeeding(false);
    }
  }

  function startRowEdit(artist: ArtistProfile) {
    setEditingRowId(artist.id);
    setRowDraft({
      name: artist.name,
      genres: artist.genres,
      status: artist.status,
    });
  }

  async function saveRowEdit(artistId: string) {
    if (!session || !rowDraft) return;

    try {
      const existing = artists.find((artist) => artist.id === artistId);
      if (!existing) return;

      const updated = await updateArtist(
        artistId,
        {
          name: rowDraft.name,
          artistType: existing.artistType,
          genres: rowDraft.genres,
          status: rowDraft.status,
          classification: existing.classification ?? "",
          city: existing.city ?? "",
          country: existing.country ?? "",
          reach: existing.reach,
          bio: existing.bio ?? "",
          promoImageUrl: existing.promoImageUrl ?? "",
          contactName: existing.contactName ?? "",
          contactRole: existing.contactRole ?? "",
          email: existing.email ?? "",
          bookingEmail: existing.bookingEmail ?? "",
          managementEmail: existing.managementEmail ?? "",
          pressEmail: existing.pressEmail ?? "",
          phone: existing.phone ?? "",
          preferredContactMethod: existing.preferredContactMethod ?? "",
          agencyName: existing.agencyName ?? "",
          managementCompany: existing.managementCompany ?? "",
          contactPage: existing.contactPage ?? "",
          sourceUrls: existing.sourceUrls ?? [],
          contactConfidence: existing.contactConfidence ?? "",
          territory: existing.territory ?? "",
          representedArtists: existing.representedArtists,
          internalNotes: existing.internalNotes ?? "",
          reliabilityRating: existing.reliabilityRating ?? 0,
          typicalFeeCents: existing.typicalFeeCents,
          depositRequired: existing.depositRequired,
          depositAmountCents: existing.depositAmountCents,
          bookingNotes: existing.bookingNotes ?? "",
          tags: existing.tags,
          socialLinks: existing.socialLinks.map(({ platform, url }) => ({ platform, url })),
          documents: existing.documents,
        },
        session,
      );
      setArtists((current) => current.map((artist) => (artist.id === artistId ? updated : artist)));
      setEditingRowId(null);
      setRowDraft(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update artist.");
    }
  }

  function cancelRowEdit() {
    setEditingRowId(null);
    setRowDraft(null);
  }

  async function handleDeleteArtist(artist: ArtistProfile) {
    if (!session) return;

    try {
      await deleteArtistRecord(artist.id, session);
      setArtists((current) => current.filter((item) => item.id !== artist.id));
      if (selectedId === artist.id) setSelectedId(null);
      setActionMenuArtist(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete artist.");
    }
  }

  if (!hasSupabaseConfig) {
    return (
      <SetupState
        title="Supabase env vars are missing"
        description="Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your local environment, then restart the dev server."
      />
    );
  }

  if (!session) {
    return (
      <SetupState
        title="Connect your Supabase account"
        description="Artist records are protected by Supabase RLS. Sign in with GitHub to load and manage your own artist library."
        actionLabel="Sign in with GitHub"
        onAction={startGithubSignIn}
      />
    );
  }

  return (
    <PageContent>
      <header className={`flex flex-col ${PAGE_STACK_GAP} lg:flex-row lg:items-start lg:justify-between`}>
        <div>
          <h1 className="text-[32px] font-bold leading-9 tracking-tight text-[#F5F5F7]">Artists</h1>
          <p className="mt-1 text-[14px] leading-5 text-[#A1A1AA]">
            Manage your artists, documents, contacts, and profile details.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-11 min-w-[280px] items-center gap-3 rounded-lg border border-[#232330] bg-[#11111A] px-4 text-[#A1A1AA]">
            <Search className="size-4 shrink-0" aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search artists..."
              className="w-full bg-transparent text-sm text-[#F5F5F7] outline-none placeholder:text-[#71717A]"
            />
          </div>
          <FilterPopover
            label="Filters"
            value="all"
            onChange={() => {}}
            options={[]}
            activeCount={advancedFilterCount}
            onClearAll={() => {
              setArtistTypeFilter("all");
              setReachFilter("all");
            }}
          >
            <label className="block text-[12px] text-[#A1A1AA]">
              Artist type
              <select
                value={artistTypeFilter}
                onChange={(e) => setArtistTypeFilter(e.target.value)}
                className="mt-1 w-full rounded-md border border-[#3F3F46] bg-[#0B0B10] px-2 py-1.5 text-[13px] text-[#F5F5F7]"
              >
                <option value="all">All types</option>
                {artistTypeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[12px] text-[#A1A1AA]">
              Reach
              <select
                value={reachFilter}
                onChange={(e) => setReachFilter(e.target.value)}
                className="mt-1 w-full rounded-md border border-[#3F3F46] bg-[#0B0B10] px-2 py-1.5 text-[13px] text-[#F5F5F7]"
              >
                <option value="all">All reach</option>
                {reachOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </FilterPopover>
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            disabled={!session}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#232330] bg-[#11111A] px-4 text-sm font-medium text-[#E4E4E7] hover:border-[#8B5CF6]/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="size-4" aria-hidden />
            Import Artists
          </button>
          {showSeedAction ? (
            <button
              type="button"
              onClick={handleSeedArtists}
              disabled={seeding}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#232330] bg-[#11111A] px-4 text-sm font-medium text-[#E4E4E7] hover:border-[#8B5CF6]/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {seeding ? "Adding..." : "Seed 25 Artists"}
            </button>
          ) : null}
          <Link
            href="/artists/new"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#8B5CF6]/60 bg-[#7C3AED] px-5 text-sm font-semibold text-white shadow-[0_0_24px_0_rgba(139,92,246,0.22)] hover:bg-[#8B5CF6]"
          >
            <Plus className="size-4" aria-hidden />
            Add Artist
          </Link>
        </div>
      </header>

      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => {
            const active = status === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setStatus(filter)}
                className={[
                  "inline-flex h-9 items-center gap-2 rounded-lg border px-4 text-sm font-medium capitalize",
                  active
                    ? "border-[#8B5CF6]/60 bg-[#7C3AED] text-white"
                    : "border-[#232330] bg-[#11111A] text-[#A1A1AA] hover:text-white",
                ].join(" ")}
              >
                {filter}
                <span className="rounded-full bg-black/20 px-2 py-0.5 text-xs">
                  {counts[filter]}
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="text-sm font-medium text-[#A1A1AA] hover:text-[#F5F5F7]"
        >
          Sign out
        </button>
      </section>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div
        className={`grid items-start gap-3 ${
          selectedArtist ? "xl:grid-cols-[minmax(0,1fr)_minmax(420px,440px)]" : ""
        }`}
      >
        <ManagementTableCard>
          <ManagementTableViewport minWidth={920}>
              <colgroup>
                <col className="w-[21%]" />
                <col className="w-[13%]" />
                <col className="w-[19%]" />
                <col className="w-[11%]" />
                <col className="w-[17%]" />
                <col className="w-[9%]" />
                <col className="w-[10%]" />
              </colgroup>
            <ManagementTableHead>
              <SortableManagementHeader label="Artist" sortKey="name" current={sortKey} direction={sortDirection} onSort={handleSort} />
              <SortableManagementHeader label="Category" sortKey="artistType" current={sortKey} direction={sortDirection} onSort={handleSort} />
              <SortableManagementHeader label="Genre" sortKey="genres" current={sortKey} direction={sortDirection} onSort={handleSort} />
              <SortableManagementHeader label="Status" sortKey="status" current={sortKey} direction={sortDirection} onSort={handleSort} />
              <SortableManagementHeader label="Location / Reach" sortKey="location" current={sortKey} direction={sortDirection} onSort={handleSort} />
              <SortableManagementHeader label="Added" sortKey="addedDate" current={sortKey} direction={sortDirection} onSort={handleSort} />
              <ManagementTableHeaderCell align="right">Quick Actions</ManagementTableHeaderCell>
            </ManagementTableHead>
              <tbody>
                {loading ? (
                  <ManagementTableEmptyState colSpan={7}>Loading artists from Supabase...</ManagementTableEmptyState>
                ) : paginatedArtists.length === 0 ? (
                  <ManagementTableEmptyState colSpan={7}>
                    No artists match this view. Add your first artist to get started.
                  </ManagementTableEmptyState>
                ) : (
                  paginatedArtists.map((artist) => {
                    const selected = selectedArtist?.id === artist.id;
                    const editing = editingRowId === artist.id && rowDraft !== null;
                    return (
                      <tr
                        key={artist.id}
                        onClick={() => setSelectedId(artist.id)}
                        className={managementTableRowClass(selected)}
                      >
                        <ManagementTableCell>
                          <div className="flex items-center gap-3">
                            <ArtistAvatar artist={artist} />
                            <div className="min-w-0">
                              {editing ? (
                                <input
                                  value={rowDraft.name}
                                  onClick={(event) => event.stopPropagation()}
                                  onChange={(event) =>
                                    setRowDraft((current) =>
                                      current ? { ...current, name: event.target.value } : current,
                                    )
                                  }
                                  className="h-7 w-full rounded-md border border-[#8B5CF6] bg-[#11111A] px-2 text-sm font-semibold text-[#F5F5F7] outline-none"
                                />
                              ) : (
                                <p className="truncate font-semibold text-[#F5F5F7]">{artist.name}</p>
                              )}
                              <p className="truncate text-xs text-[#A1A1AA]">{artist.artistType}</p>
                            </div>
                          </div>
                        </ManagementTableCell>
                        <ManagementTableCell className="text-[#E4E4E7]">{artist.artistType}</ManagementTableCell>
                        <ManagementTableCell className="text-[#E4E4E7]">
                          {editing ? (
                            <input
                              value={rowDraft.genres.join(", ")}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) =>
                                setRowDraft((current) =>
                                  current
                                    ? {
                                        ...current,
                                        genres: event.target.value
                                          .split(",")
                                          .map((genre) => genre.trim())
                                          .filter(Boolean),
                                      }
                                    : current,
                                )
                              }
                              className="h-7 w-full rounded-md border border-[#8B5CF6] bg-[#11111A] px-2 text-sm text-[#F5F5F7] outline-none"
                              placeholder="House, Techno"
                            />
                          ) : (
                            artist.genres.join(", ") || "Not set"
                          )}
                        </ManagementTableCell>
                        <ManagementTableCell>
                          {editing ? (
                            <select
                              value={rowDraft.status}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) =>
                                setRowDraft((current) =>
                                  current
                                    ? { ...current, status: event.target.value as ArtistStatus }
                                    : current,
                                )
                              }
                              className="h-7 rounded-md border border-[#8B5CF6] bg-[#11111A] px-2 text-sm text-[#F5F5F7] outline-none"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="archived">Archived</option>
                            </select>
                          ) : (
                            <StatusBadge status={artist.status} />
                          )}
                        </ManagementTableCell>
                        <ManagementTableCell>
                          <p className="text-[#E4E4E7]">{formatLocation(artist)}</p>
                          <p className="text-xs capitalize text-[#A1A1AA]">{artist.reach}</p>
                        </ManagementTableCell>
                        <ManagementTableCell className="text-[#E4E4E7]">{formatDate(artist.addedDate)}</ManagementTableCell>
                        <ManagementTableCell>
                          <div className="flex justify-end gap-2">
                            {editing ? (
                              <>
                                <button
                                  type="button"
                                  className="flex size-8 items-center justify-center rounded-md border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
                                  aria-label={`Save ${artist.name}`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void saveRowEdit(artist.id);
                                  }}
                                >
                                  <Check className="size-4" />
                                </button>
                                <button
                                  type="button"
                                  className="flex size-8 items-center justify-center rounded-md border border-[#232330] text-[#A1A1AA] hover:bg-[#232330] hover:text-white"
                                  aria-label={`Cancel editing ${artist.name}`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    cancelRowEdit();
                                  }}
                                >
                                  <X className="size-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="flex size-8 items-center justify-center rounded-md border border-[#232330] text-[#A1A1AA] hover:border-[#8B5CF6]/50 hover:text-white"
                                  aria-label={`Edit ${artist.name}`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    startRowEdit(artist);
                                  }}
                                >
                                  <Edit3 className="size-4" />
                                </button>
                                <button
                                  type="button"
                                  className="flex size-8 items-center justify-center rounded-md text-[#A1A1AA] hover:bg-[#232330] hover:text-white"
                                  aria-label={`More actions for ${artist.name}`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setActionMenuArtist(artist);
                                  }}
                                >
                                  <MoreHorizontal className="size-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </ManagementTableCell>
                      </tr>
                    );
                  })
                )}
              </tbody>
          </ManagementTableViewport>

          <ManagementTablePagination
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalCount={filteredArtists.length}
            entityLabel="artists"
            onPrevious={() => setPage((value) => value - 1)}
            onNext={() => setPage((value) => value + 1)}
          />
        </ManagementTableCard>

        {selectedArtist ? (
          <ArtistSidePanel
            artist={selectedArtist}
            onClose={() => setSelectedId(null)}
            onDownload={handleDownload}
            onViewProfile={() => setProfileArtist(selectedArtist)}
            onOpenActions={() => setActionMenuArtist(selectedArtist)}
          />
        ) : null}
      </div>

      {profileArtist ? (
        <ArtistProfileModal artist={profileArtist} onClose={() => setProfileArtist(null)} />
      ) : null}

      {actionMenuArtist ? (
        <ArtistActionsOverlay
          artist={actionMenuArtist}
          onClose={() => setActionMenuArtist(null)}
          onDelete={() => void handleDeleteArtist(actionMenuArtist)}
        />
      ) : null}

      {session ? (
        <ArtistImportDialog
          open={importOpen}
          onClose={() => setImportOpen(false)}
          session={session}
          onImported={() => {
            listArtists(session)
              .then(setArtists)
              .catch(() => undefined);
          }}
        />
      ) : null}
    </PageContent>
  );
}

async function deleteArtistRecord(artistId: string, session: SupabaseSession) {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Missing Supabase environment variables.");

  const response = await fetch(`${config.url}/rest/v1/artists?id=eq.${artistId}`, {
    method: "DELETE",
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
  });

  if (!response.ok) {
    throw new Error("Unable to delete artist.");
  }
}

function ArtistSidePanel({
  artist,
  onClose,
  onDownload,
  onViewProfile,
  onOpenActions,
}: {
  artist: ArtistProfile;
  onClose: () => void;
  onDownload: (path: string) => void;
  onViewProfile: () => void;
  onOpenActions: () => void;
}) {
  const router = useRouter();
  const [bioExpanded, setBioExpanded] = useState(false);
  const bio = artist.bio || "No bio has been added for this artist yet.";
  const canExpandBio = bio.length > 47;
  const visibleBio = bioExpanded || !canExpandBio ? bio : `${bio.slice(0, 44).trimEnd()}...`;

  useEffect(() => {
    setBioExpanded(false);
  }, [artist.id]);

  return (
    <aside className="rounded-xl border border-[#232330] bg-[#11111A] p-5 shadow-[0px_10px_40px_0px_rgba(0,0,0,0.4)] xl:sticky xl:top-5 xl:max-h-[calc(100vh-40px)] xl:overflow-y-auto">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <ArtistAvatar artist={artist} size="lg" />
          <div>
            <h2 className="text-xl font-bold text-[#F5F5F7]">{artist.name}</h2>
            <p className="text-sm text-[#A1A1AA]">{artist.artistType}</p>
            <StatusBadge status={artist.status} />
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-8 items-center justify-center rounded-md text-[#A1A1AA] hover:bg-[#232330] hover:text-white"
          aria-label="Close artist panel"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-5 grid grid-cols-5 gap-3 text-center text-[10px] text-[#A1A1AA]">
        <button
          type="button"
          onClick={onViewProfile}
          className="flex min-h-[62px] flex-col items-center justify-center gap-1.5 rounded-lg border border-[#232330] bg-[#0F0F17] px-2 py-2 hover:border-[#8B5CF6]/50 hover:text-white"
        >
          <UserCircle className="size-4" aria-hidden />
          View Profile
        </button>
        <Link
          href={`/artists/new?artistId=${artist.id}`}
          className="flex min-h-[62px] flex-col items-center justify-center gap-1.5 rounded-lg border border-[#232330] bg-[#0F0F17] px-2 py-2 hover:border-[#8B5CF6]/50 hover:text-white"
        >
          <Edit3 className="size-4" aria-hidden />
          Edit
        </Link>
        <button
          type="button"
          onClick={() =>
            router.push(`/events?q=${encodeURIComponent(artist.name)}&artistId=${encodeURIComponent(artist.id)}`)
          }
          className="flex min-h-[62px] flex-col items-center justify-center gap-1.5 rounded-lg border border-[#232330] bg-[#0F0F17] px-2 py-2 hover:border-[#8B5CF6]/50 hover:text-white"
        >
          <Music className="size-4" aria-hidden />
          Events
        </button>
        <button
          type="button"
          onClick={() => {
            if (artist.email?.trim()) {
              window.location.href = `mailto:${encodeURIComponent(artist.email.trim())}`;
            }
          }}
          disabled={!artist.email?.trim()}
          title={artist.email?.trim() ? `Email ${artist.name}` : "No contact email on file"}
          className="flex min-h-[62px] flex-col items-center justify-center gap-1.5 rounded-lg border border-[#232330] bg-[#0F0F17] px-2 py-2 hover:border-[#8B5CF6]/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <MessageCircle className="size-4" aria-hidden />
          Message
        </button>
        <button
          type="button"
          onClick={onOpenActions}
          className="flex min-h-[62px] flex-col items-center justify-center gap-1.5 rounded-lg border border-[#232330] bg-[#0F0F17] px-2 py-2 hover:border-[#8B5CF6]/50 hover:text-white"
        >
          <MoreHorizontal className="size-4" aria-hidden />
          More
        </button>
      </div>

      <InfoCard title="About">
        <button
          type="button"
          onClick={() => canExpandBio && setBioExpanded((current) => !current)}
          className={[
            "w-full rounded-lg text-left text-sm leading-6 text-[#D4D4D8] transition-colors",
            canExpandBio ? "cursor-pointer hover:bg-[#181824] hover:text-[#F5F5F7]" : "cursor-default",
            "p-2",
          ].join(" ")}
          aria-expanded={bioExpanded}
        >
          {visibleBio}
        </button>
        <dl className="mt-4 space-y-3 text-sm">
          <Detail label="Genre" value={artist.genres.join(", ") || "Not set"} />
          <Detail label="Location" value={`${formatLocation(artist)} (${artist.reach})`} />
          <Detail label="Email" value={artist.email} />
          <Detail label="Phone" value={artist.phone} />
          <Detail label="Added" value={formatDate(artist.addedDate)} />
        </dl>
      </InfoCard>

      <InfoCard>
        <div className="flex flex-wrap gap-2">
          {artist.socialLinks.length === 0 ? (
            <span className="text-sm text-[#A1A1AA]">No social links added.</span>
          ) : (
            artist.socialLinks.map((link) => (
              <a
                key={link.platform}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-[#232330] bg-[#0B0B10] px-3 py-2 text-sm capitalize text-[#E4E4E7] hover:border-[#8B5CF6]/50 hover:text-white"
              >
                {link.platform}
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            ))
          )}
        </div>
      </InfoCard>

      <InfoCard title="Documents">
        <div className="space-y-2">
          {artist.documents.length === 0 ? (
            <span className="text-sm text-[#A1A1AA]">No documents uploaded.</span>
          ) : (
            artist.documents.slice(0, 4).map((document) => (
              <button
                key={document.id ?? document.filePath}
                type="button"
                onClick={() => onDownload(document.filePath)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-[#232330] bg-[#0B0B10] px-3 py-2 text-left text-sm text-[#E4E4E7] hover:border-[#8B5CF6]/50"
              >
                <span className="min-w-0 truncate">{document.fileName}</span>
                <Download className="size-4 shrink-0 text-[#A1A1AA]" aria-hidden />
              </button>
            ))
          )}
        </div>
      </InfoCard>

      <InfoCard title="Notes">
        <p className="text-sm leading-6 text-[#D4D4D8]">
          {artist.internalNotes || "No internal notes recorded."}
        </p>
      </InfoCard>
    </aside>
  );
}

function InfoCard({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="mt-4 rounded-xl border border-[#232330] bg-[#0F0F17] p-4">
      {title ? <h3 className="mb-3 text-sm font-semibold text-[#F5F5F7]">{title}</h3> : null}
      {children}
    </section>
  );
}

function ArtistActionsOverlay({
  artist,
  onClose,
  onDelete,
}: {
  artist: ArtistProfile;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" onClick={onClose}>
      <section
        className="w-full max-w-sm rounded-2xl border border-[#232330] bg-[#11111A] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.55)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Artist Actions</p>
            <h3 className="mt-1 text-lg font-bold text-[#F5F5F7]">{artist.name}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-[#A1A1AA] hover:bg-[#232330] hover:text-white"
            aria-label="Close artist actions"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="mt-5 space-y-2">
          <Link
            href={`/artists/new?artistId=${artist.id}`}
            className="flex w-full items-center gap-3 rounded-lg border border-[#232330] bg-[#0B0B10] px-3 py-3 text-sm font-medium text-[#E4E4E7] hover:border-[#8B5CF6]/50 hover:text-white"
          >
            <Edit3 className="size-4" aria-hidden />
            Edit full profile
          </Link>
          <button
            type="button"
            onClick={onDelete}
            className="flex w-full items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-3 text-left text-sm font-semibold text-red-200 hover:border-red-400/60 hover:bg-red-500/15"
          >
            <Trash2 className="size-4" aria-hidden />
            Delete artist entry
          </button>
        </div>

        <p className="mt-4 text-xs leading-5 text-[#A1A1AA]">
          Deleting removes this artist record from Supabase. Uploaded files in storage are not removed automatically.
        </p>
      </section>
    </div>
  );
}

type ProfileTab = "overview" | "contact" | "booking" | "documents" | "notes";

function ArtistProfileModal({ artist, onClose }: { artist: ArtistProfile; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <section className="flex h-[760px] max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#232330] bg-[#11111A] shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
        <header className="relative shrink-0 overflow-hidden border-b border-[#232330] bg-gradient-to-br from-[#1A1430] to-[#0B0B10] p-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-lg text-[#A1A1AA] hover:bg-white/10 hover:text-white"
            aria-label="Close profile"
          >
            <X className="size-5" aria-hidden />
          </button>
          <div className="flex flex-col gap-5 md:flex-row md:items-end">
            <ArtistAvatar artist={artist} size="lg" />
            <div className="min-w-0 flex-1 pr-10">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={artist.status} />
                <span className="rounded-md border border-[#8B5CF6]/30 bg-[#2D2640]/70 px-2 py-1 text-xs text-[#C4B5FD]">
                  {artist.artistType}
                </span>
                <span className="rounded-md border border-[#232330] bg-black/20 px-2 py-1 text-xs capitalize text-[#A1A1AA]">
                  {artist.reach}
                </span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-[#F5F5F7]">{artist.name}</h2>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-[#D4D4D8]">
                {artist.bio || "No artist bio has been added yet."}
              </p>
            </div>
          </div>
        </header>

        <div className="shrink-0 border-b border-[#232330] px-5 pt-4">
          <div className="flex flex-wrap gap-2">
            <ProfileTabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>
              Overview
            </ProfileTabButton>
            <ProfileTabButton active={activeTab === "contact"} onClick={() => setActiveTab("contact")}>
              Contact
            </ProfileTabButton>
            <ProfileTabButton active={activeTab === "booking"} onClick={() => setActiveTab("booking")}>
              Booking
            </ProfileTabButton>
            <ProfileTabButton active={activeTab === "documents"} onClick={() => setActiveTab("documents")}>
              Documents
            </ProfileTabButton>
            <ProfileTabButton active={activeTab === "notes"} onClick={() => setActiveTab("notes")}>
              Notes
            </ProfileTabButton>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {activeTab === "overview" ? (
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
              <ProfileSection title="Profile Details">
                <dl className="grid gap-4 md:grid-cols-2">
                  <ProfileDetail label="Artist Name" value={artist.name} />
                  <ProfileDetail label="Category" value={artist.artistType} />
                  <ProfileDetail label="Genres" value={artist.genres.join(", ")} />
                  <ProfileDetail label="Classification" value={artist.classification} />
                  <ProfileDetail label="Location" value={formatLocation(artist)} />
                  <ProfileDetail label="Reach" value={artist.reach} />
                  <ProfileDetail label="Added" value={formatDate(artist.addedDate)} />
                  <ProfileDetail label="Last Updated" value={formatDate(artist.updatedAt)} />
                </dl>
              </ProfileSection>

              <div className="space-y-3">
                <ProfileSection title="Tags">
                  <TagList items={artist.tags} empty="No tags added." />
                </ProfileSection>
                <ProfileSection title="Social Links">
                  <SocialLinkList artist={artist} />
                </ProfileSection>
              </div>
            </div>
          ) : null}

          {activeTab === "contact" ? (
            <div className="grid gap-3 lg:grid-cols-2">
              <ProfileSection title="Primary Contact">
                <dl className="grid gap-4 md:grid-cols-2">
                  <ProfileDetail label="Contact Name" value={artist.contactName} />
                  <ProfileDetail label="Role" value={artist.contactRole} />
                  <ProfileDetail label="Primary email" value={artist.email} />
                  <ProfileDetail label="Booking email" value={artist.bookingEmail} />
                  <ProfileDetail label="Management email" value={artist.managementEmail} />
                  <ProfileDetail label="Press email" value={artist.pressEmail} />
                  <ProfileDetail label="Contact page" value={artist.contactPage} />
                  <ProfileDetail label="Phone" value={artist.phone} />
                  <ProfileDetail label="Preferred Method" value={artist.preferredContactMethod} />
                </dl>
              </ProfileSection>

              <ProfileSection title="Agency / Management">
                <dl className="grid gap-4 md:grid-cols-2">
                  <ProfileDetail label="Agency" value={artist.agencyName} />
                  <ProfileDetail label="Management Company" value={artist.managementCompany} />
                  <ProfileDetail label="Contact confidence" value={artist.contactConfidence} />
                  <ProfileDetail label="Territory" value={artist.territory} />
                </dl>
                <div className="mt-5">
                  <p className="text-xs uppercase tracking-wide text-[#71717A]">Represented Artists</p>
                  <TagList items={artist.representedArtists} empty="No represented artists recorded." />
                </div>
              </ProfileSection>
            </div>
          ) : null}

          {activeTab === "booking" ? (
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
              <ProfileSection title="Booking Details">
                <dl className="grid gap-4 md:grid-cols-2">
                  <ProfileDetail
                    label="Typical Fee"
                    value={formatCentsValue(artist.typicalFeeCents)}
                  />
                  <ProfileDetail label="Deposit Required" value={artist.depositRequired ? "Yes" : "No"} />
                  <ProfileDetail
                    label="Deposit Amount"
                    value={formatCentsValue(artist.depositAmountCents)}
                  />
                  <ProfileDetail label="Reliability Rating" value={formatRating(artist.reliabilityRating)} />
                </dl>
              </ProfileSection>

              <ProfileSection title="Booking Notes">
                <p className="text-sm leading-6 text-[#D4D4D8]">
                  {artist.bookingNotes || "No booking notes recorded."}
                </p>
              </ProfileSection>
            </div>
          ) : null}

          {activeTab === "documents" ? (
            <ProfileSection title="Documents">
              <div className="grid gap-2">
                {artist.documents.length === 0 ? (
                  <p className="text-sm text-[#A1A1AA]">No documents have been uploaded.</p>
                ) : (
                  artist.documents.map((document) => (
                    <div
                      key={document.id ?? document.filePath}
                      className="grid gap-3 rounded-lg border border-[#232330] bg-[#0B0B10] px-3 py-3 text-sm md:grid-cols-[minmax(0,1fr)_140px_120px_140px]"
                    >
                      <span className="truncate font-medium text-[#F5F5F7]">{document.fileName}</span>
                      <span className="rounded-md bg-[#2D2640] px-2 py-1 text-xs text-[#C4B5FD]">
                        {document.category || "Uncategorised"}
                      </span>
                      <span className="text-[#A1A1AA]">{formatFileSize(document.fileSize)}</span>
                      <span className="text-[#A1A1AA]">{formatDate(document.uploadedAt)}</span>
                    </div>
                  ))
                )}
              </div>
            </ProfileSection>
          ) : null}

          {activeTab === "notes" ? (
            <div className="grid gap-3 lg:grid-cols-2">
              <ProfileSection title="Internal Notes">
                <p className="text-sm leading-6 text-[#D4D4D8]">
                  {artist.internalNotes || "No internal notes recorded."}
                </p>
              </ProfileSection>
              <ProfileSection title="Record Info">
                <dl className="grid gap-4 md:grid-cols-2">
                  <ProfileDetail label="Created" value={formatDate(artist.createdAt)} />
                  <ProfileDetail label="Updated" value={formatDate(artist.updatedAt)} />
                  <ProfileDetail label="Documents" value={`${artist.documents.length}`} />
                  <ProfileDetail label="Social Links" value={`${artist.socialLinks.length}`} />
                </dl>
              </ProfileSection>
            </div>
          ) : null}
        </div>

        <footer className="flex shrink-0 flex-col gap-3 border-t border-[#232330] p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#A1A1AA]">Full profile data is pulled from the stored artist record.</p>
          <Link
            href={`/artists/new?artistId=${artist.id}`}
            className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[#8B5CF6]/60 bg-[#7C3AED] px-5 text-sm font-semibold text-white hover:bg-[#8B5CF6]"
          >
            <Edit3 className="size-4" aria-hidden />
            Edit Full Profile
          </Link>
        </footer>
      </section>
    </div>
  );
}

function ProfileTabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-t-lg border border-b-0 px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-[#8B5CF6]/50 bg-[#7C3AED] text-white"
          : "border-[#232330] bg-[#0F0F17] text-[#A1A1AA] hover:text-white",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function ProfileSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[#232330] bg-[#0F0F17] p-5">
      <h3 className="mb-4 text-base font-semibold text-[#F5F5F7]">{title}</h3>
      {children}
    </section>
  );
}

function TagList({ items, empty }: { items: string[]; empty: string }) {
  const values = items.filter(Boolean);
  if (values.length === 0) {
    return <p className="mt-2 text-sm text-[#A1A1AA]">{empty}</p>;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {values.map((item) => (
        <span key={item} className="rounded-md border border-[#232330] bg-[#0B0B10] px-3 py-1.5 text-sm text-[#E4E4E7]">
          {item}
        </span>
      ))}
    </div>
  );
}

function SocialLinkList({ artist }: { artist: ArtistProfile }) {
  if (artist.socialLinks.length === 0) {
    return <p className="text-sm text-[#A1A1AA]">No social links added.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {artist.socialLinks.map((link) => (
        <a
          key={link.platform}
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-[#232330] bg-[#0B0B10] px-3 py-2 text-sm capitalize text-[#E4E4E7] hover:border-[#8B5CF6]/50"
        >
          {link.platform}
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      ))}
    </div>
  );
}

function formatCentsValue(cents: number) {
  if (!cents) return "Not set";
  return <CurrencyText value={cents} fromCents />;
}

function ProfileDetail({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-[#71717A]">{label}</dt>
      <dd className="mt-1 text-sm text-[#F5F5F7]">{value || "Not set"}</dd>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[#A1A1AA]">{label}</dt>
      <dd className="truncate text-right text-[#E4E4E7]">{value || "Not set"}</dd>
    </div>
  );
}

function ArtistAvatar({ artist, size = "md" }: { artist: ArtistProfile; size?: "md" | "lg" }) {
  const className =
    size === "lg"
      ? "size-20 rounded-full ring-2 ring-[#8B5CF6]/70"
      : "size-11 rounded-full ring-1 ring-[#232330]";

  if (artist.promoImageUrl) {
    return (
      <img
        src={artist.promoImageUrl}
        alt=""
        className={`${className} shrink-0 object-cover`}
      />
    );
  }

  return (
    <div
      className={`${className} flex shrink-0 items-center justify-center bg-gradient-to-br from-[#2D2640] to-[#0B0B10] text-sm font-bold text-[#C4B5FD]`}
      aria-hidden
    >
      {artist.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()}
    </div>
  );
}

function StatusBadge({ status }: { status: ArtistStatus }) {
  const className =
    status === "active"
      ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/20"
      : status === "inactive"
        ? "bg-amber-500/15 text-amber-300 ring-amber-500/20"
        : "bg-zinc-500/15 text-zinc-300 ring-zinc-500/20";

  return (
    <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium capitalize ring-1 ${className}`}>
      {status}
    </span>
  );
}

function SetupState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center justify-center">
      <section className="rounded-2xl border border-[#232330] bg-[#11111A] p-8 text-center shadow-[0px_10px_40px_0px_rgba(0,0,0,0.4)]">
        <Mail className="mx-auto size-10 text-[#8B5CF6]" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#F5F5F7]">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-[#A1A1AA]">{description}</p>
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg border border-[#8B5CF6]/60 bg-[#7C3AED] px-5 text-sm font-semibold text-white"
          >
            {actionLabel}
          </button>
        ) : null}
      </section>
    </div>
  );
}

function buildSeedArtistDrafts(): ArtistDraft[] {
  return seedArtistTemplates.map(([name, artistType, genres, city, country], index) => {
    const status: ArtistStatus = index % 9 === 0 ? "archived" : index % 5 === 0 ? "inactive" : "active";
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, ".");

    return {
      name,
      artistType,
      genres: [...genres],
      status,
      classification: index % 4 === 0 ? "Headliner" : index % 3 === 0 ? "Established" : "Emerging",
      city,
      country,
      reach: index % 6 === 0 ? "international" : index % 2 === 0 ? "national" : "local",
      bio: `${name} is a test artist profile for PromoSync QA, covering table layout, filtering, sorting, pagination, and event lineup workflows.`,
      promoImageUrl: "",
      contactName: `${name.split(" ")[0]} Agent`,
      contactRole: "Agent",
      email: `${slug}@example.com`,
      bookingEmail: index % 3 === 0 ? `bookings.${slug}@example.com` : "",
      managementEmail: "",
      pressEmail: "",
      phone: `+44 7700 90${String(index + 10).padStart(2, "0")}`,
      preferredContactMethod: index % 2 === 0 ? "Email" : "WhatsApp",
      agencyName: index % 3 === 0 ? "Northstar Artists" : "",
      managementCompany: index % 4 === 0 ? "Pulse Management" : "",
      contactPage: "",
      sourceUrls: [],
      contactConfidence: "",
      territory: "",
      representedArtists: [],
      internalNotes: index % 4 === 0 ? "Seed profile for testing richer artist notes." : "",
      reliabilityRating: (index % 5) + 1,
      typicalFeeCents: (750 + index * 125) * 100,
      depositRequired: index % 2 === 0,
      depositAmountCents: index % 2 === 0 ? (150 + index * 25) * 100 : 0,
      bookingNotes: index % 2 === 0 ? "Seeded booking terms for test data." : "",
      tags: [
        genres[0]?.toLowerCase().replace(/\s+/g, "-") ?? "artist",
        index % 2 === 0 ? "festival-friendly" : "club",
        index % 3 === 0 ? "high draw" : "local",
      ],
      socialLinks: [
        { platform: "instagram", url: `https://instagram.com/${slug}` },
        { platform: "spotify", url: `https://open.spotify.com/search/${encodeURIComponent(name)}` },
      ],
      documents: [],
    };
  });
}

function sortableValue(artist: ArtistProfile, key: SortKey) {
  switch (key) {
    case "name":
      return artist.name;
    case "artistType":
      return artist.artistType;
    case "genres":
      return artist.genres.join(", ");
    case "status":
      return artist.status;
    case "location":
      return formatLocation(artist);
    case "addedDate":
      return artist.addedDate;
  }
}

function formatLocation(artist: ArtistProfile) {
  return [artist.city, artist.country].filter(Boolean).join(", ") || "Not set";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatFileSize(bytes: number) {
  if (!bytes) return "Unknown size";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatRating(rating?: number) {
  if (!rating) return "Not set";
  return `${rating}/5`;
}
