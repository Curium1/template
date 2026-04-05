import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../shared/api/supabaseClient';
import { useCompany } from '../../company/context/CompanyContext';
import type { CompanyMember } from '../../company/types';

/**
 * Fetch all members of the active company with profile + role data.
 */
export function useCompanyMembers() {
  const { activeCompany } = useCompany();
  const companyId = activeCompany?.id;

  return useQuery({
    queryKey: ['company_members', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_members')
        .select(`
          *,
          role:company_roles(*),
          user_profile:user_profiles!company_members_user_profile_fk(display_name, avatar_url)
        `)
        .eq('company_id', companyId!)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!companyId,
  });
}

/**
 * Update a member's role.
 */
export function useUpdateMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ memberId, roleId }: { memberId: string; roleId: string }) => {
      const { data, error } = await supabase
        .from('company_members')
        .update({ role_id: roleId })
        .eq('id', memberId)
        .select()
        .single();
      if (error) throw error;
      return data as CompanyMember;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company_members'] }),
  });
}

/**
 * Remove a member from the company.
 */
export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('company_members')
        .delete()
        .eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company_members'] }),
  });
}
