import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Calendar, MapPin, Users, Clock } from 'lucide-react';
import type { CommunityEvent } from '../types';

interface EventCardProps {
  event: CommunityEvent;
  onEdit: (event: CommunityEvent) => void;
  onDelete: (event: CommunityEvent) => void;
}

export function EventCard({ event, onEdit, onDelete }: EventCardProps) {
  const { t } = useTranslation();

  const eventDate = new Date(event.date);
  const isPast = eventDate < new Date();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {event.imageUrl && (
            <div className="shrink-0 w-24 h-24 rounded-md overflow-hidden bg-muted">
              <img
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold truncate">{event.title}</h3>
                {event.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {event.description}
                  </p>
                )}
              </div>
              <div className="flex gap-1.5">
                <Badge variant={event.eventType === 'community' ? 'secondary' : 'default'}>
                  {t(`events.type_${event.eventType}`)}
                </Badge>
                {isPast && (
                  <Badge variant="destructive">{t('events.past')}</Badge>
                )}
                {!event.isActive && (
                  <Badge variant="outline">{t('common.inactive')}</Badge>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {eventDate.toLocaleDateString()}
              </span>
              {event.time && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {event.time}
                </span>
              )}
              {event.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {event.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {t('events.rsvpCount', { count: event._count.rsvps })}
                {event.maxAttendees && ` / ${event.maxAttendees}`}
              </span>
            </div>

            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(event)}
              >
                <Pencil className="h-3.5 w-3.5 mr-1" />
                {t('common.edit')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(event)}
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
