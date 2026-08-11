import { NextRequest, NextResponse } from "next/server";
import { getShortestPath } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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

    if (!pathResult) {
      return NextResponse.json({
        found: false,
        message: `No connection path found between ${from} and ${to} within 6 hops.`,
      });
    }

    return NextResponse.json({
      found: true,
      ...pathResult,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "database_unreachable", message: (err as Error).message },
      { status: 503 }
    );
  }
}
