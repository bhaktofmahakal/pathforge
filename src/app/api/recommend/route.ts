import { NextRequest, NextResponse } from "next/server";
import { getRecommendations } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const t0 = performance.now();
  const login = req.nextUrl.searchParams.get("login");

  if (!login) {
    return NextResponse.json(
      { error: "Query parameter 'login' is required" },
      { status: 400 }
    );
  }

  try {
    const recommendations = await getRecommendations(login);
    const ms = (performance.now() - t0).toFixed(2);
    return NextResponse.json(
      { recommendations, queryTimeMs: Number(ms) },
      { headers: { "X-Query-Time-Ms": ms } }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "database_unreachable", message: (err as Error).message },
      { status: 503 }
    );
  }
}
