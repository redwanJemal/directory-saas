import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, Trash2, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { InviteCollaboratorSchema } from '../schemas';
import { useInviteCollaborator, useRemoveCollaborator } from '../hooks/use-wedding';
import type { Collaborator } from '../types';

interface CollaboratorsManagerProps {
  collaborators: Collaborator[];
}

export function CollaboratorsManager({ collaborators }: CollaboratorsManagerProps) {
  const { t } = useTranslation();
  const invite = useInviteCollaborator();
  const remove = useRemoveCollaborator();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ email: '', role: 'viewer' as 'editor' | 'viewer' });

  function handleSubmit() {
    const result = InviteCollaboratorSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    invite.mutate(result.data, {
      onSuccess: () => {
        toast.success(t('common.save'));
        setOpen(false);
        setForm({ email: '', role: 'viewer' });
        setErrors({});
      },
      onError: () => toast.error(t('errors.serverError')),
    });
  }

  function handleRemove(id: string) {
    remove.mutate(id, {
      onError: () => toast.error(t('errors.serverError')),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{t('wedding.collaborators')}</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              {t('common.create')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('wedding.collaborators')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('auth.email')}</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, email: e.target.value }));
                    setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label>{t('guestList.group')}</Label>
                <Select value={form.role} onValueChange={(v) => setForm((prev) => ({ ...prev, role: v as 'editor' | 'viewer' }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">{t('common.edit')}</SelectItem>
                    <SelectItem value="viewer">{t('common.view')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSubmit} disabled={invite.isPending} className="w-full">
                {invite.isPending ? t('common.loading') : t('common.save')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {collaborators.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('common.noResults')}</p>
      ) : (
        <div className="grid gap-3">
          {collaborators.map((collab) => (
            <Card key={collab.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{collab.name ?? collab.email}</p>
                    {collab.name && (
                      <p className="text-xs text-muted-foreground">{collab.email}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="capitalize">{collab.role}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleRemove(collab.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
