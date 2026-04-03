import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Link, Navigate } from 'react-router-dom';
import { KeyRound, Mail, AlertCircle, CheckCircle } from 'lucide-react';

export function ResetPasswordPage() {
  const { resetPassword, isAuthenticated } = useAuth();
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
