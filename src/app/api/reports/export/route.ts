import { NextResponse } from "next/server";
import { csvFromRows, excelFromSheets } from "@/lib/export";
import { generateReport } from "@/lib/reports";
import { isReportType } from "@/lib/report-types";

function filename(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function POST(request: Request) {
  const payload = await request.json();

  if (!isReportType(payload.type) || typeof payload.releaseId !== "string") {
    return NextResponse.json({ error: "Valid type and releaseId are required" }, { status: 400 });
  }

  const report = await generateReport(payload.type, payload.releaseId);
  const baseName = filename(`${report.title}-${payload.releaseId.slice(0, 8)}`);

  if (payload.format === "csv") {
    const csv = csvFromRows(report.columns, report.rows);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${baseName}.csv"`
      }
    });
  }

  if (payload.format === "xlsx") {
    const buffer = excelFromSheets([{ name: report.title, columns: report.columns, rows: report.rows }]);
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${baseName}.xlsx"`
      }
    });
  }

  return NextResponse.json({ error: "format must be csv or xlsx" }, { status: 400 });
}
