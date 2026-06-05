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
    "bg-ignite text-black font-rajdhani font-bold tracking-widest hover:brightness-110 active:brightness-90",
  secondary:
    "bg-transparent border border-ignite/50 text-haze font-rajdhani font-bold tracking-widest hover:bg-ignite/10 hover:border-ignite",
  ghost:
    "bg-transparent text-haze-2 font-rajdhani font-semibold hover:text-haze hover:bg-cosmos-3",
  danger:
    "bg-danger/10 border border-danger/50 text-danger font-rajdhani font-bold tracking-widest hover:bg-danger/20",
};

const sizeClasses = {
  sm: "h-9 px-5 text-sm",
  md: "h-12 px-8 text-base",
  lg: "h-14 px-10 text-lg",
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
    const magneticHook = useMagneticButton(0.28);

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
          "cursor-target relative inline-flex items-center justify-center gap-2 clip-arena",
          "transition-all duration-200 select-none",
          "disabled:opacity-40 disabled:cursor-not-allowed",
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
