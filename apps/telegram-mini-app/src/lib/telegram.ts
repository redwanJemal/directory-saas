export function getTelegramWebApp(): TelegramWebApp | null {
  return window.Telegram?.WebApp ?? null;
}

export function getStartParam(): string | undefined {
  return getTelegramWebApp()?.initDataUnsafe?.start_param;
}

export function parseStartParam(): { type: string; value: string } | null {
  const param = getStartParam();
  if (!param) return null;

  if (param.startsWith('business_')) {
    return { type: 'business', value: param.replace('business_', '') };
  }
  if (param.startsWith('search_')) {
    return { type: 'search', value: decodeURIComponent(param.replace('search_', '')) };
  }
  if (param.startsWith('category_')) {
    return { type: 'category', value: param.replace('category_', '') };
  }
  if (param.startsWith('deal_')) {
    return { type: 'deal', value: param.replace('deal_', '') };
  }
  if (param === 'deals') {
    return { type: 'deals', value: '' };
  }
  if (param === 'nearby') {
    return { type: 'nearby', value: '' };
  }
  return null;
}

export function shareBusiness(name: string, slug: string): void {
  const webapp = getTelegramWebApp();
  if (webapp) {
    webapp.switchInlineQuery(`${name} - https://t.me/habeshahub_bot?start=business_${slug}`, ['users', 'groups', 'channels']);
  }
}

export function hapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light'): void {
  getTelegramWebApp()?.HapticFeedback?.impactOccurred(type);
}
