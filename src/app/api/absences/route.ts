import { NextResponse } from "next/server";
import { createAbsence, listAbsences, toAbsenceView } from "@/lib/squad";

export async function GET() {
  const absences = await listAbsences();
  return NextResponse.json({ absences: absences.map(toAbsenceView) });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const result = await createAbsence(payload);

  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  return NextResponse.json({ absence: toAbsenceView(result.data) }, { status: 201 });
}
