export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { countOnlineUsers } from "@/lib/presence";

/** Public online player count for landing stats — no user details exposed. */
export async function GET() {
  try {
    const count = await countOnlineUsers();
    return NextResponse.json(
      { count },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
