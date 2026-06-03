import { NextResponse } from "next/server";
import { createStory, toStoryView } from "@/lib/stories";

export async function POST(request: Request) {
  const payload = await request.json();
  const result = await createStory(payload);

  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  return NextResponse.json({ story: toStoryView(result.data) }, { status: 201 });
}
