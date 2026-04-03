import { create } from 'zustand';

interface DummyUIState {
  /** Currently selected item id for editing, null = closed */
  editingId: string | null;
  /** Whether the create modal is open */
  isCreating: boolean;

  openCreate: () => void;
  closeCreate: () => void;
  openEdit: (id: string) => void;
  closeEdit: () => void;
}

/**
 * UI-only state for the Dummy module.
 * This is the Zustand equivalent of a Pinia store — scoped to this module.
 */
export const useDummyStore = create<DummyUIState>(set => ({
  editingId: null,
  isCreating: false,

  openCreate: () => set({ isCreating: true, editingId: null }),
  closeCreate: () => set({ isCreating: false }),
  openEdit: (id: string) => set({ editingId: id, isCreating: false }),
  closeEdit: () => set({ editingId: null }),
}));
