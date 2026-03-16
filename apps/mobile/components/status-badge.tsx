import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BookingStatus } from '@/hooks/api/use-bookings';

interface StatusBadgeProps {
  status: BookingStatus;
}

const statusStyles: Record<BookingStatus, { bg: string; text: string }> = {
  INQUIRY: { bg: 'bg-info-50', text: 'text-info-700' },
  QUOTED: { bg: 'bg-warning-50', text: 'text-warning-700' },
  BOOKED: { bg: 'bg-success-50', text: 'text-success-700' },
  COMPLETED: { bg: 'bg-surface-tertiary', text: 'text-content-secondary' },
  CANCELLED: { bg: 'bg-danger-50', text: 'text-danger-700' },
};

const statusKeys: Record<BookingStatus, string> = {
  INQUIRY: 'bookings.status.inquiry',
  QUOTED: 'bookings.status.quoted',
  BOOKED: 'bookings.status.booked',
  COMPLETED: 'bookings.status.completed',
  CANCELLED: 'bookings.status.cancelled',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation();
  const style = statusStyles[status];

  return (
    <View className={`rounded-full px-2.5 py-1 ${style.bg}`}>
      <Text className={`text-xs font-semibold ${style.text}`}>
        {t(statusKeys[status])}
      </Text>
    </View>
  );
}
