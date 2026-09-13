import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // The keepalive route uses its own Vercel Cron Bearer secret. Skip Clerk
    // there so the machine token is not parsed as a Clerk session JWT.
    "/((?!api/cron/supabase-keepalive(?:/|$)|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for other API routes, even when their paths contain dots.
    "/(api(?!/cron/supabase-keepalive(?:/|$))|trpc)(.*)",
  ],
};
