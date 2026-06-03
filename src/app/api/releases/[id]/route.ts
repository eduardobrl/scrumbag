import { NextResponse } from "next/server";
import { getReleaseDetails, updateRelease, toReleaseView } from "@/lib/releases";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const release = await getReleaseDetails(id);

  if (!release) {
    return NextResponse.json({ errors: { general: "Release not found" } }, { status: 404 });
  }

  return NextResponse.json({ release: toReleaseView(release) });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await request.json();
  const result = await updateRelease(id, payload);

  if (!result.ok) {
    const status = result.errors.general === "Release not found" ? 404 : 400;
    return NextResponse.json({ errors: result.errors }, { status });
  }

  return NextResponse.json({ release: toReleaseView(result.data) });
}
