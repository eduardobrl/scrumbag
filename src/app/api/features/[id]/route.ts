import { NextResponse } from "next/server";
import {
  cancelFeature,
  getFeatureDetails,
  reassignFeatureRelease,
  toFeatureView,
  undoReassignFeatureRelease,
  updateFeature
} from "@/lib/features";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const feature = await getFeatureDetails(id);

  if (!feature) {
    return NextResponse.json({ errors: { general: "Feature not found" } }, { status: 404 });
  }

  return NextResponse.json({ feature: toFeatureView(feature) });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const text = await request.text();
  const payload = text ? JSON.parse(text) : {};
  const result =
    payload.action === "cancel"
      ? await cancelFeature(id)
      : payload.action === "reassignRelease"
        ? await reassignFeatureRelease(id, payload.targetReleaseId)
        : payload.action === "undoReassignRelease"
          ? await undoReassignFeatureRelease(id, payload.undo)
          : await updateFeature(id, payload);

  if (!result.ok) {
    const status = result.errors.general === "Feature not found" ? 404 : 400;
    return NextResponse.json({ errors: result.errors }, { status });
  }

  if ("feature" in result.data) {
    return NextResponse.json({
      feature: toFeatureView(result.data.feature),
      undo: "undo" in result.data ? result.data.undo : undefined,
      changed: "changed" in result.data ? result.data.changed : undefined
    });
  }

  return NextResponse.json({ feature: toFeatureView(result.data) });
}
