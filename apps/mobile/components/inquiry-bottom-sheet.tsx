import { View, Text, Pressable, TextInput, Modal, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui/button';
import { useSendInquiry } from '@/hooks/api/use-vendors';

interface InquiryBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  vendorId: string;
  vendorName: string;
}

const BUDGET_OPTIONS = [
  '$0 - $1,000',
  '$1,000 - $5,000',
  '$5,000 - $10,000',
  '$10,000 - $25,000',
  '$25,000+',
];

export function InquiryBottomSheet({
  visible,
  onClose,
  vendorId,
  vendorName,
}: InquiryBottomSheetProps) {
  const { t } = useTranslation();
  const sendInquiry = useSendInquiry();
  const [eventDate, setEventDate] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [message, setMessage] = useState('');
  const [budgetRange, setBudgetRange] = useState('');

  const handleSubmit = async () => {
    if (!message.trim()) return;

    try {
      await sendInquiry.mutateAsync({
        vendorId,
        eventDate: eventDate || undefined,
        guestCount: guestCount ? parseInt(guestCount, 10) : undefined,
        message: message.trim(),
        budgetRange: budgetRange || undefined,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('', t('vendor.inquirySent'));
      resetForm();
      onClose();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const resetForm = () => {
    setEventDate('');
    setGuestCount('');
    setMessage('');
    setBudgetRange('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[90%] rounded-t-3xl bg-surface pb-8">
          {/* Handle bar */}
          <View className="items-center py-3">
            <View className="h-1 w-10 rounded-full bg-border" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-4 pb-3">
            <View>
              <Text className="text-lg font-bold text-content">{t('vendor.requestQuote')}</Text>
              <Text className="text-sm text-content-secondary">{vendorName}</Text>
            </View>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#495057" />
            </Pressable>
          </View>

          <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
            {/* Event Date */}
            <Text className="mb-1 text-sm font-medium text-content">
              {t('vendor.eventDate')}
            </Text>
            <TextInput
              className="mb-3 rounded-input border border-border bg-surface px-4 py-3 text-content"
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#868e96"
              value={eventDate}
              onChangeText={setEventDate}
            />

            {/* Guest Count */}
            <Text className="mb-1 text-sm font-medium text-content">
              {t('vendor.guestCount')}
            </Text>
            <TextInput
              className="mb-3 rounded-input border border-border bg-surface px-4 py-3 text-content"
              placeholder="150"
              placeholderTextColor="#868e96"
              keyboardType="numeric"
              value={guestCount}
              onChangeText={setGuestCount}
            />

            {/* Budget Range */}
            <Text className="mb-2 text-sm font-medium text-content">
              {t('vendor.budgetRange')}
            </Text>
            <View className="mb-3 flex-row flex-wrap">
              {BUDGET_OPTIONS.map((option) => {
                const isSelected = budgetRange === option;
                return (
                  <Pressable
                    key={option}
                    className={`mb-2 mr-2 rounded-full px-3 py-1.5 ${
                      isSelected ? 'bg-brand-600' : 'bg-surface-secondary'
                    }`}
                    onPress={() => setBudgetRange(isSelected ? '' : option)}
                  >
                    <Text
                      className={`text-sm ${
                        isSelected ? 'font-semibold text-content-inverse' : 'text-content'
                      }`}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Message */}
            <Text className="mb-1 text-sm font-medium text-content">{t('vendor.message')}</Text>
            <TextInput
              className="mb-4 rounded-input border border-border bg-surface px-4 py-3 text-content"
              placeholder={t('vendor.message')}
              placeholderTextColor="#868e96"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ minHeight: 100 }}
              value={message}
              onChangeText={setMessage}
            />
          </ScrollView>

          {/* Submit */}
          <View className="px-4 pt-3">
            <Button
              title={t('vendor.sendInquiry')}
              onPress={handleSubmit}
              loading={sendInquiry.isPending}
              disabled={!message.trim()}
              haptic="medium"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
