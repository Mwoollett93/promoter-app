import type { CSSProperties, ReactNode } from "react";

import { pageContentClass } from "@/lib/layout/page-layout";

type PageContentProps = {
  children: ReactNode;
  className?: string;
  maxWidth?: number;
  fill?: boolean;
};

export default function PageContent({
  children,
  className = "",
  maxWidth,
  fill = false,
}: PageContentProps) {
  const style: CSSProperties | undefined =
    !fill && maxWidth
      ? { maxWidth: `${maxWidth}px`, marginLeft: "auto", marginRight: "auto" }
      : undefined;

  return (
    <div
      className={pageContentClass(
        fill ? `w-full max-w-none ${className}`.trim() : className,
        { fill },
      )}
      style={style}
    >
      {children}
    </div>
  );
}
