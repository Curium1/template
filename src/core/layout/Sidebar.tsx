import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/context/AuthContext';
import { useAuthorization } from '../authorization/context/AuthorizationContext';
import { useCompany } from '../company/context/CompanyContext';
import { useTheme } from '../theme/ThemeProvider';
import { moduleRegistry } from '../modules/moduleRegistry';
import {
  LayoutDashboard,
  LogOut,
  ChevronDown,
  ChevronUp,
  PanelLeftClose,
  PanelLeft,
  User,
  Sun,
  Moon,
  Monitor,
  type LucideIcon,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import type { NavigationItem } from '../modules/types';

/** Default brand color (red, matching Cyvra reference) */
const DEFAULT_BRAND_COLOR = '#E53E3E';

function getIcon(name: string): LucideIcon {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  const pascalName = name
    .split('-')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
  return icons[pascalName] ?? LayoutDashboard;
}

/* ─── Submenu Item ─── */
function SubMenuItem({
  item,
  collapsed,
  brandColor,
  isLast,
}: {
  item: NavigationItem;
  collapsed: boolean;
  brandColor: string;
  isLast: boolean;
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const isActive = location.pathname === item.path;

  if (collapsed) return null;

  return (
    <NavLink
      to={item.path}
      end
      className={() =>
        `relative flex items-center gap-3 pl-11 pr-3 py-1.5 text-[13px] transition-colors duration-100 ${
          isActive
            ? 'text-foreground font-medium'
            : 'text-muted-foreground hover:text-foreground'
        }`
      }
    >
      {/* Continuous thin connector line */}
      <span
        className="absolute left-[23px] top-0 w-[1px] bg-border/80"
        style={{ height: '100%' }}
      />
      {/* Active accent dash */}
      {isActive && (
        <span
          className="absolute left-[22px] top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full z-10"
          style={{ backgroundColor: brandColor }}
        />
      )}
      <span className="truncate">{t(item.labelKey, item.label)}</span>
    </NavLink>
  );
}

/* ─── Menu Group (expandable) ─── */
function MenuGroup({
  item,
  collapsed,
  brandColor,
}: {
  item: NavigationItem;
  collapsed: boolean;
  brandColor: string;
}) {
  const { t } = useTranslation();
  const { can } = useAuthorization();
  const location = useLocation();
  const navigate = useNavigate();

  const Icon = getIcon(item.icon);
  const hasChildren = item.children && item.children.length > 0;

  const visibleChildren = item.children?.filter(child => {
    if (child.requiredPermission) return can(child.requiredPermission);
    return true;
  }) ?? [];

  const isChildActive = visibleChildren.some(c => location.pathname === c.path);
  const isParentPathActive = location.pathname === item.path;
  const isAnyActive = isChildActive || isParentPathActive;

  const [isExpanded, setIsExpanded] = useState(isAnyActive);

  useEffect(() => {
    if (isAnyActive && !isExpanded) {
      setIsExpanded(true);
    }
  }, [isAnyActive]);

  // Collapsed view
  if (collapsed) {
    return (
      <NavLink
        to={item.path}
        className={() =>
          `flex items-center justify-center w-10 h-10 mx-auto rounded-lg transition-colors duration-100 ${
            isAnyActive
              ? 'bg-foreground/[0.07] text-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]'
          }`
        }
        title={t(item.labelKey, item.label)}
      >
        <Icon
          className="w-[18px] h-[18px] transition-colors duration-150"
          style={isAnyActive ? { color: brandColor } : undefined}
        />
      </NavLink>
    );
  }

  // No children → simple link
  if (!hasChildren || visibleChildren.length === 0) {
    return (
      <NavLink
        to={item.path}
        end
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors duration-100 ${
            isActive
              ? 'bg-foreground/[0.06] text-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Icon
              className="w-[18px] h-[18px] shrink-0 transition-colors duration-150"
              style={isActive ? { color: brandColor } : undefined}
            />
            <span className="truncate">{t(item.labelKey, item.label)}</span>
          </>
        )}
      </NavLink>
    );
  }

  // Has children → navigable header + expand/collapse
  const handleHeaderClick = () => {
    if (isExpanded) {
      navigate(item.path);
    } else {
      setIsExpanded(true);
      navigate(item.path);
    }
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  };

  return (
    <div>
      <button
        onClick={handleHeaderClick}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors duration-100 cursor-pointer ${
          isAnyActive
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]'
        }`}
      >
        <Icon
          className="w-[18px] h-[18px] shrink-0 transition-colors duration-150"
          style={isAnyActive ? { color: brandColor } : undefined}
        />
        <span className="truncate flex-1 text-left">{t(item.labelKey, item.label)}</span>
        <ChevronDown
          onClick={handleChevronClick}
          className={`w-3.5 h-3.5 shrink-0 text-muted-foreground transition-transform duration-200 hover:text-foreground ${
            isExpanded ? 'rotate-0' : '-rotate-90'
          }`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ease-out ${
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="py-0.5">
          {visibleChildren.map((child, idx) => (
            <SubMenuItem
              key={child.path}
              item={child}
              collapsed={collapsed}
              brandColor={brandColor}
              isLast={idx === visibleChildren.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Sidebar ─── */
interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

export function Sidebar({ collapsed, onToggle, isMobile }: SidebarProps) {
  const { t } = useTranslation();
  const { can, canAccessModule } = useAuthorization();
  const { activeCompany } = useCompany();

  const brandColor = activeCompany?.brand_color || DEFAULT_BRAND_COLOR;

  // On mobile, always show expanded
  const isCollapsed = isMobile ? false : collapsed;

  const dashboardItem: NavigationItem = {
    label: 'Översikt',
    labelKey: 'layout.dashboard',
    icon: 'layout-dashboard',
    path: '/',
    order: 0,
  };

  const moduleNav = moduleRegistry.getAllNavigation().filter(item => {
    if (item.requiredPermission) return can(item.requiredPermission);
    const moduleKey = item.path.split('/')[1];
    return moduleKey ? canAccessModule(moduleKey) : true;
  });

  return (
    <aside
      className={`h-full border-r border-border/60 flex flex-col bg-card transition-all duration-300 ease-out ${
        isCollapsed ? 'w-[60px]' : 'w-[240px]'
      }`}
    >
      {/* Brand + collapse/close toggle */}
      <div className={`h-14 flex items-center border-b border-border/40 ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
        {!isCollapsed && (
          <span className="text-[15px] font-semibold tracking-tight text-foreground truncate">
            {t('app.name')}
          </span>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] transition-colors"
          title={isMobile ? 'Stäng meny' : (isCollapsed ? 'Expandera meny' : 'Minimera meny')}
        >
          {isMobile ? (
            <LucideIcons.X className="w-[18px] h-[18px]" />
          ) : isCollapsed ? (
            <PanelLeft className="w-[18px] h-[18px]" />
          ) : (
            <PanelLeftClose className="w-[18px] h-[18px]" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 py-3 space-y-0.5 overflow-y-auto ${isCollapsed ? 'px-1.5' : 'px-2.5'}`}>
        <MenuGroup item={dashboardItem} collapsed={isCollapsed} brandColor={brandColor} />

        {/* Module section label */}
        {moduleNav.length > 0 && !isCollapsed && (
          <div className="pt-5 pb-1.5 px-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
              {t('layout.modules', 'Moduler')}
            </span>
          </div>
        )}
        {moduleNav.length > 0 && isCollapsed && <div className="h-4" />}

        {moduleNav.map(item => (
          <MenuGroup
            key={item.path}
            item={item}
            collapsed={isCollapsed}
            brandColor={brandColor}
          />
        ))}
      </nav>

      {/* User panel at bottom */}
      <SidebarUserPanel collapsed={isCollapsed} />
    </aside>
  );
}

/* ─── User Panel (sidebar bottom) ─── */

function SidebarUserPanel({ collapsed }: { collapsed: boolean }) {
  const { user, logout } = useAuth();
  const { roleName } = useAuthorization();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = (user?.displayName ?? user?.email ?? '')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (collapsed) {
    return (
      <div className="border-t border-border/40 p-1.5">
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center justify-center w-10 h-10 mx-auto rounded-full bg-foreground text-background text-[11px] font-semibold hover:bg-foreground/85 transition-colors"
          title={t('settings.title', 'Inställningar')}
        >
          {initials || <User className="w-4 h-4" />}
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-border/40 relative" ref={panelRef}>
      {/* Popover — opens upward */}
      {open && (
        <div className="absolute bottom-full left-2 right-2 mb-1 bg-card border border-border/60 rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Settings link */}
          <button
            onClick={() => {
              setOpen(false);
              navigate('/settings');
            }}
            className="w-full text-left px-3.5 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] flex items-center gap-2.5 border-b border-border/40"
          >
            <User className="w-3.5 h-3.5" />
            {t('settings.title', 'Inställningar')}
          </button>

          {/* Theme quick-toggle */}
          <div className="px-3.5 py-2 border-b border-border/40">
            <div className="flex gap-1">
              {([
                { key: 'light' as const, Icon: Sun },
                { key: 'dark' as const, Icon: Moon },
                { key: 'system' as const, Icon: Monitor },
              ]).map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setTheme(opt.key)}
                  title={t(`theme.${opt.key}`)}
                  className={`flex-1 flex items-center justify-center p-1.5 rounded-lg transition-colors ${
                    theme === opt.key
                      ? 'bg-foreground/10 text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]'
                  }`}
                >
                  <opt.Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>

          {/* Logout */}
          <div className="py-1">
            <button
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="w-full text-left px-3.5 py-1.5 text-[13px] text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] flex items-center gap-2.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              {t('auth.logout', 'Logga ut')}
            </button>
          </div>
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 w-full px-3 py-3 text-[13px] text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] transition-colors"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-foreground text-background text-[11px] font-semibold shrink-0">
          {initials || <User className="w-4 h-4" />}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-[13px] font-medium text-foreground truncate">
            {user?.displayName ?? user?.email}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            {roleName}
          </p>
        </div>
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 shrink-0" />
        )}
      </button>
    </div>
  );
}
