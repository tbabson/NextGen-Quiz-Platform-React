/** Shared Framer Motion presets. */

export const pageMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

export const stagger = (step = 0.06, delay = 0) => ({
  animate: { transition: { staggerChildren: step, delayChildren: delay } },
});

export const rise = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } },
};
