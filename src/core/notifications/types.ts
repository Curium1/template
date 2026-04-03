/**
 * Notification / Todo system types.
 * Modules push notifications via useNotifications().push().
 * Items appear in the bell (unread) and the Todo module (all statuses).
 */

export type NotificationPriority = 'low' | 'medium' | 'high';

export type TodoStatus = 'new' | 'in_progress' | 'done';

/* ── Recurrence ─────────────────────── */

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

/** 0 = Mon, 1 = Tue, ..., 6 = Sun */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type WeekdayPosition = 'first' | 'second' | 'third' | 'fourth' | 'last';

export type MonthlyMode = 'day_of_month' | 'weekday_position' | 'workday';

export interface RecurrenceRule {
  /** Frequency type */
  frequency: RecurrenceFrequency;

  /** Repeat every N (days / weeks / months / years), default 1 */
  interval: number;

  /* ── Weekly ── */

  /** Which weekdays to repeat on (Mon=0 ... Sun=6) */
  weekdays?: Weekday[];

  /* ── Monthly ── */

  /** How to pick the day within the month */
  monthlyMode?: MonthlyMode;

  /** For 'day_of_month': specific day (1–31) */
  dayOfMonth?: number;

  /** For 'weekday_position': which occurrence */
  weekdayPosition?: WeekdayPosition;

  /** For 'weekday_position': which weekday */
  weekday?: Weekday;

  /** For 'workday': the N-th workday of the month */
  workdayNumber?: number;

  /* ── Yearly ── */

  /** Month (0=Jan ... 11=Dec) — used by yearly */
  month?: number;
}

/* ── Notification / Todo item ─────────── */

export interface AppNotification {
  /** Unique ID (auto-generated if omitted) */
  id: string;

  /** Module key that created this notification (e.g. 'dummy', 'user_admin') */
  moduleKey: string;

  /** Human-readable module label (for grouping UI) */
  moduleLabel: string;

  /** i18n key for the module label */
  moduleLabelKey: string;

  /** Notification title */
  title: string;

  /** Optional longer description */
  description?: string;

  /** Lucide icon name (defaults to module's nav icon) */
  icon?: string;

  /** Route path to navigate to when clicked */
  path: string;

  /** When the notification was created */
  createdAt: Date;

  /** Optional deadline (enables deadline grouping) */
  deadline?: Date;

  /** Priority level */
  priority: NotificationPriority;

  /** Whether the user has read this notification (read = gone from bell) */
  read: boolean;

  /** Todo status for kanban/list tracking */
  status: TodoStatus;

  /** Muted = hidden from bell immediately, still visible in todo module */
  muted: boolean;

  /** Optional recurrence rule (manual tasks only) */
  recurrence?: RecurrenceRule;
}

export type NotificationGroupBy = 'created' | 'deadline' | 'module';
