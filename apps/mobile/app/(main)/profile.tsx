import { View, Text, ScrollView, Pressable, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';

import { useAuthStore } from '@/store/auth-store';
import i18n from '@/i18n';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'am' : 'en';
    i18n.changeLanguage(newLang);
  };

  const handleLogout = () => {
    Alert.alert(t('auth.logout'), t('profile.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('auth.logout'),
        style: 'destructive',
        onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="pb-8">
        {/* Header */}
        <View className="items-center px-4 pt-4 pb-6">
          <View className="mb-3 h-20 w-20 items-center justify-center rounded-full bg-brand-100">
            <Text className="text-3xl font-bold text-brand-700">
              {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text className="text-xl font-bold text-content">
            {user?.name ?? ''}
          </Text>
          <Text className="mt-1 text-content-secondary">
            {user?.email ?? ''}
          </Text>
          <Pressable className="mt-3 rounded-button border border-border px-4 py-2">
            <Text className="text-sm font-medium text-content">
              {t('profile.editProfile')}
            </Text>
          </Pressable>
        </View>

        {/* Settings Section */}
        <View className="mx-4 mb-4">
          <Text className="mb-2 text-sm font-semibold uppercase text-content-tertiary">
            {t('profile.settings')}
          </Text>
          <View className="rounded-card bg-surface-secondary">
            {/* Language */}
            <Pressable
              className="flex-row items-center justify-between border-b border-border px-4 py-3.5"
              onPress={toggleLanguage}
            >
              <View className="flex-row items-center">
                <Ionicons name="language-outline" size={20} color="#495057" />
                <Text className="ml-3 text-base text-content">
                  {t('profile.language')}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="mr-2 text-content-secondary">
                  {i18n.language === 'en'
                    ? t('profile.english')
                    : t('profile.amharic')}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#adb5bd" />
              </View>
            </Pressable>

            {/* Notifications */}
            <View className="flex-row items-center justify-between px-4 py-3.5">
              <View className="flex-row items-center">
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color="#495057"
                />
                <Text className="ml-3 text-base text-content">
                  {t('profile.notifications')}
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#dee2e6', true: '#4c6ef5' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* About Section */}
        <View className="mx-4 mb-6">
          <Text className="mb-2 text-sm font-semibold uppercase text-content-tertiary">
            {t('profile.about')}
          </Text>
          <View className="rounded-card bg-surface-secondary">
            <View className="flex-row items-center justify-between px-4 py-3.5">
              <View className="flex-row items-center">
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#495057"
                />
                <Text className="ml-3 text-base text-content">
                  {t('profile.version')}
                </Text>
              </View>
              <Text className="text-content-secondary">{appVersion}</Text>
            </View>
          </View>
        </View>

        {/* Logout */}
        <View className="mx-4">
          <Pressable
            className="rounded-card bg-danger-50 px-4 py-3.5"
            onPress={handleLogout}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="log-out-outline" size={20} color="#e03131" />
              <Text className="ml-2 text-base font-semibold text-danger-700">
                {t('auth.logout')}
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
