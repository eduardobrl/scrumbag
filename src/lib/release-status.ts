export const RELEASE_STATUS_VALUES = ["PLANNED", "PLANNING", "IN_PROGRESS", "CLOSED", "CANCELLED"] as const;

export const RELEASE_LIFECYCLE_ORDER = ["PLANNED", "PLANNING", "IN_PROGRESS", "CLOSED"] as const;

export type ReleaseStatusValue = (typeof RELEASE_STATUS_VALUES)[number];

export type ReleaseStatusTone = "neutral" | "success" | "warning" | "danger";

export function isReleaseStatus(value: unknown): value is ReleaseStatusValue {
  return typeof value === "string" && (RELEASE_STATUS_VALUES as readonly string[]).includes(value);
}

export function isAllowedReleaseTransition(existing: ReleaseStatusValue, next: ReleaseStatusValue) {
  if (existing === next) {
    return true;
  }

  if (existing === "CLOSED" || existing === "CANCELLED") {
    return false;
  }

  if (next === "CANCELLED") {
    return true;
  }

  const currentIndex = RELEASE_LIFECYCLE_ORDER.indexOf(existing);
  const nextIndex = RELEASE_LIFECYCLE_ORDER.indexOf(next);

  return currentIndex >= 0 && nextIndex === currentIndex + 1;
}

export function getReleaseStatusTone(status: ReleaseStatusValue): ReleaseStatusTone {
  switch (status) {
    case "IN_PROGRESS":
      return "success";
    case "PLANNING":
    case "CLOSED":
      return "warning";
    case "CANCELLED":
      return "danger";
    default:
      return "neutral";
  }
}
