export type BacklogItemType = "epic" | "feature" | "story" | "bug";
export type BacklogItemStatus = "backlog" | "in_progress" | "done";
export const FIBONACCI_POINTS = [1, 2, 3, 5, 8, 13, 21] as const;
export type StoryPoint = typeof FIBONACCI_POINTS[number];

export interface BacklogItem {
  id: string;
  type: BacklogItemType;
  title: string;
  description: string | null;
  parent_id: string | null;
  status: BacklogItemStatus;
  priority: number;
  story_points: StoryPoint | null;
  estimate_days: number | null;
  completed_at: string | null;
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
  story_points?: StoryPoint | null;
  estimate_days?: number | null;
}

export type UpdateBacklogItem = Partial<
  Omit<BacklogItem, "id" | "created_at" | "updated_at">
>;

export type SprintStatus = "planned" | "active" | "closed";
export type ReleaseStatus = "planned" | "active" | "closed";

export interface Release {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: ReleaseStatus;
  created_at: string;
  updated_at: string;
}

export interface NewRelease {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  status?: ReleaseStatus;
}

export type UpdateRelease = Partial<
  Omit<Release, "id" | "created_at" | "updated_at">
>;

export interface Sprint {
  id: string;
  release_id: string | null;
  goal: string;
  start_date: string;
  end_date: string;
  status: SprintStatus;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewSprint {
  release_id?: string | null;
  goal: string;
  start_date: string;
  end_date: string;
  status?: SprintStatus;
}

export type UpdateSprint = Partial<
  Omit<Sprint, "id" | "created_at" | "updated_at">
>;

export interface SprintItem {
  id: string;
  sprint_id: string;
  backlog_item_id: string;
  sprint_order: number;
  board_order: number;
  created_at: string;
  backlog_item?: BacklogItem;
}

export interface NewSprintItem {
  sprint_id: string;
  backlog_item_id: string;
  sprint_order?: number;
  board_order?: number;
}

export type SprintBacklogCandidate = BacklogItem;

export interface SprintPlanningTotals {
  total_story_points: number;
  total_estimate_days: number;
  unestimated_count: number;
  total_items: number;
}

export interface ReleaseFeature {
  id: string;
  release_id: string;
  feature_id: string;
  start_sprint_id: string | null;
  end_sprint_id: string | null;
  board_order: number;
  added_at: string;
  added_during_execution?: boolean;
  feature?: BacklogItem;
}

export type ReleaseBoardWarning =
  | "missing_estimates"
  | "sprint_over_capacity"
  | "release_over_capacity";

export interface ReleaseSprintCapacity {
  sprint_id: string;
  available_days: number | null;
  planned_days: number;
  warnings: ReleaseBoardWarning[];
}

export interface ReleaseFeatureBoardItem {
  feature: BacklogItem;
  allocation: ReleaseFeature;
  story_points: number;
  estimate_days: number;
  story_count: number;
  bug_count: number;
  predicted_completion_sprint_id: string | null;
  warnings: ReleaseBoardWarning[];
  split_suggestion: string | null;
}

export interface ReleaseBoardSummary {
  release: Release;
  sprints: Sprint[];
  sprint_capacities: ReleaseSprintCapacity[];
  features: ReleaseFeatureBoardItem[];
  total_estimate_days: number;
  total_available_days: number | null;
  warnings: ReleaseBoardWarning[];
}

export interface AggregateEstimate {
  story_points: number;
  estimate_days: number;
}

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
