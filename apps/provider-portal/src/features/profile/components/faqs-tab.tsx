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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { GripVertical, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { faqSchema, type FAQFormData } from '../schemas';
import {
  useFAQsQuery,
  useCreateFAQMutation,
  useUpdateFAQMutation,
  useDeleteFAQMutation,
  useReorderFAQsMutation,
} from '../hooks/use-profile';
import type { FAQ } from '../types';

function SortableFAQItem({
  faq,
  onEdit,
  onDelete,
}: {
  faq: FAQ;
  onEdit: (faq: FAQ) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: faq.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2">
      <button type="button" className="mt-4 cursor-grab text-muted-foreground hover:text-foreground" {...attributes} {...listeners}>
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="flex-1 min-w-0">
        <AccordionItem value={faq.id}>
          <div className="flex items-center">
            <AccordionTrigger className="flex-1 text-left">{faq.question}</AccordionTrigger>
            <div className="flex gap-1 ml-2">
              <Button variant="ghost" size="icon" onClick={() => onEdit(faq)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(faq.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <AccordionContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{faq.answer}</p>
          </AccordionContent>
        </AccordionItem>
      </div>
    </div>
  );
}

export function FAQsTab() {
  const { t } = useTranslation();
  const { data: faqs, isLoading } = useFAQsQuery();
  const createMutation = useCreateFAQMutation();
  const updateMutation = useUpdateFAQMutation();
  const deleteMutation = useDeleteFAQMutation();
  const reorderMutation = useReorderFAQsMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [form, setForm] = useState<FAQFormData>({ question: '', answer: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function openCreate() {
    setEditingFaq(null);
    setForm({ question: '', answer: '' });
    setErrors({});
    setDialogOpen(true);
  }

  function openEdit(faq: FAQ) {
    setEditingFaq(faq);
    setForm({ question: faq.question, answer: faq.answer });
    setErrors({});
    setDialogOpen(true);
  }

  async function handleSubmit() {
    const result = faqSchema.safeParse(form);
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
      if (editingFaq) {
        await updateMutation.mutateAsync({ id: editingFaq.id, ...result.data });
        toast.success(t('profile.faqUpdated'));
      } else {
        await createMutation.mutateAsync(result.data);
        toast.success(t('profile.faqCreated'));
      }
      setDialogOpen(false);
    } catch {
      toast.error(t('errors.serverError'));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(t('profile.faqDeleted'));
    } catch {
      toast.error(t('errors.serverError'));
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !faqs) return;

    const oldIndex = faqs.findIndex((f) => f.id === active.id);
    const newIndex = faqs.findIndex((f) => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...faqs];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    try {
      await reorderMutation.mutateAsync(reordered.map((f) => f.id));
    } catch {
      toast.error(t('errors.serverError'));
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const sortedFaqs = [...(faqs ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('profile.faqs')}</h2>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('profile.addFaq')}
        </Button>
      </div>

      {sortedFaqs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">{t('profile.noFaqs')}</CardContent>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortedFaqs.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <Accordion type="multiple" className="space-y-2">
              {sortedFaqs.map((faq) => (
                <SortableFAQItem key={faq.id} faq={faq} onEdit={openEdit} onDelete={handleDelete} />
              ))}
            </Accordion>
          </SortableContext>
        </DndContext>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFaq ? t('profile.editFaq') : t('profile.addFaq')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('profile.question')}</Label>
              <Input value={form.question} onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))} />
              {errors.question && <p className="text-sm text-destructive">{errors.question}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t('profile.answer')}</Label>
              <Textarea
                value={form.answer}
                onChange={(e) => setForm((p) => ({ ...p, answer: e.target.value }))}
                rows={5}
              />
              {errors.answer && <p className="text-sm text-destructive">{errors.answer}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={isMutating}>
              {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingFaq ? t('common.save') : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
