import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

/**
 * Core i18n setup — ONLY core/shared translations live here.
 * Module translations are registered via `registerModuleTranslations()`
 * from each module's `module.config.tsx`.
 */
const coreResources = {
  sv: {
    translation: {
      // App
      'app.name': 'Modular Platform',
      'app.loading': 'Laddar...',

      // Auth
      'auth.login': 'Logga in',
      'auth.logout': 'Logga ut',
      'auth.email': 'E-post',
      'auth.password': 'Lösenord',
      'auth.forgotPassword': 'Glömt lösenord?',
      'auth.resetPassword': 'Återställ lösenord',
      'auth.resetSubtitle': 'Vi skickar en återställningslänk till din e-post',
      'auth.resetSent': 'En länk för att återställa lösenordet har skickats till din e-post.',
      'auth.loginError': 'Felaktig e-post eller lösenord.',
      'auth.loginButton': 'Logga in',
      'auth.resetButton': 'Skicka återställningslänk',
      'auth.backToLogin': 'Tillbaka till inloggning',
      'auth.setNewPassword': 'Välj nytt lösenord',
      'auth.setNewPasswordSubtitle': 'Ange ditt nya lösenord nedan.',
      'auth.newPasswordPlaceholder': 'Minst 6 tecken',
      'auth.confirmPasswordPlaceholder': 'Bekräfta lösenord',
      'auth.saveNewPassword': 'Spara nytt lösenord',
      'auth.passwordUpdated': 'Lösenordet har uppdaterats!',
      'auth.tokenExpired': 'Länken har gått ut',
      'auth.tokenExpiredDescription': 'Begär en ny återställningslänk nedan.',
      'auth.verifying': 'Verifierar...',

      // Authorization
      'authz.forbidden': 'Åtkomst nekad',
      'authz.noPermission': 'Du har inte behörighet att se den här sidan.',

      // Layout
      'layout.dashboard': 'Översikt',
      'layout.profile': 'Profil',
      'layout.settings': 'Inställningar',
      'layout.modules': 'Moduler',

      // Notifications
      'notifications.title': 'Notiser',
      'notifications.empty': 'Inga notiser',
      'notifications.markRead': 'Markera som läst',
      'notifications.markAllRead': 'Markera alla som lästa',
      'notifications.dismiss': 'Ta bort',
      'notifications.clearAll': 'Rensa alla',
      'notifications.today': 'Idag',
      'notifications.yesterday': 'Igår',
      'notifications.tomorrow': 'Imorgon',
      'notifications.thisWeek': 'Denna vecka',
      'notifications.overdue': 'Försenad',
      'notifications.noDeadline': 'Ingen deadline',
      'notifications.groupByCreated': 'Skapad',
      'notifications.groupByDeadline': 'Deadline',
      'notifications.groupByModule': 'Modul',
      'notifications.mute': 'Tysta',
      'notifications.viewAll': 'Visa alla i uppgifter →',

      // Roles
      'roles.super_admin': 'Superadmin',
      'roles.admin': 'Administratör',
      'roles.manager': 'Chef',
      'roles.user': 'Användare',

      // Landing
      'landing.title': 'Välkommen',
      'landing.subtitle': 'Logga in för att komma igång.',
      'landing.cta': 'Logga in',

      // Theme
      'theme.light': 'Ljust',
      'theme.dark': 'Mörkt',
      'theme.system': 'System',
      'theme.toggle': 'Tema',

      // Settings page
      'settings.title': 'Inställningar',
      'settings.subtitle': 'Hantera ditt konto och dina inställningar.',
      'settings.profile': 'Profil',
      'settings.profileDescription': 'Din personliga information.',
      'settings.displayName': 'Visningsnamn',
      'settings.email': 'E-post',
      'settings.role': 'Roll',
      'settings.company': 'Företag',
      'settings.memberSince': 'Medlem sedan',
      'settings.save': 'Spara ändringar',
      'settings.saved': 'Ändringar sparade!',
      'settings.saving': 'Sparar...',
      'settings.appearance': 'Utseende',
      'settings.appearanceDescription': 'Välj tema och språk.',
      'settings.language': 'Språk',
      'settings.languageSv': 'Svenska',
      'settings.languageEn': 'English',
      'settings.security': 'Säkerhet',
      'settings.securityDescription': 'Hantera ditt lösenord.',
      'settings.changePassword': 'Byt lösenord',
      'settings.currentPassword': 'Nuvarande lösenord',
      'settings.newPassword': 'Nytt lösenord',
      'settings.confirmPassword': 'Bekräfta lösenord',
      'settings.updatePassword': 'Uppdatera lösenord',
      'settings.passwordUpdated': 'Lösenordet har uppdaterats!',
      'settings.passwordMismatch': 'Lösenorden matchar inte.',
      'settings.passwordTooShort': 'Lösenordet måste vara minst 6 tecken.',
    },
  },
  en: {
    translation: {
      'app.name': 'Modular Platform',
      'app.loading': 'Loading...',
      'auth.login': 'Log in',
      'auth.logout': 'Log out',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.forgotPassword': 'Forgot password?',
      'auth.resetPassword': 'Reset password',
      'auth.resetSubtitle': 'We will send a reset link to your email',
      'auth.resetSent': 'A password reset link has been sent to your email.',
      'auth.loginError': 'Invalid email or password.',
      'auth.loginButton': 'Log in',
      'auth.resetButton': 'Send reset link',
      'auth.backToLogin': 'Back to login',
      'auth.setNewPassword': 'Set new password',
      'auth.setNewPasswordSubtitle': 'Enter your new password below.',
      'auth.newPasswordPlaceholder': 'At least 6 characters',
      'auth.confirmPasswordPlaceholder': 'Confirm password',
      'auth.saveNewPassword': 'Save new password',
      'auth.passwordUpdated': 'Password updated!',
      'auth.tokenExpired': 'Link has expired',
      'auth.tokenExpiredDescription': 'Request a new reset link below.',
      'auth.verifying': 'Verifying...',
      'authz.forbidden': 'Access denied',
      'authz.noPermission': 'You do not have permission to view this page.',
      'layout.dashboard': 'Dashboard',
      'layout.profile': 'Profile',
      'layout.settings': 'Settings',
      'layout.modules': 'Modules',

      // Notifications
      'notifications.title': 'Notifications',
      'notifications.empty': 'No notifications',
      'notifications.markRead': 'Mark as read',
      'notifications.markAllRead': 'Mark all as read',
      'notifications.dismiss': 'Dismiss',
      'notifications.clearAll': 'Clear all',
      'notifications.today': 'Today',
      'notifications.yesterday': 'Yesterday',
      'notifications.tomorrow': 'Tomorrow',
      'notifications.thisWeek': 'This week',
      'notifications.overdue': 'Overdue',
      'notifications.noDeadline': 'No deadline',
      'notifications.groupByCreated': 'Created',
      'notifications.groupByDeadline': 'Deadline',
      'notifications.groupByModule': 'Module',
      'notifications.mute': 'Mute',
      'notifications.viewAll': 'View all in tasks →',
      'roles.super_admin': 'Super Admin',
      'roles.admin': 'Administrator',
      'roles.manager': 'Manager',
      'roles.user': 'User',
      'landing.title': 'Welcome',
      'landing.subtitle': 'Log in to get started.',
      'landing.cta': 'Log in',
      'theme.light': 'Light',
      'theme.dark': 'Dark',
      'theme.system': 'System',
      'theme.toggle': 'Theme',
      'settings.title': 'Settings',
      'settings.subtitle': 'Manage your account and preferences.',
      'settings.profile': 'Profile',
      'settings.profileDescription': 'Your personal information.',
      'settings.displayName': 'Display name',
      'settings.email': 'Email',
      'settings.role': 'Role',
      'settings.company': 'Company',
      'settings.memberSince': 'Member since',
      'settings.save': 'Save changes',
      'settings.saved': 'Changes saved!',
      'settings.saving': 'Saving...',
      'settings.appearance': 'Appearance',
      'settings.appearanceDescription': 'Choose theme and language.',
      'settings.language': 'Language',
      'settings.languageSv': 'Svenska',
      'settings.languageEn': 'English',
      'settings.security': 'Security',
      'settings.securityDescription': 'Manage your password.',
      'settings.changePassword': 'Change password',
      'settings.currentPassword': 'Current password',
      'settings.newPassword': 'New password',
      'settings.confirmPassword': 'Confirm password',
      'settings.updatePassword': 'Update password',
      'settings.passwordUpdated': 'Password updated!',
      'settings.passwordMismatch': 'Passwords do not match.',
      'settings.passwordTooShort': 'Password must be at least 6 characters.',
    },
  },
};

i18n.use(initReactI18next).init({
  resources: coreResources,
  lng: 'sv',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

/**
 * Register module-scoped translations.
 * Called from each module's `module.config.tsx` during bootstrap.
 *
 * @example
 * // In modules/dummy/i18n/sv.ts
 * export const sv = { 'modules.dummy.list': 'Dummy-poster', ... };
 *
 * // In modules/dummy/module.config.tsx
 * import { registerModuleTranslations } from '../../core/shared/i18n/i18n';
 * import { sv } from './i18n/sv';
 * import { en } from './i18n/en';
 * registerModuleTranslations({ sv, en });
 */
export function registerModuleTranslations(
  translations: Record<string, Record<string, string>>,
) {
  for (const [lang, keys] of Object.entries(translations)) {
    i18n.addResourceBundle(lang, 'translation', keys, true, true);
  }
}

export default i18n;
