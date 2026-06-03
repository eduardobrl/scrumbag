import { NextResponse } from "next/server";
import { listBacklogStories } from "@/lib/backlog";
import { toStoryView } from "@/lib/stories";
import { StoryStatus } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const stories = await listBacklogStories({
    releaseId: searchParams.get("releaseId") ?? undefined,
    featureId: searchParams.get("featureId") ?? undefined,
    status: status && status !== "ALL" ? (status as StoryStatus) : "ALL",
    q: searchParams.get("q") ?? undefined,
    unplannedOnly: searchParams.get("unplannedOnly") !== "false",
    includeCanceled: searchParams.get("includeCanceled") === "true"
  });

  return NextResponse.json({ stories: stories.map(toStoryView) });
}
