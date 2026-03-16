import {
  withSpring,
  withTiming,
  withRepeat,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  FadeInDown,
  FadeInUp,
  Layout,
} from 'react-native-reanimated';

// Spring configs
export const springConfig = {
  gentle: { damping: 20, stiffness: 150 },
  bouncy: { damping: 12, stiffness: 200 },
  stiff: { damping: 25, stiffness: 300 },
};

// Entering animations for list items (staggered)
export const staggeredFadeIn = (index: number) =>
  FadeInDown.delay(index * 60)
    .springify()
    .damping(18)
    .stiffness(150);

// Screen transition presets
export const screenTransitions = {
  fadeIn: FadeIn.duration(200),
  fadeOut: FadeOut.duration(150),
  slideIn: SlideInRight.springify().damping(20),
  slideOut: SlideOutLeft.duration(200),
};

// Layout animation for list reordering
export const listLayout = Layout.springify().damping(18).stiffness(150);

// Bottom sheet entering/exiting
export const bottomSheetEntering = FadeInUp.springify().damping(20);
export const bottomSheetExiting = FadeOut.duration(150);

// Shimmer animation helpers
export { withRepeat, withTiming, withSpring };
