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

export interface CapacityBreakdown {
  member_id: string;
  member_name: string;
  role: string;
  daily_capacity_hours: number;
  raw_capacity_hours: number;
  absence_hours: number;
  holiday_hours: number;
  real_capacity_hours: number;
  waste_hours: number;
  final_capacity_hours: number;
}

export interface CapacityResult {
  start_date: string;
  end_date: string;
  total_members: number;
  total_raw_hours: number;
  total_absence_hours: number;
  total_holiday_hours: number;
  total_real_hours: number;
  total_waste_hours: number;
  total_final_hours: number;
  members: CapacityBreakdown[];
}

export interface WasteConfig {
  waste_percentage: number;
}

export interface CapacityOverride {
  id: string;
  member_id: string;
  start_date: string;
  end_date: string;
  override_hours: number;
  reason: string | null;
  created_at: string;
}

export interface NewCapacityOverride {
  member_id: string;
  start_date: string;
  end_date: string;
  override_hours: number;
  reason?: string;
}
