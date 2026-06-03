import { NextResponse } from "next/server";
import { createSquadMember, listSquadMembers } from "@/lib/squad";

export async function GET() {
  const members = await listSquadMembers();
  return NextResponse.json({ members });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const result = await createSquadMember(payload);

  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  return NextResponse.json({ member: result.data }, { status: 201 });
}
