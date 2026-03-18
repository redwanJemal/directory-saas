export interface AppConfig {
  name: string;
  shortName: string;
  apiUrl: string;
  supportEmail: string;
}

export const appConfig: AppConfig = {
  name: process.env.EXPO_PUBLIC_APP_NAME || 'Habesha Hub',
  shortName: process.env.EXPO_PUBLIC_APP_SHORT_NAME || 'HH',
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333/api/v1',
  supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'support@example.com',
};
