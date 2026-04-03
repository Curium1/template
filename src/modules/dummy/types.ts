export interface DummyItem {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'inactive';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
