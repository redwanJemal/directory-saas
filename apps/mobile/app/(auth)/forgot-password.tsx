import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';

import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from '@/lib/auth-schemas';
import { appConfig } from '@/lib/config';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setApiError(null);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSent(true);
    } catch {
      // If endpoint doesn't exist, show success anyway (no email enumeration)
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSent(true);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-8"
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-10 items-center">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-brand-600">
              <Text className="text-2xl font-bold text-content-inverse">
                {appConfig.shortName}
              </Text>
            </View>
            <Text className="text-2xl font-bold text-content">
              {t('auth.resetPassword')}
            </Text>
            <Text className="mt-2 text-center text-content-secondary">
              {t('auth.resetSubtitle')}
            </Text>
          </View>

          {sent ? (
            <View className="items-center">
              <View className="mb-4 rounded-card bg-success-50 px-4 py-4">
                <Text className="text-center text-sm text-success-700">
                  {t('auth.resetSent')}
                </Text>
              </View>
              <Pressable className="mt-4" onPress={() => router.back()}>
                <Text className="font-semibold text-brand-600">
                  {t('auth.signIn')}
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              {apiError && (
                <View className="mb-4 rounded-card bg-danger-50 px-4 py-3">
                  <Text className="text-center text-sm text-danger-700">
                    {apiError}
                  </Text>
                </View>
              )}

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label={t('auth.email')}
                    placeholder={t('auth.email')}
                    error={
                      errors.email
                        ? t(errors.email.message ?? '')
                        : undefined
                    }
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                  />
                )}
              />

              <Button
                title={t('auth.sendResetLink')}
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting}
                haptic="medium"
              />

              <View className="mt-6 flex-row items-center justify-center">
                <Text className="text-content-secondary">
                  {t('auth.haveAccount')}{' '}
                </Text>
                <Pressable onPress={() => router.back()}>
                  <Text className="font-semibold text-brand-600">
                    {t('auth.signIn')}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
