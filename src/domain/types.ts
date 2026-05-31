export type BacklogItemType = "epic" | "feature" | "story" | "bug";
export type BacklogItemStatus = "backlog" | "in_progress" | "done";

export interface BacklogItem {
  id: string;
  type: BacklogItemType;
  title: string;
  description: string | null;
  parent_id: string | null;
  status: BacklogItemStatus;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface NewBacklogItem {
  type: BacklogItemType;
  title: string;
  description?: string;
  parent_id?: string | null;
  status?: BacklogItemStatus;
  priority?: number;
}

export type UpdateBacklogItem = Partial<
  Omit<BacklogItem, "id" | "created_at" | "updated_at">
>;
