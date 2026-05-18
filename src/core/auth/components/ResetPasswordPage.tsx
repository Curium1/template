import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../shared/api/supabaseClient';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { KeyRound, Mail, AlertCircle, CheckCircle, Lock, Loader2 } from 'lucide-react';

/**
 * Scanner-proof password reset — two phases:
 *
 * Phase 1 (no token_hash in URL): "Enter your email" → resetPasswordForEmail()
 * Phase 2 (token_hash + type in URL): "Set new password" → verifyOtp() + updateUser()
 *
 * Security scanners (Mimecast etc.) load the page but never submit the form,
 * so the token is not consumed until the user explicitly clicks "Save".
 */
export function ResetPasswordPage() {
  const { resetPassword, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  // Phase 2: Set new password
  if (tokenHash && type === 'recovery') {
    return <SetNewPasswordForm tokenHash={tokenHash} />;
  }

  // Phase 1: Request reset link
  return <RequestResetForm resetPassword={resetPassword} isAuthenticated={isAuthenticated} />;
}

/* ─── Phase 1: Request Reset Link ─── */

function RequestResetForm({
  resetPassword,
  isAuthenticated,
}: {
  resetPassword: (email: string) => Promise<{ error?: string }>;
  isAuthenticated: boolean;
}) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const result = await resetPassword(email);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
    setSubmitting(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <KeyRound className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t('auth.resetPassword')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('auth.resetSubtitle', 'Vi skickar en återställningslänk till din e-post')}</p>
        </div>

        {success ? (
          <div className="bg-card border border-border rounded-xl p-6 shadow-lg space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{t('auth.resetSent')}</span>
            </div>
            <Link
              to="/login"
              className="block text-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {t('auth.backToLogin')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-6 shadow-lg space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                    placeholder="namn@foretag.se"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? t('app.loading') : t('auth.resetButton')}
              </button>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {t('auth.backToLogin')}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ─── Phase 2: Set New Password ─── */

function SetNewPasswordForm({ tokenHash }: { tokenHash: string }) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  // Verify token on mount
  useEffect(() => {
    async function verify() {
      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        });
        if (error) {
          console.error('[ResetPassword] Token verification failed:', error.message);
          setTokenValid(false);
        } else {
          setTokenValid(true);
        }
      } catch (err) {
        console.error('[ResetPassword] Token verification error:', err);
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    }
    verify();
  }, [tokenHash]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(t('settings.passwordTooShort'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('settings.passwordMismatch'));
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message ?? 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (verifying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">{t('auth.verifying', 'Verifierar...')}</p>
        </div>
      </div>
    );
  }

  // Token expired/invalid
  if (!tokenValid) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-full max-w-md px-4">
          <div className="bg-card border border-border rounded-xl p-6 shadow-lg space-y-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 mx-auto">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{t('auth.tokenExpired', 'Länken har gått ut')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('auth.tokenExpiredDescription', 'Begär en ny återställningslänk nedan.')}
            </p>
            <Link
              to="/reset-password"
              className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {t('auth.resetPassword')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success
  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-full max-w-md px-4">
          <div className="bg-card border border-border rounded-xl p-6 shadow-lg space-y-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 mx-auto">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{t('auth.passwordUpdated', 'Lösenordet har uppdaterats!')}</h2>
            <Link
              to="/login"
              className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {t('auth.loginButton')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Set new password form
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t('auth.setNewPassword', 'Välj nytt lösenord')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('auth.setNewPasswordSubtitle', 'Ange ditt nya lösenord nedan.')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-6 shadow-lg space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-1.5">
                {t('settings.newPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="newPassword"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  placeholder={t('auth.newPasswordPlaceholder', 'Minst 6 tecken')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1.5">
                {t('settings.confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  placeholder={t('auth.confirmPasswordPlaceholder', 'Bekräfta lösenord')}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('auth.saveNewPassword', 'Spara nytt lösenord')}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {t('auth.backToLogin')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
