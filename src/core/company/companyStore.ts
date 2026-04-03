/**
 * Simple module-level store for the active company ID.
 * Used by CompanyContext and read by any code that needs the active company.
 * Avoids circular dependency with supabaseClient.
 */

const STORAGE_KEY = 'activeCompanyId';

let _activeCompanyId: string | null = localStorage.getItem(STORAGE_KEY);

export function getActiveCompanyId(): string | null {
  return _activeCompanyId;
}

export function setActiveCompanyId(id: string | null): void {
  _activeCompanyId = id;
  if (id) {
    localStorage.setItem(STORAGE_KEY, id);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}
