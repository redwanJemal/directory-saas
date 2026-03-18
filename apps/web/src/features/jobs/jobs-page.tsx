import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Briefcase,
  MapPin,
  DollarSign,
  BadgeCheck,
  ChevronRight,
  Home,
  Clock,
  Search,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { usePublicJobs, useApplyToJobMutation, type PublicJob } from './hooks/use-jobs';
import { useCountries, useCities } from '@/features/search/hooks/use-search';

export function JobsPage() {
  const { t } = useTranslation();
  const [country, setCountry] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [jobType, setJobType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState(1);
  const [applyingJob, setApplyingJob] = useState<PublicJob | null>(null);

  const { data: countries } = useCountries();
  const { data: cities } = useCities(country || undefined);

  const { data, isLoading } = usePublicJobs({
    country: country || undefined,
    city: city || undefined,
    type: jobType || undefined,
    search: searchQuery || undefined,
    page,
    pageSize: 20,
  });

  const jobs = data?.data ?? [];
  const pagination = data?.pagination ?? null;

  const handleCountryChange = (value: string) => {
    setCountry(value);
    setCity('');
    setPage(1);
  };

  const clearFilters = () => {
    setCountry('');
    setCity('');
    setJobType('');
    setSearchQuery('');
    setPage(1);
  };

  const hasFilters = country || city || jobType || searchQuery;

  const formatSalary = (job: PublicJob) => {
    if (!job.salaryMin && !job.salaryMax) return null;
    if (job.salaryMin && job.salaryMax) {
      return `${job.salaryCurrency} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`;
    }
    if (job.salaryMin) return `${job.salaryCurrency} ${job.salaryMin.toLocaleString()}+`;
    return `${t('jobs.upTo')} ${job.salaryCurrency} ${job.salaryMax?.toLocaleString()}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground transition-colors">
          <Home className="h-4 w-4" />
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{t('nav.jobs')}</span>
      </nav>

      <div className="text-center mb-8">
        <Briefcase className="h-10 w-10 mx-auto text-primary mb-3" />
        <h1 className="text-3xl md:text-4xl font-bold">{t('jobs.pageTitle')}</h1>
        <p className="mt-2 text-muted-foreground">{t('jobs.pageSubtitle')}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 w-52"
            placeholder={t('jobs.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          />
        </div>

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

        <Select value={jobType} onValueChange={(v) => { setJobType(v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t('jobs.allTypes')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full-time">{t('jobs.type_full-time')}</SelectItem>
            <SelectItem value="part-time">{t('jobs.type_part-time')}</SelectItem>
            <SelectItem value="freelance">{t('jobs.type_freelance')}</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            {t('search.clearFilters')}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
          <p className="text-lg text-muted-foreground">{t('jobs.noJobs')}</p>
          {hasFilters && (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              {t('search.clearFilters')}
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {t('search.results', { count: pagination?.totalCount ?? jobs.length })}
          </p>
          <div className="space-y-4">
            {jobs.map((job) => {
              const salary = formatSalary(job);
              return (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg truncate">{job.title}</h3>
                          <Badge variant={job.type === 'full-time' ? 'default' : 'secondary'}>
                            {t(`jobs.type_${job.type}`)}
                          </Badge>
                        </div>

                        <Link
                          to={`/vendors/${job.provider.slug}`}
                          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                          {job.provider.name}
                          {job.provider.verified && (
                            <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                          )}
                        </Link>

                        {job.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {job.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                          {(job.city || job.country) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {[job.city, job.country].filter(Boolean).join(', ')}
                            </span>
                          )}
                          {salary && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3.5 w-3.5" />
                              {salary}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(job.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <Button size="sm" onClick={() => setApplyingJob(job)}>
                        {t('jobs.apply')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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

      {/* Apply Dialog */}
      <ApplyDialog
        open={!!applyingJob}
        onOpenChange={() => setApplyingJob(null)}
        job={applyingJob}
      />
    </div>
  );
}

function ApplyDialog({ open, onOpenChange, job }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: PublicJob | null;
}) {
  const { t } = useTranslation();
  const applyMutation = useApplyToJobMutation();
  const [form, setForm] = useState({
    applicantName: '',
    phone: '',
    email: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;

    try {
      await applyMutation.mutateAsync({
        jobId: job.id,
        applicantName: form.applicantName,
        phone: form.phone || undefined,
        email: form.email || undefined,
        message: form.message || undefined,
      });
      toast.success(t('jobs.applicationSent'));
      setForm({ applicantName: '', phone: '', email: '', message: '' });
      onOpenChange(false);
    } catch {
      toast.error(t('errors.serverError'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('jobs.applyTo', { title: job?.title ?? '' })}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="applicantName">{t('jobs.applicantName')}</Label>
            <Input
              id="applicantName"
              required
              value={form.applicantName}
              onChange={(e) => setForm((p) => ({ ...p, applicantName: e.target.value }))}
            />
          </div>
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">{t('jobs.phone')}</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('jobs.email')}</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">{t('jobs.message')}</Label>
            <Textarea
              id="message"
              rows={3}
              value={form.message}
              onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
              placeholder={t('jobs.messagePlaceholder')}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={applyMutation.isPending}>
              {t('jobs.submitApplication')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
