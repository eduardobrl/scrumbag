import { NextResponse } from "next/server";
import { buildTimelineData } from "@/lib/timeline";

export async function GET(request: Request) {
  const releaseId = new URL(request.url).searchParams.get("releaseId");
  if (!releaseId) {
    return NextResponse.json({ error: "releaseId is required" }, { status: 400 });
  }

  return NextResponse.json(await buildTimelineData(releaseId));
}
