import { NextResponse } from "next/server";
import { createRelease, listReleases, toReleaseView } from "@/lib/releases";

export async function GET() {
  const releases = await listReleases();
  return NextResponse.json({ releases: releases.map(toReleaseView) });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const result = await createRelease(payload);

  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  return NextResponse.json({ release: toReleaseView(result.data) }, { status: 201 });
}
