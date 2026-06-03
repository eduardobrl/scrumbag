import { NextResponse } from "next/server";
import { updateSquadMember } from "@/lib/squad";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await request.json();
  const result = await updateSquadMember(id, payload);

  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  return NextResponse.json({ member: result.data });
}
