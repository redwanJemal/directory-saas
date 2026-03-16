import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Calendar, Mail, Phone, MapPin, Users, Package, DollarSign } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/status-badge';
import { useBooking } from '../hooks/use-bookings';

interface BookingDetailSheetProps {
  bookingId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingDetailSheet({
  bookingId,
  open,
  onOpenChange,
}: BookingDetailSheetProps) {
  const { t } = useTranslation();
  const { data: booking, isLoading } = useBooking(bookingId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('bookings.bookingDetails')}</SheetTitle>
        </SheetHeader>

        {isLoading && (
          <div className="py-8 text-center text-muted-foreground">
            {t('common.loading')}
          </div>
        )}

        {booking && (
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{booking.clientName}</h3>
              <StatusBadge status={booking.status} />
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                {t('bookings.clientInfo')}
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.clientEmail}</span>
                </div>
                {booking.clientPhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.clientPhone}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                {t('bookings.eventDetails')}
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(booking.eventDate), 'PPP')}</span>
                </div>
                {booking.eventVenue && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.eventVenue}</span>
                  </div>
                )}
                {booking.guestCount && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{t('bookings.guestCount', { count: booking.guestCount })}</span>
                  </div>
                )}
              </div>
            </div>

            {booking.packageName && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {t('bookings.package')}
                  </h4>
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.packageName}</span>
                  </div>
                </div>
              </>
            )}

            {booking.amount != null && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {t('bookings.quoteDetails')}
                  </h4>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'ETB',
                      }).format(booking.amount)}
                    </span>
                  </div>
                  {booking.quoteDescription && (
                    <p className="text-sm text-muted-foreground">
                      {booking.quoteDescription}
                    </p>
                  )}
                  {booking.quoteValidUntil && (
                    <p className="text-xs text-muted-foreground">
                      {t('bookings.validUntil', {
                        date: format(new Date(booking.quoteValidUntil), 'PPP'),
                      })}
                    </p>
                  )}
                </div>
              </>
            )}

            {booking.statusHistory && booking.statusHistory.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {t('bookings.statusHistory')}
                  </h4>
                  <div className="space-y-2">
                    {booking.statusHistory.map((entry, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize text-xs">
                            {entry.status}
                          </Badge>
                          {entry.notes && (
                            <span className="text-muted-foreground">{entry.notes}</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(entry.timestamp), 'PPp')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {booking.notes && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {t('bookings.notes')}
                  </h4>
                  <p className="text-sm">{booking.notes}</p>
                </div>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
