import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0B0B10] text-[#F5F5F7] p-10">
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-3xl font-bold">PromoSync</h1>
        <p className="text-[#A1A1AA]">Build in progress.</p>

        <Link
          href="/event-wizard/event-basics"
          className="inline-flex h-11 items-center rounded-lg border border-[#71717A] px-5 text-sm hover:border-[#8B5CF6]"
        >
          Go to Event Wizard
        </Link>
      </div>
    </main>
  );
}