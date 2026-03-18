import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuthStore } from '@/stores/auth-store';
import { brand } from '@/lib/branding';
import { SearchBar } from '@/features/search/components/search-bar';

export function PublicHeader() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  const isHomePage = location.pathname === '/';
  const isSearchPage = location.pathname === '/search';

  const navLinks = [
    { label: t('nav.search'), href: '/search' },
    { label: t('nav.categories'), href: '/categories' },
    { label: t('nav.deals'), href: '/deals' },
    { label: t('nav.events'), href: '/events' },
    { label: t('nav.cities'), href: '/cities' },
    { label: t('browse.recentlyAdded'), href: '/new' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            {brand.shortName}
          </div>
          <span className="font-semibold text-lg hidden sm:inline">
            {brand.name}
          </span>
        </Link>

        {/* Persistent search bar — hidden on home and search pages */}
        {!isHomePage && !isSearchPage && (
          <div className="hidden md:block flex-1 max-w-md">
            <SearchBar compact />
          </div>
        )}

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <Button variant="default" asChild>
                <Link to="/dashboard">{t('nav.dashboard')}</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">{t('nav.login')}</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">{t('nav.signUp')}</Link>
                </Button>
              </>
            )}
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>{brand.name}</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-6">
                {/* Mobile search bar */}
                {!isHomePage && !isSearchPage && (
                  <div className="pb-4 border-b">
                    <SearchBar compact />
                  </div>
                )}
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="text-sm font-medium"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="border-t pt-4 flex flex-col gap-2">
                  {isAuthenticated ? (
                    <Button asChild>
                      <Link to="/dashboard">{t('nav.dashboard')}</Link>
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" asChild>
                        <Link to="/login">{t('nav.login')}</Link>
                      </Button>
                      <Button asChild>
                        <Link to="/register">{t('nav.signUp')}</Link>
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
