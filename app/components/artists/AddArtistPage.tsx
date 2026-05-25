"use client";

import Link from "next/link";
import type { RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Check,
  ExternalLink,
  FileText,
  FolderOpen,
  Hash,
  Image,
  Edit3,
  Save,
  Star,
  Upload,
  X,
  UserRound,
  DollarSign,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  addArtistDocuments,
  createArtist,
  getArtist,
  getStoredSession,
  getSupabaseConfig,
  startGithubSignIn,
  updateArtist,
  uploadArtistDocument,
  uploadArtistMedia,
  updateArtistPromoImage,
} from "@/lib/supabase/browser";
import ArtistAiFillButton from "@/app/components/artists/ArtistAiFillButton";
import { countWords, MAX_ARTIST_BIO_WORDS, trimToMaxWords } from "@/lib/ai/artist-text";
import type {
  ArtistDocument,
  ArtistDraft,
  ArtistProfile,
  ArtistSocialPlatform,
  ArtistStatus,
  SupabaseSession,
} from "@/lib/types/artist";

type StepId = "basic" | "contact" | "social" | "documents";

type PendingDocument = {
  id: string;
  category: string;
  displayName: string;
  file: File;
};

const draftStorageKey = "promosync.artistDraft";

const steps: Array<{ id: StepId; label: string; icon: LucideIcon }> = [
  { id: "basic", label: "1. Basic Info", icon: UserRound },
  { id: "contact", label: "2. Contact", icon: FileText },
  { id: "social", label: "3. Social & Tags", icon: Hash },
  { id: "documents", label: "4. Documents", icon: FolderOpen },
];

const documentCategories = [
  "Press Kit",
  "Tech Rider",
  "Hospitality Rider",
  "Stage Plot",
  "Contracts",
  "Invoices",
  "Logos",
  "Promo Photos",
  "Social Assets",
  "Tour Posters",
];

const genreOptions = [
  "House",
  "Deep House",
  "Minimal House",
  "Microhouse",
  "Tech House",
  "Progressive House",
  "Acid House",
  "Afro House",
  "Tribal House",
  "Electro House",
  "Organic House",
  "Lo-Fi House",
  "Dub House",
  "Techno",
  "Detroit Techno",
  "Minimal Techno",
  "Dub Techno",
  "Industrial Techno",
  "Hypnotic Techno",
  "Hardgroove",
  "Peak Time Techno",
  "Acid Techno",
  "Schranz",
  "Ambient Techno",
  "Tribal Techno",
  "Raw Techno",
  "UK Garage",
  "2-Step",
  "Bassline",
  "Breakbeat",
  "Jungle",
  "Drum & Bass",
  "Liquid DnB",
  "Neurofunk",
  "Halftime",
  "Dubstep",
  "Deep Dubstep",
  "Leftfield Bass",
  "Grime",
  "UK Funky",
  "IDM",
  "Glitch",
  "Experimental Electronica",
  "Ambient",
  "Drone",
  "Noise",
  "Electroacoustic",
  "Deconstructed Club",
  "Post-Club",
  "Industrial",
  "Musique Concrete",
  "Electro",
  "Electroclash",
  "Breaks",
  "Nu Breaks",
  "Miami Bass",
  "Freestyle",
  "Broken Beat",
  "Trance",
  "Progressive Trance",
  "Psytrance",
  "Goa Trance",
  "Tech Trance",
  "Hard Trance",
  "Ambient Trance",
  "Downtempo",
  "Trip-Hop",
  "Balearic",
  "Chillout",
  "Dub",
  "Psybient",
  "Organic Electronica",
  "Latin Bass",
  "Baile Funk",
  "Gqom",
  "Amapiano",
  "Kuduro",
  "Dancehall",
  "Dembow",
  "Afro-Tech",
  "Chicago House",
  "Italo Disco",
  "EBM",
  "New Beat",
  "Acid",
  "Disco",
  "Cosmic Disco",
];

const popularTags = [
  "dnb",
  "house",
  "techno",
  "bass",
  "local",
  "international",
  "underground",
  "high draw",
  "festival-friendly",
  "easy to work with",
  "low maintenance",
  "heavy sound",
  "liquid",
  "melodic",
  "club",
  "warehouse",
  "support",
  "opener",
];

const socialPlatforms: ArtistSocialPlatform[] = [
  "instagram",
  "tiktok",
  "spotify",
  "soundcloud",
  "youtube",
];

const emptyDraft: ArtistDraft = {
  name: "",
  artistType: "",
  genres: [],
  status: "active",
  classification: "",
  city: "",
  country: "",
  reach: "local",
  bio: "",
  promoImageUrl: "",
  contactName: "",
  contactRole: "",
  email: "",
  phone: "",
  preferredContactMethod: "",
  agencyName: "",
  managementCompany: "",
  territory: "",
  representedArtists: [],
  internalNotes: "",
  reliabilityRating: 0,
  typicalFeeCents: 0,
  depositRequired: false,
  depositAmountCents: 0,
  bookingNotes: "",
  tags: [],
  socialLinks: socialPlatforms.map((platform) => ({ platform, url: "" })),
  documents: [],
};

