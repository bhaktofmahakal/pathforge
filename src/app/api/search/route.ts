import { NextRequest, NextResponse } from "next/server";
import { searchPeople } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";

  if (q.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchPeople(q);
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json(
      { error: "database_unreachable", message: (err as Error).message },
      { status: 503 }
    );
  }
}
