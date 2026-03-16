import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BookingStatus } from '@/hooks/api/use-bookings';

interface StatusTimelineProps {
  currentStatus: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

const TIMELINE_STEPS: { status: BookingStatus; key: string }[] = [
  { status: 'INQUIRY', key: 'bookings.status.inquiry' },
  { status: 'QUOTED', key: 'bookings.status.quoted' },
  { status: 'BOOKED', key: 'bookings.status.booked' },
  { status: 'COMPLETED', key: 'bookings.status.completed' },
];

const STATUS_ORDER: Record<BookingStatus, number> = {
  INQUIRY: 0,
  QUOTED: 1,
  BOOKED: 2,
  COMPLETED: 3,
  CANCELLED: -1,
};

export function StatusTimeline({ currentStatus, createdAt, updatedAt }: StatusTimelineProps) {
  const { t } = useTranslation();
  const currentIndex = STATUS_ORDER[currentStatus];
  const isCancelled = currentStatus === 'CANCELLED';

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });

  if (isCancelled) {
    return (
      <View className="px-4 py-3">
        <View className="flex-row items-center">
          <View className="h-4 w-4 rounded-full bg-danger-500" />
          <Text className="ml-3 text-sm font-semibold text-danger-700">
            {t('bookings.status.cancelled')}
          </Text>
          <Text className="ml-auto text-xs text-content-tertiary">
            {formatDate(updatedAt)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="px-4 py-3">
      {TIMELINE_STEPS.map((step, index) => {
        const isReached = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === TIMELINE_STEPS.length - 1;

        return (
          <View key={step.status} className="flex-row">
            {/* Dot + Line */}
            <View className="items-center">
              <View
                className={`h-4 w-4 rounded-full ${
                  isCurrent
                    ? 'bg-brand-600'
                    : isReached
                      ? 'bg-success-500'
                      : 'bg-surface-tertiary'
                }`}
              />
              {!isLast && (
                <View
                  className={`w-0.5 flex-1 ${
                    index < currentIndex ? 'bg-success-500' : 'bg-surface-tertiary'
                  }`}
                  style={{ minHeight: 32 }}
                />
              )}
            </View>

            {/* Label */}
            <View className="ml-3 pb-4">
              <Text
                className={`text-sm font-medium ${
                  isCurrent
                    ? 'text-brand-600'
                    : isReached
                      ? 'text-content'
                      : 'text-content-tertiary'
                }`}
              >
                {t(step.key)}
              </Text>
              {index === 0 && (
                <Text className="mt-0.5 text-xs text-content-tertiary">
                  {formatDate(createdAt)}
                </Text>
              )}
              {isCurrent && index > 0 && (
                <Text className="mt-0.5 text-xs text-content-tertiary">
                  {formatDate(updatedAt)}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
