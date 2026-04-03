export interface Company {
  id: string;
  name: string;
  slug: string;
  /** Company accent color for UI elements (hex). Default: #E53E3E */
  brand_color: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyRole {
  id: string;
  company_id: string;
  name: string;
  slug: string;
  is_system: boolean;
  permissions: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role_id: string;
  custom_permissions: string[];
  invited_by: string | null;
  invited_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Enriched member with joined role + profile data */
export interface CompanyMemberWithDetails extends CompanyMember {
  role?: CompanyRole;
  profile?: {
    display_name: string;
    avatar_url: string | null;
  };
  email?: string;
}

export interface CompanyState {
  /** All companies the current user belongs to */
  companies: Company[];
  /** The currently active company */
  activeCompany: Company | null;
  /** The user's membership in the active company */
  activeMembership: CompanyMember | null;
  /** The user's role in the active company */
  activeRole: CompanyRole | null;
  /** Loading state */
  isLoading: boolean;
  /** Switch active company */
  switchCompany: (companyId: string) => void;
}
