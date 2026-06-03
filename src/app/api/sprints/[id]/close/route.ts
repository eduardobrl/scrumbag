import { NextResponse } from "next/server";
import { closeSprint, validateSprintClosure } from "@/lib/sprint-closure";
import { recalculateSprintPlanningSummary } from "@/lib/sprint-planning-summary";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const validation = await validateSprintClosure(id);

  if (!validation.ok) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const result = await closeSprint(id);
  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  await recalculateSprintPlanningSummary(result.data.closedSprint.id);
  await recalculateSprintPlanningSummary(result.data.destinationSprint.id);

  return NextResponse.json(result.data);
}
