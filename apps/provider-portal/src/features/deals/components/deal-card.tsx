import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Percent, Tag } from 'lucide-react';
import type { Deal } from '../types';

interface DealCardProps {
  deal: Deal;
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'active':
      return 'default';
    case 'scheduled':
      return 'secondary';
    case 'expired':
      return 'destructive';
    default:
      return 'secondary';
  }
}

export function DealCard({ deal, onEdit, onDelete }: DealCardProps) {
  const { t } = useTranslation();

  const formattedStart = deal.startsAt
    ? new Date(deal.startsAt).toLocaleDateString()
    : null;
  const formattedEnd = deal.expiresAt
    ? new Date(deal.expiresAt).toLocaleDateString()
    : null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {deal.imageUrl && (
            <div className="shrink-0 w-24 h-24 rounded-md overflow-hidden bg-muted">
              <img
                src={deal.imageUrl}
                alt={deal.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold truncate">{deal.title}</h3>
                {deal.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {deal.description}
                  </p>
                )}
              </div>
              <Badge variant={getStatusVariant(deal.status)}>
                {t(`deals.status_${deal.status}`)}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              {deal.discountPercent && (
                <span className="flex items-center gap-1">
                  <Percent className="h-3.5 w-3.5" />
                  {deal.discountPercent}% {t('deals.off')}
                </span>
              )}
              {deal.originalPrice != null && deal.dealPrice != null && (
                <span className="flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />
                  <span className="line-through">{deal.originalPrice}</span>
                  <span className="text-foreground font-medium">{deal.dealPrice}</span>
                </span>
              )}
              {(formattedStart || formattedEnd) && (
                <span>
                  {formattedStart && formattedStart}
                  {formattedStart && formattedEnd && ' — '}
                  {formattedEnd && formattedEnd}
                </span>
              )}
            </div>

            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(deal)}
              >
                <Pencil className="h-3.5 w-3.5 mr-1" />
                {t('common.edit')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(deal)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                {t('common.delete')}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
