import DashboardShowcase from "@/app/components/marketing/DashboardShowcase";

/** @deprecated Use DashboardShowcase — kept for existing dynamic imports. */
export default function ProductShowcase(props: { variant?: "hero" | "compact" }) {
  return <DashboardShowcase {...props} />;
}
