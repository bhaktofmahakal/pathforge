import { NextRequest, NextResponse } from "next/server";
import { getPersonProfile } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ login: string }> }
) {
  const { login } = await params;

  if (!login) {
    return NextResponse.json({ error: "Missing login parameter" }, { status: 400 });
  }

  try {
    const person = await getPersonProfile(login);

    if (!person) {
      return NextResponse.json({ error: "person_not_found" }, { status: 404 });
    }

    return NextResponse.json({ person });
  } catch (err) {
    return NextResponse.json(
      { error: "database_unreachable", message: (err as Error).message },
      { status: 503 }
    );
  }
}
