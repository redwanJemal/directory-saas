import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Star, BadgeCheck, Percent, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format';
import { motion } from '@/lib/motion';
import type { VendorSearchResult } from '../types';

interface VendorCardProps {
  vendor: VendorSearchResult;
}

export function VendorCard({ vendor }: VendorCardProps) {
  const { t } = useTranslation();

  const primaryCategory = vendor.categories?.find((c) => c.isPrimary)?.name
    ?? vendor.categories?.[0]?.name
    ?? vendor.category;

  return (
    <Link to={`/vendors/${vendor.id}`}>
      <motion.div
        whileHover={{ y: -6 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group h-full border-transparent hover:border-primary/20">
          <div className="aspect-[4/3] relative overflow-hidden bg-muted">
            {vendor.coverPhoto ? (
              <img
                src={vendor.coverPhoto}
                alt={vendor.name}
                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500 ease-out"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                <span className="text-5xl font-bold text-primary/20">
                  {vendor.name.charAt(0)}
                </span>
              </div>
            )}
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {vendor.verified && (
              <Badge variant="secondary" className="absolute top-2.5 left-2.5 gap-1 shadow-sm backdrop-blur-sm">
                <BadgeCheck className="h-3 w-3 text-primary" />
                {t('common.verified')}
              </Badge>
            )}
            {vendor.activeDeals > 0 && (
              <Badge className="absolute top-2.5 right-2.5 gap-1 bg-destructive text-destructive-foreground shadow-sm">
                <Percent className="h-3 w-3" />
                {vendor.activeDeals}
              </Badge>
            )}
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
              {vendor.name}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {primaryCategory} · {vendor.city}, {t(`countries.${vendor.country}`, { defaultValue: vendor.country })}
              </span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-semibold">
                  {vendor.rating.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({vendor.reviewCount})
                </span>
              </div>
              {vendor.startingPrice > 0 && (
                <span className="text-sm font-medium text-primary">
                  {t('search.startingFrom', {
                    price: formatCurrency(vendor.startingPrice),
                  })}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
