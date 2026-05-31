import { GRID_CARD_GAP, PAGE_STACK_GAP } from "@/lib/layout/page-layout";
import { SECTION_CARD } from "@/lib/ui/page-surfaces";

function SkeletonBar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-[#232330] ${className}`} aria-hidden />;
}

export default function DashboardLoadingSkeleton() {
  return (
    <div
      className={`flex min-h-0 flex-1 flex-col ${PAGE_STACK_GAP} overflow-hidden`}
      role="status"
      aria-label="Loading dashboard"
      aria-busy="true"
    >
      <div className={`grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4 ${GRID_CARD_GAP}`}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className={`${SECTION_CARD} p-4`}>
            <SkeletonBar className="h-3 w-16" />
            <SkeletonBar className="mt-3 h-7 w-12" />
            <SkeletonBar className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>

      <section className={`grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-3 lg:items-stretch ${GRID_CARD_GAP}`}>
        <div className={`flex min-h-0 flex-col ${SECTION_CARD} p-4 lg:col-span-2`}>
          <div className="mb-4 flex items-center justify-between gap-2">
            <SkeletonBar className="h-4 w-36" />
            <SkeletonBar className="h-4 w-24" />
          </div>
          <div className={`flex min-h-0 flex-1 flex-col ${PAGE_STACK_GAP}`}>
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonBar key={index} className="h-[72px] w-full shrink-0 rounded-lg" />
            ))}
          </div>
        </div>

        <div className={`flex min-h-0 flex-col ${SECTION_CARD} p-4`}>
          <SkeletonBar className="h-4 w-28" />
          <SkeletonBar className="mt-4 h-[100px] w-full rounded-lg" />
          <div className="mt-4 space-y-3">
            <SkeletonBar className="h-3 w-full" />
            <SkeletonBar className="h-3 w-4/5" />
            <SkeletonBar className="h-3 w-3/5" />
          </div>
        </div>
      </section>
    </div>
  );
}
