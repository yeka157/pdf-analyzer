import { prisma } from "@/lib/prisma";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";

function buildName(firstName?: string | null, lastName?: string | null) {
  return `${firstName || ""} ${lastName || ""}`.trim() || null;
}

export async function POST(req: NextRequest) {
  let evt;

  try {
    evt = await verifyWebhook(req, {
      signingSecret: process.env.WEBHOOK_SECRET,
    });
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error verifying webhook", { status: 400 });
  }

  try {
    switch (evt.type) {
      case "user.created":
      case "user.updated": {
        const { id, email_addresses, first_name, last_name } = evt.data;
        const email = email_addresses[0]?.email_address;

        if (!email) {
          console.error(`Webhook ${evt.type} for ${id} carried no email`);
          break;
        }

        const name = buildName(first_name, last_name);

        // Upsert rather than create: `user.updated` can arrive for a user this
        // database has never seen, and `user.created` can be redelivered.
        await prisma.user.upsert({
          where: { id },
          create: { id, email, name },
          update: { email, name },
        });
        break;
      }

      case "user.deleted": {
        const { id } = evt.data;

        if (!id) break;

        // Subscription rows reference User, so clear them first.
        await prisma.subscription.deleteMany({ where: { userId: id } });
        await prisma.user.deleteMany({ where: { id } });
        break;
      }
    }

    return new Response("Webhook received", { status: 200 });
  } catch (error) {
    console.error(`Error handling Clerk webhook ${evt.type}:`, error);
    return new Response("Error handling webhook", { status: 500 });
  }
}
