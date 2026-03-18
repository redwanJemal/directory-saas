import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Seo } from '@/lib/seo';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  BadgeCheck,
  ChevronRight,
  Home,
  CalendarDays,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePublicEvents } from './hooks/use-events';
import { useCategories, useCountries, useCities } from '@/features/search/hooks/use-search';

export function EventsPage() {
  const { t } = useTranslation();
  const [country, setCountry] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [eventType, setEventType] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data: countries } = useCountries();
  const { data: cities } = useCities(country || undefined);
  const { data: categories } = useCategories();

  const { data, isLoading } = usePublicEvents({
    country: country || undefined,
    city: city || undefined,
    category: category || undefined,
    eventType: eventType || undefined,
    page,
    pageSize: 20,
  });

  const events = data?.data ?? [];
  const pagination = data?.pagination ?? null;

  const handleCountryChange = (value: string) => {
    setCountry(value);
    setCity('');
    setPage(1);
  };

  const clearFilters = () => {
    setCountry('');
    setCity('');
    setCategory('');
    setEventType('');
    setPage(1);
  };

  const hasFilters = country || city || category || eventType;

  return (
    <div className="container mx-auto px-4 py-8">
      <Seo
        title={t('seo.eventsTitle')}
        description={t('seo.eventsDescription')}
        canonicalPath="/events"
      />
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground transition-colors">
          <Home className="h-4 w-4" />
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{t('nav.events')}</span>
      </nav>

      <div className="text-center mb-8">
        <CalendarDays className="h-10 w-10 mx-auto text-primary mb-3" />
        <h1 className="text-3xl md:text-4xl font-bold">{t('events.pageTitle')}</h1>
        <p className="mt-2 text-muted-foreground">{t('events.pageSubtitle')}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={country} onValueChange={handleCountryChange}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t('search.allCountries')} />
          </SelectTrigger>
          <SelectContent>
            {countries?.map((c) => (
              <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={city} onValueChange={(v) => { setCity(v); setPage(1); }} disabled={!country}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t('search.allCities')} />
          </SelectTrigger>
          <SelectContent>
            {cities?.map((c) => (
              <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t('search.allCategories')} />
          </SelectTrigger>
          <SelectContent>
            {categories?.map((cat) => (
              <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={eventType} onValueChange={(v) => { setEventType(v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t('events.allTypes')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="business">{t('events.type_business')}</SelectItem>
            <SelectItem value="community">{t('events.type_community')}</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            {t('search.clearFilters')}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-[16/9] w-full" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16">
          <CalendarDays className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
          <p className="text-lg text-muted-foreground">{t('events.noEvents')}</p>
          {hasFilters && (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              {t('search.clearFilters')}
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {t('search.results', { count: pagination?.totalCount ?? events.length })}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {events.map((event) => {
              const eventDate = new Date(event.date);
              return (
                <Link key={event.id} to={`/vendors/${event.provider.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow group h-full">
                    <div className="aspect-[16/9] relative overflow-hidden bg-muted">
                      {event.imageUrl || event.provider.coverPhoto ? (
                        <img
                          src={event.imageUrl ?? event.provider.coverPhoto ?? ''}
                          alt={event.title}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/5">
                          <CalendarDays className="h-12 w-12 text-primary/20" />
                        </div>
                      )}
                      <Badge
                        className="absolute top-2 left-2"
                        variant={event.eventType === 'community' ? 'secondary' : 'default'}
                      >
                        {t(`events.type_${event.eventType}`)}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold truncate">{event.title}</h3>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {eventDate.toLocaleDateString()}
                        </span>
                        {event.time && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {event.time}
                          </span>
                        )}
                      </div>

                      {event.location && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          {event.provider.name}
                          {event.provider.verified && (
                            <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                          )}
                        </p>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {event.rsvpCount}
                          {event.maxAttendees && ` / ${event.maxAttendees}`}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPage(pagination.page - 1)}
              >
                {t('common.back')}
              </Button>
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                const startPage = Math.max(1, Math.min(pagination.page - 2, pagination.totalPages - 4));
                const p = startPage + i;
                if (p > pagination.totalPages) return null;
                return (
                  <Button
                    key={p}
                    variant={p === pagination.page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage(pagination.page + 1)}
              >
                {t('common.next')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
