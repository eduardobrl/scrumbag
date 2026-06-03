import { NextResponse } from "next/server";
import { reopenSprint } from "@/lib/sprint-closure";
import { recalculateSprintPlanningSummary } from "@/lib/sprint-planning-summary";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await reopenSprint(id);

  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  await recalculateSprintPlanningSummary(id);

  return NextResponse.json({ sprint: result.data });
}
