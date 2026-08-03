export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const shell = {
  canvasMaxWidth: 768,
  tabBarMaxWidth: 520,
  navigationBreakpoint: 960,
  sideRailWidth: 72,
  tabBarHeight: 64,
  tabBarBottomGap: 12,
  horizontalInset: 16,
  fabHeight: 52,
  fabGap: 12,
  contentBreathingRoom: 20,
  toastMaxWidth: 560,
} as const;

export const tabShellInset = (safeBottom: number) => safeBottom + shell.tabBarBottomGap + shell.tabBarHeight;
export const tabContentInset = (safeBottom: number) => tabShellInset(safeBottom) + shell.contentBreathingRoom;
