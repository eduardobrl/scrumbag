import { NextResponse } from "next/server";
import { createImpediment, listImpedimentsByRelease, toImpedimentView } from "@/lib/impediments";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const releaseId = searchParams.get("releaseId");

  if (!releaseId) {
    return NextResponse.json({ errors: { releaseId: "Required" } }, { status: 400 });
  }

  const impediments = await listImpedimentsByRelease(releaseId);
  return NextResponse.json({ impediments: impediments.map(toImpedimentView) });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const result = await createImpediment(payload);

  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  return NextResponse.json({ impediment: toImpedimentView(result.data) }, { status: 201 });
}
