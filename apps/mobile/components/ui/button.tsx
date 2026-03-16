import {
  Pressable,
  Text,
  ActivityIndicator,
  type PressableProps,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  loading?: boolean;
  haptic?: 'light' | 'medium' | 'heavy';
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

  const handlePress = (e: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
    if (haptic === 'light')
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (haptic === 'medium')
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else if (haptic === 'heavy')
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onPress?.(e);
  };

  return (
    <Pressable
      className={`rounded-button px-6 py-3.5 ${styles.container} ${
        disabled || loading ? 'opacity-50' : 'active:opacity-80'
      }`}
      disabled={disabled || loading}
      onPress={handlePress}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? '#fff' : '#4c6ef5'}
        />
      ) : (
        <Text className={`text-center text-base font-semibold ${styles.text}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
