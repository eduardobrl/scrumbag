export interface BacklogItem {
  id: string;
  type: string;
  title: string;
  description: string | null;
  parent_id: string | null;
  status: string;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface NewBacklogItem {
  type: string;
  title: string;
  description?: string;
  parent_id?: string | null;
  status?: string;
  priority?: number;
}
