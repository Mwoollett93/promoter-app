import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const baseClasses =
  "inline-flex items-center justify-center rounded-[8px] border transition-all duration-150 disabled:cursor-not-allowed font-medium text-[16px] leading-[20px] tracking-[0.08px]";

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-10 px-6",
  md: "h-11 px-[50px]", // Figma base: 44px height + 50px horizontal
  lg: "h-12 px-14",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    // Default
    "bg-[#7C3AED] text-white border-[rgba(139,92,246,0.45)]",
    // Hover
    "hover:border-[#A855F7] hover:shadow-[0_0_24px_0_rgba(139,92,246,0.3)]",
    "hover:bg-[linear-gradient(178.683deg,#7C3AED_4.7705%,rgba(71,33,135,0.76)_96.232%)]",
    // Pressed
    "active:bg-[rgba(124,58,237,0.44)] active:border-[rgba(139,92,246,0.7)] active:shadow-none",
    // Disabled
    "disabled:bg-[rgba(124,58,237,0.3)] disabled:border-[rgba(139,92,246,0.2)] disabled:text-[rgba(255,255,255,0.3)] disabled:shadow-none",
  ].join(" "),

  secondary: [
    "bg-[rgba(139,92,246,0.16)] text-[#8B5CF6] border-[#8B5CF6]",
    "hover:text-[#A855F7] hover:border-[#A855F7]",
    "active:bg-[rgba(139,92,246,0.3)] active:text-[#8B5CF6] active:border-[#8B5CF6]",
    "disabled:bg-[rgba(139,92,246,0.16)] disabled:border-[rgba(139,92,246,0.16)] disabled:text-[rgba(139,92,246,0.16)]",
  ].join(" "),

  ghost: [
    "bg-transparent text-[#A1A1AA] border-[#71717A]",
    "hover:border-[rgba(35,35,48,0.9)]",
    "active:bg-[rgba(35,35,48,0.3)] active:border-[#A1A1AA]",
    "disabled:border-[rgba(35,35,48,0.3)] disabled:text-[rgba(161,161,170,0.6)] disabled:bg-transparent",
  ].join(" "),

  danger: [
    "bg-[rgba(239,68,68,0.15)] text-[#F87171] border-[#F87171]",
    "hover:bg-[rgba(239,68,68,0.2)] hover:border-[#F87171]",
    "active:bg-[rgba(239,68,68,0.05)] active:border-[rgba(248,113,113,0.7)] active:text-[rgba(248,113,113,0.7)]",
    "disabled:bg-[rgba(239,68,68,0.15)] disabled:border-[rgba(248,113,113,0.3)] disabled:text-[rgba(248,113,113,0.3)]",
  ].join(" "),
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={[baseClasses, sizeClasses[size], variantClasses[variant], className].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}