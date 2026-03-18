import { useTranslation } from 'react-i18next';
import {
  Menu,
  LogOut,
  LayoutDashboard,
  Building2,
  Users,
  Shield,
  CreditCard,
  FileText,
  Layers,
  Settings,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { Link, useLocation } from 'react-router';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuthStore } from '@/stores/auth-store';
import { brand } from '@/lib/branding';
import { cn } from '@/lib/utils';

const navItems = [
  { labelKey: 'nav.dashboard', href: '/', icon: LayoutDashboard },
  { labelKey: 'nav.tenants', href: '/tenants', icon: Building2 },
  { labelKey: 'nav.verifications', href: '/verifications', icon: ShieldCheck },
  { labelKey: 'nav.reviews', href: '/reviews', icon: Star },
  { labelKey: 'nav.users', href: '/users', icon: Users },
  { labelKey: 'nav.roles', href: '/roles', icon: Shield },
  { labelKey: 'nav.subscriptions', href: '/subscriptions', icon: CreditCard },
  { labelKey: 'nav.auditLogs', href: '/audit-logs', icon: FileText },
  { labelKey: 'nav.jobs', href: '/jobs', icon: Layers },
  { labelKey: 'nav.settings', href: '/settings', icon: Settings },
];

export function Header() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'AD';

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4">
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="border-b p-4">
            <SheetTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                {brand.shortName}
              </div>
              {brand.name}
            </SheetTitle>
          </SheetHeader>
          <nav className="space-y-1 p-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{t(item.labelKey)}</span>
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Mobile brand */}
      <div className="flex items-center gap-2 md:hidden">
        <span className="font-semibold">{brand.name}</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t('auth.logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
