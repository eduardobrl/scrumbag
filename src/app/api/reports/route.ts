import { NextResponse } from "next/server";
import { generateReport } from "@/lib/reports";
import { isReportType } from "@/lib/report-types";

export async function POST(request: Request) {
  const payload = await request.json();

  if (!isReportType(payload.type) || typeof payload.releaseId !== "string") {
    return NextResponse.json({ error: "Valid type and releaseId are required" }, { status: 400 });
  }

  const report = await generateReport(payload.type, payload.releaseId);
  return NextResponse.json(report);
}
