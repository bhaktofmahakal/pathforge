import { NextRequest, NextResponse } from "next/server";
import { getShortestPath } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const t0 = performance.now();
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json(
      { error: "Both 'from' and 'to' query parameters are required" },
      { status: 400 }
    );
  }

  try {
    const pathResult = await getShortestPath(from, to);
    const ms = (performance.now() - t0).toFixed(2);
    if (!pathResult) {
      return NextResponse.json(
        { found: false, message: `No path found between '${from}' and '${to}'` },
        { headers: { "X-Query-Time-Ms": ms } }
      );
    }
    return NextResponse.json(
      { found: true, ...pathResult, queryTimeMs: Number(ms) },
      { headers: { "X-Query-Time-Ms": ms } }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "database_unreachable", message: (err as Error).message },
      { status: 503 }
    );
  }
}
