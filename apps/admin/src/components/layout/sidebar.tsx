import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Building2,
  Users,
  Shield,
  CreditCard,
  FileText,
  Layers,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { brand } from '@/lib/branding';

const STORAGE_KEY = 'saas_admin_sidebar_collapsed';

interface NavItem {
  labelKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { labelKey: 'nav.dashboard', href: '/', icon: LayoutDashboard },
  { labelKey: 'nav.tenants', href: '/tenants', icon: Building2 },
  { labelKey: 'nav.users', href: '/users', icon: Users },
  { labelKey: 'nav.roles', href: '/roles', icon: Shield },
  { labelKey: 'nav.subscriptions', href: '/subscriptions', icon: CreditCard },
  { labelKey: 'nav.auditLogs', href: '/audit-logs', icon: FileText },
  { labelKey: 'nav.jobs', href: '/jobs', icon: Layers },
  { labelKey: 'nav.settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'hidden md:flex md:flex-col border-r border-sidebar-border bg-sidebar-background transition-all duration-300',
          collapsed ? 'w-[68px]' : 'w-64',
        )}
      >
        {/* Brand */}
        <div
          className={cn(
            'flex h-14 items-center border-b border-sidebar-border px-4',
            collapsed && 'justify-center',
          )}
        >
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shrink-0">
              {brand.shortName}
            </div>
            {!collapsed && (
              <span className="font-semibold text-sidebar-foreground">
                {brand.name}
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const linkContent = (
              <Link
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  collapsed && 'justify-center px-2',
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{t(item.labelKey)}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">
                    {t(item.labelKey)}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{linkContent}</div>;
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="border-t border-sidebar-border p-2">
          <Button
            variant="ghost"
            size="icon"
            className={cn('w-full', !collapsed && 'justify-start px-3')}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
            {!collapsed && (
              <span className="ml-2 text-sm">{t('nav.collapse')}</span>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
