import { useTranslation } from 'react-i18next';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Guest } from '../types';

interface RSVPSummaryProps {
  guests: Guest[];
}

export function RSVPSummary({ guests }: RSVPSummaryProps) {
  const { t } = useTranslation();
  const attending = guests.filter((g) => g.rsvp === 'attending').length;
  const declined = guests.filter((g) => g.rsvp === 'declined').length;
  const pending = guests.filter((g) => g.rsvp === 'pending').length;

  const stats = [
    {
      label: t('guestList.title'),
      value: guests.length,
      icon: Users,
      style: '',
    },
    {
      label: t('guestList.attending'),
      value: attending,
      icon: UserCheck,
      style: 'text-primary',
    },
    {
      label: t('guestList.declined'),
      value: declined,
      icon: UserX,
      style: 'text-destructive',
    },
    {
      label: t('guestList.pending'),
      value: pending,
      icon: Clock,
      style: 'text-muted-foreground',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <stat.icon className={`h-5 w-5 ${stat.style || 'text-primary'}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
