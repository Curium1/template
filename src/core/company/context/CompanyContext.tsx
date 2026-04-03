import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { supabase } from '../../shared/api/supabaseClient';
import { useAuth } from '../../auth/context/AuthContext';
import { getActiveCompanyId, setActiveCompanyId } from '../companyStore';
import type { Company, CompanyRole, CompanyMember, CompanyState } from '../types';

const CompanyContext = createContext<CompanyState | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [memberships, setMemberships] = useState<(CompanyMember & { company: Company; role: CompanyRole })[]>([]);
  const [activeCompanyId, setActiveCompanyIdState] = useState<string | null>(getActiveCompanyId());
  const [isLoading, setIsLoading] = useState(true);

  // Track which user we last fetched for to prevent redundant fetches
  const lastFetchedUserId = useRef<string | null>(null);

  // Use user.id as stable dependency instead of the full user object
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setCompanies([]);
      setMemberships([]);
      setIsLoading(false);
      lastFetchedUserId.current = null;
      return;
    }

    // Skip re-fetch if we already loaded data for this user
    if (lastFetchedUserId.current === userId && memberships.length > 0) {
      return;
    }

    const fetchCompanyData = async () => {
      // Only show loading spinner on initial fetch, not on re-renders
      if (lastFetchedUserId.current !== userId) {
        setIsLoading(true);
      }

      try {
        const { data: memberData, error } = await supabase
          .from('company_members')
          .select(`
            *,
            company:companies(*),
            role:company_roles(*)
          `)
          .eq('user_id', userId);

        if (error) {
          console.error('[Company] Failed to fetch memberships:', error.message);
          setIsLoading(false);
          return;
        }

        const enriched = (memberData ?? []) as (CompanyMember & { company: Company; role: CompanyRole })[];
        setMemberships(enriched);

        const companyList = enriched.map(m => m.company).filter(Boolean);
        setCompanies(companyList);

        // Set default active company if none selected or previous selection is invalid
        const storedId = getActiveCompanyId();
        const validIds = companyList.map(c => c.id);

        if (!storedId || !validIds.includes(storedId)) {
          const defaultId = companyList[0]?.id ?? null;
          setActiveCompanyId(defaultId);
          setActiveCompanyIdState(defaultId);
        }

        lastFetchedUserId.current = userId;
      } catch (err) {
        console.error('[Company] Unexpected error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, userId]);

  const switchCompany = useCallback((companyId: string) => {
    setActiveCompanyId(companyId);
    setActiveCompanyIdState(companyId);
  }, []);

  // Derive active company and role from memberships
  const activeMembership = memberships.find(m => m.company_id === activeCompanyId) ?? null;
  const activeCompany = activeMembership?.company ?? null;
  const activeRole = activeMembership?.role ?? null;

  const value: CompanyState = {
    companies,
    activeCompany,
    activeMembership,
    activeRole,
    isLoading,
    switchCompany,
  };

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany(): CompanyState {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}
