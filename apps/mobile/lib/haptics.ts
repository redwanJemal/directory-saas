import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const isNative = Platform.OS !== 'web';

export const haptics = {
  /** Light tap — button presses, tab switches, chip selections, filter applied */
  light: () => {
    if (isNative) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  /** Medium tap — form submit, swipe actions, important interactions */
  medium: () => {
    if (isNative) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  /** Heavy tap — destructive actions (delete, cancel, logout) */
  heavy: () => {
    if (isNative) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  /** Success — booking confirmed, task completed, save successful */
  success: () => {
    if (isNative)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  /** Warning — validation error, rate limit */
  warning: () => {
    if (isNative)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  /** Error — login failed, API error, network error */
  error: () => {
    if (isNative)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  /** Selection tick — checkbox, radio, toggle, language change */
  selection: () => {
    if (isNative) Haptics.selectionAsync();
  },
};
