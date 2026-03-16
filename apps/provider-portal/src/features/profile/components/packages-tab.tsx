import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { GripVertical, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import { packageSchema, type PackageFormData } from '../schemas';
import {
  usePackagesQuery,
  useCreatePackageMutation,
  useUpdatePackageMutation,
  useDeletePackageMutation,
  useReorderPackagesMutation,
} from '../hooks/use-profile';
import type { Package } from '../types';

const PRICE_TYPES = ['fixed', 'starting_from', 'hourly', 'custom'] as const;

function SortablePackageCard({
  pkg,
  onEdit,
  onDelete,
}: {
  pkg: Package;
  onEdit: (pkg: Package) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: pkg.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card>
        <CardContent className="flex items-start gap-4 p-4">
          <button type="button" className="mt-1 cursor-grab text-muted-foreground hover:text-foreground" {...attributes} {...listeners}>
            <GripVertical className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{pkg.name}</h3>
              <Badge variant="secondary">{t(`profile.priceType_${pkg.priceType}`)}</Badge>
            </div>
            <p className="mt-1 text-lg font-bold text-primary">
              {pkg.priceType === 'custom' ? t('profile.customPrice') : `$${pkg.price.toLocaleString()}`}
              {pkg.priceType === 'hourly' && `/${t('profile.hour')}`}
            </p>
            {pkg.description && <p className="mt-1 text-sm text-muted-foreground">{pkg.description}</p>}
            {pkg.duration && (
              <p className="mt-1 text-sm text-muted-foreground">
                {t('profile.duration')}: {pkg.duration}
              </p>
            )}
            {pkg.inclusions.length > 0 && (
              <ul className="mt-2 space-y-1">
                {pkg.inclusions.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground">
                    &bull; {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(pkg)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(pkg.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function PackagesTab() {
  const { t } = useTranslation();
  const { data: packages, isLoading } = usePackagesQuery();
  const createMutation = useCreatePackageMutation();
  const updateMutation = useUpdatePackageMutation();
  const deleteMutation = useDeletePackageMutation();
  const reorderMutation = useReorderPackagesMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<Package | null>(null);
  const [form, setForm] = useState<PackageFormData>({
    name: '',
    description: '',
    price: 0,
    priceType: 'fixed',
    duration: '',
    inclusions: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [inclusionInput, setInclusionInput] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function openCreate() {
    setEditingPkg(null);
    setForm({ name: '', description: '', price: 0, priceType: 'fixed', duration: '', inclusions: [] });
    setErrors({});
    setDialogOpen(true);
  }

  function openEdit(pkg: Package) {
    setEditingPkg(pkg);
    setForm({
      name: pkg.name,
      description: pkg.description || '',
      price: pkg.price,
      priceType: pkg.priceType,
      duration: pkg.duration || '',
      inclusions: [...pkg.inclusions],
    });
    setErrors({});
    setDialogOpen(true);
  }

  async function handleSubmit() {
    const result = packageSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString();
        if (key) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    try {
      const payload = {
        name: result.data.name,
        description: result.data.description ?? '',
        price: result.data.price,
        priceType: result.data.priceType,
        duration: result.data.duration ?? '',
        inclusions: result.data.inclusions,
      };
      if (editingPkg) {
        await updateMutation.mutateAsync({ id: editingPkg.id, ...payload });
        toast.success(t('profile.packageUpdated'));
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(t('profile.packageCreated'));
      }
      setDialogOpen(false);
    } catch {
      toast.error(t('errors.serverError'));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(t('profile.packageDeleted'));
    } catch {
      toast.error(t('errors.serverError'));
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !packages) return;

    const oldIndex = packages.findIndex((p) => p.id === active.id);
    const newIndex = packages.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...packages];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    try {
      await reorderMutation.mutateAsync(reordered.map((p) => p.id));
    } catch {
      toast.error(t('errors.serverError'));
    }
  }

  function addInclusion() {
    const trimmed = inclusionInput.trim();
    if (!trimmed) return;
    setForm((prev) => ({ ...prev, inclusions: [...prev.inclusions, trimmed] }));
    setInclusionInput('');
  }

  function removeInclusion(index: number) {
    setForm((prev) => ({ ...prev, inclusions: prev.inclusions.filter((_, i) => i !== index) }));
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  const sortedPackages = [...(packages ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('profile.packages')}</h2>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('profile.addPackage')}
        </Button>
      </div>

      {sortedPackages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">{t('profile.noPackages')}</CardContent>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortedPackages.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {sortedPackages.map((pkg) => (
                <SortablePackageCard key={pkg.id} pkg={pkg} onEdit={openEdit} onDelete={handleDelete} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPkg ? t('profile.editPackage') : t('profile.addPackage')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('profile.packageName')}</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t('profile.description')}</Label>
              <Textarea
                value={form.description ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('profile.price')}</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))}
                />
                {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
              </div>
              <div className="space-y-2">
                <Label>{t('profile.priceType')}</Label>
                <Select
                  value={form.priceType}
                  onValueChange={(v) => setForm((p) => ({ ...p, priceType: v as PackageFormData['priceType'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_TYPES.map((pt) => (
                      <SelectItem key={pt} value={pt}>
                        {t(`profile.priceType_${pt}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('profile.duration')}</Label>
              <Input
                value={form.duration ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('profile.inclusions')}</Label>
              <div className="space-y-2">
                {form.inclusions.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => {
                        const next = [...form.inclusions];
                        next[index] = e.target.value;
                        setForm((p) => ({ ...p, inclusions: next }));
                      }}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeInclusion(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={inclusionInput}
                  onChange={(e) => setInclusionInput(e.target.value)}
                  placeholder={t('profile.addInclusion')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addInclusion();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addInclusion}>
                  {t('common.create')}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={isMutating}>
              {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingPkg ? t('common.save') : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
