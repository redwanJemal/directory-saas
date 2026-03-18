import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, ExternalLink, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useProfileQuery } from '@/features/profile/hooks/use-profile';
import { brand } from '@/lib/branding';

const DEFAULT_GREETING = `Hi! I found your business on ${brand.name}. I'd like to inquire about your services.`;

export function WhatsAppSetup() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: profile } = useProfileQuery();

  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [greetingMessage, setGreetingMessage] = useState('');

  useEffect(() => {
    if (profile) {
      setWhatsappNumber(profile.whatsapp || '');
      setGreetingMessage(profile.whatsappMessage || '');
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async (data: { whatsapp: string | null; whatsappMessage: string | null }) => {
      await api.patch('/providers/me', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-profile'] });
      toast.success(t('settings.saved'));
    },
    onError: () => {
      toast.error(t('errors.serverError'));
    },
  });

  function handleSave() {
    saveMutation.mutate({
      whatsapp: whatsappNumber || null,
      whatsappMessage: greetingMessage || null,
    });
  }

  // Preview URL
  const previewUrl = useMemo(() => {
    if (!whatsappNumber) return null;
    let cleaned = whatsappNumber.replace(/[^+\d]/g, '');
    if (cleaned.startsWith('00')) cleaned = '+' + cleaned.slice(2);
    if (!cleaned.startsWith('+')) cleaned = '+' + cleaned;
    const numberWithoutPlus = cleaned.replace('+', '');
    const message = greetingMessage || DEFAULT_GREETING;
    return `https://wa.me/${numberWithoutPlus}?text=${encodeURIComponent(message)}`;
  }, [whatsappNumber, greetingMessage]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-5 w-5" />
            {t('settings.whatsappSetup')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsappNumber">{t('settings.whatsappNumber')}</Label>
            <Input
              id="whatsappNumber"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder={t('settings.whatsappNumberPlaceholder')}
            />
            <p className="text-xs text-muted-foreground">
              {t('settings.whatsappNumberHint')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="greetingMessage">
              {t('settings.whatsappGreeting')}
            </Label>
            <Textarea
              id="greetingMessage"
              value={greetingMessage}
              onChange={(e) => setGreetingMessage(e.target.value)}
              placeholder={DEFAULT_GREETING}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {t('settings.whatsappGreetingHint')}
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t('common.save')}
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      {whatsappNumber && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('settings.whatsappPreview')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {profile?.businessName || t('settings.yourBusiness')}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {greetingMessage || DEFAULT_GREETING}
                  </p>
                </div>
              </div>
            </div>

            {previewUrl && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  {t('settings.whatsappLink')}
                </Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-muted px-3 py-2 text-xs break-all">
                    {previewUrl}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
