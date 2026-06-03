import { NextResponse } from "next/server";
import { moveStoryToBacklog } from "@/lib/backlog";
import { toStoryView } from "@/lib/stories";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await moveStoryToBacklog(id);

  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  return NextResponse.json({ story: toStoryView(result.data) });
}
