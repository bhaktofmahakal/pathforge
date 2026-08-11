import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 20;

  try {
    const leaderboard = await getLeaderboard(limit);
    return NextResponse.json({ leaderboard });
  } catch (err) {
    return NextResponse.json(
      { error: "database_unreachable", message: (err as Error).message },
      { status: 503 }
    );
  }
}
