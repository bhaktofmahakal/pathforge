import { NextRequest, NextResponse } from "next/server";
import { getConnectors } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const t0 = performance.now();
  const me = req.nextUrl.searchParams.get("me");
  const target = req.nextUrl.searchParams.get("target");

  if (!me || !target) {
    return NextResponse.json(
      { error: "Both 'me' and 'target' query parameters are required" },
      { status: 400 }
    );
  }

  try {
    const connectors = await getConnectors(me, target);
    const ms = (performance.now() - t0).toFixed(2);
    return NextResponse.json(
      { connectors, queryTimeMs: Number(ms) },
      { headers: { "X-Query-Time-Ms": ms } }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "database_unreachable", message: (err as Error).message },
      { status: 503 }
    );
  }
}
