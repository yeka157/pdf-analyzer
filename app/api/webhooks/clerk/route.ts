import { prisma } from "@/lib/prisma";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req, {
      signingSecret: process.env.WEBHOOK_SECRET,
    });

    // Do something with payload
    // For this guide, log payload to console

    if (evt.type === "user.created") {
      const { id, email_addresses, first_name, last_name } = evt.data;

      try {
        const fullName = `${first_name || ""} ${last_name || ""}`.trim();

        // call prisma to create user
        await prisma.user.create({
          data: {
            id,
            email: email_addresses[0].email_address,
            name: fullName || null,
          },
        });
        console.log(id, fullName, email_addresses);
      } catch (error) {
        console.error(error);
        return new Response("Error saving user", { status: 500 });
      }
    }
    return new Response("Webhook received", { status: 200 });
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error verifying webhook", { status: 400 });
  }
}
