import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNotifications } from './NotificationContext';
import { useCompany } from '../company/context/CompanyContext';
import {
  Bell,
  CheckCheck,
  Clock,
  CalendarClock,
  Layers,
  BellOff,
  LayoutDashboard,
  type LucideIcon,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { AppNotification, NotificationGroupBy } from './types';

const DEFAULT_BRAND_COLOR = '#E53E3E';

function getIcon(name: string): LucideIcon {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  const pascalName = name
    .split('-')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
  return icons[pascalName] ?? LayoutDashboard;
}

/* ── Date helpers ── */

function isToday(d: Date): boolean {
  return d.toDateString() === new Date().toDateString();
}

function isYesterday(d: Date): boolean {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return d.toDateString() === y.toDateString();
}

function isTomorrow(d: Date): boolean {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return d.toDateString() === t.toDateString();
}

function isThisWeek(d: Date): boolean {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return d >= start && d < end;
}

function formatDateLabel(d: Date, t: (k: string, f?: string) => string): string {
  if (isToday(d)) return t('notifications.today', 'Idag');
  if (isYesterday(d)) return t('notifications.yesterday', 'Igår');
  if (isTomorrow(d)) return t('notifications.tomorrow', 'Imorgon');
  if (isThisWeek(d)) return t('notifications.thisWeek', 'Denna vecka');
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}

function formatDeadlineLabel(d: Date | undefined, t: (k: string, f?: string) => string): string {
  if (!d) return t('notifications.noDeadline', 'Ingen deadline');
  if (isToday(d)) return t('notifications.today', 'Idag');
  if (isTomorrow(d)) return t('notifications.tomorrow', 'Imorgon');
  if (d < new Date()) return t('notifications.overdue', 'Försenad');
  if (isThisWeek(d)) return t('notifications.thisWeek', 'Denna vecka');
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
}

/* ── Group notifications ── */

interface NotifGroup { label: string; items: AppNotification[] }

function groupNotifications(items: AppNotification[], groupBy: NotificationGroupBy, t: (k: string, f?: string) => string): NotifGroup[] {
  const map = new Map<string, AppNotification[]>();
  for (const n of items) {
    let key: string;
    switch (groupBy) {
      case 'created': key = formatDateLabel(n.createdAt, t); break;
      case 'deadline': key = formatDeadlineLabel(n.deadline, t); break;
      case 'module': key = t(n.moduleLabelKey, n.moduleLabel); break;
    }
    const arr = map.get(key) ?? [];
    arr.push(n);
    map.set(key, arr);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

/* ── Priority dot ── */

function PriorityDot({ priority }: { priority: AppNotification['priority'] }) {
  const c = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-blue-400' };
  return <span className={`absolute top-0.5 right-0.5 w-2 h-2 rounded-full ${c[priority]}`} />;
}

/* ── Notification row ── */

function NotificationRow({ notification: n, brandColor, onNavigate }: {
  notification: AppNotification;
  brandColor: string;
  onNavigate: (n: AppNotification) => void;
}) {
  const { t } = useTranslation();
  const { mute } = useNotifications();
  const Icon = n.icon ? getIcon(n.icon) : getIcon('bell');

  return (
    <div
      className="group relative flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-foreground/[0.04] transition-colors duration-100"
      onClick={() => onNavigate(n)}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') onNavigate(n); }}
    >
      <div className="relative shrink-0 mt-0.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${brandColor}15` }}>
          <Icon className="w-4 h-4" style={{ color: brandColor }} />
        </div>
        <PriorityDot priority={n.priority} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-foreground font-medium truncate">{n.title}</p>
        {n.description && <p className="text-[12px] text-muted-foreground truncate mt-0.5">{n.description}</p>}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] text-muted-foreground/60">{formatTime(n.createdAt)}</span>
          {n.deadline && (
            <>
              <span className="text-[11px] text-muted-foreground/40">·</span>
              <span className={`text-[11px] ${n.deadline < new Date() ? 'text-red-500' : 'text-muted-foreground/60'}`}>
                <CalendarClock className="w-3 h-3 inline mr-0.5 -mt-0.5" />
                {n.deadline.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
              </span>
            </>
          )}
        </div>
      </div>

      <button
        onClick={e => { e.stopPropagation(); mute(n.id); }}
        className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] transition-all shrink-0"
        title={t('notifications.mute', 'Tysta')}
      >
        <BellOff className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/* ── Group-by tabs ── */

const GROUP_OPTIONS: { key: NotificationGroupBy; icon: LucideIcon; labelKey: string; fallback: string }[] = [
  { key: 'created', icon: Clock, labelKey: 'notifications.groupByCreated', fallback: 'Skapad' },
  { key: 'deadline', icon: CalendarClock, labelKey: 'notifications.groupByDeadline', fallback: 'Deadline' },
  { key: 'module', icon: Layers, labelKey: 'notifications.groupByModule', fallback: 'Modul' },
];

/* ═══════════════════════════════════
   NotificationPanel — bell dropdown
   ═══════════════════════════════════ */

export function NotificationPanel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { notifications, bellCount, markAsRead, markAllAsRead } = useNotifications();
  const { activeCompany } = useCompany();
  const brandColor = activeCompany?.brand_color || DEFAULT_BRAND_COLOR;

  const [open, setOpen] = useState(false);
  const [groupBy, setGroupBy] = useState<NotificationGroupBy>('created');
  const panelRef = useRef<HTMLDivElement>(null);

  // Bell-visible items only: unread + not muted
  const bellItems = useMemo(() => notifications.filter(n => !n.read && !n.muted), [notifications]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const groups = useMemo(() => groupNotifications(bellItems, groupBy, t), [bellItems, groupBy, t]);

  const handleNavigate = (n: AppNotification) => {
    markAsRead(n.id);
    setOpen(false);
    navigate(n.path);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] transition-colors"
      >
        <Bell className="w-[18px] h-[18px]" />
        {bellCount > 0 && (
          <span
            className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1"
            style={{ backgroundColor: brandColor }}
          >
            {bellCount > 99 ? '99+' : bellCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-[380px] max-h-[520px] bg-card border border-border/60 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
            <h3 className="text-[14px] font-semibold text-foreground">
              {t('notifications.title', 'Notiser')}
              {bellCount > 0 && <span className="ml-2 text-[12px] font-medium text-muted-foreground">({bellCount})</span>}
            </h3>
            {bellCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] transition-colors"
                title={t('notifications.markAllRead', 'Markera alla som lästa')}
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Group-by tabs */}
          {bellItems.length > 0 && (
            <div className="flex items-center gap-0.5 px-3 py-2 border-b border-border/40">
              {GROUP_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setGroupBy(opt.key)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-medium transition-colors ${
                    groupBy === opt.key
                      ? 'bg-foreground/[0.07] text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]'
                  }`}
                >
                  <opt.icon className="w-3.5 h-3.5" />
                  {t(opt.labelKey, opt.fallback)}
                </button>
              ))}
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {bellItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bell className="w-8 h-8 mb-3 opacity-30" />
                <p className="text-[13px]">{t('notifications.empty', 'Inga notiser')}</p>
              </div>
            ) : (
              groups.map(g => (
                <div key={g.label}>
                  <div className="sticky top-0 bg-card/95 backdrop-blur-sm px-4 py-1.5 border-b border-border/20">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/60">{g.label}</span>
                  </div>
                  {g.items.map(n => (
                    <NotificationRow key={n.id} notification={n} brandColor={brandColor} onNavigate={handleNavigate} />
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Footer: link to todo module */}
          {bellItems.length > 0 && (
            <button
              onClick={() => { setOpen(false); navigate('/todo'); }}
              className="px-4 py-2.5 border-t border-border/40 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/[0.02] transition-colors text-center"
            >
              {t('notifications.viewAll', 'Visa alla i uppgifter →')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
