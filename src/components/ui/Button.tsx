import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./ui.css";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "quiet";
  size?: "md" | "lg";
  arrow?: boolean;
  loading?: boolean;
  children: ReactNode;
};

export function ArrowIcon() {
  return (
    <svg className="btn__arrow" width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden="true">
      <path d="M0 6h16M11 1l5 5-5 5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  arrow = false,
  loading = false,
  disabled,
  className = "",
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`btn btn--${variant} btn--${size} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      <span className="btn__label">{children}</span>
      {loading ? <span className="btn__dots" aria-hidden="true"><i /><i /><i /></span> : arrow && <ArrowIcon />}
    </button>
  );
}
