"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Download,
  Edit3,
  MoreHorizontal,
  Plus,
  Search,
  Ticket,
  Trash2,
  X,
} from "lucide-react";

import PageContent from "@/app/components/layout/PageContent";
import ActionComingSoonTile from "@/app/components/ui/ActionComingSoonTile";
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
import {
  getStoredSession,
  getSupabaseConfig,
  signOutOfSupabase,
  startGithubSignIn,
} from "@/lib/supabase/browser";
import { MANAGEMENT_TABLE_PAGE_SIZE_VENUES, PAGE_STACK_GAP } from "@/lib/layout/page-layout";
import * as SupabaseBrowser from "@/lib/supabase/browser";
import AddedByLine from "@/app/components/ui/AddedByLine";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import type { SupabaseSession } from "@/lib/types/artist";

type VenueStatus = "active" | "inactive";

type VenueDocument = {
  id?: string;
  venueId?: string;
  category: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
};

type VenueProfile = {
  id: string;
  name: string;
  venueType: string;
  status: VenueStatus;
  addressLine1: string;
  city: string;
  stateRegion?: string;
  postalCode?: string;
  country: string;
  description?: string;
  imageUrl?: string;
  maxCapacity: number;
  indoorCapacity: number;
  outdoorCapacity: number;
  curfewTime?: string;
  noiseRestriction?: string;
  ageRestriction?: string;
  wheelchairAccessible: boolean;
  parkingAvailable: boolean;
  facilities: string[];
  otherFacilities?: string;
  venueManagerName?: string;
  venueManagerPhone?: string;
  bookingContactName?: string;
  bookingContactEmail?: string;
  financeContactName?: string;
  financeContactPhone?: string;
  financeContactEmail?: string;
  preferredContactMethod?: string;
  operationsNotes?: string;
  depositRequired: boolean;
  depositAmountCents: number;
  depositDueTerms?: string;
  hireFeeCents: number;
  paymentTerms?: string;
  barSplitPercent?: number;
  minimumSpendCents: number;
  securityRequired: boolean;
  equipmentProvided: boolean;
  smokingAllowed: boolean;
  lateLicense: boolean;
  timezone?: string;
  parkingDetails?: string;
  loadInDetails?: string;
  loadOutDetails?: string;
  addedDate: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  documents: VenueDocument[];
};

type VenueDraft = {
  name: string;
  venueType: string;
  status: VenueStatus;
  addressLine1: string;
  city: string;
  stateRegion: string;
  postalCode: string;
  country: string;
  description: string;
  imageUrl: string;
  maxCapacity: number;
  indoorCapacity: number;
  outdoorCapacity: number;
  curfewTime: string;
  noiseRestriction: string;
  ageRestriction: string;
  wheelchairAccessible: boolean;
  parkingAvailable: boolean;
  facilities: string[];
  otherFacilities: string;
  venueManagerName: string;
  venueManagerPhone: string;
  bookingContactName: string;
  bookingContactEmail: string;
  financeContactName: string;
  financeContactPhone: string;
  financeContactEmail: string;
  preferredContactMethod: string;
  operationsNotes: string;
  depositRequired: boolean;
  depositAmountCents: number;
  depositDueTerms: string;
  hireFeeCents: number;
  paymentTerms: string;
  barSplitPercent: number;
  minimumSpendCents: number;
  securityRequired: boolean;
  equipmentProvided: boolean;
  smokingAllowed: boolean;
  lateLicense: boolean;
  timezone: string;
  parkingDetails: string;
  loadInDetails: string;
  loadOutDetails: string;
  documents: VenueDocument[];
};

type VenueDocumentRow = {
  id: string;
  venue_id: string;
  category: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
};

type VenueRow = {
  id: string;
  name: string;
  venue_type: string;
  status: VenueStatus;
  address_line1: string;
  city: string;
  state_region: string | null;
  postal_code: string | null;
  country: string;
  description: string | null;
  image_url: string | null;
  max_capacity: number | null;
  indoor_capacity: number | null;
  outdoor_capacity: number | null;
  curfew_time: string | null;
  noise_restriction: string | null;
  age_restriction: string | null;
  wheelchair_accessible: boolean | null;
  parking_available: boolean | null;
  facilities: string[] | null;
  other_facilities: string | null;
  venue_manager_name: string | null;
  venue_manager_phone: string | null;
  booking_contact_name: string | null;
  booking_contact_email: string | null;
  finance_contact_name: string | null;
  finance_contact_phone: string | null;
  finance_contact_email: string | null;
  preferred_contact_method: string | null;
  operations_notes: string | null;
  deposit_required: boolean | null;
  deposit_amount_cents: number | null;
  deposit_due_terms: string | null;
  hire_fee_cents: number | null;
  payment_terms: string | null;
  bar_split_percent: number | null;
  minimum_spend_cents: number | null;
  security_required: boolean | null;
  equipment_provided: boolean | null;
  smoking_allowed: boolean | null;
  late_license: boolean | null;
  timezone: string | null;
  parking_details: string | null;
  load_in_details: string | null;
  load_out_details: string | null;
  added_date: string;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  venue_documents?: VenueDocumentRow[] | null;
};

const venueApi = SupabaseBrowser as {
  createSignedVenueDocumentUrl?: (filePath: string, session: SupabaseSession) => Promise<string>;
  createVenue?: (draft: VenueDraft, session: SupabaseSession, workspaceId: string) => Promise<VenueProfile>;
  deleteVenue?: (venueId: string, session: SupabaseSession) => Promise<void>;
  listVenues?: (session: SupabaseSession, workspaceId: string) => Promise<VenueProfile[]>;
};

