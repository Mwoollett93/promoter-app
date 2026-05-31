"use client";

import * as React from "react";

import { usePrefersReducedMotion } from "@/app/components/marketing/landing/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

type ScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Stagger delay in ms — use on siblings for sequential fade-up. */
  delay?: number;
  as?: "div" | "section" | "li" | "article" | "blockquote";
};

/**
 * Fade-up on scroll via IntersectionObserver.
 * Instant visibility when reduced motion is preferred (no hidden-then-animate flash).
 */
export function ScrollReveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: ScrollRevealProps) {
  const reducedMotion = usePrefersReducedMotion();
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(reducedMotion);

  React.useEffect(() => {
    if (reducedMotion) {
      setVisible(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <Tag
      ref={ref as React.RefObject<never>}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none",
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
        className,
      )}
      style={reducedMotion ? undefined : { transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

type StaggerGroupProps = {
  children: React.ReactNode;
  className?: string;
  /** Base delay between each child in ms. */
  stagger?: number;
  as?: "div" | "ul";
};

/** Wraps children in ScrollReveal with incremental delay for staggered entrances. */
export function StaggerGroup({
  children,
  className,
  stagger = 80,
  as: Tag = "div",
}: StaggerGroupProps) {
  const items = React.Children.toArray(children);

  return (
    <Tag className={className}>
      {items.map((child, index) => (
        <ScrollReveal key={index} delay={index * stagger}>
          {child}
        </ScrollReveal>
      ))}
    </Tag>
  );
}
