import * as Haptics from 'expo-haptics';

export const haptics = {
  selection: () => Haptics.selectionAsync().catch(() => undefined),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined),
  impact: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined)
};
