import { NextResponse } from "next/server";
import driver from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = performance.now();
  try {
    const session = driver.session();
    try {
      await session.run("RETURN 1 AS ok");
      const elapsed = (performance.now() - start).toFixed(2);
      return NextResponse.json(
        { status: "ok", queryTimeMs: `${elapsed}ms` },
        { headers: { "X-Query-Time-Ms": elapsed } }
      );
    } finally {
      await session.close();
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown database error";
    return NextResponse.json(
      { status: "error", error: "database_unreachable", message },
      { status: 503 }
    );
  }
}
