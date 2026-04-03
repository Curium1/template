import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../core/shared/api/supabaseClient';
import { useCompany } from '../../../core/company/context/CompanyContext';
import { useAuth } from '../../../core/auth/context/AuthContext';

/**
 * Invite a user to the active company.
 * Creates a new Supabase auth user (via Edge Function) and company_members row.
 */
export function useInviteUser() {
  const qc = useQueryClient();
  const { activeCompany } = useCompany();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (payload: {
      email: string;
      role_id: string;
      display_name?: string;
    }) => {
      // Call the Edge Function to create user + membership
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email: payload.email,
          role_id: payload.role_id,
          display_name: payload.display_name ?? '',
          company_id: activeCompany!.id,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw new Error(error.message ?? 'Kunde inte bjuda in användaren');
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company_members'] }),
  });
}
