import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/dashboard";
import { detectAlerts } from "@/lib/alerts";

export async function GET(request: Request) {
  const releaseId = new URL(request.url).searchParams.get("releaseId");
  if (!releaseId) {
    return NextResponse.json({ error: "releaseId is required" }, { status: 400 });
  }

  const [dashboard, alerts] = await Promise.all([getDashboardData(releaseId), detectAlerts(releaseId)]);
  return NextResponse.json({ dashboard, alerts });
}
