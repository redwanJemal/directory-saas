import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import Animated, {
  FadeInRight,
  FadeOutLeft,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui/button';
import { useCreateWedding } from '@/hooks/api/use-wedding';

const TOTAL_STEPS = 5;

const STYLE_OPTIONS = [
  'traditional',
  'modern',
  'rustic',
  'elegant',
  'bohemian',
  'classic',
  'minimalist',
  'romantic',
];

interface WeddingSetupProps {
  onComplete: () => void;
}

export function WeddingSetup({ onComplete }: WeddingSetupProps) {
  const { t } = useTranslation();
  const createWedding = useCreateWedding();

  const [step, setStep] = useState(1);
  const [weddingDate, setWeddingDate] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [estimatedGuests, setEstimatedGuests] = useState('');
  const [venue, setVenue] = useState('');
  const [stylePreferences, setStylePreferences] = useState<string[]>([]);

  const goNext = useCallback(() => {
    if (step < TOTAL_STEPS) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep((s) => s + 1);
    }
  }, [step]);

  const goBack = useCallback(() => {
    if (step > 1) {
      setStep((s) => s - 1);
    }
  }, [step]);

  const toggleStyle = useCallback((style: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStylePreferences((prev) =>
      prev.includes(style)
        ? prev.filter((s) => s !== style)
        : [...prev, style],
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      await createWedding.mutateAsync({
        weddingDate: weddingDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        partnerName: partnerName || '',
        estimatedGuests: parseInt(estimatedGuests, 10) || 100,
        venue: venue || undefined,
        stylePreferences: stylePreferences.length > 0 ? stylePreferences : undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [weddingDate, partnerName, estimatedGuests, venue, stylePreferences, createWedding, onComplete]);

  const canProceed =
    (step === 1 && weddingDate.length > 0) ||
    (step === 2 && partnerName.length > 0) ||
    (step === 3 && estimatedGuests.length > 0) ||
    step === 4 ||
    step === 5;

  const guestOptions = ['50', '100', '150', '200', '300'];

  return (
    <View className="flex-1 bg-surface px-4 pt-6">
      {/* Progress Bar */}
      <View className="mb-6 flex-row items-center">
        {step > 1 && (
          <Pressable onPress={goBack} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#4c6ef5" />
          </Pressable>
        )}
        <View className="flex-1 flex-row">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              className={`mx-0.5 h-1.5 flex-1 rounded-full ${
                i < step ? 'bg-brand-600' : 'bg-surface-tertiary'
              }`}
            />
          ))}
        </View>
        <Text className="ml-3 text-xs text-content-tertiary">
          {step}/{TOTAL_STEPS}
        </Text>
      </View>

      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        {/* Step 1: Wedding Date */}
        {step === 1 && (
          <Animated.View entering={FadeInRight.duration(300)} exiting={FadeOutLeft.duration(200)}>
            <Text className="text-2xl font-bold text-content">
              {t('weddingSetup.whenIsWedding')}
            </Text>
            <Text className="mt-2 text-sm text-content-secondary">
              {t('weddingSetup.dateSubtitle')}
            </Text>
            <TextInput
              className="mt-6 rounded-input border border-border bg-surface-secondary px-4 py-3.5 text-base text-content"
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#868e96"
              value={weddingDate}
              onChangeText={setWeddingDate}
              keyboardType={Platform.OS === 'ios' ? 'default' : 'default'}
            />
            <Pressable
              className="mt-3"
              onPress={() => {
                setWeddingDate('');
                goNext();
              }}
            >
              <Text className="text-sm text-brand-600">{t('weddingSetup.notDecided')}</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Step 2: Partner Name */}
        {step === 2 && (
          <Animated.View entering={FadeInRight.duration(300)} exiting={FadeOutLeft.duration(200)}>
            <Text className="text-2xl font-bold text-content">
              {t('weddingSetup.whoMarrying')}
            </Text>
            <Text className="mt-2 text-sm text-content-secondary">
              {t('weddingSetup.partnerSubtitle')}
            </Text>
            <TextInput
              className="mt-6 rounded-input border border-border bg-surface-secondary px-4 py-3.5 text-base text-content"
              placeholder={t('wedding.partnerName')}
              placeholderTextColor="#868e96"
              value={partnerName}
              onChangeText={setPartnerName}
              autoCapitalize="words"
            />
          </Animated.View>
        )}

        {/* Step 3: Guest Estimate */}
        {step === 3 && (
          <Animated.View entering={FadeInRight.duration(300)} exiting={FadeOutLeft.duration(200)}>
            <Text className="text-2xl font-bold text-content">
              {t('weddingSetup.howManyGuests')}
            </Text>
            <Text className="mt-2 text-sm text-content-secondary">
              {t('weddingSetup.guestsSubtitle')}
            </Text>
            <View className="mt-6 flex-row flex-wrap">
              {guestOptions.map((count) => (
                <Pressable
                  key={count}
                  className={`mb-3 mr-3 rounded-full px-5 py-3 ${
                    estimatedGuests === count
                      ? 'bg-brand-600'
                      : 'bg-surface-secondary border border-border'
                  }`}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setEstimatedGuests(count);
                  }}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      estimatedGuests === count ? 'text-content-inverse' : 'text-content'
                    }`}
                  >
                    {count === '300' ? '300+' : count}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              className="mt-3 rounded-input border border-border bg-surface-secondary px-4 py-3.5 text-base text-content"
              placeholder={t('weddingSetup.customCount')}
              placeholderTextColor="#868e96"
              value={guestOptions.includes(estimatedGuests) ? '' : estimatedGuests}
              onChangeText={setEstimatedGuests}
              keyboardType="number-pad"
            />
          </Animated.View>
        )}

        {/* Step 4: Venue */}
        {step === 4 && (
          <Animated.View entering={FadeInRight.duration(300)} exiting={FadeOutLeft.duration(200)}>
            <Text className="text-2xl font-bold text-content">
              {t('weddingSetup.haveVenue')}
            </Text>
            <Text className="mt-2 text-sm text-content-secondary">
              {t('weddingSetup.venueSubtitle')}
            </Text>
            <TextInput
              className="mt-6 rounded-input border border-border bg-surface-secondary px-4 py-3.5 text-base text-content"
              placeholder={t('wedding.venue')}
              placeholderTextColor="#868e96"
              value={venue}
              onChangeText={setVenue}
              autoCapitalize="words"
            />
            <Pressable
              className="mt-3"
              onPress={() => {
                setVenue('');
                goNext();
              }}
            >
              <Text className="text-sm text-brand-600">{t('common.skip')}</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Step 5: Style Preferences */}
        {step === 5 && (
          <Animated.View entering={FadeInRight.duration(300)} exiting={FadeOutLeft.duration(200)}>
            <Text className="text-2xl font-bold text-content">
              {t('weddingSetup.whatsYourStyle')}
            </Text>
            <Text className="mt-2 text-sm text-content-secondary">
              {t('weddingSetup.styleSubtitle')}
            </Text>
            <View className="mt-6 flex-row flex-wrap">
              {STYLE_OPTIONS.map((style) => {
                const isSelected = stylePreferences.includes(style);
                return (
                  <Pressable
                    key={style}
                    className={`mb-3 mr-3 rounded-full px-4 py-2.5 ${
                      isSelected
                        ? 'bg-brand-600'
                        : 'bg-surface-secondary border border-border'
                    }`}
                    onPress={() => toggleStyle(style)}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isSelected ? 'text-content-inverse' : 'text-content'
                      }`}
                    >
                      {t(`weddingSetup.styles.${style}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Bottom Action */}
      <View className="pb-6 pt-4">
        {step < TOTAL_STEPS ? (
          <Button
            title={t('common.next')}
            onPress={goNext}
            disabled={!canProceed}
          />
        ) : (
          <Button
            title={t('wedding.createWedding')}
            onPress={handleSubmit}
            loading={createWedding.isPending}
            haptic="medium"
          />
        )}
      </View>
    </View>
  );
}
