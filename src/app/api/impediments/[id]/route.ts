import { NextResponse } from "next/server";
import { getImpedimentDetail, resolveImpediment, toImpedimentView, updateImpediment } from "@/lib/impediments";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const impediment = await getImpedimentDetail(id);

  if (!impediment) {
    return NextResponse.json({ errors: { general: "Impediment not found" } }, { status: 404 });
  }

  return NextResponse.json({ impediment: toImpedimentView(impediment) });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const text = await request.text();
  const payload = text ? JSON.parse(text) : {};
  const result = payload.action === "resolve" ? await resolveImpediment(id, payload) : await updateImpediment(id, payload);

  if (!result.ok) {
    const status = result.errors.general === "Impediment not found" ? 404 : 400;
    return NextResponse.json({ errors: result.errors }, { status });
  }

  return NextResponse.json({ impediment: toImpedimentView(result.data) });
}
