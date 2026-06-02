import { Database } from "bun:sqlite";
import { BacklogRepository } from "../data/backlog-repository";
import { ReleaseRepository } from "../data/release-repository";
import { SprintRepository } from "../data/sprint-repository";
import type {
  BacklogItem,
  ReleaseBoardSummary,
  ReleaseBoardWarning,
  ReleaseFeatureBoardItem,
  ReleaseSprintCapacity,
} from "../domain/types";
import { CapacityService } from "./capacity-service";

export class ReleasePlanningService {
  private releases: ReleaseRepository;
  private sprints: SprintRepository;
  private backlog: BacklogRepository;
  private capacity: CapacityService;

  constructor(db: Database) {
    this.releases = new ReleaseRepository(db);
    this.sprints = new SprintRepository(db);
    this.backlog = new BacklogRepository(db);
    this.capacity = new CapacityService(db);
  }

  getBoardSummary(releaseId: string): ReleaseBoardSummary {
    const release = this.releases.findById(releaseId);
    if (!release) throw new Error(`Release ${releaseId} not found`);

    const sprints = this.sprints.findByRelease(releaseId);
    const releaseFeatures = this.releases.findFeatures(releaseId);

    const sprintCapacities: ReleaseSprintCapacity[] = sprints.map((sprint) => {
      try {
        const result = this.capacity.calculate(sprint.start_date, sprint.end_date);
        return {
          sprint_id: sprint.id,
          available_days: result.total_final_hours / 6,
          planned_days: 0,
          warnings: [],
        };
      } catch {
        return {
          sprint_id: sprint.id,
          available_days: null,
          planned_days: 0,
          warnings: ["missing_estimates"],
        };
      }
    });

    const sprintIndex = new Map(sprints.map((sprint, index) => [sprint.id, index]));
    const capacityBySprint = new Map(
      sprintCapacities.map((capacity) => [capacity.sprint_id, capacity])
    );

    const features: ReleaseFeatureBoardItem[] = releaseFeatures.map((allocation) => {
      const feature = allocation.feature ?? this.backlog.findById(allocation.feature_id);
      if (!feature) throw new Error(`Feature ${allocation.feature_id} not found`);

      const children = this.releases.findFeatureChildren(allocation.feature_id);
      const aggregate = aggregateChildren(children);
      const warnings: ReleaseBoardWarning[] = [];
      if (aggregate.missingEstimateCount > 0) warnings.push("missing_estimates");

      const start = allocation.start_sprint_id
        ? sprintIndex.get(allocation.start_sprint_id)
        : undefined;
      const end = allocation.end_sprint_id
        ? sprintIndex.get(allocation.end_sprint_id)
        : undefined;
      let spanCapacity = 0;

      if (start !== undefined && end !== undefined && start <= end) {
        const spanLength = end - start + 1;
        const plannedPerSprint = spanLength > 0 ? aggregate.estimate_days / spanLength : 0;
        for (let index = start; index <= end; index += 1) {
          const sprint = sprints[index];
          const sprintCapacity = capacityBySprint.get(sprint.id);
          if (!sprintCapacity) continue;
          sprintCapacity.planned_days += plannedPerSprint;
          spanCapacity += sprintCapacity.available_days ?? 0;
        }
      }

      if (spanCapacity > 0 && aggregate.estimate_days > spanCapacity) {
        warnings.push("sprint_over_capacity");
      }

      return {
        feature,
        allocation,
        story_points: aggregate.story_points,
        estimate_days: aggregate.estimate_days,
        story_count: aggregate.story_count,
        bug_count: aggregate.bug_count,
        predicted_completion_sprint_id: allocation.end_sprint_id,
        warnings,
        split_suggestion: this.splitSuggestion(aggregate.estimate_days, sprintCapacities),
      };
    });

    for (const sprintCapacity of sprintCapacities) {
      if (
        sprintCapacity.available_days !== null &&
        sprintCapacity.planned_days > sprintCapacity.available_days
      ) {
        sprintCapacity.warnings.push("sprint_over_capacity");
      }
    }

    const totalEstimateDays = features.reduce(
      (total, feature) => total + feature.estimate_days,
      0
    );
    const availableValues = sprintCapacities
      .map((capacity) => capacity.available_days)
      .filter((value): value is number => value !== null);
    const totalAvailableDays =
      availableValues.length === sprintCapacities.length
        ? availableValues.reduce((total, value) => total + value, 0)
        : null;
    const warnings: ReleaseBoardWarning[] = [];
    if (
      totalAvailableDays !== null &&
      totalEstimateDays > totalAvailableDays
    ) {
      warnings.push("release_over_capacity");
    }
    if (features.some((feature) => feature.warnings.includes("missing_estimates"))) {
      warnings.push("missing_estimates");
    }
    if (sprintCapacities.some((capacity) => capacity.warnings.includes("sprint_over_capacity"))) {
      warnings.push("sprint_over_capacity");
    }

    return {
      release,
      sprints,
      sprint_capacities: sprintCapacities,
      features,
      total_estimate_days: totalEstimateDays,
      total_available_days: totalAvailableDays,
      warnings,
    };
  }

  private splitSuggestion(
    estimateDays: number,
    sprintCapacities: ReleaseSprintCapacity[]
  ): string | null {
    if (estimateDays <= 0) return null;
    const availableDays = sprintCapacities
      .map((capacity) => capacity.available_days ?? 0)
      .filter((value) => value > 0);
    const total = availableDays.reduce((sum, value) => sum + value, 0);
    const maxSprint = Math.max(0, ...availableDays);
    if (total > 0 && estimateDays > total) {
      return "Esta feature parece grande demais para a release. Considere dividir em features menores.";
    }
    if (maxSprint > 0 && estimateDays > maxSprint * 1.5) {
      return "Esta feature atravessa muita capacidade. Considere dividir em features menores.";
    }
    return null;
  }
}

function aggregateChildren(children: BacklogItem[]) {
  return children.reduce(
    (acc, item) => {
      if (item.type === "story") acc.story_count += 1;
      if (item.type === "bug") acc.bug_count += 1;
      acc.story_points += item.story_points ?? 0;
      acc.estimate_days += item.estimate_days ?? 0;
      if (item.estimate_days === null) acc.missingEstimateCount += 1;
      return acc;
    },
    {
      story_points: 0,
      estimate_days: 0,
      story_count: 0,
      bug_count: 0,
      missingEstimateCount: 0,
    }
  );
}
