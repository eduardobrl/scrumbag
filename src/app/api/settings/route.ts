import { NextResponse } from "next/server";
import { getOrCreateSettings, toSettingsView, updateSettings } from "@/lib/settings";

export async function GET() {
  const settings = await getOrCreateSettings();
  return NextResponse.json({ settings: toSettingsView(settings) });
}

export async function PUT(request: Request) {
  const payload = await request.json();
  const result = await updateSettings(payload);

  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  return NextResponse.json({ settings: toSettingsView(result.data) });
}
