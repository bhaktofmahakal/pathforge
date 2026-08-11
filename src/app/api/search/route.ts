import { NextRequest, NextResponse } from "next/server";
import { searchPeople } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const t0 = performance.now();
  const q = req.nextUrl.searchParams.get("q") || "";
  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 8;

  try {
    const results = await searchPeople(q, isNaN(limit) ? 8 : limit);
    const ms = (performance.now() - t0).toFixed(2);
    return NextResponse.json(
      { results, queryTimeMs: Number(ms) },
      { headers: { "X-Query-Time-Ms": ms } }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "database_unreachable", message: (err as Error).message },
      { status: 503 }
    );
  }
}
