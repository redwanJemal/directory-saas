import { Alert, Platform } from 'react-native';
import i18n from '@/i18n';
import { haptics } from './haptics';

export function handleApiError(error: any): string {
  const status = error?.response?.status;
  const message = error?.response?.data?.error?.message;

  let userMessage: string;

  switch (status) {
    case 401:
      userMessage = i18n.t('errors.unauthorized');
      break;
    case 403:
      userMessage = i18n.t('errors.forbidden');
      break;
    case 404:
      userMessage = i18n.t('errors.notFound');
      break;
    case 422:
      userMessage = message || i18n.t('errors.validationError');
      break;
    case 429:
      userMessage = i18n.t('errors.rateLimited');
      haptics.warning();
      break;
    default:
      if (!error?.response) {
        userMessage = i18n.t('errors.networkError');
      } else {
        userMessage = i18n.t('errors.serverError');
      }
      haptics.error();
  }

  if (Platform.OS === 'web') {
    console.error(userMessage);
  } else {
    Alert.alert(i18n.t('common.error'), userMessage);
  }

  return userMessage;
}
