import {
  useTableQuery,
  useTableInsert,
  useTableUpdate,
  useTableDelete,
} from '../../../core/shared/hooks/useSupabaseQuery';
import type { DummyItem } from '../types';

const TABLE = 'dummy_items';

export function useDummyItems() {
  return useTableQuery<DummyItem>(TABLE, q => q.order('created_at', { ascending: false }));
}

export function useCreateDummy() {
  return useTableInsert<DummyItem>(TABLE);
}

export function useUpdateDummy() {
  return useTableUpdate<DummyItem>(TABLE);
}

export function useDeleteDummy() {
  return useTableDelete(TABLE);
}
