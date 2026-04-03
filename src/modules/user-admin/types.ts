import type { CompanyMember, CompanyRole } from '../../../core/company/types';

/** Enriched member with joined profile and role data */
export interface MemberWithProfile extends CompanyMember {
  user_profile: {
    display_name: string;
    avatar_url: string | null;
  } | null;
  role: CompanyRole | null;
  user_email?: string;
}
