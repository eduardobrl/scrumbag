import { StoryStatus } from "@prisma/client";
import { detectAlerts } from "@/lib/alerts";
import { listBacklogStories } from "@/lib/backlog";
import { getDashboardData } from "@/lib/dashboard";
import { prisma } from "@/lib/db";
import type { McpTool } from "@/mcp/tools/index";

const releaseSchema = {
  type: "object" as const,
  properties: { releaseId: { type: "string" } },
  required: ["releaseId"]
};

export const suggestTools: McpTool[] = [
  {
    name: "suggest_scope_adjustments",
    description: "Suggest scope reductions when release planned effort exceeds capacity.",
    parameters: releaseSchema,
    handler: async (args) => {
      const releaseId = String(args.releaseId);
      const dashboard = await getDashboardData(releaseId);
      const backlog = await listBacklogStories({ releaseId, unplannedOnly: true });
      return {
        overCapacity: dashboard.risk === "Over capacity",
        reasoning:
          dashboard.risk === "Over capacity"
            ? `Release exceeds capacity by ${Math.abs(dashboard.remainingCapacityDays).toFixed(1)} days.`
            : "Release is within current capacity.",
        candidates: backlog.slice(0, 5).map((story) => ({
          storyId: story.id,
          title: story.title,
          estimatedDays: story.estimatedDays ?? 0
        }))
      };
    }
  },
  {
    name: "suggest_story_redistribution",
    description: "Suggest moving stories from over-capacity sprints to sprints with remaining capacity.",
    parameters: releaseSchema,
    handler: async (args) => {
      const dashboard = await getDashboardData(String(args.releaseId));
      const over = dashboard.sprints.filter((sprint) => sprint.overCapacity);
      const under = dashboard.sprints.filter((sprint) => sprint.remainingCapacityDays > 0);
      const moves = [];

      for (const source of over) {
        const candidate = under.find((target) => target.id !== source.id);
        if (candidate) {
          moves.push({
            fromSprintId: source.id,
            toSprintId: candidate.id,
            reasoning: `${source.name} is over capacity and ${candidate.name} has ${candidate.remainingCapacityDays.toFixed(1)} days available.`
          });
        }
      }

      return { moves };
    }
  },
  {
    name: "suggest_capacity_risks",
    description: "Identify high-occupancy sprints and late unfinished features.",
    parameters: releaseSchema,
    handler: async (args) => {
      const dashboard = await getDashboardData(String(args.releaseId));
      const riskySprints = dashboard.sprints.filter((sprint) => sprint.occupancyPercentage > 90);
      const features = await prisma.feature.findMany({
        where: { releaseId: String(args.releaseId), lifecycleStatus: "ACTIVE" },
        include: { stories: true }
      });
      const riskyFeatures = features
        .filter((feature) => feature.stories.some((story) => story.status !== StoryStatus.DONE && story.status !== StoryStatus.CANCELLED))
        .map((feature) => ({ featureId: feature.id, name: feature.name }));

      return { riskySprints, riskyFeatures };
    }
  },
  {
    name: "suggest_late_features",
    description: "Find features that remain unfinished in the second half of the release.",
    parameters: releaseSchema,
    handler: async (args) => {
      const releaseId = String(args.releaseId);
      const sprints = await prisma.sprint.findMany({ where: { releaseId }, orderBy: { startDate: "asc" } });
      const secondHalf = new Set(sprints.slice(Math.floor(sprints.length / 2)).map((sprint) => sprint.id));
      const features = await prisma.feature.findMany({
        where: { releaseId, lifecycleStatus: "ACTIVE" },
        include: { stories: true }
      });
      return features
        .filter((feature) =>
          feature.stories.some(
            (story) => story.currentSprintId && secondHalf.has(story.currentSprintId) && story.status !== StoryStatus.DONE
          )
        )
        .map((feature) => ({ featureId: feature.id, name: feature.name }));
    }
  },
  {
    name: "explain_release_status",
    description: "Explain progress, capacity, risk, and alerts for a release.",
    parameters: releaseSchema,
    handler: async (args) => {
      const releaseId = String(args.releaseId);
      const [dashboard, alerts] = await Promise.all([getDashboardData(releaseId), detectAlerts(releaseId)]);
      return {
        summary: `${dashboard.release.name} is ${dashboard.progress}% complete with ${dashboard.plannedEffortDays.toFixed(1)} planned days against ${dashboard.totalCapacityDays.toFixed(1)} capacity days. Risk: ${dashboard.risk}.`,
        alerts: alerts.map((alert) => alert.message)
      };
    }
  }
];
