import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CreateGuestSchema } from '../schemas';
import { useCreateGuest } from '../hooks/use-guests';

interface AddGuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddGuestDialog({ open, onOpenChange }: AddGuestDialogProps) {
  const { t } = useTranslation();
  const createGuest = useCreateGuest();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    group: 'family',
    side: 'mutual',
    dietaryNotes: '',
  });

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  function handleSubmit() {
    const payload = {
      name: form.name,
      email: form.email || undefined,
      phone: form.phone || undefined,
      group: form.group,
      side: form.side,
      dietaryNotes: form.dietaryNotes || undefined,
    };

    const result = CreateGuestSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    createGuest.mutate(result.data, {
      onSuccess: () => {
        toast.success(t('common.save'));
        onOpenChange(false);
        setForm({ name: '', email: '', phone: '', group: 'family', side: 'mutual', dietaryNotes: '' });
        setErrors({});
      },
      onError: () => toast.error(t('errors.serverError')),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('guestList.addGuest')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('guestList.name')}</Label>
            <Input value={form.name} onChange={(e) => handleChange('name', e.target.value)} />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('auth.email')}</Label>
              <Input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('vendor.message')}</Label>
              <Input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('guestList.group')}</Label>
              <Select value={form.group} onValueChange={(v) => handleChange('group', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="family">{t('guestList.family')}</SelectItem>
                  <SelectItem value="friends">{t('guestList.friends')}</SelectItem>
                  <SelectItem value="colleagues">{t('guestList.colleagues')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('guestList.side')}</Label>
              <Select value={form.side} onValueChange={(v) => handleChange('side', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bride">{t('guestList.bride')}</SelectItem>
                  <SelectItem value="groom">{t('guestList.groom')}</SelectItem>
                  <SelectItem value="mutual">{t('guestList.mutual')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('guestList.meal')}</Label>
            <Textarea
              value={form.dietaryNotes}
              onChange={(e) => handleChange('dietaryNotes', e.target.value)}
              rows={2}
            />
          </div>

          <Button onClick={handleSubmit} disabled={createGuest.isPending} className="w-full">
            {createGuest.isPending ? t('common.loading') : t('guestList.addGuest')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
