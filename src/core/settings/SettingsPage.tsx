import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/context/AuthContext';
import { useAuthorization } from '../authorization/context/AuthorizationContext';
import { useCompany } from '../company/context/CompanyContext';
import { useTheme } from '../theme/ThemeProvider';
import { usePageHeader } from '../layout/usePageHeader';
import { supabase } from '../shared/api/supabaseClient';
import i18n from '../shared/i18n/i18n';
import {
  User,
  Sun,
  Moon,
  Monitor,
  Lock,
  Globe,
  Palette,
  Check,
  AlertCircle,
} from 'lucide-react';

export function SettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { roleName } = useAuthorization();
  const { activeCompany } = useCompany();
  const { theme, setTheme } = useTheme();

  usePageHeader({
    title: t('settings.title', 'Inställningar'),
    subtitle: t('settings.subtitle', 'Hantera ditt konto och dina inställningar.'),
  });

  // Profile state
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Language state
  const [language, setLanguage] = useState(i18n.language);

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user?.displayName) setDisplayName(user.displayName);
  }, [user?.displayName]);

  const memberSince = user?.supabaseUser?.created_at
    ? new Date(user.supabaseUser.created_at).toLocaleDateString(language, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  /* ── Profile save ── */
  async function handleProfileSave() {
    if (!user) return;
    setProfileSaving(true);
    setProfileError('');
    setProfileSaved(false);

    const { error } = await supabase
      .from('user_profiles')
      .update({ display_name: displayName })
      .eq('id', user.id);

    setProfileSaving(false);
    if (error) {
      setProfileError(error.message);
    } else {
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    }
  }

  /* ── Language change ── */
  async function handleLanguageChange(lng: string) {
    setLanguage(lng);
    i18n.changeLanguage(lng);
    if (user) {
      await supabase
        .from('user_profiles')
        .update({ locale: lng })
        .eq('id', user.id);
    }
  }

  /* ── Password change ── */
  async function handlePasswordChange() {
    setPasswordError('');
    setPasswordSaved(false);

    if (newPassword.length < 6) {
      setPasswordError(t('settings.passwordTooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('settings.passwordMismatch'));
      return;
    }

    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    setPasswordSaving(false);
    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSaved(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSaved(false), 3000);
    }
  }

  /* ── Styles ── */
  const labelClass = 'block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/60 mb-1';
  const inputClass =
    'w-full px-3 py-1.5 rounded-lg border border-border/60 bg-background text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors';
  const disabledInputClass =
    'w-full px-3 py-1.5 rounded-lg border border-border/30 bg-secondary/50 text-[13px] text-muted-foreground cursor-not-allowed';
  const btnPrimary =
    'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-foreground text-background text-[12px] font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const initials = (user?.displayName ?? user?.email ?? '')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 max-w-4xl">
      {/* ── Left Column: Profile ── */}
      <section className="bg-card border border-border/60 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border/40 flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <div>
            <h2 className="text-[13px] font-semibold text-foreground">{t('settings.profile')}</h2>
            <p className="text-[11px] text-muted-foreground">{t('settings.profileDescription')}</p>
          </div>
        </div>

        <div className="px-5 py-4">
          {/* Avatar row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-11 h-11 rounded-full bg-foreground text-background text-[14px] font-semibold shrink-0">
              {initials || <User className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-foreground truncate">{user?.displayName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>

          {/* Fields in 2-col grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {/* Display Name (editable) — full width */}
            <div className="col-span-2">
              <label className={labelClass}>{t('settings.displayName')}</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Email */}
            <div>
              <label className={labelClass}>{t('settings.email')}</label>
              <input type="text" value={user?.email ?? ''} disabled className={disabledInputClass} />
            </div>

            {/* Role */}
            <div>
              <label className={labelClass}>{t('settings.role')}</label>
              <input type="text" value={roleName} disabled className={disabledInputClass} />
            </div>

            {/* Company */}
            <div>
              <label className={labelClass}>{t('settings.company')}</label>
              <input type="text" value={activeCompany?.name ?? '—'} disabled className={disabledInputClass} />
            </div>

            {/* Member since */}
            <div>
              <label className={labelClass}>{t('settings.memberSince')}</label>
              <input type="text" value={memberSince} disabled className={disabledInputClass} />
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleProfileSave}
              disabled={profileSaving || displayName === user?.displayName}
              className={btnPrimary}
            >
              {profileSaving ? t('settings.saving') : t('settings.save')}
            </button>
            {profileSaved && (
              <span className="flex items-center gap-1 text-[11px] text-green-500 font-medium">
                <Check className="w-3 h-3" /> {t('settings.saved')}
              </span>
            )}
            {profileError && (
              <span className="flex items-center gap-1 text-[11px] text-destructive font-medium">
                <AlertCircle className="w-3 h-3" /> {profileError}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── Right Column: Appearance + Security stacked ── */}
      <div className="space-y-4">
        {/* Appearance */}
        <section className="bg-card border border-border/60 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border/40 flex items-center gap-2">
            <Palette className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-[13px] font-semibold text-foreground">{t('settings.appearance')}</h2>
          </div>

          <div className="px-5 py-4 space-y-3">
            {/* Theme */}
            <div>
              <label className={labelClass}>{t('theme.toggle')}</label>
              <div className="flex gap-1.5">
                {([
                  { key: 'light' as const, icon: Sun, label: t('theme.light') },
                  { key: 'dark' as const, icon: Moon, label: t('theme.dark') },
                  { key: 'system' as const, icon: Monitor, label: t('theme.system') },
                ]).map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setTheme(opt.key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border text-[12px] font-medium transition-all ${
                      theme === opt.key
                        ? 'border-foreground/30 bg-foreground/[0.06] text-foreground shadow-sm'
                        : 'border-border/40 text-muted-foreground hover:text-foreground hover:border-border/80'
                    }`}
                  >
                    <opt.icon className="w-3.5 h-3.5" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div>
              <label className={labelClass}>
                <Globe className="w-3 h-3 inline mr-1 -mt-0.5" />
                {t('settings.language')}
              </label>
              <div className="flex gap-1.5">
                {([
                  { key: 'sv', label: t('settings.languageSv'), flag: '🇸🇪' },
                  { key: 'en', label: t('settings.languageEn'), flag: '🇬🇧' },
                ]).map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => handleLanguageChange(opt.key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border text-[12px] font-medium transition-all ${
                      language === opt.key
                        ? 'border-foreground/30 bg-foreground/[0.06] text-foreground shadow-sm'
                        : 'border-border/40 text-muted-foreground hover:text-foreground hover:border-border/80'
                    }`}
                  >
                    <span className="text-[13px]">{opt.flag}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="bg-card border border-border/60 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border/40 flex items-center gap-2">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-[13px] font-semibold text-foreground">{t('settings.security')}</h2>
          </div>

          <div className="px-5 py-4 space-y-3">
            <div>
              <label className={labelClass}>{t('settings.newPassword')}</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>{t('settings.confirmPassword')}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePasswordChange}
                disabled={passwordSaving || !newPassword}
                className={btnPrimary}
              >
                {passwordSaving ? t('settings.saving') : t('settings.updatePassword')}
              </button>
              {passwordSaved && (
                <span className="flex items-center gap-1 text-[11px] text-green-500 font-medium">
                  <Check className="w-3 h-3" /> {t('settings.passwordUpdated')}
                </span>
              )}
              {passwordError && (
                <span className="flex items-center gap-1 text-[11px] text-destructive font-medium">
                  <AlertCircle className="w-3 h-3" /> {passwordError}
                </span>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
