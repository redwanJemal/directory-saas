import {
  Pressable,
  Text,
  ActivityIndicator,
  type PressableProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { haptics } from '@/lib/haptics';
import { springConfig } from '@/lib/animations';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  loading?: boolean;
  haptic?: 'light' | 'medium' | 'heavy' | 'none';
}

const variantStyles = {
  primary: { container: 'bg-brand-600', text: 'text-content-inverse' },
  secondary: {
    container: 'bg-surface-secondary',
    text: 'text-content',
  },
  outline: {
    container: 'border border-border bg-transparent',
    text: 'text-content',
  },
  danger: { container: 'bg-danger-500', text: 'text-content-inverse' },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  title,
  variant = 'primary',
  loading,
  haptic = 'light',
  onPress,
  disabled,
  ...props
}: ButtonProps) {
  const styles = variantStyles[variant];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, springConfig.stiff);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig.gentle);
  };

  const handlePress = (
    e: Parameters<NonNullable<PressableProps['onPress']>>[0],
  ) => {
    if (haptic === 'light') haptics.light();
    else if (haptic === 'medium') haptics.medium();
    else if (haptic === 'heavy') haptics.heavy();
    onPress?.(e);
  };

  return (
    <AnimatedPressable
      className={`rounded-button px-6 py-3.5 ${styles.container} ${
        disabled || loading ? 'opacity-50' : ''
      }`}
      style={animatedStyle}
      disabled={disabled || loading}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary' || variant === 'danger' ? '#fff' : '#4c6ef5'
          }
        />
      ) : (
        <Text
          className={`text-center text-base font-semibold ${styles.text}`}
        >
          {title}
        </Text>
      )}
    </AnimatedPressable>
  );
}
