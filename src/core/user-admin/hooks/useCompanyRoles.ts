import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../shared/api/supabaseClient';
import { useCompany } from '../../company/context/CompanyContext';
import type { CompanyRole } from '../../company/types';

/**
 * Fetch all roles for the active company.
 */
export function useCompanyRoles() {
  const { activeCompany } = useCompany();
  const companyId = activeCompany?.id;

  return useQuery<CompanyRole[]>({
    queryKey: ['company_roles', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_roles')
        .select('*')
        .eq('company_id', companyId!)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data ?? []) as CompanyRole[];
    },
    enabled: !!companyId,
  });
}

/**
 * Create a new role in the active company.
 */
export function useCreateRole() {
  const qc = useQueryClient();
  const { activeCompany } = useCompany();

  return useMutation({
    mutationFn: async (role: { name: string; slug: string; permissions: string[] }) => {
      const { data, error } = await supabase
        .from('company_roles')
        .insert({
          ...role,
          company_id: activeCompany!.id,
          is_system: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data as CompanyRole;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company_roles'] }),
  });
}

/**
 * Update a role's permissions.
 */
export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; permissions?: string[]; sort_order?: number }) => {
      const { data, error } = await supabase
        .from('company_roles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as CompanyRole;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company_roles'] });
      qc.invalidateQueries({ queryKey: ['company_members'] });
    },
  });
}

/**
 * Delete a custom role (system roles cannot be deleted).
 */
export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('company_roles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company_roles'] }),
  });
}
