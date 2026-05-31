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

export interface SquadMember {
  id: string;
  name: string;
  role: string;
  daily_capacity_hours: number;
  created_at: string;
  updated_at: string;
}

export interface NewSquadMember {
  name: string;
  role: string;
  daily_capacity_hours?: number;
}

export type UpdateSquadMember = Partial<
  Omit<SquadMember, "id" | "created_at" | "updated_at">
>;

export type AbsenceType = "vacation" | "sick_leave" | "unpaid_leave" | "holiday" | "other";

export interface Absence {
  id: string;
  member_id: string | null;
  type: AbsenceType;
  start_date: string;
  end_date: string;
  description: string | null;
  created_at: string;
}

export interface NewAbsence {
  member_id?: string | null;
  type: AbsenceType;
  start_date: string;
  end_date: string;
  description?: string;
}

export type UpdateAbsence = Partial<
  Omit<Absence, "id" | "created_at">
>;
