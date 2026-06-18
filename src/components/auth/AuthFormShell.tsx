"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { BountixxLogo } from "@/components/BountixxLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { staggerContainer, slideUp } from "@/lib/animations";
import { cn } from "@/lib/utils";

export function AuthLegacyPanel({ children }: { children: React.ReactNode }) {
  return <div data-legacy-aesthetic className="hidden lg:block">{children}</div>;
}

export function AuthFormShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-center px-6 py-16 relative min-h-screen bg-cosmos">
      <div className="absolute top-5 left-5 right-5 flex items-center justify-between z-10">
        <Link
          href="/"
          className="cursor-target flex items-center gap-2 text-sm font-medium text-haze-2 hover:text-haze transition-colors group rounded-lg px-3 py-2 hover:bg-[var(--surface-hover)]"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          Back
        </Link>
        <ThemeToggle />
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="w-full max-w-[420px] pt-10"
      >
        <motion.div variants={slideUp} className="lg:hidden flex justify-center mb-8">
          <BountixxLogo size={44} showWordmark />
        </motion.div>

        <motion.p variants={slideUp} className="text-xs font-medium text-plum mb-2">
          {eyebrow}
        </motion.p>

        <motion.div variants={slideUp}>
          <h1 className="font-display text-3xl text-haze mb-2 text-balance">{title}</h1>
          <p className="text-sm text-haze-2 mb-8 leading-relaxed">{subtitle}</p>
        </motion.div>

        {children}

        {footer && (
          <motion.div variants={slideUp} className="text-sm text-haze-2 text-center mt-8">
            {footer}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export function OAuthButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="cursor-target flex items-center justify-center gap-3 h-11 w-full rounded-xl border border-[var(--border-2)] bg-[var(--surface-inset)] text-haze font-medium text-sm hover:border-[var(--border-accent)] hover:bg-[var(--surface-hover)] transition-[background-color,border-color,color] duration-300 disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function AuthDivider() {
  return (
    <div className="flex items-center gap-3 my-6">
      <span className="flex-1 h-px bg-[var(--border-1)]" />
      <span className="text-xs text-haze-3 font-medium">or</span>
      <span className="flex-1 h-px bg-[var(--border-1)]" />
    </div>
  );
}

export function MethodTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; icon: React.ReactNode }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex mb-6 p-1 rounded-xl bg-[var(--surface-inset)] border border-[var(--border-1)]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-medium transition-all",
            active === tab.id
              ? "bg-[var(--surface-raised)] text-haze shadow-sm border border-[var(--border-2)]"
              : "text-haze-3 hover:text-haze-2"
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function AuthError({ message }: { message: string }) {
  return <p className="text-sm text-danger">{message}</p>;
}

export function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853" />
      <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

export function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
