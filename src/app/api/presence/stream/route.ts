export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { getSession, unauthorized } from "@/lib/getSession";
import {
  listOnlineUsers,
  serializeOnlineUsers,
  touchPresence,
} from "@/lib/presence";

const STREAM_INTERVAL_MS = 1_000;

/** Live SSE feed of who's online — pushes immediately when the list changes. */
export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session) return unauthorized();

  const userId = session.id;
  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | null = null;
  let lastKey: string | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const push = async () => {
        try {
          await touchPresence(userId, true);
          const onlineUsers = await listOnlineUsers(userId);
          const users = serializeOnlineUsers(onlineUsers);
          const key = users.map((u) => u.id).join(",");

          if (lastKey === null || key !== lastKey) {
            lastKey = key;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ users, count: users.length })}\n\n`,
              ),
            );
            return;
          }

          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          if (timer) clearInterval(timer);
          try {
            controller.close();
          } catch {
            // already closed
          }
        }
      };

      void push();
      timer = setInterval(() => void push(), STREAM_INTERVAL_MS);

      req.signal.addEventListener("abort", () => {
        if (timer) clearInterval(timer);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
    cancel() {
      if (timer) clearInterval(timer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
