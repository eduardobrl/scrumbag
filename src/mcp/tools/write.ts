import { StoryStatus } from "@prisma/client";
import { moveStoryToBacklog, planStoryIntoSprint } from "@/lib/backlog";
import { createFeature, updateFeature } from "@/lib/features";
import { prisma } from "@/lib/db";
import { createStory, updateStory, validateStoryStatus } from "@/lib/stories";
import type { McpTool } from "@/mcp/tools/index";

export const writeTools: McpTool[] = [
  {
    name: "create_feature",
    description: "Create a feature for a release.",
    parameters: {
      type: "object",
      properties: { releaseId: { type: "string" }, name: { type: "string" }, description: { type: "string" } },
      required: ["releaseId", "name"]
    },
    handler: async (args) =>
      createFeature({
        releaseId: args.releaseId,
        name: args.name,
        description: args.description
      })
  },
  {
    name: "update_feature",
    description: "Update feature name or description.",
    parameters: {
      type: "object",
      properties: { featureId: { type: "string" }, name: { type: "string" }, description: { type: "string" } },
      required: ["featureId"]
    },
    handler: async (args) => {
      const feature = await prisma.feature.findUnique({ where: { id: String(args.featureId) } });
      if (!feature) return { ok: false, errors: { featureId: "Feature not found" } };
      return updateFeature(feature.id, {
        releaseId: feature.releaseId,
        name: args.name ?? feature.name,
        description: args.description ?? feature.description
      });
    }
  },
  {
    name: "create_story",
    description: "Create a story under a feature.",
    parameters: {
      type: "object",
      properties: {
        featureId: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        acceptanceCriteria: { type: "string" },
        storyPoints: { type: "number" },
        estimatedDays: { type: "number" }
      },
      required: ["featureId", "title"]
    },
    handler: async (args) =>
      createStory({
        featureId: args.featureId,
        title: args.title,
        description: args.description,
        acceptanceCriteria: args.acceptanceCriteria,
        storyPoints: args.storyPoints,
        estimatedDays: args.estimatedDays
      })
  },
  {
    name: "update_story",
    description: "Update story fields.",
    parameters: {
      type: "object",
      properties: {
        storyId: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        acceptanceCriteria: { type: "string" },
        storyPoints: { type: "number" },
        estimatedDays: { type: "number" },
        status: { type: "string", enum: Object.values(StoryStatus) }
      },
      required: ["storyId"]
    },
    handler: async (args) => {
      const story = await prisma.story.findUnique({ where: { id: String(args.storyId) } });
      if (!story) return { ok: false, errors: { storyId: "Story not found" } };
      return updateStory(story.id, {
        featureId: story.featureId,
        title: args.title ?? story.title,
        description: args.description ?? story.description,
        acceptanceCriteria: args.acceptanceCriteria ?? story.acceptanceCriteria,
        storyPoints: args.storyPoints ?? story.storyPoints,
        estimatedDays: args.estimatedDays ?? story.estimatedDays,
        status: args.status ?? story.status,
        currentSprintId: story.currentSprintId
      });
    }
  },
  {
    name: "move_story",
    description: "Move a story to a sprint or back to backlog when sprintId is omitted.",
    parameters: {
      type: "object",
      properties: { storyId: { type: "string" }, sprintId: { type: "string" } },
      required: ["storyId"]
    },
    handler: async (args) =>
      args.sprintId ? planStoryIntoSprint(String(args.storyId), String(args.sprintId)) : moveStoryToBacklog(String(args.storyId))
  },
  {
    name: "update_story_status",
    description: "Update story workflow status.",
    parameters: {
      type: "object",
      properties: { storyId: { type: "string" }, status: { type: "string", enum: Object.values(StoryStatus) } },
      required: ["storyId", "status"]
    },
    handler: async (args) => {
      const status = validateStoryStatus(args.status);
      if (!status.ok) return { ok: false, errors: status.errors };
      const story = await prisma.story.update({
        where: { id: String(args.storyId) },
        data: { status: status.data },
        include: { feature: true, currentSprint: true }
      });
      return { ok: true, data: story };
    }
  }
];
