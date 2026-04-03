import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-foreground/20 border-t-foreground" />
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const result = await login(email, password);
    if (result.error) setError(result.error);
    setSubmitting(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-sm px-4">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground">
            {t('app.name')}
          </h1>
          <p className="text-[15px] text-muted-foreground mt-2">
            {t('auth.login')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-destructive/[0.08] text-destructive text-[13px]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-[13px] font-medium text-foreground">
              {t('auth.email')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/60 text-[14px] focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
              placeholder="namn@företag.se"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-[13px] font-medium text-foreground">
              {t('auth.password')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/60 text-[14px] focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 rounded-xl bg-foreground text-background text-[14px] font-medium hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? '...' : t('auth.loginButton')}
          </button>
        </form>
      </div>
    </div>
  );
}
