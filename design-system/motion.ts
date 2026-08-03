export const motion = {
  duration: { press: 120, control: 180, overlay: 260, page: 400 },
  easing: { standard: [0.2, 0, 0.1, 1], enter: [0, 0, 0.15, 1], exit: [0.4, 0, 1, 1] },
  spring: { damping: 24, stiffness: 260, mass: 0.9 },
} as const;
