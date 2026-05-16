export const pageTransition = {
  type: 'tween',
  duration: 0.18,
  ease: 'easeOut',
} as const

export const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: pageTransition,
}

export const listItemMotion = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, height: 0 },
  transition: { duration: 0.16, ease: 'easeOut' },
} as const
