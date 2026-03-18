import { useTranslation } from 'react-i18next';
import { hapticFeedback } from '@/lib/telegram';

const CATEGORY_ICONS: Record<string, string> = {
  'food-drink': '🍽️',
  'beauty-grooming': '💇',
  'services': '🔧',
  'automotive': '🚗',
  'health-wellness': '🏥',
  'shopping': '🛍️',
  'community': '🤝',
};

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  _count?: { providers: number };
  children?: Category[];
}

interface CategoryGridProps {
  categories: Category[];
  onSelect: (slug: string) => void;
}

export function CategoryGrid({ categories, onSelect }: CategoryGridProps) {
  const { t } = useTranslation();

  const parentCategories = categories.filter((c) => !('parentId' in c) || !(c as Record<string, unknown>).parentId);

  return (
    <div className="grid grid-cols-2 gap-2">
      {parentCategories.map((cat) => {
        const icon = CATEGORY_ICONS[cat.slug] || cat.icon || '📌';
        const count = cat._count?.providers ?? 0;

        return (
          <button
            key={cat.id}
            onClick={() => {
              hapticFeedback('light');
              onSelect(cat.slug);
            }}
            className="flex flex-col items-center gap-1 p-4 rounded-xl bg-[var(--tg-theme-secondary-bg-color,var(--card))] active:scale-[0.97] transition-transform"
          >
            <span className="text-2xl">{icon}</span>
            <span className="text-sm font-medium text-[var(--tg-theme-text-color,var(--foreground))]">
              {cat.name}
            </span>
            <span className="text-xs text-[var(--tg-theme-hint-color,var(--muted-foreground))]">
              {t('categories.businesses', { count })}
            </span>
          </button>
        );
      })}
    </div>
  );
}