function artistProfileToDraft(artist: ArtistProfile): ArtistDraft {
  return {
    ...emptyDraft,
    name: artist.name,
    artistType: artist.artistType,
    genres: artist.genres,
    status: artist.status,
    classification: artist.classification ?? "",
    city: artist.city ?? "",
    country: artist.country ?? "",
    reach: artist.reach,
    bio: artist.bio ?? "",
    promoImageUrl: artist.promoImageUrl ?? "",
    contactName: artist.contactName ?? "",
    contactRole: artist.contactRole ?? "",
    email: artist.email ?? "",
    phone: artist.phone ?? "",
    preferredContactMethod: artist.preferredContactMethod ?? "",
    agencyName: artist.agencyName ?? "",
    managementCompany: artist.managementCompany ?? "",
    territory: artist.territory ?? "",
    representedArtists: artist.representedArtists,
    internalNotes: artist.internalNotes ?? "",
    reliabilityRating: artist.reliabilityRating ?? 0,
    typicalFeeCents: artist.typicalFeeCents,
    depositRequired: artist.depositRequired,
    depositAmountCents: artist.depositAmountCents,
    bookingNotes: artist.bookingNotes ?? "",
    tags: artist.tags,
    socialLinks: emptyDraft.socialLinks.map((link) => ({
      ...link,
      url: artist.socialLinks.find((item) => item.platform === link.platform)?.url ?? "",
    })),
    documents: artist.documents,
  };
}

