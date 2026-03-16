import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/api';
import type { ApiResponse } from '@/lib/types';

interface WebsiteSettings {
  isPublic: boolean;
  slug: string;
  url?: string;
}

export function WeddingWebsiteSettings() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<WebsiteSettings>({
    isPublic: false,
    slug: '',
  });

  const { data } = useQuery({
    queryKey: ['settings', 'website'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<WebsiteSettings>>(
        '/settings/wedding-website',
      );
      return data.data;
    },
  });

  useEffect(() => {
    if (data) setSettings(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (settings: WebsiteSettings) => {
      await api.patch('/settings/wedding-website', settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'website'] });
      toast.success(t('settings.saved'));
    },
    onError: () => {
      toast.error(t('errors.serverError'));
    },
  });

  function handleCopyLink() {
    if (settings.url) {
      navigator.clipboard.writeText(settings.url);
      toast.success(t('settings.linkCopied'));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('settings.weddingWebsite')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-w-md">
        <div className="flex items-center justify-between">
          <Label>{t('settings.publicWebsite')}</Label>
          <Switch
            checked={settings.isPublic}
            onCheckedChange={(checked) =>
              setSettings((prev) => ({ ...prev, isPublic: checked }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label>{t('settings.customUrl')}</Label>
          <Input
            value={settings.slug}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, slug: e.target.value }))
            }
          />
        </div>

        {settings.url && (
          <div className="space-y-2">
            <Label>{t('settings.shareLink')}</Label>
            <div className="flex items-center gap-2">
              <Input value={settings.url} readOnly />
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <Button
          onClick={() => saveMutation.mutate(settings)}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? t('common.loading') : t('common.save')}
        </Button>
      </CardContent>
    </Card>
  );
}
