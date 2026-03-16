import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { format } from 'date-fns';
import { MessageSquare, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/status-badge';
import { api } from '@/lib/api';
import type { ApiPagedResponse } from '@/lib/types';

interface BookedVendor {
  id: string;
  vendorName: string;
  vendorPhoto?: string;
  category: string;
  status: string;
  packageName?: string;
  eventDate?: string;
  conversationId?: string;
}

function useMyBookings() {
  return useQuery({
    queryKey: ['bookings', 'me'],
    queryFn: async () => {
      const { data } = await api.get<ApiPagedResponse<BookedVendor>>(
        '/bookings/me?pageSize=50',
      );
      return data.data;
    },
  });
}

export function MyVendorsPage() {
  const { t } = useTranslation();
  const { data: bookings, isLoading } = useMyBookings();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t('nav.vendors')}</h1>
        <Button variant="outline" asChild>
          <Link to="/search">
            <Search className="mr-2 h-4 w-4" />
            {t('vendor.findMore')}
          </Link>
        </Button>
      </div>

      {!bookings || bookings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('common.noResults')}</p>
          <Button className="mt-4" asChild>
            <Link to="/search">{t('vendor.findMore')}</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-lg font-bold text-primary flex-shrink-0">
                    {booking.vendorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{booking.vendorName}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {booking.category}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <StatusBadge status={booking.status} />
                    </div>
                    {booking.packageName && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {booking.packageName}
                      </p>
                    )}
                    {booking.eventDate && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(booking.eventDate), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link to="/dashboard/messages">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {t('messages.quickMessage')}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
