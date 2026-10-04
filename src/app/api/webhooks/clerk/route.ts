import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sites, auditLog } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Missing CLERK_WEBHOOK_SECRET" },
      { status: 500 }
    );
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: "Missing Svix verification headers" },
      { status: 400 }
    );
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as unknown as WebhookEvent;
  } catch (err: any) {
    return NextResponse.json(
      { error: "Webhook verification failed: " + err.message },
      { status: 400 }
    );
  }

  const eventType = evt.type;

  if (eventType === "organization.created" || eventType === "organization.updated") {
    const data = evt.data;
    const metadata = (data.public_metadata || {}) as Record<string, any>;

    if (metadata.node_type === "SITE" && metadata.site_id && metadata.bu_id) {
      await db
        .insert(sites)
        .values({
          id: metadata.site_id as string,
          clerkOrgId: data.id,
          name: data.name,
          buId: metadata.bu_id as string,
          stateCode: (metadata.state as string) || "IND",
          active: true,
        })
        .onConflictDoUpdate({
          target: sites.id,
          set: {
            clerkOrgId: data.id,
            name: data.name,
            buId: metadata.bu_id as string,
            stateCode: (metadata.state as string) || "IND",
            active: true,
          },
        });
    }

    await db.insert(auditLog).values({
      action: eventType === "organization.created" ? "CREATE" : "UPDATE",
      actorClerkId: data.created_by || "clerk_system",
      detail: `Clerk organization event ${eventType} for ${data.name} (${data.id})`,
    });
  } else if (eventType === "organization.deleted") {
    const data = evt.data;
    if (data.id) {
      await db
        .update(sites)
        .set({ active: false })
        .where(eq(sites.clerkOrgId, data.id));
    }
  }

  return NextResponse.json({ success: true });
}
