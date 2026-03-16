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

import { registerSchema, type RegisterFormData } from '@/lib/auth-schemas';
import { useAuthStore } from '@/store/auth-store';
import { appConfig } from '@/lib/config';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { register: registerUser, error, clearError } = useAuthStore();
  const [termsAccepted, setTermsAccepted] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: undefined as unknown as true,
    },
  });

  const toggleTerms = () => {
    const newValue = !termsAccepted;
    setTermsAccepted(newValue);
    setValue('acceptTerms', newValue as unknown as true, {
      shouldValidate: true,
    });
  };

  const onSubmit = async (data: RegisterFormData) => {
    clearError();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(main)');
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow px-6 py-8"
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-8 items-center">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-brand-600">
              <Text className="text-2xl font-bold text-content-inverse">
                {appConfig.shortName}
              </Text>
            </View>
            <Text className="text-2xl font-bold text-content">
              {t('auth.register')}
            </Text>
            <Text className="mt-2 text-center text-content-secondary">
              {t('auth.registerSubtitle')}
            </Text>
          </View>

          {error && (
            <View className="mb-4 rounded-card bg-danger-50 px-4 py-3">
              <Text className="text-center text-sm text-danger-700">
                {error}
              </Text>
            </View>
          )}

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('auth.name')}
                placeholder={t('auth.name')}
                error={errors.name ? t(errors.name.message ?? '') : undefined}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('auth.email')}
                placeholder={t('auth.email')}
                error={errors.email ? t(errors.email.message ?? '') : undefined}
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

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('auth.password')}
                placeholder={t('auth.password')}
                error={
                  errors.password
                    ? t(errors.password.message ?? '')
                    : undefined
                }
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('auth.confirmPassword')}
                placeholder={t('auth.confirmPassword')}
                error={
                  errors.confirmPassword
                    ? t(errors.confirmPassword.message ?? '')
                    : undefined
                }
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
              />
            )}
          />

          <Pressable
            className="mb-2 flex-row items-center"
            onPress={toggleTerms}
          >
            <View
              className={`mr-3 h-5 w-5 items-center justify-center rounded border ${
                termsAccepted
                  ? 'border-brand-600 bg-brand-600'
                  : 'border-border bg-surface'
              }`}
            >
              {termsAccepted && (
                <Text className="text-xs text-content-inverse">✓</Text>
              )}
            </View>
            <Text className="flex-1 text-sm text-content">
              {t('auth.termsAgree')}
            </Text>
          </Pressable>
          {errors.acceptTerms && (
            <Text className="mb-4 text-sm text-danger-500">
              {t(errors.acceptTerms.message ?? '')}
            </Text>
          )}

          <View className="mt-4">
            <Button
              title={t('auth.register')}
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              haptic="medium"
            />
          </View>

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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
