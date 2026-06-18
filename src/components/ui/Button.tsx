"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useMagneticButton } from "@/hooks/useMagneticButton";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  magnetic?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses = {
  primary:
    "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] font-semibold hover:bg-[var(--btn-primary-hover)] shadow-sm",
  secondary:
    "bg-transparent border border-[var(--border-accent)] text-[var(--accent)] font-semibold hover:bg-[var(--void-tint)]",
  ghost:
    "bg-transparent text-haze-2 font-medium hover:text-haze hover:bg-[var(--surface-hover)]",
  danger:
    "bg-[var(--void-tint)] border border-[var(--border-accent)] text-[var(--accent)] font-semibold hover:bg-[var(--void-tint-hover)]",
};

const sizeClasses = {
  sm: "h-9 px-4 text-sm rounded-lg",
  md: "h-11 px-6 text-sm rounded-xl",
  lg: "h-12 px-8 text-base rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      magnetic = false,
      loading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const magneticHook = useMagneticButton(0.22);

    const combinedRef = (el: HTMLButtonElement | null) => {
      if (magnetic) {
        (magneticHook.ref as React.MutableRefObject<HTMLElement | null>).current = el;
      }
      if (typeof ref === "function") ref(el);
      else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = el;
    };

    return (
      <button
        ref={combinedRef}
        className={cn(
          "cursor-target relative inline-flex items-center justify-center gap-2",
          "transition-[background-color,border-color,color,box-shadow,transform] duration-300 select-none",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
          "active:scale-[0.98]",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        disabled={disabled || loading}
        onMouseMove={magnetic ? magneticHook.onMouseMove : undefined}
        onMouseLeave={magnetic ? magneticHook.onMouseLeave : undefined}
        {...props}
      >
        {loading ? (
          <>
            <span className="spinner scale-75" />
            <span className="opacity-70">{children}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";