async function readSupabaseError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { message?: string; error_description?: string; hint?: string };
    return data.message ?? data.error_description ?? data.hint ?? fallback;
  } catch {
    return fallback;
  }
}

async function venueRest<T>(
  path: string,
  session: SupabaseSession,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    prefer?: string;
  } = {},
): Promise<T> {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Missing Supabase environment variables.");

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    method: options.method ?? "GET",
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${session.accessToken}`,
      Accept: "application/json",
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(options.prefer ? { Prefer: options.prefer } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(await readSupabaseError(response, "Supabase request failed."));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function venueDraftToRow(draft: VenueDraft) {
  return {
    name: draft.name.trim(),
    venue_type: draft.venueType,
    status: draft.status,
    address_line1: draft.addressLine1.trim(),
    city: draft.city.trim(),
    state_region: draft.stateRegion || null,
    postal_code: draft.postalCode || null,
    country: draft.country.trim(),
    description: draft.description || null,
    image_url: draft.imageUrl || null,
    max_capacity: draft.maxCapacity,
    indoor_capacity: draft.indoorCapacity,
    outdoor_capacity: draft.outdoorCapacity,
    curfew_time: draft.curfewTime || null,
    noise_restriction: draft.noiseRestriction || null,
    age_restriction: draft.ageRestriction || null,
    wheelchair_accessible: draft.wheelchairAccessible,
    parking_available: draft.parkingAvailable,
    facilities: draft.facilities,
    other_facilities: draft.otherFacilities || null,
    venue_manager_name: draft.venueManagerName || null,
    venue_manager_phone: draft.venueManagerPhone || null,
    booking_contact_name: draft.bookingContactName || null,
    booking_contact_email: draft.bookingContactEmail || null,
    finance_contact_name: draft.financeContactName || null,
    finance_contact_phone: draft.financeContactPhone || null,
    finance_contact_email: draft.financeContactEmail || null,
    preferred_contact_method: draft.preferredContactMethod || null,
    operations_notes: draft.operationsNotes || null,
    deposit_required: draft.depositRequired,
    deposit_amount_cents: draft.depositAmountCents,
    deposit_due_terms: draft.depositDueTerms || null,
    hire_fee_cents: draft.hireFeeCents,
    payment_terms: draft.paymentTerms || null,
    bar_split_percent: draft.barSplitPercent,
    minimum_spend_cents: draft.minimumSpendCents,
    security_required: draft.securityRequired,
    equipment_provided: draft.equipmentProvided,
    smoking_allowed: draft.smokingAllowed,
    late_license: draft.lateLicense,
    timezone: draft.timezone || null,
    parking_details: draft.parkingDetails || null,
    load_in_details: draft.loadInDetails || null,
    load_out_details: draft.loadOutDetails || null,
  };
}

function mapVenueRow(row: VenueRow): VenueProfile {
  return {
    id: row.id,
    name: row.name,
    venueType: row.venue_type,
    status: row.status,
    addressLine1: row.address_line1,
    city: row.city,
    stateRegion: row.state_region ?? undefined,
    postalCode: row.postal_code ?? undefined,
    country: row.country,
    description: row.description ?? undefined,
    imageUrl: row.image_url ?? undefined,
    maxCapacity: row.max_capacity ?? 0,
    indoorCapacity: row.indoor_capacity ?? 0,
    outdoorCapacity: row.outdoor_capacity ?? 0,
    curfewTime: row.curfew_time ?? undefined,
    noiseRestriction: row.noise_restriction ?? undefined,
    ageRestriction: row.age_restriction ?? undefined,
    wheelchairAccessible: row.wheelchair_accessible ?? false,
    parkingAvailable: row.parking_available ?? false,
    facilities: row.facilities ?? [],
    otherFacilities: row.other_facilities ?? undefined,
    venueManagerName: row.venue_manager_name ?? undefined,
    venueManagerPhone: row.venue_manager_phone ?? undefined,
    bookingContactName: row.booking_contact_name ?? undefined,
    bookingContactEmail: row.booking_contact_email ?? undefined,
    financeContactName: row.finance_contact_name ?? undefined,
    financeContactPhone: row.finance_contact_phone ?? undefined,
    financeContactEmail: row.finance_contact_email ?? undefined,
    preferredContactMethod: row.preferred_contact_method ?? undefined,
    operationsNotes: row.operations_notes ?? undefined,
    depositRequired: row.deposit_required ?? false,
    depositAmountCents: row.deposit_amount_cents ?? 0,
    depositDueTerms: row.deposit_due_terms ?? undefined,
    hireFeeCents: row.hire_fee_cents ?? 0,
    paymentTerms: row.payment_terms ?? undefined,
    barSplitPercent: row.bar_split_percent ?? undefined,
    minimumSpendCents: row.minimum_spend_cents ?? 0,
    securityRequired: row.security_required ?? false,
    equipmentProvided: row.equipment_provided ?? false,
    smokingAllowed: row.smoking_allowed ?? false,
    lateLicense: row.late_license ?? false,
    timezone: row.timezone ?? undefined,
    parkingDetails: row.parking_details ?? undefined,
    loadInDetails: row.load_in_details ?? undefined,
    loadOutDetails: row.load_out_details ?? undefined,
    addedDate: row.added_date,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    documents: (row.venue_documents ?? []).map((doc) => ({
      id: doc.id,
      venueId: doc.venue_id,
      category: doc.category,
      fileName: doc.file_name,
      filePath: doc.file_path,
      fileType: doc.file_type,
      fileSize: doc.file_size,
      uploadedAt: doc.uploaded_at,
    })),
  };
}

async function listVenuesLocal(session: SupabaseSession, workspaceId: string): Promise<VenueProfile[]> {
  const rows = await venueRest<VenueRow[]>(
    `venues?select=*,venue_documents(*)&workspace_id=eq.${workspaceId}&order=created_at.desc`,
    session,
  );
  return rows.map(mapVenueRow);
}

async function createVenueLocal(
  draft: VenueDraft,
  session: SupabaseSession,
  workspaceId: string,
): Promise<VenueProfile> {
  const [created] = await venueRest<VenueRow[]>("venues?select=*", session, {
    method: "POST",
    body: {
      ...venueDraftToRow(draft),
      workspace_id: workspaceId,
      created_by: session.user.id,
    },
    prefer: "return=representation",
  });

  if (!created) throw new Error("Supabase did not return the created venue.");
  return mapVenueRow({ ...created, venue_documents: [] });
}

async function deleteVenueLocal(venueId: string, session: SupabaseSession) {
  await venueRest(`venues?id=eq.${venueId}`, session, {
    method: "DELETE",
  });
}

async function createSignedVenueDocumentUrlLocal(filePath: string, session: SupabaseSession) {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Missing Supabase environment variables.");

  const response = await fetch(`${config.url}/storage/v1/object/sign/venue-documents/${filePath}`, {
    method: "POST",
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn: 60 }),
  });

  if (!response.ok) {
    throw new Error(await readSupabaseError(response, "Unable to create a signed download URL."));
  }

  const data = (await response.json()) as { signedURL?: string; signedUrl?: string };
  const signedPath = data.signedURL ?? data.signedUrl;
  if (!signedPath) throw new Error("Supabase did not return a signed URL.");
  if (signedPath.startsWith("http")) return signedPath;
  return `${config.url}/storage/v1${signedPath.startsWith("/") ? signedPath : `/${signedPath}`}`;
}

const createSignedVenueDocumentUrl = venueApi.createSignedVenueDocumentUrl ?? createSignedVenueDocumentUrlLocal;
const createVenue = venueApi.createVenue ?? createVenueLocal;
const deleteVenue = venueApi.deleteVenue ?? deleteVenueLocal;
const listVenues = venueApi.listVenues ?? listVenuesLocal;

const venueSeedDrafts: VenueDraft[] = [
  createSeedVenueDraft("Ministry of Sound", "Nightclub", "103 Gaunt St", "London", "United Kingdom", 1500, 0),
  createSeedVenueDraft("The Warehouse Project", "Warehouse", "Trafford Wharf Rd", "Manchester", "United Kingdom", 5000, 1),
  createSeedVenueDraft("Printworks London", "Warehouse", "Surrey Quays Rd", "London", "United Kingdom", 6000, 2),
  createSeedVenueDraft("SWG3", "Multi-Room Venue", "100 Eastvale Pl", "Glasgow", "United Kingdom", 2000, 3),
  createSeedVenueDraft("Electric Brixton", "Live Music Venue", "Town Hall Parade", "London", "United Kingdom", 1200, 4),
  createSeedVenueDraft("Motion Bristol", "Warehouse", "74-78 Avon St", "Bristol", "United Kingdom", 1600, 5),
  createSeedVenueDraft("Revolver Upstairs", "Bar", "229 Chapel St", "Melbourne", "Australia", 500, 6),
];

type SortKey = "name" | "city" | "capacity" | "status" | "addedDate";

const statusFilters: Array<VenueStatus | "all"> = ["all", "active", "inactive"];
const pageSize = MANAGEMENT_TABLE_PAGE_SIZE_VENUES;
const showSeedAction = process.env.NODE_ENV !== "production";

export default function VenueManagementPage() {
  const { workspace, members } = useWorkspace();
  const workspaceId = workspace?.id;
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [venues, setVenues] = useState<VenueProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<VenueStatus | "all">("all");
  const [venueTypeFilter, setVenueTypeFilter] = useState<string | "all">("all");
  const [countryFilter, setCountryFilter] = useState<string | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("addedDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [actionVenue, setActionVenue] = useState<VenueProfile | null>(null);
  const [profileVenue, setProfileVenue] = useState<VenueProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasSupabaseConfig = Boolean(getSupabaseConfig());

  useEffect(() => {
    const stored = getStoredSession();
    setSession(stored);

    if (!stored || !workspaceId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    listVenues(stored, workspaceId)
      .then((rows) => {
        setVenues(rows);
        setSelectedId(rows[0]?.id ?? null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Unable to load venues.");
      })
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const counts = useMemo(
    () => ({
      all: venues.length,
      active: venues.filter((venue) => venue.status === "active").length,
      inactive: venues.filter((venue) => venue.status === "inactive").length,
    }),
    [venues],
  );

  const venueTypeOptions = useMemo(() => {
    const types = [...new Set(venues.map((v) => v.venueType).filter(Boolean))].sort();
    return types.map((t) => ({ value: t, label: t }));
  }, [venues]);

  const countryOptions = useMemo(() => {
    const countries = [...new Set(venues.map((v) => v.country).filter(Boolean))].sort();
    return countries.map((c) => ({ value: c, label: c }));
  }, [venues]);

  const advancedFilterCount =
    (venueTypeFilter !== "all" ? 1 : 0) + (countryFilter !== "all" ? 1 : 0);

  const filteredVenues = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const next = venues.filter((venue) => {
      const matchesStatus = status === "all" || venue.status === status;
      const matchesType = venueTypeFilter === "all" || venue.venueType === venueTypeFilter;
      const matchesCountry = countryFilter === "all" || venue.country === countryFilter;
      const haystack = [
        venue.name,
        venue.venueType,
        venue.city,
        venue.country,
        venue.addressLine1,
        ...venue.facilities,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && matchesType && matchesCountry && (!needle || haystack.includes(needle));
    });

    return [...next].sort((a, b) => {
      const aValue = sortableValue(a, sortKey);
      const bValue = sortableValue(b, sortKey);
      const comparison = aValue.localeCompare(bValue);
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [venues, query, sortKey, sortDirection, status, venueTypeFilter, countryFilter]);

  useEffect(() => {
    setPage(1);
  }, [query, status, venueTypeFilter, countryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredVenues.length / pageSize));
  const paginatedVenues = filteredVenues.slice((page - 1) * pageSize, page * pageSize);
  const selectedVenue = selectedId ? venues.find((venue) => venue.id === selectedId) ?? null : null;

  useEffect(() => {
    setPage(1);
  }, [query, status]);

  useEffect(() => {
    if (selectedId && !filteredVenues.some((venue) => venue.id === selectedId)) {
      setSelectedId(filteredVenues[0]?.id ?? null);
    }
  }, [filteredVenues, selectedId]);

  function handleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection("asc");
  }

  async function handleSeedVenues() {
    if (!session || !workspaceId || seeding) return;

    setSeeding(true);
    setError(null);

    try {
      for (const draft of venueSeedDrafts) {
        await createVenue(draft, session, workspaceId);
      }

      const rows = await listVenues(session, workspaceId);
      setVenues(rows);
      setSelectedId(rows[0]?.id ?? null);
      setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to seed venues.");
    } finally {
      setSeeding(false);
    }
  }

  async function handleDownload(filePath: string) {
    if (!session) return;

    try {
      const url = await createSignedVenueDocumentUrl(filePath, session);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to open document.");
    }
  }

  async function handleDeleteVenue(venue: VenueProfile) {
    if (!session) return;

    try {
      await deleteVenue(venue.id, session);
      setVenues((current) => current.filter((item) => item.id !== venue.id));
      if (selectedId === venue.id) {
        setSelectedId(null);
      }
      setActionVenue(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete venue.");
    }
  }

  async function handleSignOut() {
    await signOutOfSupabase();
    setSession(null);
    setVenues([]);
    setSelectedId(null);
  }

  if (!hasSupabaseConfig) {
    return (
      <SetupState
        title="Supabase env vars are missing"
        description="Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before managing venues."
      />
    );
  }

  if (!session) {
    return (
      <SetupState
        title="Sign in to manage venues"
        description="Venue records are stored in your Supabase workspace, so a Supabase Auth session is required."
        actionLabel="Sign in with GitHub"
        onAction={startGithubSignIn}
      />
    );
  }

  return (
    <PageContent>
      <header className={`flex flex-col ${PAGE_STACK_GAP} lg:flex-row lg:items-start lg:justify-between`}>
        <div>
          <h1 className="text-[32px] font-bold leading-9 tracking-tight text-[#F5F5F7]">Venues</h1>
          <p className="mt-1 text-[14px] leading-5 text-[#A1A1AA]">
            Manage your venues, contacts, documents, and operating terms.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-11 min-w-[280px] items-center gap-3 rounded-lg border border-[#232330] bg-[#11111A] px-4 text-[#A1A1AA]">
            <Search className="size-4 shrink-0" aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search venues..."
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
              setVenueTypeFilter("all");
              setCountryFilter("all");
            }}
          >
            <label className="block text-[12px] text-[#A1A1AA]">
              Venue type
              <select
                value={venueTypeFilter}
                onChange={(e) => setVenueTypeFilter(e.target.value)}
                className="mt-1 w-full rounded-md border border-[#3F3F46] bg-[#0B0B10] px-2 py-1.5 text-[13px] text-[#F5F5F7]"
              >
                <option value="all">All types</option>
                {venueTypeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[12px] text-[#A1A1AA]">
              Country
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="mt-1 w-full rounded-md border border-[#3F3F46] bg-[#0B0B10] px-2 py-1.5 text-[13px] text-[#F5F5F7]"
              >
                <option value="all">All countries</option>
                {countryOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </FilterPopover>
          {showSeedAction ? (
            <button
              type="button"
              onClick={handleSeedVenues}
              disabled={seeding}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#232330] bg-[#11111A] px-4 text-sm font-medium text-[#E4E4E7] hover:border-[#8B5CF6]/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {seeding ? "Adding..." : "Seed 24 Venues"}
            </button>
          ) : null}
          <Link
            href="/venues/new"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#8B5CF6]/60 bg-[#7C3AED] px-5 text-sm font-semibold text-white shadow-[0_0_24px_0_rgba(139,92,246,0.22)] hover:bg-[#8B5CF6]"
          >
            <Plus className="size-4" aria-hidden />
            Add Venue
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
                {filter === "all" ? "All Venues" : filter}
                <span className="rounded-full bg-black/20 px-2 py-0.5 text-xs">{counts[filter]}</span>
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
          selectedVenue ? "xl:grid-cols-[minmax(0,1fr)_minmax(360px,400px)]" : ""
        }`}
      >
        <ManagementTableCard>
          <ManagementTableViewport minWidth={880}>
                <colgroup>
                  <col className="w-[39%]" />
                  <col className="w-[17%]" />
                  <col className="w-[14%]" />
                  <col className="w-[12%]" />
                  <col className="w-[10%]" />
                  <col className="w-[8%]" />
                </colgroup>
            <ManagementTableHead>
              <SortableManagementHeader label="Venue" sortKey="name" current={sortKey} direction={sortDirection} onSort={handleSort} />
              <SortableManagementHeader label="City" sortKey="city" current={sortKey} direction={sortDirection} onSort={handleSort} />
              <SortableManagementHeader label="Capacity" sortKey="capacity" current={sortKey} direction={sortDirection} onSort={handleSort} />
              <SortableManagementHeader label="Status" sortKey="status" current={sortKey} direction={sortDirection} onSort={handleSort} />
              <SortableManagementHeader label="Added" sortKey="addedDate" current={sortKey} direction={sortDirection} onSort={handleSort} />
              <ManagementTableHeaderCell align="right">Quick Actions</ManagementTableHeaderCell>
            </ManagementTableHead>
                <tbody>
                  {loading ? (
                    <ManagementTableEmptyState colSpan={6}>Loading venues from Supabase...</ManagementTableEmptyState>
                  ) : paginatedVenues.length === 0 ? (
                    <ManagementTableEmptyState colSpan={6}>
                      No venues match this view. Add your first venue to get started.
                    </ManagementTableEmptyState>
                  ) : (
                    paginatedVenues.map((venue) => {
                      const selected = selectedVenue?.id === venue.id;
                      return (
                        <tr
                          key={venue.id}
                          onClick={() => setSelectedId(venue.id)}
                          className={managementTableRowClass(selected)}
                        >
                          <ManagementTableCell>
                            <div className="flex items-center gap-3">
                              <VenueThumb venue={venue} />
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-[#F5F5F7]">{venue.name}</p>
                                <p className="truncate text-xs text-[#A1A1AA]">{formatFullAddress(venue)}</p>
                              </div>
                            </div>
                          </ManagementTableCell>
                          <ManagementTableCell className="text-[#E4E4E7]">{venue.city}</ManagementTableCell>
                          <ManagementTableCell className="text-[#E4E4E7]">{formatCapacity(venue.maxCapacity)}</ManagementTableCell>
                          <ManagementTableCell>
                            <StatusBadge status={venue.status} />
                          </ManagementTableCell>
                          <ManagementTableCell className="text-[#E4E4E7]">
                            <p>{formatDate(venue.addedDate)}</p>
                            <AddedByLine userId={venue.createdBy} members={members} />
                          </ManagementTableCell>
                          <ManagementTableCell>
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setActionVenue(venue);
                                }}
                                className="flex size-8 items-center justify-center rounded-md text-[#A1A1AA] hover:bg-[#232330] hover:text-white"
                                aria-label={`More actions for ${venue.name}`}
                              >
                                <MoreHorizontal className="size-4" />
                              </button>
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
            totalCount={filteredVenues.length}
            entityLabel="venues"
            onPrevious={() => setPage((value) => value - 1)}
            onNext={() => setPage((value) => value + 1)}
          />
        </ManagementTableCard>

        {selectedVenue ? (
          <VenueSidePanel
            venue={selectedVenue}
            onClose={() => setSelectedId(null)}
            onViewDetails={() => setProfileVenue(selectedVenue)}
            onOpenActions={() => setActionVenue(selectedVenue)}
          />
        ) : null}
      </div>

      {actionVenue ? (
        <VenueActionsOverlay
          venue={actionVenue}
          onClose={() => setActionVenue(null)}
          onDelete={() => void handleDeleteVenue(actionVenue)}
        />
      ) : null}

      {profileVenue ? (
        <VenueProfileModal
          venue={profileVenue}
          onClose={() => setProfileVenue(null)}
          onDownload={handleDownload}
        />
      ) : null}
    </PageContent>
  );
}

function VenueSidePanel({
  venue,
  onClose,
  onViewDetails,
  onOpenActions,
}: {
  venue: VenueProfile;
  onClose: () => void;
  onViewDetails: () => void;
  onOpenActions: () => void;
}) {
  const router = useRouter();

  return (
    <aside className="rounded-xl border border-[#232330] bg-[#11111A] p-5 shadow-[0px_10px_40px_0px_rgba(0,0,0,0.4)] xl:sticky xl:top-5 xl:max-h-[calc(100vh-40px)] xl:overflow-y-auto">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <VenueThumb venue={venue} size="lg" />
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-bold text-[#F5F5F7]">{venue.name}</h2>
            <p className="text-sm text-[#A1A1AA]">{formatFullAddress(venue)}</p>
            <div className="mt-2">
              <StatusBadge status={venue.status} />
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-8 items-center justify-center rounded-md text-[#A1A1AA] hover:bg-[#232330] hover:text-white"
          aria-label="Close venue panel"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-5 grid grid-cols-5 gap-3 text-center text-[10px] text-[#A1A1AA]">
        <ActionTile icon={<Building2 className="size-4" />} label="View Details" onClick={onViewDetails} />
        <ActionLinkTile icon={<Edit3 className="size-4" />} label="Edit" href={`/venues/new?venueId=${venue.id}`} />
        <ActionTile
          icon={<CalendarDays className="size-4" />}
          label="Events"
          onClick={() =>
            router.push(
              `/events?venueId=${encodeURIComponent(venue.id)}&venueName=${encodeURIComponent(venue.name)}`,
            )
          }
        />
        <ActionComingSoonTile
          icon={<Ticket className="size-4" />}
          label="Bookings"
          title="Venue bookings — coming soon"
        />
        <ActionTile icon={<MoreHorizontal className="size-4" />} label="More" onClick={onOpenActions} />
      </div>

      <InfoCard title="About">
        <p className="text-sm leading-6 text-[#D4D4D8]">
          {venue.description || "No venue description has been added yet."}
        </p>
      </InfoCard>

      <InfoCard title="Details">
        <dl className="space-y-3 text-sm">
          <Detail label="Type" value={venue.venueType} />
          <Detail label="Capacity" value={formatCapacity(venue.maxCapacity)} />
          <Detail label="Curfew" value={venue.curfewTime} />
          <Detail label="Email" value={venue.bookingContactEmail} />
          <Detail label="Phone" value={venue.venueManagerPhone} />
        </dl>
      </InfoCard>

      <InfoCard title="Facilities">
        <PillList items={venue.facilities} empty="No facilities listed." />
      </InfoCard>

      <InfoCard>
        <div className="grid gap-3 sm:grid-cols-2">
          <MetaStat label="Created" value={formatDate(venue.createdAt)} />
          <MetaStat label="Updated" value={formatDate(venue.updatedAt)} />
        </div>
      </InfoCard>
    </aside>
  );
}

function VenueActionsOverlay({
  venue,
  onClose,
  onDelete,
}: {
  venue: VenueProfile;
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
            <p className="text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Venue Actions</p>
            <h3 className="mt-1 text-lg font-bold text-[#F5F5F7]">{venue.name}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-[#A1A1AA] hover:bg-[#232330] hover:text-white"
            aria-label="Close venue actions"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="mt-5 space-y-2">
          <Link
            href={`/venues/new?venueId=${venue.id}`}
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
            Delete venue entry
          </button>
        </div>
      </section>
    </div>
  );
}

type VenueTab = "overview" | "operations" | "terms" | "documents";

function VenueProfileModal({
  venue,
  onClose,
  onDownload,
}: {
  venue: VenueProfile;
  onClose: () => void;
  onDownload: (filePath: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<VenueTab>("overview");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <section className="flex h-[760px] max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#232330] bg-[#11111A] shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
        <header className="relative shrink-0 overflow-hidden border-b border-[#232330] bg-gradient-to-br from-[#1A1430] to-[#0B0B10] p-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-lg text-[#A1A1AA] hover:bg-white/10 hover:text-white"
            aria-label="Close venue profile"
          >
            <X className="size-5" aria-hidden />
          </button>
          <div className="flex flex-col gap-5 md:flex-row md:items-end">
            <VenueThumb venue={venue} size="xl" />
            <div className="min-w-0 flex-1 pr-10">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={venue.status} />
                <span className="rounded-md border border-[#8B5CF6]/30 bg-[#2D2640]/70 px-2 py-1 text-xs text-[#C4B5FD]">
                  {venue.venueType}
                </span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-[#F5F5F7]">{venue.name}</h2>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-[#D4D4D8]">
                {venue.description || "No venue description has been added yet."}
              </p>
            </div>
          </div>
        </header>

        <div className="shrink-0 border-b border-[#232330] px-5 pt-4">
          <div className="flex flex-wrap gap-2">
            <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>
              Overview
            </TabButton>
            <TabButton active={activeTab === "operations"} onClick={() => setActiveTab("operations")}>
              Operations
            </TabButton>
            <TabButton active={activeTab === "terms"} onClick={() => setActiveTab("terms")}>
              Terms
            </TabButton>
            <TabButton active={activeTab === "documents"} onClick={() => setActiveTab("documents")}>
              Documents
            </TabButton>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {activeTab === "overview" ? (
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
              <ProfileSection title="Venue Details">
                <dl className="grid gap-4 md:grid-cols-2">
                  <ProfileDetail label="Address" value={formatFullAddress(venue)} />
                  <ProfileDetail label="City" value={venue.city} />
                  <ProfileDetail label="Country" value={venue.country} />
                  <ProfileDetail label="Capacity" value={formatCapacity(venue.maxCapacity)} />
                  <ProfileDetail label="Indoor Capacity" value={formatCapacity(venue.indoorCapacity)} />
                  <ProfileDetail label="Outdoor Capacity" value={formatCapacity(venue.outdoorCapacity)} />
                  <ProfileDetail label="Noise Restrictions" value={venue.noiseRestriction} />
                  <ProfileDetail label="Age Restriction" value={venue.ageRestriction} />
                </dl>
              </ProfileSection>

              <div className="space-y-3">
                <ProfileSection title="Facilities">
                  <PillList items={venue.facilities} empty="No facilities listed." />
                </ProfileSection>
                <ProfileSection title="Access">
                  <dl className="space-y-3">
                    <Detail label="Wheelchair Access" value={venue.wheelchairAccessible ? "Yes" : "No"} />
                    <Detail label="Parking Available" value={venue.parkingAvailable ? "Yes" : "No"} />
                    <Detail label="Curfew" value={venue.curfewTime} />
                  </dl>
                </ProfileSection>
              </div>
            </div>
          ) : null}

          {activeTab === "operations" ? (
            <div className="grid gap-3 lg:grid-cols-2">
              <ProfileSection title="Operations & Contacts">
                <dl className="grid gap-4 md:grid-cols-2">
                  <ProfileDetail label="Venue Manager" value={venue.venueManagerName} />
                  <ProfileDetail label="Manager Phone" value={venue.venueManagerPhone} />
                  <ProfileDetail label="Booking Contact" value={venue.bookingContactName} />
                  <ProfileDetail label="Booking Email" value={venue.bookingContactEmail} />
                  <ProfileDetail label="Finance Contact" value={venue.financeContactName} />
                  <ProfileDetail label="Finance Phone" value={venue.financeContactPhone} />
                  <ProfileDetail label="Finance Email" value={venue.financeContactEmail} />
                  <ProfileDetail label="Preferred Method" value={venue.preferredContactMethod} />
                </dl>
              </ProfileSection>

              <ProfileSection title="Additional Information">
                <dl className="grid gap-4">
                  <ProfileDetail label="Timezone" value={venue.timezone} />
                  <ProfileDetail label="Parking Details" value={venue.parkingDetails} />
                  <ProfileDetail label="Load In" value={venue.loadInDetails} />
                  <ProfileDetail label="Load Out" value={venue.loadOutDetails} />
                  <ProfileDetail label="Notes" value={venue.operationsNotes} />
                </dl>
              </ProfileSection>
            </div>
          ) : null}

          {activeTab === "terms" ? (
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
              <ProfileSection title="Terms & Conditions">
                <dl className="grid gap-4 md:grid-cols-2">
                  <ProfileDetail label="Deposit Required" value={venue.depositRequired ? "Yes" : "No"} />
                  <ProfileDetail
                    label="Deposit Amount"
                    value={formatCentsValue(venue.depositAmountCents)}
                  />
                  <ProfileDetail label="Deposit Due" value={venue.depositDueTerms} />
                  <ProfileDetail label="Hire Fee" value={formatCentsValue(venue.hireFeeCents)} />
                  <ProfileDetail label="Payment Terms" value={venue.paymentTerms} />
                  <ProfileDetail label="Bar Split" value={venue.barSplitPercent ? `${venue.barSplitPercent}%` : "Not set"} />
                  <ProfileDetail
                    label="Minimum Spend"
                    value={formatCentsValue(venue.minimumSpendCents)}
                  />
                  <ProfileDetail label="Late License" value={venue.lateLicense ? "Yes" : "No"} />
                </dl>
              </ProfileSection>

              <ProfileSection title="Event Requirements">
                <dl className="space-y-3">
                  <Detail label="Security Required" value={venue.securityRequired ? "Yes" : "No"} />
                  <Detail label="Equipment Provided" value={venue.equipmentProvided ? "Yes" : "No"} />
                  <Detail label="Smoking Allowed" value={venue.smokingAllowed ? "Yes" : "No"} />
                </dl>
              </ProfileSection>
            </div>
          ) : null}

          {activeTab === "documents" ? (
            <ProfileSection title="Uploaded Documents">
              <div className="grid gap-2">
                {venue.documents.length === 0 ? (
                  <p className="text-sm text-[#A1A1AA]">No documents have been uploaded.</p>
                ) : (
                  venue.documents.map((document) => (
                    <button
                      key={document.id ?? document.filePath}
                      type="button"
                      onClick={() => onDownload(document.filePath)}
                      className="grid gap-3 rounded-lg border border-[#232330] bg-[#0B0B10] px-3 py-3 text-left text-sm md:grid-cols-[minmax(0,1fr)_150px_120px_40px]"
                    >
                      <span className="truncate font-medium text-[#F5F5F7]">{document.fileName}</span>
                      <span className="rounded-md bg-[#2D2640] px-2 py-1 text-xs text-[#C4B5FD]">
                        {document.category}
                      </span>
                      <span className="text-[#A1A1AA]">{formatDate(document.uploadedAt)}</span>
                      <Download className="size-4 text-[#A1A1AA]" aria-hidden />
                    </button>
                  ))
                )}
              </div>
            </ProfileSection>
          ) : null}
        </div>

        <footer className="flex shrink-0 flex-col gap-3 border-t border-[#232330] p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#A1A1AA]">Full profile data is pulled from the stored venue record.</p>
          <Link
            href={`/venues/new?venueId=${venue.id}`}
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

function ActionTile({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[62px] flex-col items-center justify-center gap-1.5 rounded-lg border border-[#232330] bg-[#0F0F17] px-2 py-2 hover:border-[#8B5CF6]/50 hover:text-white"
    >
      {icon}
      {label}
    </button>
  );
}

function ActionLinkTile({ icon, label, href }: { icon: ReactNode; label: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-[62px] flex-col items-center justify-center gap-1.5 rounded-lg border border-[#232330] bg-[#0F0F17] px-2 py-2 hover:border-[#8B5CF6]/50 hover:text-white"
    >
      {icon}
      {label}
    </Link>
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

function ProfileSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[#232330] bg-[#0F0F17] p-5">
      <h3 className="mb-4 text-base font-semibold text-[#F5F5F7]">{title}</h3>
      {children}
    </section>
  );
}

function TabButton({
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

function StatusBadge({ status }: { status: VenueStatus }) {
  const className =
    status === "active"
      ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/20"
      : "bg-amber-500/15 text-amber-300 ring-amber-500/20";

  return (
    <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium capitalize ring-1 ${className}`}>
      {status}
    </span>
  );
}

function VenueThumb({ venue, size = "md" }: { venue: VenueProfile; size?: "md" | "lg" | "xl" }) {
  const className =
    size === "xl"
      ? "h-28 w-40 rounded-xl"
      : size === "lg"
        ? "h-20 w-24 rounded-xl"
        : "h-12 w-14 rounded-lg";

  if (venue.imageUrl) {
    return <img src={venue.imageUrl} alt="" className={`${className} shrink-0 object-cover`} />;
  }

  return (
    <div
      className={`${className} flex shrink-0 items-center justify-center bg-gradient-to-br from-[#2D2640] to-[#0B0B10] text-sm font-bold text-[#C4B5FD]`}
      aria-hidden
    >
      {venue.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()}
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

function MetaStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#232330] bg-[#0B0B10] p-3">
      <p className="text-xs uppercase tracking-wide text-[#71717A]">{label}</p>
      <p className="mt-1 text-sm text-[#F5F5F7]">{value}</p>
    </div>
  );
}

function PillList({ items, empty }: { items: string[]; empty: string }) {
  const values = items.filter(Boolean);
  if (values.length === 0) {
    return <p className="text-sm text-[#A1A1AA]">{empty}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((item) => (
        <span key={item} className="rounded-md border border-[#232330] bg-[#0B0B10] px-3 py-1.5 text-sm text-[#E4E4E7]">
          {item}
        </span>
      ))}
    </div>
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
    <div className="flex min-h-[60vh] items-center justify-center">
      <section className="max-w-xl rounded-2xl border border-[#232330] bg-[#11111A] p-10 text-center shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#1A1430] text-[#C4B5FD]">
          <CheckCircle2 className="size-7" aria-hidden />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-[#F5F5F7]">{title}</h1>
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

function createSeedVenueDraft(
  name: string,
  venueType: string,
  addressLine1: string,
  city: string,
  country: string,
  maxCapacity: number,
  index: number,
): VenueDraft {
  return {
    name,
    venueType,
    status: index % 5 === 0 ? "inactive" : "active",
    addressLine1,
    city,
    stateRegion: "",
    postalCode: "",
    country,
    description: `${name} is a seeded venue profile for PromoSync testing, covering table filtering and venue wizard flows.`,
    imageUrl: "",
    maxCapacity,
    indoorCapacity: Math.round(maxCapacity * 0.8),
    outdoorCapacity: Math.round(maxCapacity * 0.2),
    curfewTime: index % 2 === 0 ? "02:00" : "04:00",
    noiseRestriction: index % 3 === 0 ? "Strict" : "Moderate",
    ageRestriction: "18+",
    wheelchairAccessible: index % 2 === 0,
    parkingAvailable: index % 3 !== 0,
    facilities: ["Main Room", "Bar", "Sound System", "Lighting Rig"].filter((_, facilityIndex) =>
      (facilityIndex + index) % 2 === 0,
    ),
    otherFacilities: "",
    venueManagerName: `${name.split(" ")[0]} Manager`,
    venueManagerPhone: `+44 20 7704 ${String(3000 + index).slice(-4)}`,
    bookingContactName: `${name.split(" ")[0]} Bookings`,
    bookingContactEmail: `bookings.${name.toLowerCase().replace(/[^a-z0-9]+/g, "")}@example.com`,
    financeContactName: `${name.split(" ")[0]} Finance`,
    financeContactPhone: `+44 20 7704 ${String(4000 + index).slice(-4)}`,
    financeContactEmail: `finance.${name.toLowerCase().replace(/[^a-z0-9]+/g, "")}@example.com`,
    preferredContactMethod: "Email",
    operationsNotes: "",
    depositRequired: index % 2 === 0,
    depositAmountCents: index % 2 === 0 ? 75000 : 0,
    depositDueTerms: index % 2 === 0 ? "7 days after booking" : "",
    hireFeeCents: (1200 + index * 150) * 100,
    paymentTerms: "7 days before event",
    barSplitPercent: index % 3 === 0 ? 80 : 0,
    minimumSpendCents: index % 4 === 0 ? 200000 : 0,
    securityRequired: index % 2 === 0,
    equipmentProvided: true,
    smokingAllowed: false,
    lateLicense: index % 4 === 0,
    timezone: city === "Melbourne" ? "Australia/Melbourne" : "Europe/London",
    parkingDetails: index % 3 !== 0 ? "On-site or nearby parking available." : "",
    loadInDetails: "After 16:00",
    loadOutDetails: "By 10:00 next day",
    documents: [],
  };
}

function sortableValue(venue: VenueProfile, key: SortKey) {
  switch (key) {
    case "name":
      return venue.name;
    case "city":
      return venue.city;
    case "capacity":
      return String(venue.maxCapacity).padStart(8, "0");
    case "status":
      return venue.status;
    case "addedDate":
      return venue.addedDate;
  }
}

function formatFullAddress(venue: VenueProfile) {
  return [venue.addressLine1, venue.city, venue.stateRegion, venue.postalCode, venue.country]
    .filter(Boolean)
    .join(", ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatCapacity(value: number) {
  return value ? new Intl.NumberFormat("en-GB").format(value) : "Not set";
}

