import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Repeat,
  ChevronDown,
  CalendarDays,
  Briefcase,
  Hash,
} from 'lucide-react';
import { useNotifications } from '../../notifications';
import type {
  NotificationPriority,
  RecurrenceFrequency,
  RecurrenceRule,
  Weekday,
  WeekdayPosition,
  MonthlyMode,
} from '../../notifications/types';

/* ── Constants ── */

const WEEKDAY_LABELS_SV = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];
const WEEKDAY_LABELS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAY_KEYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

const MONTH_LABELS_SV = ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'];
const MONTH_LABELS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const POSITION_OPTIONS: { value: WeekdayPosition; sv: string; en: string }[] = [
  { value: 'first', sv: 'Första', en: 'First' },
  { value: 'second', sv: 'Andra', en: 'Second' },
  { value: 'third', sv: 'Tredje', en: 'Third' },
  { value: 'fourth', sv: 'Fjärde', en: 'Fourth' },
  { value: 'last', sv: 'Sista', en: 'Last' },
];

const PRIORITY_OPTIONS: { value: NotificationPriority; sv: string; en: string; color: string }[] = [
  { value: 'low', sv: 'Låg', en: 'Low', color: 'bg-blue-400' },
  { value: 'medium', sv: 'Medel', en: 'Medium', color: 'bg-amber-500' },
  { value: 'high', sv: 'Hög', en: 'High', color: 'bg-red-500' },
];

const FREQUENCY_OPTIONS: { value: RecurrenceFrequency; svLabel: string; enLabel: string }[] = [
  { value: 'daily', svLabel: 'Dagligen', enLabel: 'Daily' },
  { value: 'weekly', svLabel: 'Veckovis', enLabel: 'Weekly' },
  { value: 'monthly', svLabel: 'Månadsvis', enLabel: 'Monthly' },
  { value: 'yearly', svLabel: 'Årligen', enLabel: 'Yearly' },
];

const MONTHLY_MODE_OPTIONS: { value: MonthlyMode; svLabel: string; enLabel: string; icon: typeof CalendarDays }[] = [
  { value: 'day_of_month', svLabel: 'Dag i månaden', enLabel: 'Day of month', icon: CalendarDays },
  { value: 'weekday_position', svLabel: 'Veckodag', enLabel: 'Weekday position', icon: CalendarDays },
  { value: 'workday', svLabel: 'Arbetsdag', enLabel: 'Workday', icon: Briefcase },
];

/* ── Shared styles ── */

