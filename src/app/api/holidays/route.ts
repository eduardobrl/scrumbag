import { NextResponse } from "next/server";
import { createHoliday, listHolidays, toHolidayView } from "@/lib/squad";

export async function GET() {
  const holidays = await listHolidays();
  return NextResponse.json({ holidays: holidays.map(toHolidayView) });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const result = await createHoliday(payload);

  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  return NextResponse.json({ holiday: toHolidayView(result.data) }, { status: 201 });
}
