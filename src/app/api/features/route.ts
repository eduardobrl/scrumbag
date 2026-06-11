import { NextResponse } from "next/server";
import { createFeature, listFeatures, listOrphanFeatures, toFeatureView } from "@/lib/features";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const releaseId = searchParams.get("releaseId");
  const features = releaseId === "orphans" ? await listOrphanFeatures() : await listFeatures(releaseId ?? undefined);

  return NextResponse.json({ features: features.map(toFeatureView) });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const result = await createFeature(payload);

  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  return NextResponse.json({ feature: toFeatureView(result.data) }, { status: 201 });
}
