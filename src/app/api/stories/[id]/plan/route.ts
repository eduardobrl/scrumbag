import { NextResponse } from "next/server";
import { planStoryIntoSprint, previewStorySprintPlan } from "@/lib/backlog";
import { toStoryView } from "@/lib/stories";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await request.json();
  const sprintId = typeof payload.sprintId === "string" ? payload.sprintId : "";
  if (payload.previewOnly === true) {
    const result = await previewStorySprintPlan(id, sprintId);

    if (!result.ok) {
      return NextResponse.json({ errors: result.errors }, { status: 400 });
    }

    return NextResponse.json({ preview: result.data });
  }

  const result = await planStoryIntoSprint(id, sprintId);

  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  return NextResponse.json({ story: toStoryView(result.data) });
}
