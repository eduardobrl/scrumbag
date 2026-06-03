import { cancelFeature } from "@/lib/features";
import { closeSprint, reopenSprint } from "@/lib/sprint-closure";
import { cancelStory } from "@/lib/stories";
import type { McpTool } from "@/mcp/tools/index";

const confirmedSchema = {
  type: "object" as const,
  properties: { confirmed: { type: "boolean" } },
  required: []
};

export const safeTools: McpTool[] = [
  {
    name: "close_sprint",
    description: "Close a sprint and migrate unfinished stories. Requires confirmation.",
    parameters: {
      ...confirmedSchema,
      properties: { sprintId: { type: "string" }, confirmed: { type: "boolean" } },
      required: ["sprintId"]
    },
    dangerous: true,
    handler: async (args) => closeSprint(String(args.sprintId))
  },
  {
    name: "reopen_sprint",
    description: "Reopen a closed sprint. Requires confirmation.",
    parameters: {
      ...confirmedSchema,
      properties: { sprintId: { type: "string" }, confirmed: { type: "boolean" } },
      required: ["sprintId"]
    },
    dangerous: true,
    handler: async (args) => reopenSprint(String(args.sprintId))
  },
  {
    name: "cancel_story",
    description: "Cancel a story without deleting it. Requires confirmation.",
    parameters: {
      ...confirmedSchema,
      properties: { storyId: { type: "string" }, confirmed: { type: "boolean" } },
      required: ["storyId"]
    },
    dangerous: true,
    handler: async (args) => cancelStory(String(args.storyId))
  },
  {
    name: "cancel_feature",
    description: "Cancel a feature without deleting it. Requires confirmation.",
    parameters: {
      ...confirmedSchema,
      properties: { featureId: { type: "string" }, confirmed: { type: "boolean" } },
      required: ["featureId"]
    },
    dangerous: true,
    handler: async (args) => cancelFeature(String(args.featureId))
  }
];
