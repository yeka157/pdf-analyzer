import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error("Supabase keepalive database probe failed:", error);
    return Response.json({ ok: false }, { status: 500 });
  }

  return Response.json({ ok: true });
}
