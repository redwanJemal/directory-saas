import { View, type DimensionValue } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  className?: string;
}

export function Skeleton({ width, height = 20, borderRadius = 8, className }: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.7, { duration: 800 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      className={`bg-surface-tertiary ${className || ''}`}
      style={[{ width: width as number | undefined, height, borderRadius }, animatedStyle]}
    />
  );
}

export function VendorCardSkeleton() {
  return (
    <View className="mb-3 overflow-hidden rounded-card border border-border bg-surface">
      <Skeleton height={160} borderRadius={0} width="100%" />
      <View className="p-3">
        <Skeleton width="70%" height={18} />
        <Skeleton width="40%" height={14} className="mt-2" />
        <Skeleton width="50%" height={14} className="mt-1" />
        <View className="mt-2 flex-row justify-between">
          <Skeleton width="30%" height={14} />
          <Skeleton width="25%" height={14} />
        </View>
      </View>
    </View>
  );
}

export function CompactVendorCardSkeleton() {
  return (
    <View className="mr-3 w-56 overflow-hidden rounded-card border border-border bg-surface">
      <Skeleton height={112} borderRadius={0} width="100%" />
      <View className="p-2.5">
        <Skeleton width="80%" height={14} />
        <Skeleton width="50%" height={12} className="mt-1" />
        <Skeleton width="40%" height={12} className="mt-1" />
      </View>
    </View>
  );
}

export function CategorySkeleton() {
  return (
    <View className="mr-3 items-center">
      <Skeleton width={56} height={56} borderRadius={28} />
      <Skeleton width={48} height={12} className="mt-2" borderRadius={4} />
    </View>
  );
}
