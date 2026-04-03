import { useTranslation } from 'react-i18next';
import { useCompany } from '../company/context/CompanyContext';
import { usePageMeta } from './PageMetaContext';
import { NotificationPanel } from '../notifications';
import { ChevronDown, Menu } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  onOpenMobileMenu?: () => void;
}

/**
 * Header — hamburger (mobile) + title + subtitle (left), page actions + company/notifications (right).
 * User avatar lives in the Sidebar.
 */
export function Header({ onOpenMobileMenu }: HeaderProps) {
  const { t } = useTranslation();
  const { companies, activeCompany, switchCompany } = useCompany();
  const pageMeta = usePageMeta();

  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const companyRef = useRef<HTMLDivElement>(null);
  const hasMultipleCompanies = companies.length > 1;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (companyRef.current && !companyRef.current.contains(e.target as Node)) {
        setShowCompanyDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header>
      <div className="h-14 flex items-center justify-between gap-3">
        {/* Left: hamburger (mobile) + page title + subtitle */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Hamburger — mobile only */}
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-1.5 -ml-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] transition-colors shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            {pageMeta.title && (
              <h1 className="text-[15px] font-semibold tracking-tight text-foreground truncate">
                {pageMeta.title}
              </h1>
            )}
            {pageMeta.subtitle && (
              <p className="text-[13px] text-muted-foreground truncate hidden sm:block">
                {pageMeta.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: page actions + company + notifications */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Company name/switcher */}
          <div className="relative" ref={companyRef}>
            {hasMultipleCompanies ? (
              <button
                onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] transition-colors"
              >
                <span className="truncate max-w-[140px]">
                  {activeCompany?.name ?? t('app.loading')}
                </span>
                <ChevronDown className="w-3 h-3 shrink-0" />
              </button>
            ) : (
              <span className="hidden sm:inline px-3 py-1.5 text-[13px] font-medium text-muted-foreground">
                {activeCompany?.name ?? ''}
              </span>
            )}

            {showCompanyDropdown && hasMultipleCompanies && (
              <div className="absolute top-full right-0 mt-1 w-52 bg-card border border-border/60 rounded-xl shadow-lg py-1 z-50">
                {companies.map(company => (
                  <button
                    key={company.id}
                    onClick={() => {
                      switchCompany(company.id);
                      setShowCompanyDropdown(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-[13px] hover:bg-foreground/[0.04] ${
                      company.id === activeCompany?.id
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {company.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notification panel (bell icon + dropdown) */}
          <NotificationPanel />

          {/* Page-specific actions (far right) */}
          {pageMeta.actions && (
            <div className="flex items-center gap-2 ml-1 sm:ml-2">
              {pageMeta.actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
