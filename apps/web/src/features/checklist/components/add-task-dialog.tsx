import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CreateTaskSchema } from '../schemas';
import { useCreateTask } from '../hooks/use-checklist';

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTaskDialog({ open, onOpenChange }: AddTaskDialogProps) {
  const { t } = useTranslation();
  const createTask = useCreateTask();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    assignedTo: '',
    category: '',
  });

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  function handleSubmit() {
    const payload = {
      title: form.title,
      description: form.description || undefined,
      dueDate: form.dueDate,
      assignedTo: form.assignedTo || undefined,
      category: form.category || undefined,
    };

    const result = CreateTaskSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    createTask.mutate(result.data, {
      onSuccess: () => {
        toast.success(t('common.save'));
        onOpenChange(false);
        setForm({ title: '', description: '', dueDate: '', assignedTo: '', category: '' });
        setErrors({});
      },
      onError: () => toast.error(t('errors.serverError')),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('checklist.addTask')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('guestList.name')}</Label>
            <Input value={form.title} onChange={(e) => handleChange('title', e.target.value)} />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label>{t('vendor.message')}</Label>
            <Textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('checklist.dueDate')}</Label>
            <Input type="date" value={form.dueDate} onChange={(e) => handleChange('dueDate', e.target.value)} />
            {errors.dueDate && <p className="text-sm text-destructive">{errors.dueDate}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('checklist.assignedTo')}</Label>
              <Input value={form.assignedTo} onChange={(e) => handleChange('assignedTo', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('budget.category')}</Label>
              <Input value={form.category} onChange={(e) => handleChange('category', e.target.value)} />
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={createTask.isPending} className="w-full">
            {createTask.isPending ? t('common.loading') : t('checklist.addTask')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