const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-[14px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all';
const selectClass = 'px-3.5 py-2.5 rounded-xl border border-border bg-background text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 appearance-none cursor-pointer';
const labelClass = 'block text-[13px] font-medium text-foreground mb-1.5';

/* ═══════════════════════════════════════
   Weekday Picker (used for weekly recurrence)
   ═══════════════════════════════════════ */

function WeekdayPicker({ selected, onChange, language }: {
  selected: Weekday[];
  onChange: (days: Weekday[]) => void;
  language: string;
}) {
  const labels = language === 'sv' ? WEEKDAY_LABELS_SV : WEEKDAY_LABELS_EN;

  const toggle = (day: Weekday) => {
    const next = selected.includes(day)
      ? selected.filter(d => d !== day)
      : [...selected, day].sort();
    onChange(next);
  };

  return (
    <div className="flex gap-1.5">
      {WEEKDAY_KEYS.map(day => {
        const active = selected.includes(day);
        return (
          <button
            key={day}
            type="button"
            onClick={() => toggle(day)}
            className={`
              w-9 h-9 rounded-lg text-[12px] font-semibold transition-all duration-150
              ${active
                ? 'bg-foreground text-background shadow-sm'
                : 'bg-foreground/[0.04] text-muted-foreground hover:bg-foreground/[0.08] hover:text-foreground'
              }
            `}
          >
            {labels[day].charAt(0)}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════
   Interval Selector (every N weeks/months/etc)
   ═══════════════════════════════════════ */

function IntervalSelector({ value, onChange, unitSv, unitEn, language, max = 52 }: {
  value: number;
  onChange: (n: number) => void;
  unitSv: string;
  unitEn: string;
  language: string;
  max?: number;
}) {
  const unit = language === 'sv' ? unitSv : unitEn;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[13px] text-muted-foreground shrink-0">
        {language === 'sv' ? 'Var' : 'Every'}
      </span>
      <input
        type="number"
        min={1}
        max={max}
        value={value}
        onChange={e => onChange(Math.max(1, Math.min(max, parseInt(e.target.value) || 1)))}
        className="w-16 px-2.5 py-1.5 rounded-lg border border-border bg-background text-[14px] text-foreground text-center focus:outline-none focus:ring-2 focus:ring-foreground/10"
      />
      <span className="text-[13px] text-muted-foreground">
        {value === 1
          ? unit
          : `${unit}`
        }
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════
   Monthly Options Panel
   ═══════════════════════════════════════ */

function MonthlyOptions({ rule, onChange, language }: {
  rule: RecurrenceRule;
  onChange: (patch: Partial<RecurrenceRule>) => void;
  language: string;
}) {
  const mode = rule.monthlyMode ?? 'day_of_month';
  const weekdayLabels = language === 'sv' ? WEEKDAY_LABELS_SV : WEEKDAY_LABELS_EN;
  const posLabels = language === 'sv' ? POSITION_OPTIONS.map(p => p.sv) : POSITION_OPTIONS.map(p => p.en);

  return (
    <div className="space-y-3">
      {/* Mode selector */}
      <div className="flex gap-1.5 p-1 bg-foreground/[0.02] rounded-xl border border-border/40">
        {MONTHLY_MODE_OPTIONS.map(opt => {
          const active = mode === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ monthlyMode: opt.value })}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                active
                  ? 'bg-foreground/[0.07] text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <opt.icon className="w-3.5 h-3.5" />
              {language === 'sv' ? opt.svLabel : opt.enLabel}
            </button>
          );
        })}
      </div>

      {/* Mode-specific options */}
      {mode === 'day_of_month' && (
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-muted-foreground">
            {language === 'sv' ? 'Dag' : 'Day'}
          </span>
          <input
            type="number"
            min={1}
            max={31}
            value={rule.dayOfMonth ?? 1}
            onChange={e => onChange({ dayOfMonth: Math.max(1, Math.min(31, parseInt(e.target.value) || 1)) })}
            className="w-16 px-2.5 py-1.5 rounded-lg border border-border bg-background text-[14px] text-foreground text-center focus:outline-none focus:ring-2 focus:ring-foreground/10"
          />
          <span className="text-[13px] text-muted-foreground">
            {language === 'sv' ? 'i månaden' : 'of the month'}
          </span>
        </div>
      )}

      {mode === 'weekday_position' && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={rule.weekdayPosition ?? 'first'}
              onChange={e => onChange({ weekdayPosition: e.target.value as WeekdayPosition })}
              className={selectClass + ' pr-8'}
            >
              {POSITION_OPTIONS.map((opt, i) => (
                <option key={opt.value} value={opt.value}>{posLabels[i]}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={rule.weekday ?? 0}
              onChange={e => onChange({ weekday: parseInt(e.target.value) as Weekday })}
              className={selectClass + ' pr-8'}
            >
              {WEEKDAY_KEYS.map(d => (
                <option key={d} value={d}>{weekdayLabels[d]}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
          <span className="text-[13px] text-muted-foreground">
            {language === 'sv' ? 'i månaden' : 'of the month'}
          </span>
        </div>
      )}

      {mode === 'workday' && (
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-muted-foreground">
            {language === 'sv' ? 'Arbetsdag' : 'Workday'}
          </span>
          <input
            type="number"
            min={1}
            max={23}
            value={rule.workdayNumber ?? 1}
            onChange={e => onChange({ workdayNumber: Math.max(1, Math.min(23, parseInt(e.target.value) || 1)) })}
            className="w-16 px-2.5 py-1.5 rounded-lg border border-border bg-background text-[14px] text-foreground text-center focus:outline-none focus:ring-2 focus:ring-foreground/10"
          />
          <span className="text-[13px] text-muted-foreground">
            {language === 'sv' ? 'i månaden' : 'of the month'}
          </span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   Yearly Options Panel
   ═══════════════════════════════════════ */

function YearlyOptions({ rule, onChange, language }: {
  rule: RecurrenceRule;
  onChange: (patch: Partial<RecurrenceRule>) => void;
  language: string;
}) {
  const monthLabels = language === 'sv' ? MONTH_LABELS_SV : MONTH_LABELS_EN;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <select
          value={rule.month ?? 0}
          onChange={e => onChange({ month: parseInt(e.target.value) })}
          className={selectClass + ' pr-8'}
        >
          {monthLabels.map((label, i) => (
            <option key={i} value={i}>{label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
      </div>
      <span className="text-[13px] text-muted-foreground">
        {language === 'sv' ? 'dag' : 'day'}
      </span>
      <input
        type="number"
        min={1}
        max={31}
        value={rule.dayOfMonth ?? 1}
        onChange={e => onChange({ dayOfMonth: Math.max(1, Math.min(31, parseInt(e.target.value) || 1)) })}
        className="w-16 px-2.5 py-1.5 rounded-lg border border-border bg-background text-[14px] text-foreground text-center focus:outline-none focus:ring-2 focus:ring-foreground/10"
      />
    </div>
  );
}

/* ═══════════════════════════════════════
   Recurrence Summary
   ═══════════════════════════════════════ */

function recurrenceSummary(rule: RecurrenceRule, language: string): string {
  const weekdayLabels = language === 'sv' ? WEEKDAY_LABELS_SV : WEEKDAY_LABELS_EN;
  const posLabels = POSITION_OPTIONS.map(p => language === 'sv' ? p.sv.toLowerCase() : p.en.toLowerCase());
  const monthLabels = language === 'sv' ? MONTH_LABELS_SV : MONTH_LABELS_EN;
  const every = language === 'sv' ? 'Var' : 'Every';

  switch (rule.frequency) {
    case 'daily':
      return rule.interval === 1
        ? (language === 'sv' ? 'Varje dag' : 'Every day')
        : `${every} ${rule.interval} ${language === 'sv' ? 'dagar' : 'days'}`;
    case 'weekly': {
      const days = (rule.weekdays ?? []).map(d => weekdayLabels[d]).join(', ');
      const base = rule.interval === 1
        ? (language === 'sv' ? 'Varje vecka' : 'Every week')
        : `${every} ${rule.interval} ${language === 'sv' ? 'veckor' : 'weeks'}`;
      return days ? `${base} — ${days}` : base;
    }
    case 'monthly': {
      const base = rule.interval === 1
        ? (language === 'sv' ? 'Varje månad' : 'Every month')
        : `${every} ${rule.interval} ${language === 'sv' ? 'månader' : 'months'}`;
      switch (rule.monthlyMode) {
        case 'weekday_position':
          return `${base} — ${posLabels[POSITION_OPTIONS.findIndex(p => p.value === rule.weekdayPosition)] ?? ''} ${weekdayLabels[rule.weekday ?? 0]}`;
        case 'workday':
          return `${base} — ${language === 'sv' ? 'arbetsdag' : 'workday'} ${rule.workdayNumber ?? 1}`;
        default:
          return `${base} — ${language === 'sv' ? 'dag' : 'day'} ${rule.dayOfMonth ?? 1}`;
      }
    }
    case 'yearly': {
      const base = rule.interval === 1
        ? (language === 'sv' ? 'Varje år' : 'Every year')
        : `${every} ${rule.interval} ${language === 'sv' ? 'år' : 'years'}`;
      return `${base} — ${monthLabels[rule.month ?? 0]} ${rule.dayOfMonth ?? 1}`;
    }
  }
}

/* ═══════════════════════════════════════
   TaskCreateModal
   ═══════════════════════════════════════ */

export function TaskCreateModal({ onClose }: { onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const { push } = useNotifications();
  const lang = i18n.language.startsWith('sv') ? 'sv' : 'en';

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<NotificationPriority>('medium');
  const [deadline, setDeadline] = useState('');
  const [icon, setIcon] = useState('check-square');

  // Recurrence state
  const [isRecurring, setIsRecurring] = useState(false);
  const [rule, setRule] = useState<RecurrenceRule>({
    frequency: 'weekly',
    interval: 1,
    weekdays: [0, 1, 2, 3, 4], // Mon-Fri
    monthlyMode: 'day_of_month',
    dayOfMonth: 1,
    weekdayPosition: 'first',
    weekday: 0,
    workdayNumber: 1,
    month: 0,
  });

  const patchRule = (patch: Partial<RecurrenceRule>) => setRule(prev => ({ ...prev, ...patch }));

  const freqUnit = {
    daily: { sv: 'dag(ar)', en: 'day(s)' },
    weekly: { sv: 'vecka/veckor', en: 'week(s)' },
    monthly: { sv: 'månad(er)', en: 'month(s)' },
    yearly: { sv: 'år', en: 'year(s)' },
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    push({
      moduleKey: 'todo',
      moduleLabel: lang === 'sv' ? 'Uppgifter' : 'Tasks',
      moduleLabelKey: 'modules.todo.name',
      title: title.trim(),
      description: description.trim() || undefined,
      icon,
      path: '/todo',
      priority,
      createdAt: new Date(),
      deadline: deadline ? new Date(deadline) : undefined,
      recurrence: isRecurring ? { ...rule } : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/10 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card border border-border/60 rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
          <h2 className="text-[17px] font-semibold text-foreground">
            {t('modules.todo.createTask', 'Skapa uppgift')}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-5">
            {/* Title */}
            <div>
              <label className={labelClass}>{t('modules.todo.taskTitle', 'Titel')}</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                autoFocus
                className={inputClass}
                placeholder={lang === 'sv' ? 'Vad behöver göras?' : 'What needs to be done?'}
              />
            </div>

            {/* Description */}
            <div>
              <label className={labelClass}>{t('modules.todo.taskDescription', 'Beskrivning')}</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                className={inputClass + ' resize-none'}
                placeholder={lang === 'sv' ? 'Valfri beskrivning...' : 'Optional description...'}
              />
            </div>

            {/* Priority + Deadline row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t('modules.todo.taskPriority', 'Prioritet')}</label>
                <div className="flex gap-1.5">
                  {PRIORITY_OPTIONS.map(opt => {
                    const active = priority === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPriority(opt.value)}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[13px] font-medium border transition-all ${
                          active
                            ? 'border-foreground/20 bg-foreground/[0.06] text-foreground shadow-sm'
                            : 'border-border bg-background text-muted-foreground hover:bg-foreground/[0.03]'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${opt.color}`} />
                        {lang === 'sv' ? opt.sv : opt.en}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className={labelClass}>{t('modules.todo.taskDeadline', 'Deadline')}</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* ── Recurrence toggle ── */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsRecurring(!isRecurring)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border w-full text-left transition-all ${
                  isRecurring
                    ? 'border-foreground/20 bg-foreground/[0.04] text-foreground'
                    : 'border-border bg-background text-muted-foreground hover:bg-foreground/[0.02]'
                }`}
              >
                <Repeat className={`w-4 h-4 transition-colors ${isRecurring ? 'text-foreground' : 'text-muted-foreground/50'}`} />
                <span className="text-[14px] font-medium flex-1">
                  {t('modules.todo.repeats', 'Upprepning')}
                </span>
                {isRecurring && (
                  <span className="text-[12px] text-muted-foreground">
                    {recurrenceSummary(rule, lang)}
                  </span>
                )}
                <ChevronDown className={`w-4 h-4 text-muted-foreground/50 transition-transform ${isRecurring ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* ── Recurrence settings (collapsible) ── */}
            {isRecurring && (
              <div className="space-y-4 pl-1 border-l-2 border-foreground/[0.06] ml-2 pl-5 animate-in slide-in-from-top-1 duration-200">
                {/* Frequency selector */}
                <div>
                  <label className={labelClass}>
                    {t('modules.todo.recurrenceFrequency', 'Frekvens')}
                  </label>
                  <div className="flex gap-1.5">
                    {FREQUENCY_OPTIONS.map(opt => {
                      const active = rule.frequency === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => patchRule({ frequency: opt.value })}
                          className={`flex-1 px-2 py-2 rounded-xl text-[12px] font-medium border transition-all ${
                            active
                              ? 'border-foreground/20 bg-foreground/[0.06] text-foreground shadow-sm'
                              : 'border-border bg-background text-muted-foreground hover:bg-foreground/[0.03]'
                          }`}
                        >
                          {lang === 'sv' ? opt.svLabel : opt.enLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Interval */}
                <IntervalSelector
                  value={rule.interval}
                  onChange={n => patchRule({ interval: n })}
                  unitSv={freqUnit[rule.frequency].sv}
                  unitEn={freqUnit[rule.frequency].en}
                  language={lang}
                />

                {/* ── Frequency-specific options ── */}

                {/** WEEKLY: weekday picker */}
                {rule.frequency === 'weekly' && (
                  <div>
                    <label className={labelClass}>
                      {t('modules.todo.onTheseDays', 'Dessa dagar')}
                    </label>
                    <WeekdayPicker
                      selected={rule.weekdays ?? []}
                      onChange={weekdays => patchRule({ weekdays })}
                      language={lang}
                    />
                  </div>
                )}

                {/** MONTHLY: mode selector + options */}
                {rule.frequency === 'monthly' && (
                  <MonthlyOptions rule={rule} onChange={patchRule} language={lang} />
                )}

                {/** YEARLY: month + day picker */}
                {rule.frequency === 'yearly' && (
                  <div>
                    <label className={labelClass}>
                      {t('modules.todo.yearlyDate', 'Datum')}
                    </label>
                    <YearlyOptions rule={rule} onChange={patchRule} language={lang} />
                  </div>
                )}

                {/* Summary preview */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-foreground/[0.02] border border-border/30">
                  <Hash className="w-3.5 h-3.5 text-muted-foreground/50" />
                  <span className="text-[12px] text-muted-foreground italic">
                    {recurrenceSummary(rule, lang)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-border/40">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-border text-[14px] font-medium text-foreground hover:bg-foreground/[0.04] transition-colors"
            >
              {t('modules.todo.cancel', 'Avbryt')}
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 py-2.5 px-4 rounded-xl bg-foreground text-background text-[14px] font-medium hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t('modules.todo.createTask', 'Skapa uppgift')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
