import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format';
import type { VendorSearchResult } from '../types';

interface VendorCardProps {
  vendor: VendorSearchResult;
}

export function VendorCard({ vendor }: VendorCardProps) {
  const { t } = useTranslation();

  return (
    <Link to={`/vendors/${vendor.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="aspect-[4/3] relative overflow-hidden bg-muted">
          {vendor.coverPhoto ? (
            <img
              src={vendor.coverPhoto}
              alt={vendor.name}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span className="text-4xl font-bold opacity-20">
                {vendor.name.charAt(0)}
              </span>
            </div>
          )}
          {vendor.featured && (
            <Badge className="absolute top-2 left-2">
              {t('search.featured')}
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold truncate">{vendor.name}</h3>
          <p className="text-sm text-muted-foreground">
            {vendor.category} · {vendor.location}
          </p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="text-sm font-medium">
                {vendor.rating.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">
                ({vendor.reviewCount})
              </span>
            </div>
            <span className="text-sm font-medium">
              {t('search.startingFrom', {
                price: formatCurrency(vendor.startingPrice),
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
