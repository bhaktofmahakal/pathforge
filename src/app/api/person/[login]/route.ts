import { NextRequest, NextResponse } from "next/server";
import { getPersonProfile } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ login: string }> }
) {
  const t0 = performance.now();
  const { login } = await params;

  if (!login) {
    return NextResponse.json({ error: "Missing login parameter" }, { status: 400 });
  }

  try {
    const person = await getPersonProfile(login);
    const ms = (performance.now() - t0).toFixed(2);
    if (!person) {
      return NextResponse.json(
        { error: "not_found", message: `Person '${login}' not found` },
        { status: 404, headers: { "X-Query-Time-Ms": ms } }
      );
    }
    return NextResponse.json(
      { person, queryTimeMs: Number(ms) },
      { headers: { "X-Query-Time-Ms": ms } }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "database_unreachable", message: (err as Error).message },
      { status: 503 }
    );
  }
}
