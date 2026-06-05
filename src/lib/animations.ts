/* Framer Motion variant presets used across Bountixx */
import type { Variants } from "framer-motion";

/* ─── Page transition ─── */
export const pageVariants: Variants = {
  hidden:  { opacity: 0, y: 16 },
  enter:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -12, transition: { duration: 0.25 } },
};

/* ─── Stagger container ─── */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

/* ─── Stagger child: slide up ─── */
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 44 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

/* ─── Stagger child: slide in from left ─── */
export const slideLeft: Variants = {
  hidden: { opacity: 0, x: -32 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

/* ─── Fade in ─── */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.4 } },
};

/* ─── Scale pop (for badges, rewards) ─── */
export const scalePop: Variants = {
  hidden:  { opacity: 0, scale: 0.6 },
  show:    { opacity: 1, scale: 1, transition: { type: "spring", damping: 14, stiffness: 280 } },
  exit:    { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
};

/* ─── Slide in from right (toast) ─── */
export const slideRight: Variants = {
  hidden: { opacity: 0, x: 80 },
  show:   { opacity: 1, x: 0, transition: { type: "spring", damping: 20, stiffness: 300 } },
  exit:   { opacity: 0, x: 80, transition: { duration: 0.22 } },
};

/* ─── Modal ─── */
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 16 },
  show:   { opacity: 1, scale: 1,    y: 0,  transition: { type: "spring", damping: 20, stiffness: 320 } },
  exit:   { opacity: 0, scale: 0.94, y: 12, transition: { duration: 0.2 } },
};

/* ─── Backdrop ─── */
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.22 } },
  exit:   { opacity: 0, transition: { duration: 0.2 } },
};

/* ─── Word stagger (hero title) ─── */
export const wordContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.6 } },
};
export const wordChild: Variants = {
  hidden: { opacity: 0, y: 80 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
};

/* ─── Winner sequence ─── */
export const winnerReveal: Variants = {
  hidden: { opacity: 0, scale: 0.55, rotate: -6 },
  show: {
    opacity: 1, scale: 1, rotate: 0,
    transition: { type: "spring", damping: 12, stiffness: 220, delay: 0.5 },
  },
};
