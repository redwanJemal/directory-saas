import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth-store';
import i18n from '@/i18n';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'am' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <View className="flex-1 bg-surface pt-16 px-4">
      <Text className="text-2xl font-bold text-content">{t('profile.title')}</Text>
      <Text className="mt-2 text-content-secondary">{user?.email}</Text>

      <Pressable
        className="mt-6 rounded-button bg-brand-100 px-4 py-3"
        onPress={toggleLanguage}
      >
        <Text className="text-center text-brand-700">
          {t('profile.language')}: {i18n.language === 'en' ? t('profile.english') : t('profile.amharic')}
        </Text>
      </Pressable>

      <Pressable
        className="mt-4 rounded-button bg-danger-50 px-4 py-3"
        onPress={logout}
      >
        <Text className="text-center text-danger-700">{t('auth.logout')}</Text>
      </Pressable>
    </View>
  );
}
