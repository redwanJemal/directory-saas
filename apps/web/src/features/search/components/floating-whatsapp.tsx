import { MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRecordContactClick } from '../hooks/use-search';

interface FloatingWhatsAppProps {
  providerId: string;
  whatsappUrl: string;
}

export function FloatingWhatsApp({ providerId, whatsappUrl }: FloatingWhatsAppProps) {
  const { t } = useTranslation();
  const recordClick = useRecordContactClick();

  const handleClick = () => {
    recordClick.mutate({ providerId, type: 'whatsapp' });
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[oklch(0.55_0.18_145)] px-5 py-3 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
      aria-label={t('vendor.contactWhatsApp')}
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden sm:inline text-sm font-medium">
        {t('vendor.contactWhatsApp')}
      </span>
    </button>
  );
}
