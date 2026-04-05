import { create } from 'zustand';

interface UserAdminUIState {
  isInviting: boolean;
  editingMemberId: string | null;
  isManagingRoles: boolean;
  editingRoleId: string | null;

  openInvite: () => void;
  closeInvite: () => void;
  openEditMember: (id: string) => void;
  closeEditMember: () => void;
  openManageRoles: () => void;
  closeManageRoles: () => void;
  openEditRole: (id: string) => void;
  closeEditRole: () => void;
}

export const useUserAdminStore = create<UserAdminUIState>((set) => ({
  isInviting: false,
  editingMemberId: null,
  isManagingRoles: false,
  editingRoleId: null,

  openInvite: () => set({ isInviting: true }),
  closeInvite: () => set({ isInviting: false }),
  openEditMember: (id) => set({ editingMemberId: id }),
  closeEditMember: () => set({ editingMemberId: null }),
  openManageRoles: () => set({ isManagingRoles: true }),
  closeManageRoles: () => set({ isManagingRoles: false }),
  openEditRole: (id) => set({ editingRoleId: id }),
  closeEditRole: () => set({ editingRoleId: null }),
}));
