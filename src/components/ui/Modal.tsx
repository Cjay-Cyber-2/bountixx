"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { backdropVariants, modalVariants } from "@/lib/animations";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizeMap = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };

export function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 z-50 bg-cosmos/80 backdrop-blur-sm"
          />
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? "modal-title" : undefined}
              className={`
                pointer-events-auto w-full ${sizeMap[size]}
                bg-cosmos-3 border border-cosmos-4 clip-arena
              `}
            >
              {title && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-cosmos-4">
                  <h2
                    id="modal-title"
                    className="font-orbitron font-bold text-lg text-haze tracking-wide"
                  >
                    {title}
                  </h2>
                  <button
                    onClick={onClose}
                    className="cursor-target text-haze-3 hover:text-void transition-colors"
                    aria-label="Close modal"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
              <div className="p-6">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
