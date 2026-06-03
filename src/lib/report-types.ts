export const REPORT_TYPES = [
  "release-planning",
  "sprint-capacity",
  "stories-by-sprint",
  "feature-progress",
  "leakage",
  "planned-vs-capacity",
  "timeline"
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_LABELS: Record<ReportType, string> = {
  "release-planning": "Release planning",
  "sprint-capacity": "Sprint capacity",
  "stories-by-sprint": "Stories by sprint",
  "feature-progress": "Feature progress",
  leakage: "Leakage",
  "planned-vs-capacity": "Planned versus capacity",
  timeline: "Timeline"
};

export function isReportType(value: unknown): value is ReportType {
  return typeof value === "string" && REPORT_TYPES.includes(value as ReportType);
}
