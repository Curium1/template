import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './core/auth/context/AuthContext';
import { CompanyProvider } from './core/company/context/CompanyContext';
import { AuthorizationProvider } from './core/authorization/context/AuthorizationContext';
import { NotificationProvider } from './core/notifications';
import { ThemeProvider } from './core/theme/ThemeProvider';
import { AppRouter } from './core/router/AppRouter';
import { queryClient } from './core/shared/store/queryClient';
import './core/shared/i18n/i18n';

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <CompanyProvider>
              <AuthorizationProvider>
                <NotificationProvider>
                  <AppRouter />
                </NotificationProvider>
              </AuthorizationProvider>
            </CompanyProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

