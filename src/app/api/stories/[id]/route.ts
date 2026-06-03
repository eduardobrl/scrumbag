import { NextResponse } from "next/server";
import { cancelStory, getStoryDetails, toStoryView, updateStory } from "@/lib/stories";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const story = await getStoryDetails(id);

  if (!story) {
    return NextResponse.json({ errors: { general: "Story not found" } }, { status: 404 });
  }

  return NextResponse.json({ story: toStoryView(story) });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const text = await request.text();
  const payload = text ? JSON.parse(text) : {};
  const result = payload.action === "cancel" ? await cancelStory(id) : await updateStory(id, payload);

  if (!result.ok) {
    const status = result.errors.general === "Story not found" ? 404 : 400;
    return NextResponse.json({ errors: result.errors }, { status });
  }

  return NextResponse.json({ story: toStoryView(result.data) });
}
