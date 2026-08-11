import { NextRequest, NextResponse } from "next/server";
import { getRecommendations } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const login = req.nextUrl.searchParams.get("login");

  if (!login) {
    return NextResponse.json(
      { error: "The 'login' query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const recommendations = await getRecommendations(login);
    return NextResponse.json({ recommendations });
  } catch (err) {
    return NextResponse.json(
      { error: "database_unreachable", message: (err as Error).message },
      { status: 503 }
    );
  }
}
