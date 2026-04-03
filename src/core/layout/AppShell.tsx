import { useState, useCallback, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { PageMetaProvider } from './PageMetaContext';

const SIDEBAR_KEY = 'sidebar_collapsed';

/**
 * Main application shell — responsive layout:
 * - Desktop (≥768px): persistent sidebar (collapsible) + content area
 * - Mobile (<768px): sidebar hidden, hamburger in header opens overlay drawer
 */
export function AppShell() {
  const location = useLocation();

  // Desktop collapsed state (persisted)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Mobile drawer state
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem(SIDEBAR_KEY, String(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

  const openMobileMenu = useCallback(() => setMobileOpen(true), []);
  const closeMobileMenu = useCallback(() => setMobileOpen(false), []);

  // Auto-close mobile drawer on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <PageMetaProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Desktop sidebar — hidden on mobile */}
        <div className="hidden md:block">
          <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />
        </div>

        {/* Mobile sidebar drawer + backdrop */}
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden"
              onClick={closeMobileMenu}
            />
            {/* Drawer */}
            <div className="fixed inset-y-0 left-0 z-50 md:hidden animate-in slide-in-from-left duration-200">
              <Sidebar collapsed={false} onToggle={closeMobileMenu} isMobile />
            </div>
          </>
        )}

        {/* Content area */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
              <Header onOpenMobileMenu={openMobileMenu} />
              <div className="pb-8">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </PageMetaProvider>
  );
}
