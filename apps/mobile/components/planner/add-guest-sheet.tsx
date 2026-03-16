import { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateGuest } from '@/hooks/api/use-guests';

interface AddGuestSheetProps {
  visible: boolean;
  onClose: () => void;
}

const GuestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  side: z.enum(['bride', 'groom', 'both']),
  relationship: z.string().min(1),
});

const SIDES = ['bride', 'groom', 'both'] as const;

const RELATIONSHIPS = [
  'family',
  'friend',
  'colleague',
  'neighbor',
  'other',
];

export function AddGuestSheet({ visible, onClose }: AddGuestSheetProps) {
  const { t } = useTranslation();
  const createGuest = useCreateGuest();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [side, setSide] = useState<'bride' | 'groom' | 'both'>('both');
  const [relationship, setRelationship] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    const result = GuestSchema.safeParse({ name, email, phone, side, relationship });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = t('errors.validationError');
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      await createGuest.mutateAsync({
        name: name.trim(),
        email: email || null,
        phone: phone || null,
        side,
        relationship,
        rsvpStatus: 'pending',
        mealChoice: null,
        plusOne: false,
        events: [],
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetAndClose();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const resetAndClose = () => {
    setName('');
    setEmail('');
    setPhone('');
    setSide('both');
    setRelationship('');
    setErrors({});
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={resetAndClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[85%] rounded-t-3xl bg-surface pb-8">
          <View className="items-center py-3">
            <View className="h-1 w-10 rounded-full bg-border" />
          </View>

          <View className="flex-row items-center justify-between px-4 pb-3">
            <Text className="text-lg font-bold text-content">{t('guests.addGuest')}</Text>
            <Pressable onPress={resetAndClose}>
              <Ionicons name="close" size={24} color="#495057" />
            </Pressable>
          </View>

          <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
            <Input
              label={t('guests.name')}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              placeholder={t('guests.name')}
              error={errors.name}
            />

            <Input
              label={t('guests.email')}
              value={email}
              onChangeText={setEmail}
              placeholder={t('guests.email')}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <Input
              label={t('guests.phone')}
              value={phone}
              onChangeText={setPhone}
              placeholder={t('guests.phone')}
              keyboardType="phone-pad"
            />

            {/* Side selector */}
            <Text className="mb-1.5 text-sm font-medium text-content">{t('guests.side')}</Text>
            <View className="mb-4 flex-row">
              {SIDES.map((s) => {
                const isSelected = side === s;
                return (
                  <Pressable
                    key={s}
                    className={`mr-2 rounded-full px-4 py-1.5 ${
                      isSelected ? 'bg-brand-600' : 'bg-surface-secondary'
                    }`}
                    onPress={() => setSide(s)}
                  >
                    <Text
                      className={`text-sm capitalize ${
                        isSelected ? 'font-semibold text-content-inverse' : 'text-content'
                      }`}
                    >
                      {s}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Relationship selector */}
            <Text className="mb-1.5 text-sm font-medium text-content">
              {t('guests.relationship')}
            </Text>
            <View className="mb-4 flex-row flex-wrap">
              {RELATIONSHIPS.map((rel) => {
                const isSelected = relationship === rel;
                return (
                  <Pressable
                    key={rel}
                    className={`mb-2 mr-2 rounded-full px-3 py-1.5 ${
                      isSelected ? 'bg-brand-600' : 'bg-surface-secondary'
                    }`}
                    onPress={() => {
                      setRelationship(rel);
                      if (errors.relationship)
                        setErrors((prev) => ({ ...prev, relationship: '' }));
                    }}
                  >
                    <Text
                      className={`text-sm capitalize ${
                        isSelected ? 'font-semibold text-content-inverse' : 'text-content'
                      }`}
                    >
                      {rel}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.relationship && (
              <Text className="-mt-2 mb-2 text-sm text-danger-500">{errors.relationship}</Text>
            )}
          </ScrollView>

          <View className="px-4 pt-3">
            <Button
              title={t('guests.addGuest')}
              onPress={handleSubmit}
              loading={createGuest.isPending}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
