import { NextResponse } from "next/server";
import driver from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const t0 = performance.now();
  const session = driver.session();
  try {
    await session.run("RETURN 1");
    const ms = (performance.now() - t0).toFixed(2);
    return NextResponse.json(
      { status: "ok", latencyMs: Number(ms) },
      { headers: { "X-Query-Time-Ms": ms } }
    );
  } catch (err) {
    return NextResponse.json(
      { status: "error", message: (err as Error).message },
      { status: 503 }
    );
  } finally {
    await session.close();
  }
}
