import { NextResponse } from "next/server";
import { StoryStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { toStoryView, validateStoryStatus } from "@/lib/stories";

const BOARD_STATUSES = new Set<StoryStatus>([
  StoryStatus.SPRINT_BACKLOG,
  StoryStatus.IN_PROGRESS,
  StoryStatus.DONE
]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await request.json();
  const validated = validateStoryStatus(payload.status);

  if (!validated.ok || !BOARD_STATUSES.has(validated.data)) {
    return NextResponse.json({ errors: { status: "Choose a valid status" } }, { status: 400 });
  }

  const existing = await prisma.story.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ errors: { general: "Story not found" } }, { status: 404 });
  }

  const story = await prisma.story.update({
    where: { id },
    data: { status: validated.data },
    include: {
      feature: { include: { release: true } },
      currentSprint: true
    }
  });

  return NextResponse.json({ story: toStoryView(story) });
}
