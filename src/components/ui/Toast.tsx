"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info, Coins } from "lucide-react";
import { slideRight } from "@/lib/animations";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info" | "coins" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (opts: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
}

const toastConfig: Record<ToastType, { border: string; icon: React.ReactNode }> = {
  success: { border: "border-l-success", icon: <CheckCircle size={16} className="text-success shrink-0" /> },
  error:   { border: "border-l-danger",  icon: <AlertCircle size={16} className="text-danger shrink-0" /> },
  warning: { border: "border-l-crown",   icon: <AlertCircle size={16} className="text-crown shrink-0" /> },
  info:    { border: "border-l-void",    icon: <Info size={16} className="text-void shrink-0" /> },
  coins:   { border: "border-l-crown",   icon: <Coins size={16} className="text-crown shrink-0" /> },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, toast.duration ?? 4000);
    return () => clearTimeout(t);
  }, [toast.duration, onDismiss]);

  const { border, icon } = toastConfig[toast.type];

  return (
    <motion.div
      layout
      variants={slideRight}
      initial="hidden"
      animate="show"
      exit="exit"
      className={cn(
        "flex items-start gap-3 p-4 w-full sm:w-auto sm:min-w-[300px] sm:max-w-[380px]",
        "bg-cosmos-2 border border-cosmos-4 border-l-4",
        border
      )}
      role="alert"
    >
      {icon}
      <div className="flex-1 min-w-0">
        <p className="font-rajdhani font-semibold text-sm text-haze leading-none">{toast.title}</p>
        {toast.message && (
          <p className="font-rajdhani text-xs text-haze-2 mt-1 leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-haze-3 hover:text-haze transition-colors shrink-0"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((opts: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev.slice(-2), { ...opts, id }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:right-6 z-[9999] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onDismiss={() => dismiss(t.id)} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
