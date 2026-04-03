import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../api/supabaseClient';
import { useCompany } from '../../company/context/CompanyContext';

/**
 * Generic typed hook for fetching rows from a Supabase table.
 * Automatically scopes queries to the active company via company_id.
 *
 * Usage:
 *   const { data, isLoading } = useTableQuery('dummy_items', q => q.order('created_at'));
 */
export function useTableQuery<T>(
  table: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modifier?: (query: any) => any,
  options?: { enabled?: boolean; companyScoped?: boolean }
) {
  const { activeCompany } = useCompany();
  const companyScoped = options?.companyScoped ?? true;
  const companyId = activeCompany?.id;

  return useQuery<T[]>({
    queryKey: [table, companyId],
    queryFn: async () => {
      let query = supabase.from(table).select('*');
      if (companyScoped && companyId) {
        query = query.eq('company_id', companyId);
      }
      if (modifier) {
        query = modifier(query as never) as never;
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data as T[]) ?? [];
    },
    enabled: (options?.enabled ?? true) && (!companyScoped || !!companyId),
  });
}

/**
 * Generic hook for INSERT mutations.
 * Automatically includes company_id for company-scoped tables.
 */
export function useTableInsert<T>(table: string, options?: { companyScoped?: boolean }) {
  const qc = useQueryClient();
  const { activeCompany } = useCompany();
  const companyScoped = options?.companyScoped ?? true;

  return useMutation({
    mutationFn: async (row: Omit<T, 'id' | 'created_at' | 'updated_at'>) => {
      const payload = companyScoped && activeCompany
        ? { ...row, company_id: activeCompany.id }
        : row;

      const { data, error } = await supabase.from(table).insert(payload).select().single();
      if (error) throw error;
      return data as T;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
  });
}

export function useTableUpdate<T>(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<T>) => {
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as T;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
  });
}

export function useTableDelete(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
  });
}
