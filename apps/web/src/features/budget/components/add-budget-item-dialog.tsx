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
import { CreateBudgetItemSchema } from '../schemas';
import { useAddBudgetItem } from '../hooks/use-budget';
import type { BudgetCategory } from '../types';

interface AddBudgetItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: BudgetCategory[];
}

export function AddBudgetItemDialog({
  open,
  onOpenChange,
  categories,
}: AddBudgetItemDialogProps) {
  const { t } = useTranslation();
  const addItem = useAddBudgetItem();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    categoryId: '',
    name: '',
    estimated: '',
    actual: '',
    paid: '',
    vendor: '',
    notes: '',
  });

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  function handleSubmit() {
    const payload = {
      categoryId: form.categoryId,
      name: form.name,
      estimated: Number(form.estimated) || 0,
      actual: form.actual ? Number(form.actual) : undefined,
      paid: form.paid ? Number(form.paid) : undefined,
      vendor: form.vendor || undefined,
      notes: form.notes || undefined,
    };

    const result = CreateBudgetItemSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    addItem.mutate(result.data, {
      onSuccess: () => {
        toast.success(t('common.save'));
        onOpenChange(false);
        setForm({ categoryId: '', name: '', estimated: '', actual: '', paid: '', vendor: '', notes: '' });
        setErrors({});
      },
      onError: () => toast.error(t('errors.serverError')),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('budget.addItem')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('budget.category')}</Label>
            <Select value={form.categoryId} onValueChange={(v) => handleChange('categoryId', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId}</p>}
          </div>

          <div className="space-y-2">
            <Label>{t('guestList.name')}</Label>
            <Input value={form.name} onChange={(e) => handleChange('name', e.target.value)} />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t('budget.estimated')}</Label>
              <Input type="number" value={form.estimated} onChange={(e) => handleChange('estimated', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('budget.actual')}</Label>
              <Input type="number" value={form.actual} onChange={(e) => handleChange('actual', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('budget.paid')}</Label>
              <Input type="number" value={form.paid} onChange={(e) => handleChange('paid', e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('nav.vendors')}</Label>
            <Input value={form.vendor} onChange={(e) => handleChange('vendor', e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>{t('vendor.message')}</Label>
            <Textarea value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} rows={2} />
          </div>

          <Button onClick={handleSubmit} disabled={addItem.isPending} className="w-full">
            {addItem.isPending ? t('common.loading') : t('budget.addItem')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
