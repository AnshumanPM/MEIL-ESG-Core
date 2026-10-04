import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { sites } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getAuthContext() {
  const session = await auth();
  const { userId, orgId, orgRole, has, sessionClaims } = session;

  if (!userId) {
    throw new Error("Unauthorized: User not authenticated");
  }

  let site = null;
  let isHq = false;

  if (orgId) {
    const found = await db
      .select()
      .from(sites)
      .where(eq(sites.clerkOrgId, orgId))
      .limit(1);

    if (found.length > 0) {
      site = found[0];
    } else {
      try {
        const client = await clerkClient();
        const org = await client.organizations.getOrganization({
          organizationId: orgId,
        });
        const meta = (org.publicMetadata || {}) as Record<string, any>;
        isHq =
          meta.node_type === "HQ" ||
          org.name.toLowerCase().includes("hq") ||
          org.slug?.toLowerCase().includes("hq") ||
          false;

        if (!isHq) {
          const siteCode =
            (meta.site_id as string) ||
            `PRJ-${org.id.slice(-6).toUpperCase()}`;
          const buCode = (meta.bu_id as string) || "BU-WATER";
          const state = (meta.state as string) || "AP";

          await db
            .insert(sites)
            .values({
              id: siteCode,
              clerkOrgId: org.id,
              name: org.name,
              buId: buCode,
              stateCode: state,
              active: true,
            })
            .onConflictDoUpdate({
              target: sites.id,
              set: {
                clerkOrgId: org.id,
                name: org.name,
                buId: buCode,
                stateCode: state,
                active: true,
              },
            });

          const synced = await db
            .select()
            .from(sites)
            .where(eq(sites.clerkOrgId, orgId))
            .limit(1);

          if (synced.length > 0) {
            site = synced[0];
          }
        }
      } catch (err) {
        console.error("Clerk org resolution error:", err);
      }
    }
  }

  const claims = sessionClaims as Record<string, any> | undefined;
  let buIds: string[] =
    claims?.bu_ids ||
    claims?.public_metadata?.bu_ids ||
    claims?.metadata?.bu_ids ||
    [];

  if (userId && buIds.length === 0) {
    try {
      const client = await clerkClient();
      const u = await client.users.getUser(userId);
      const userMeta = (u.publicMetadata || {}) as Record<string, any>;
      if (Array.isArray(userMeta.bu_ids)) {
        buIds = userMeta.bu_ids;
      }
    } catch {}
  }

  return {
    userId,
    orgId,
    orgRole,
    site,
    isHq,
    buIds,
    has,
    sessionClaims,
  };
}

export async function requireAuthContext() {
  const ctx = await getAuthContext();
  if (!ctx.orgId) {
    throw new Error("Forbidden: Organization membership required");
  }
  return ctx;
}

export async function requireSiteContext() {
  const ctx = await requireAuthContext();
  if (!ctx.site) {
    throw new Error(
      "Forbidden: Active organization is not a registered project site"
    );
  }
  return { ...ctx, site: ctx.site };
}

export async function requireBUReviewerContext() {
  const ctx = await requireAuthContext();
  if (
    ctx.orgRole !== "org:bu_reviewer" &&
    ctx.orgRole !== "bu_reviewer" &&
    ctx.orgRole !== "org:corporate_admin" &&
    ctx.orgRole !== "corporate_admin"
  ) {
    throw new Error("Forbidden: BU Reviewer or Admin permission required");
  }
  return ctx;
}

export async function requireCorporateAdminContext() {
  const ctx = await requireAuthContext();
  if (
    ctx.orgRole !== "org:corporate_admin" &&
    ctx.orgRole !== "corporate_admin"
  ) {
    throw new Error("Forbidden: Corporate Admin permission required");
  }
  return ctx;
}

export async function requireAuditorContext() {
  const ctx = await requireAuthContext();
  if (
    ctx.orgRole !== "org:external_auditor" &&
    ctx.orgRole !== "external_auditor" &&
    ctx.orgRole !== "org:corporate_admin" &&
    ctx.orgRole !== "corporate_admin"
  ) {
    throw new Error("Forbidden: External Auditor permission required");
  }
  return ctx;
}
