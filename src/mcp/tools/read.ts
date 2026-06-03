import { StoryStatus } from "@prisma/client";
import { listBacklogStories } from "@/lib/backlog";
import { calculateSprintCapacity } from "@/lib/capacity";
import { getDashboardData } from "@/lib/dashboard";
import { prisma } from "@/lib/db";
import { listFeatures, toFeatureView } from "@/lib/features";
import { getActiveReleaseSummary, listReleases, toActiveReleaseSummary, toReleaseView } from "@/lib/releases";
import { generateReport } from "@/lib/reports";
import { listSprintsForRelease, toSprintView } from "@/lib/sprints";
import { buildTimelineData } from "@/lib/timeline";
import type { McpTool } from "@/mcp/tools/index";

const objectSchema = {
  type: "object" as const,
  properties: {}
};

export const readTools: McpTool[] = [
  {
    name: "get_releases",
    description: "List releases with generated sprints.",
    parameters: objectSchema,
    handler: async () => (await listReleases()).map(toReleaseView)
  },
  {
    name: "get_active_release",
    description: "Return the active in-progress release.",
    parameters: objectSchema,
    handler: async () => {
      const release = await getActiveReleaseSummary();
      return release ? toActiveReleaseSummary(release) : null;
    }
  },
  {
    name: "get_release_summary",
    description: "Return dashboard release health summary.",
    parameters: { type: "object", properties: { releaseId: { type: "string" } }, required: ["releaseId"] },
    handler: async (args) => getDashboardData(String(args.releaseId))
  },
  {
    name: "get_sprints",
    description: "List sprints for a release.",
    parameters: { type: "object", properties: { releaseId: { type: "string" } }, required: ["releaseId"] },
    handler: async (args) => (await listSprintsForRelease(String(args.releaseId))).map(toSprintView)
  },
  {
    name: "get_sprint_capacity",
    description: "Return calculated capacity for a sprint.",
    parameters: { type: "object", properties: { sprintId: { type: "string" } }, required: ["sprintId"] },
    handler: async (args) => calculateSprintCapacity(String(args.sprintId))
  },
  {
    name: "get_features",
    description: "List features with aggregate metrics for a release.",
    parameters: { type: "object", properties: { releaseId: { type: "string" } }, required: ["releaseId"] },
    handler: async (args) => (await listFeatures(String(args.releaseId))).map(toFeatureView)
  },
  {
    name: "get_stories",
    description: "List non-canceled stories by feature or sprint.",
    parameters: {
      type: "object",
      properties: { featureId: { type: "string" }, sprintId: { type: "string" } }
    },
    handler: async (args) =>
      prisma.story.findMany({
        where: {
          status: { not: StoryStatus.CANCELLED },
          ...(args.featureId ? { featureId: String(args.featureId) } : {}),
          ...(args.sprintId ? { currentSprintId: String(args.sprintId) } : {})
        },
        include: { feature: true, currentSprint: true },
        orderBy: { createdAt: "asc" }
      })
  },
  {
    name: "get_backlog",
    description: "List unplanned non-canceled backlog stories for a release.",
    parameters: { type: "object", properties: { releaseId: { type: "string" } }, required: ["releaseId"] },
    handler: async (args) => listBacklogStories({ releaseId: String(args.releaseId), unplannedOnly: true })
  },
  {
    name: "get_timeline",
    description: "Return timeline data for a release.",
    parameters: { type: "object", properties: { releaseId: { type: "string" } }, required: ["releaseId"] },
    handler: async (args) => buildTimelineData(String(args.releaseId))
  },
  {
    name: "get_capacity_report",
    description: "Return planned versus capacity report.",
    parameters: { type: "object", properties: { releaseId: { type: "string" } }, required: ["releaseId"] },
    handler: async (args) => generateReport("planned-vs-capacity", String(args.releaseId))
  },
  {
    name: "get_leakage_report",
    description: "Return leakage report.",
    parameters: { type: "object", properties: { releaseId: { type: "string" } }, required: ["releaseId"] },
    handler: async (args) => generateReport("leakage", String(args.releaseId))
  }
];