export default function AddArtistPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingArtistId = searchParams.get("artistId");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [draft, setDraft] = useState<ArtistDraft>(emptyDraft);
  const [step, setStep] = useState<StepId>("basic");
  const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>([]);
  const [promoImageFile, setPromoImageFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(documentCategories[0]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasSupabaseConfig = Boolean(getSupabaseConfig());

  useEffect(() => {
    const stored = getStoredSession();
    setSession(stored);

    try {
      const raw = window.localStorage.getItem(draftStorageKey);
      if (raw && !editingArtistId) {
        setDraft({ ...emptyDraft, ...(JSON.parse(raw) as Partial<ArtistDraft>) });
      }
    } catch {
      window.localStorage.removeItem(draftStorageKey);
    }

    if (stored && editingArtistId) {
      getArtist(editingArtistId, stored)
        .then((artist) => {
          setDraft(artistProfileToDraft(artist));
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Unable to load artist for editing.");
        });
    }
  }, [editingArtistId]);

  const currentIndex = steps.findIndex((item) => item.id === step);
  const completion = useMemo(() => {
    const checks = [
      Boolean(draft.name && draft.artistType && draft.genres.length > 0 && draft.city && draft.country),
      Boolean(draft.contactName && draft.email),
      draft.socialLinks.some((link) => link.url.trim()) || draft.tags.length > 0,
      pendingDocuments.length > 0,
    ];

    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [draft, pendingDocuments.length]);

  function patchDraft(patch: Partial<ArtistDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function saveDraft() {
    window.localStorage.setItem(draftStorageKey, JSON.stringify(draft));
    setMessage("Draft saved locally in this browser.");
    setError(null);
  }

  async function saveArtist() {
    if (!session) {
      setError("Sign in with Supabase before saving artists.");
      return;
    }

    if (!draft.name.trim() || !draft.artistType.trim()) {
      setStep("basic");
      setError("Artist name and artist type are required.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const artist = editingArtistId
        ? await updateArtist(editingArtistId, { ...draft, documents: [] }, session)
        : await createArtist({ ...draft, documents: [] }, session);
      if (promoImageFile) {
        const promoImageUrl = await uploadArtistMedia(promoImageFile, session);
        await updateArtistPromoImage(artist.id, promoImageUrl, session);
      }

      const uploadedDocuments: ArtistDocument[] = [];

      for (const pending of pendingDocuments) {
        const uploaded = await uploadArtistDocument(pending.file, artist.id, pending.category, session);
        uploadedDocuments.push({
          ...uploaded,
          fileName: pending.displayName.trim() || pending.file.name,
        });
      }

      await addArtistDocuments(artist.id, uploadedDocuments, session);
      window.localStorage.removeItem(draftStorageKey);
      router.push("/artists");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save artist.");
    } finally {
      setSaving(false);
    }
  }

  function addTag(tag: string) {
    const normalised = tag.trim().toLowerCase();
    if (!normalised || draft.tags.includes(normalised)) return;
    patchDraft({ tags: [...draft.tags, normalised] });
    setTagInput("");
  }

  function removeTag(tag: string) {
    patchDraft({ tags: draft.tags.filter((item) => item !== tag) });
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;

    const next = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      category: selectedCategory,
      displayName: file.name,
      file,
    }));
    setPendingDocuments((current) => [...current, ...next]);
  }

  if (!hasSupabaseConfig) {
    return (
      <SetupState
        title="Supabase env vars are missing"
        description="Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before creating artists."
      />
    );
  }

  if (!session) {
    return (
      <SetupState
        title="Sign in to add artists"
        description="Artist creation writes to your user-scoped Supabase tables, so a Supabase Auth session is required."
        actionLabel="Sign in with GitHub"
        onAction={startGithubSignIn}
      />
    );
  }

  return (
    <div className="flex w-full max-w-none flex-col gap-3 pb-10">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-[#A1A1AA]">
            <Link href="/artists" className="hover:text-white">
              Artists
            </Link>
            <span>/</span>
            <span>{editingArtistId ? "Edit Artist" : "Add Artist"}</span>
          </div>
          <h1 className="text-[32px] font-bold leading-9 tracking-tight text-[#F5F5F7]">
            {editingArtistId ? "Edit Artist" : "Add Artist"}
          </h1>
          <p className="mt-1 text-[14px] leading-5 text-[#A1A1AA]">
            {editingArtistId
              ? "Update this artist profile and save the latest details."
              : "Create a new artist profile. You can always add more details later."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/artists"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-[#232330] bg-[#0B0B10] px-5 text-sm font-semibold text-[#E4E4E7] hover:border-[#8B5CF6]/50"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={saveDraft}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#232330] bg-[#11111A] px-5 text-sm font-semibold text-[#E4E4E7] hover:border-[#8B5CF6]/50"
          >
            <Save className="size-4" aria-hidden />
            Save Draft
          </button>
          <button
            type="button"
            onClick={saveArtist}
            disabled={saving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#8B5CF6]/60 bg-[#7C3AED] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : editingArtistId ? "Update Artist" : "Save Artist"}
          </button>
        </div>
      </header>

      {(message || error) && (
        <div
          className={[
            "rounded-lg border px-4 py-3 text-sm",
            error ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
          ].join(" ")}
        >
          {error ?? message}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-[#232330] bg-[#11111A] shadow-[0px_10px_40px_0px_rgba(0,0,0,0.35)]">
        <nav className="grid border-b border-[#232330] bg-[#0F0F17] md:grid-cols-4">
          {steps.map((item, index) => {
            const Icon = item.icon;
            const active = item.id === step;
            const complete = index < currentIndex;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setStep(item.id)}
                className={[
                  "flex h-16 items-center justify-center gap-2 border-b-2 text-sm font-semibold transition-colors",
                  active
                    ? "border-[#8B5CF6] text-[#C4B5FD]"
                    : complete
                      ? "border-transparent text-emerald-300"
                      : "border-transparent text-[#A1A1AA] hover:text-white",
                ].join(" ")}
              >
                {complete ? <Check className="size-4" aria-hidden /> : <Icon className="size-4" aria-hidden />}
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="grid gap-3 p-5 xl:grid-cols-[minmax(0,1fr)_260px]">
          <div>
            {step === "basic" ? (
              <BasicInfoStep
                draft={draft}
                patchDraft={patchDraft}
                promoImageFile={promoImageFile}
                setPromoImageFile={setPromoImageFile}
                onAiError={(msg) => {
                  setError(msg);
                  setMessage(null);
                }}
                onAiSuccess={(msg) => {
                  setMessage(msg);
                  setError(null);
                }}
              />
            ) : step === "contact" ? (
              <ContactStep draft={draft} patchDraft={patchDraft} />
            ) : step === "social" ? (
              <SocialStep
                draft={draft}
                patchDraft={patchDraft}
                tagInput={tagInput}
                setTagInput={setTagInput}
                addTag={addTag}
                removeTag={removeTag}
              />
            ) : (
              <DocumentsStep
                pendingDocuments={pendingDocuments}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                onFiles={handleFiles}
                onRemove={(id) =>
                  setPendingDocuments((current) => current.filter((document) => document.id !== id))
                }
                onUpdateCategory={(id, category) =>
                  setPendingDocuments((current) =>
                    current.map((document) =>
                      document.id === id ? { ...document, category } : document,
                    ),
                  )
                }
                onRename={(id, displayName) =>
                  setPendingDocuments((current) =>
                    current.map((document) =>
                      document.id === id ? { ...document, displayName } : document,
                    ),
                  )
                }
                fileInputRef={fileInputRef}
              />
            )}
          </div>

          <aside className="space-y-3">
            <section className="rounded-xl border border-[#232330] bg-[#0F0F17] p-5">
              <h2 className="text-sm font-semibold text-[#F5F5F7]">Tips</h2>
              <p className="mt-3 text-sm leading-6 text-[#A1A1AA]">
                Add essential details first. Social links, tags, and files make lineup planning faster later.
              </p>
            </section>
            <section className="rounded-xl border border-[#232330] bg-[#0F0F17] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-[#F5F5F7]">Profile Completion</h2>
                  <p className="mt-1 text-xs text-[#A1A1AA]">{completion}% complete</p>
                </div>
                <div className="flex size-14 items-center justify-center rounded-full border-4 border-[#7C3AED] text-sm font-bold text-white">
                  {completion}%
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-xs text-[#A1A1AA]">
                {steps.map((item, index) => (
                  <li key={item.id} className="flex items-center gap-2">
                    <span
                      className={[
                        "size-2 rounded-full",
                        index <= currentIndex ? "bg-[#8B5CF6]" : "bg-[#3F3F46]",
                      ].join(" ")}
                    />
                    {item.label.replace(/^\d\.\s/, "")}
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-[#232330] px-5 py-4">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setStep(steps[currentIndex - 1].id)}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#232330] px-5 text-sm font-semibold text-[#E4E4E7] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Previous
          </button>

          {currentIndex < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep(steps[currentIndex + 1].id)}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#8B5CF6]/60 bg-[#7C3AED] px-5 text-sm font-semibold text-white"
            >
              Next
              <ArrowRight className="size-4" aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              onClick={saveArtist}
              disabled={saving}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#8B5CF6]/60 bg-[#7C3AED] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : editingArtistId ? "Update Artist" : "Save Artist"}
              <ArrowRight className="size-4" aria-hidden />
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}

function BasicInfoStep({
  draft,
  patchDraft,
  promoImageFile,
  setPromoImageFile,
  onAiError,
  onAiSuccess,
}: {
  draft: ArtistDraft;
  patchDraft: (patch: Partial<ArtistDraft>) => void;
  promoImageFile: File | null;
  setPromoImageFile: (file: File | null) => void;
  onAiError: (message: string) => void;
  onAiSuccess: (message: string) => void;
}) {
  return (
    <section>
      <h2 className="text-lg font-bold text-[#F5F5F7]">Basic Information</h2>
      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-[#F5F5F7]">
                Artist Name <span className="text-red-400">*</span>
              </span>
              <ArtistAiFillButton
                artistName={draft.name}
                draft={draft}
                onApply={(next) => patchDraft(next)}
                onError={onAiError}
                onSuccess={onAiSuccess}
              />
            </span>
            <input
              type="text"
              value={draft.name}
              onChange={(event) => patchDraft({ name: event.target.value })}
              placeholder="Enter artist name"
              className="h-11 w-full rounded-lg border border-[#3F3F46] bg-[#0F0F17] px-3 text-sm text-[#F5F5F7] outline-none transition-colors placeholder:text-[#71717A] focus:border-[#8B5CF6]"
            />
            <span className="mt-1 block text-[12px] text-[#71717A]">
              Type the artist name, then use Find Artist to preview matches before filling the form.
            </span>
          </label>
          <SelectField
            label="Artist Type"
            required
            value={draft.artistType}
            onChange={(artistType) => patchDraft({ artistType })}
            options={["DJ / Producer", "DJ", "Vocalist", "Live Band", "Band", "Producer"]}
          />
          <GenreInput
            value={draft.genres}
            onChange={(genres) => patchDraft({ genres })}
          />
          <Field label="City" required value={draft.city} onChange={(city) => patchDraft({ city })} placeholder="Enter city" />
          <Field label="Country" required value={draft.country} onChange={(country) => patchDraft({ country })} placeholder="Select country" />
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Classification"
              value={draft.classification}
              onChange={(classification) => patchDraft({ classification })}
              options={["Emerging", "Established", "Headliner", "Legacy"]}
            />
            <SelectField
              label="Active Status"
              value={draft.status}
              onChange={(status) => patchDraft({ status: status as ArtistStatus })}
              options={["active", "inactive", "archived"]}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#F5F5F7]">Promo Image</label>
            {draft.promoImageUrl && !promoImageFile ? (
              <div className="mb-3 flex items-center gap-3 rounded-xl border border-[#232330] bg-[#0F0F17] p-3">
                <img
                  src={draft.promoImageUrl}
                  alt=""
                  className="size-16 rounded-lg border border-[#232330] object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-[#E4E4E7]">AI-suggested image</p>
                  <button
                    type="button"
                    onClick={() => patchDraft({ promoImageUrl: "" })}
                    className="mt-1 text-[12px] text-[#8B5CF6] hover:text-[#A78BFA]"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : null}
            <div className="flex min-h-[170px] flex-col items-center justify-center rounded-xl border border-dashed border-[#3F3F46] bg-[#0B0B10] p-5 text-center">
              <Image className="size-8 text-[#A1A1AA]" aria-hidden />
              <p className="mt-3 text-sm font-semibold text-[#F5F5F7]">
                {promoImageFile ? promoImageFile.name : "Upload Image"}
              </p>
              <p className="text-xs text-[#71717A]">JPG, PNG, or WebP up to your Supabase limit.</p>
              <label className="mt-4 inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#8B5CF6]/60 bg-[#2D2640]/60 px-4 text-sm font-semibold text-[#C4B5FD]">
                <Upload className="size-4" aria-hidden />
                Choose File
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => setPromoImageFile(event.target.files?.[0] ?? null)}
                />
              </label>
              <p className="mt-4 text-xs text-[#71717A]">Or paste an existing public image URL.</p>
              <input
                value={draft.promoImageUrl}
                onChange={(event) => patchDraft({ promoImageUrl: event.target.value })}
                placeholder="https://..."
                className="mt-4 h-11 w-full rounded-lg border border-[#3F3F46] bg-[#11111A] px-3 text-sm text-[#F5F5F7] outline-none focus:border-[#8B5CF6]"
              />
            </div>
          </div>
          <BioTextArea value={draft.bio} onChange={(bio) => patchDraft({ bio })} />
        </div>
      </div>
    </section>
  );
}

function ContactStep({
  draft,
  patchDraft,
}: {
  draft: ArtistDraft;
  patchDraft: (patch: Partial<ArtistDraft>) => void;
}) {
  return (
    <section>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
        <div className="space-y-3">
          <section className="rounded-xl border border-[#232330] bg-[#0F0F17] p-5">
            <h2 className="text-lg font-bold text-[#F5F5F7]">Primary Contact</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Field label="Contact Name" required value={draft.contactName} onChange={(contactName) => patchDraft({ contactName })} placeholder="Enter full name" />
              <SelectField label="Role" value={draft.contactRole} onChange={(contactRole) => patchDraft({ contactRole })} options={["Artist", "Agent", "Manager", "Tour Manager"]} />
            </div>
            <div className="mt-3 space-y-3">
              <Field label="Email" required value={draft.email} onChange={(email) => patchDraft({ email })} placeholder="Enter email address" type="email" />
              <Field label="Phone" value={draft.phone} onChange={(phone) => patchDraft({ phone })} placeholder="Enter phone number" />
              <SelectField label="Preferred Contact Method" value={draft.preferredContactMethod} onChange={(preferredContactMethod) => patchDraft({ preferredContactMethod })} options={["Email", "Phone", "WhatsApp", "Instagram DM"]} />
            </div>
            <div className="mt-3">
              <label className="mb-2 block text-sm font-medium text-[#F5F5F7]">Reliability Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => patchDraft({ reliabilityRating: rating })}
                    className={rating <= draft.reliabilityRating ? "text-[#8B5CF6]" : "text-[#71717A]"}
                    aria-label={`${rating} star rating`}
                  >
                    <Star className="size-6" fill={rating <= draft.reliabilityRating ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[#232330] bg-[#0F0F17] p-5">
            <h2 className="text-lg font-bold text-[#F5F5F7]">Agency / Management <span className="text-sm font-normal text-[#A1A1AA]">(Optional)</span></h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Field label="Agency / Management Name" value={draft.agencyName} onChange={(agencyName) => patchDraft({ agencyName })} placeholder="Enter agency or management name" />
              <Field label="Management Company" value={draft.managementCompany} onChange={(managementCompany) => patchDraft({ managementCompany })} placeholder="Enter management company" />
            </div>
          </section>
        </div>

        <section className="rounded-xl border border-[#232330] bg-[#0F0F17] p-5">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-[#2D2640] text-[#C4B5FD]">
              <DollarSign className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-bold text-[#F5F5F7]">Booking Fee <span className="text-sm font-normal text-[#A1A1AA]">(Optional)</span></h2>
              <p className="text-sm text-[#A1A1AA]">Set your typical booking fee and deposit preferences.</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <CurrencyField
              label="Typical Booking Fee"
              valueCents={draft.typicalFeeCents}
              onChange={(typicalFeeCents) => patchDraft({ typicalFeeCents })}
              helperText="Artist's typical booking fee."
            />

            <label className="flex min-h-[62px] items-center justify-between gap-3 rounded-lg border border-[#232330] bg-[#11111A] px-4 py-3">
              <span>
                <span className="block text-sm font-medium text-[#F5F5F7]">Deposit Required</span>
                <span className="mt-1 block text-xs text-[#A1A1AA]">
                  {draft.depositRequired ? "Yes, deposit is required" : "No, deposit is not required"}
                </span>
              </span>
              <input
                type="checkbox"
                checked={draft.depositRequired}
                onChange={(event) => patchDraft({ depositRequired: event.target.checked })}
                className="size-5 accent-[#8B5CF6]"
              />
            </label>

            <CurrencyField
              label="Deposit Amount"
              valueCents={draft.depositAmountCents}
              onChange={(depositAmountCents) => patchDraft({ depositAmountCents })}
              helperText="Amount requested as deposit"
            />

            <TextArea
              label="Notes"
              value={draft.bookingNotes}
              onChange={(bookingNotes) => patchDraft({ bookingNotes })}
              placeholder="Add any notes about booking terms..."
              maxLength={500}
              compact
            />
          </div>
        </section>
      </div>
    </section>
  );
}

function SocialStep({
  draft,
  patchDraft,
  tagInput,
  setTagInput,
  addTag,
  removeTag,
}: {
  draft: ArtistDraft;
  patchDraft: (patch: Partial<ArtistDraft>) => void;
  tagInput: string;
  setTagInput: (value: string) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
}) {
  return (
    <section className="grid gap-8 lg:grid-cols-2">
      <div>
        <h2 className="text-lg font-bold text-[#F5F5F7]">Social Links</h2>
        <p className="mt-1 text-sm text-[#A1A1AA]">Add links to the artist&apos;s social profiles.</p>
        <div className="mt-5 space-y-3">
          {draft.socialLinks.map((link) => (
            <div key={link.platform} className="grid grid-cols-[120px_minmax(0,1fr)_44px] items-center gap-3">
              <span className="text-sm font-semibold capitalize text-[#F5F5F7]">{link.platform}</span>
              <input
                value={link.url}
                onChange={(event) =>
                  patchDraft({
                    socialLinks: draft.socialLinks.map((item) =>
                      item.platform === link.platform ? { ...item, url: event.target.value } : item,
                    ),
                  })
                }
                placeholder={`https://${link.platform}.com/username`}
                className="h-11 rounded-lg border border-[#3F3F46] bg-[#0F0F17] px-3 text-sm text-[#F5F5F7] outline-none focus:border-[#8B5CF6]"
              />
              <a
                href={link.url || "#"}
                target="_blank"
                rel="noreferrer"
                className="flex size-11 items-center justify-center rounded-lg border border-[#232330] text-[#A1A1AA]"
              >
                <ExternalLink className="size-4" aria-hidden />
              </a>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-[#F5F5F7]">Tags</h2>
        <p className="mt-1 text-sm text-[#A1A1AA]">Add tags to help categorise and find this artist.</p>
        <input
          value={tagInput}
          onChange={(event) => setTagInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addTag(tagInput);
            }
          }}
          placeholder="Add a tag and press Enter..."
          className="mt-5 h-11 w-full rounded-lg border border-[#3F3F46] bg-[#0F0F17] px-3 text-sm text-[#F5F5F7] outline-none focus:border-[#8B5CF6]"
        />
        <h3 className="mt-5 text-sm font-semibold text-[#F5F5F7]">Popular Tags</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {[...new Set([...draft.tags, ...popularTags])].map((tag) => {
            const selected = draft.tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => (selected ? removeTag(tag) : addTag(tag))}
                className={[
                  "rounded-full border px-3 py-1.5 text-xs font-medium",
                  selected
                    ? "border-[#8B5CF6]/60 bg-[#2D2640] text-[#F5F5F7]"
                    : "border-[#232330] bg-[#0F0F17] text-[#A1A1AA] hover:text-white",
                ].join(" ")}
              >
                {tag} {selected ? "x" : "+"}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function DocumentsStep({
  pendingDocuments,
  selectedCategory,
  setSelectedCategory,
  onFiles,
  onRemove,
  onUpdateCategory,
  onRename,
  fileInputRef,
}: {
  pendingDocuments: PendingDocument[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  onFiles: (files: FileList | null) => void;
  onRemove: (id: string) => void;
  onUpdateCategory: (id: string, category: string) => void;
  onRename: (id: string, displayName: string) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
}) {
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);

  return (
    <section>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#F5F5F7]">Documents & Media</h2>
          <p className="mt-1 text-sm text-[#A1A1AA]">Upload important documents, logos, images, and assets related to this artist.</p>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-dashed border-[#8B5CF6]/60 bg-[#2D2640]/40 px-5 text-sm font-semibold text-[#C4B5FD]"
        >
          <Upload className="size-4" aria-hidden />
          Upload Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => onFiles(event.target.files)}
        />
      </div>

      <h3 className="mt-6 text-sm font-semibold text-[#F5F5F7]">Document Categories</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {documentCategories.map((category) => {
          const count = pendingDocuments.filter((document) => document.category === category).length;
          const selected = selectedCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={[
                "rounded-xl border p-5 text-center transition-colors",
                selected
                  ? "border-[#8B5CF6]/70 bg-[#2D2640]/60"
                  : "border-[#232330] bg-[#0F0F17] hover:border-[#8B5CF6]/50",
              ].join(" ")}
            >
              <FileText className="mx-auto size-6 text-[#C4B5FD]" aria-hidden />
              <p className="mt-3 text-sm font-semibold text-[#F5F5F7]">{category}</p>
              <p className="mt-1 text-xs text-[#A1A1AA]">{count} files</p>
            </button>
          );
        })}
      </div>

      <h3 className="mt-7 text-sm font-semibold text-[#F5F5F7]">Uploaded Files</h3>
      <div className="mt-3 w-full overflow-hidden rounded-xl border border-[#232330]">
        <table className="w-full table-fixed border-collapse">
          <thead className="bg-[#0F0F17] text-left text-xs uppercase tracking-wide text-[#71717A]">
            <tr>
              <th className="w-[34%] px-4 py-3">File Name</th>
              <th className="w-[22%] px-4 py-3">Category</th>
              <th className="w-[18%] px-4 py-3">Type</th>
              <th className="w-[14%] px-4 py-3">Size</th>
              <th className="w-[12%] px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingDocuments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#A1A1AA]">
                  Select a category and upload files to attach them when the artist is saved.
                </td>
              </tr>
            ) : (
              pendingDocuments.map((document) => (
                <tr key={document.id} className="border-t border-[#232330] text-sm text-[#E4E4E7]">
                  <td className="px-4 py-3">
                    {editingDocumentId === document.id ? (
                      <input
                        value={document.displayName}
                        onChange={(event) => onRename(document.id, event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") setEditingDocumentId(null);
                        }}
                        className="h-9 w-full rounded-md border border-[#8B5CF6] bg-[#11111A] px-2 text-sm text-[#F5F5F7] outline-none"
                        autoFocus
                      />
                    ) : (
                      <span className="block truncate">{document.displayName}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingDocumentId === document.id ? (
                      <select
                        value={document.category}
                        onChange={(event) => onUpdateCategory(document.id, event.target.value)}
                        className="h-9 rounded-md border border-[#3F3F46] bg-[#11111A] px-2 text-xs text-[#F5F5F7] outline-none focus:border-[#8B5CF6]"
                      >
                        {documentCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="rounded-md bg-[#2D2640] px-2 py-1 text-xs text-[#C4B5FD]">
                        {document.category}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="block truncate">{document.file.type || "File"}</span>
                  </td>
                  <td className="px-4 py-3">{formatBytes(document.file.size)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingDocumentId((current) =>
                            current === document.id ? null : document.id,
                          )
                        }
                        className="flex size-8 items-center justify-center rounded-md text-[#A1A1AA] hover:bg-[#232330] hover:text-white"
                        aria-label={`Edit ${document.displayName}`}
                      >
                        <Edit3 className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemove(document.id)}
                        className="flex size-8 items-center justify-center rounded-md text-[#A1A1AA] hover:bg-red-500/10 hover:text-red-300"
                        aria-label={`Delete ${document.displayName}`}
                      >
                        <X className="size-4" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function GenreInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (genres: string[]) => void;
}) {
  const [input, setInput] = useState("");
  const suggestions = useMemo(() => {
    const needle = input.trim().toLowerCase();
    if (!needle) return genreOptions.slice(0, 8);
    return genreOptions
      .filter((genre) => genre.toLowerCase().includes(needle) && !value.includes(genre))
      .slice(0, 8);
  }, [input, value]);

  function addGenre(genre: string) {
    const normalised = genre.trim();
    if (!normalised || value.some((item) => item.toLowerCase() === normalised.toLowerCase())) {
      return;
    }
    onChange([...value, normalised]);
    setInput("");
  }

  function removeGenre(genre: string) {
    onChange(value.filter((item) => item !== genre));
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[#F5F5F7]">
        Genre <span className="text-red-400">*</span>
      </label>
      <div className="rounded-lg border border-[#3F3F46] bg-[#0F0F17] p-2 transition-colors focus-within:border-[#8B5CF6]">
        <div className="flex min-h-[28px] flex-wrap gap-1.5">
          {value.map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => removeGenre(genre)}
              className="rounded-full border border-[#8B5CF6]/40 bg-[#2D2640] px-2.5 py-1 text-xs font-medium text-[#F5F5F7] hover:border-[#A855F7]"
            >
              {genre} x
            </button>
          ))}
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                addGenre(input);
              }
            }}
            placeholder={value.length > 0 ? "Add another genre..." : "House, Techno, Drum & Bass..."}
            className="min-w-[180px] flex-1 bg-transparent px-1 py-1 text-sm text-[#F5F5F7] outline-none placeholder:text-[#71717A]"
          />
        </div>
      </div>
      {input.trim() || suggestions.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {input.trim() ? (
            <button
              type="button"
              onClick={() => addGenre(input)}
              className="rounded-full border border-dashed border-[#8B5CF6]/60 px-2.5 py-1 text-xs text-[#C4B5FD] hover:bg-[#2D2640]"
            >
              Add "{input.trim()}"
            </button>
          ) : null}
          {suggestions.map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => addGenre(genre)}
              className="rounded-full border border-[#232330] bg-[#11111A] px-2.5 py-1 text-xs text-[#A1A1AA] hover:border-[#8B5CF6]/50 hover:text-white"
            >
              {genre}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CurrencyField({
  label,
  valueCents,
  onChange,
  helperText,
}: {
  label: string;
  valueCents: number;
  onChange: (valueCents: number) => void;
  helperText: string;
}) {
  const dollars = valueCents > 0 ? String(valueCents / 100) : "";
  const stepCents = 1_000;

  function setFromInput(value: string) {
    const numeric = value.replace(/[^\d.]/g, "");
    const [whole = "", ...decimalParts] = numeric.split(".");
    const decimal = decimalParts.join("").slice(0, 2);
    const cleaned = decimalParts.length > 0 ? `${whole}.${decimal}` : whole;
    onChange(Math.max(0, Math.round(Number(cleaned || 0) * 100)));
  }

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[#F5F5F7]">{label}</span>
      <div className="flex h-11 items-center rounded-lg border border-[#3F3F46] bg-[#11111A] px-3 focus-within:border-[#8B5CF6]">
        <DollarSign className="mr-2 size-4 shrink-0 text-[#A1A1AA]" aria-hidden />
        <input
          type="text"
          inputMode="decimal"
          pattern="[0-9]*\\.?[0-9]*"
          value={dollars}
          onChange={(event) => setFromInput(event.target.value)}
          onKeyDown={(event) => {
            const allowedKeys = [
              "Backspace",
              "Delete",
              "Tab",
              "Enter",
              "Escape",
              "ArrowLeft",
              "ArrowRight",
              "Home",
              "End",
            ];
            const isShortcut = event.ctrlKey || event.metaKey;
            const isNumber = /^[0-9]$/.test(event.key);
            const isDecimal = event.key === "." && !dollars.includes(".");
            if (!allowedKeys.includes(event.key) && !isShortcut && !isNumber && !isDecimal) {
              event.preventDefault();
            }
          }}
          placeholder={`Enter ${label.toLowerCase()}`}
          className="w-full bg-transparent text-sm text-[#F5F5F7] outline-none placeholder:text-[#71717A]"
        />
        <div className="ml-2 flex shrink-0 flex-col border-l border-[#3F3F46] pl-2">
          <button
            type="button"
            onClick={() => onChange(valueCents + stepCents)}
            className="flex h-4 w-5 items-center justify-center text-[#3F3F46] hover:text-[#8B5CF6]"
            aria-label={`Increase ${label} by $10`}
          >
            <ChevronUp className="size-3.5" strokeWidth={2.5} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => onChange(Math.max(0, valueCents - stepCents))}
            className="flex h-4 w-5 items-center justify-center text-[#3F3F46] hover:text-[#8B5CF6]"
            aria-label={`Decrease ${label} by $10`}
          >
            <ChevronDown className="size-3.5" strokeWidth={2.5} aria-hidden />
          </button>
        </div>
      </div>
      <span className="mt-1 block text-xs text-[#A1A1AA]">{helperText}</span>
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[#F5F5F7]">
        {label} {required ? <span className="text-red-400">*</span> : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-[#3F3F46] bg-[#0F0F17] px-3 text-sm text-[#F5F5F7] outline-none transition-colors placeholder:text-[#71717A] focus:border-[#8B5CF6]"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[#F5F5F7]">
        {label} {required ? <span className="text-red-400">*</span> : null}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-[#3F3F46] bg-[#0F0F17] px-3 text-sm text-[#F5F5F7] outline-none focus:border-[#8B5CF6]"
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function BioTextArea({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const words = countWords(value);
  const overLimit = words > MAX_ARTIST_BIO_WORDS;

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[#F5F5F7]">Bio</span>
      <textarea
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          if (countWords(next) <= MAX_ARTIST_BIO_WORDS) {
            onChange(next);
            return;
          }
          onChange(trimToMaxWords(next, MAX_ARTIST_BIO_WORDS));
        }}
        placeholder="Write a short bio about the artist..."
        className="min-h-[126px] w-full resize-none rounded-lg border border-[#3F3F46] bg-[#0F0F17] px-3 py-3 text-sm text-[#F5F5F7] outline-none placeholder:text-[#71717A] focus:border-[#8B5CF6]"
      />
      <span
        className={[
          "mt-1 block text-right text-xs",
          overLimit ? "text-red-300" : "text-[#71717A]",
        ].join(" ")}
      >
        {words}/{MAX_ARTIST_BIO_WORDS} words
      </span>
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  compact = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  maxLength: number;
  compact?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[#F5F5F7]">{label}</span>
      <textarea
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`w-full resize-none rounded-lg border border-[#3F3F46] bg-[#0F0F17] px-3 py-3 text-sm text-[#F5F5F7] outline-none placeholder:text-[#71717A] focus:border-[#8B5CF6] ${
          compact ? "min-h-[92px]" : "min-h-[126px]"
        }`}
      />
      <span className="mt-1 block text-right text-xs text-[#71717A]">
        {value.length}/{maxLength}
      </span>
    </label>
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
        <UserRound className="mx-auto size-10 text-[#8B5CF6]" aria-hidden />
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

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
