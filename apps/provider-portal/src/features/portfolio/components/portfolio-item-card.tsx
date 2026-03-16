import { useTranslation } from 'react-i18next';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GripVertical, Pencil, Trash2, Star } from 'lucide-react';
import type { PortfolioItem } from '@/features/profile/types';

interface PortfolioItemCardProps {
  item: PortfolioItem;
  onEdit: (item: PortfolioItem) => void;
  onDelete: (id: string) => void;
  onSetCover: (id: string) => void;
}

export function PortfolioItemCard({ item, onEdit, onDelete, onSetCover }: PortfolioItemCardProps) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group relative overflow-hidden rounded-lg border bg-card">
      <div className="aspect-square overflow-hidden">
        {item.type === 'video' ? (
          <video src={item.url} className="h-full w-full object-cover" muted />
        ) : (
          <img src={item.url} alt={item.title} className="h-full w-full object-cover" />
        )}
      </div>

      {item.isCover && (
        <Badge className="absolute top-2 left-2">{t('portfolio.cover')}</Badge>
      )}

      {item.type === 'video' && (
        <Badge variant="secondary" className="absolute top-2 right-2">
          {t('portfolio.video')}
        </Badge>
      )}

      <div className="absolute inset-0 flex flex-col justify-between bg-background/80 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex items-center justify-between p-2">
          <button type="button" className="cursor-grab text-muted-foreground hover:text-foreground" {...attributes} {...listeners}>
            <GripVertical className="h-5 w-5" />
          </button>
          <div className="flex gap-1">
            {!item.isCover && (
              <Button variant="ghost" size="icon" onClick={() => onSetCover(item.id)} title={t('portfolio.setCover')}>
                <Star className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="p-3">
          {item.title && <p className="font-medium text-foreground">{item.title}</p>}
          {item.venue && <p className="text-sm text-muted-foreground">{item.venue}</p>}
        </div>
      </div>
    </div>
  );
}
