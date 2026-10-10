"use server";

import { db } from "@/db";
import { groups, companies, businessUnits, auditLog } from "@/db/schema";
import { getAuthContext } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function assertCorporateAdmin(ctx: { orgRole?: string | null }) {
  if (
    ctx.orgRole !== "org:corporate_admin" &&
    ctx.orgRole !== "corporate_admin"
  ) {
    throw new Error(
      "Permission denied: Corporate Admin authorization required",
    );
  }
}

export async function createGroupAction(data: { id: string; name: string }) {
  const ctx = await getAuthContext();
  assertCorporateAdmin(ctx);

  await db.insert(groups).values({
    id: data.id.trim(),
    name: data.name.trim(),
  });

  await db.insert(auditLog).values({
    action: "CREATE",
    actorClerkId: ctx.userId,
    detail: `Created Group ${data.id} (${data.name})`,
  });

  revalidatePath("/dashboard/admin/groups");
  revalidatePath("/dashboard/admin/hierarchy");
  revalidatePath("/dashboard/admin/companies");
  return { success: true };
}

export async function updateGroupAction(id: string, data: { name: string }) {
  const ctx = await getAuthContext();
  assertCorporateAdmin(ctx);

  await db
    .update(groups)
    .set({
      name: data.name.trim(),
    })
    .where(eq(groups.id, id));

  await db.insert(auditLog).values({
    action: "UPDATE",
    actorClerkId: ctx.userId,
    detail: `Updated Group ${id} (${data.name})`,
  });

  revalidatePath("/dashboard/admin/groups");
  revalidatePath("/dashboard/admin/hierarchy");
  revalidatePath("/dashboard/admin/companies");
  return { success: true };
}

export async function createCompanyAction(data: {
  id: string;
  name: string;
  groupId: string;
}) {
  const ctx = await getAuthContext();
  assertCorporateAdmin(ctx);

  await db.insert(companies).values({
    id: data.id.trim(),
    name: data.name.trim(),
    groupId: data.groupId,
  });

  await db.insert(auditLog).values({
    action: "CREATE",
    actorClerkId: ctx.userId,
    detail: `Created Company ${data.id} (${data.name}) under Group ${data.groupId}`,
  });

  revalidatePath("/dashboard/admin/companies");
  revalidatePath("/dashboard/admin/hierarchy");
  revalidatePath("/dashboard/admin/business-units");
  return { success: true };
}

export async function updateCompanyAction(
  id: string,
  data: { name: string; groupId: string },
) {
  const ctx = await getAuthContext();
  assertCorporateAdmin(ctx);

  await db
    .update(companies)
    .set({
      name: data.name.trim(),
      groupId: data.groupId,
    })
    .where(eq(companies.id, id));

  await db.insert(auditLog).values({
    action: "UPDATE",
    actorClerkId: ctx.userId,
    detail: `Updated Company ${id} (${data.name}), Group: ${data.groupId}`,
  });

  revalidatePath("/dashboard/admin/companies");
  revalidatePath("/dashboard/admin/hierarchy");
  revalidatePath("/dashboard/admin/business-units");
  return { success: true };
}

export async function createBusinessUnitAction(data: {
  id: string;
  name: string;
  companyId: string;
}) {
  const ctx = await getAuthContext();
  assertCorporateAdmin(ctx);

  await db.insert(businessUnits).values({
    id: data.id.trim(),
    name: data.name.trim(),
    companyId: data.companyId,
  });

  await db.insert(auditLog).values({
    action: "CREATE",
    actorClerkId: ctx.userId,
    detail: `Created Business Unit ${data.id} (${data.name}) under Company ${data.companyId}`,
  });

  revalidatePath("/dashboard/admin/business-units");
  revalidatePath("/dashboard/admin/hierarchy");
  revalidatePath("/dashboard/admin/sites");
  return { success: true };
}

export async function updateBusinessUnitAction(
  id: string,
  data: { name: string; companyId: string },
) {
  const ctx = await getAuthContext();
  assertCorporateAdmin(ctx);

  await db
    .update(businessUnits)
    .set({
      name: data.name.trim(),
      companyId: data.companyId,
    })
    .where(eq(businessUnits.id, id));

  await db.insert(auditLog).values({
    action: "UPDATE",
    actorClerkId: ctx.userId,
    detail: `Updated Business Unit ${id} (${data.name}), Company: ${data.companyId}`,
  });

  revalidatePath("/dashboard/admin/business-units");
  revalidatePath("/dashboard/admin/hierarchy");
  revalidatePath("/dashboard/admin/sites");
  return { success: true };
}
