"use server";

import { db } from "@/db";
import {
  emissionEntries,
  documents,
  emissionFactors,
  fyConfig,
  auditLog,
  sites,
} from "@/db/schema";
import { getAuthContext, requireSiteContext } from "@/lib/auth";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createEmissionEntry(data: {
  financialYear: string;
  entryDate: string;
  scope: "SCOPE_1" | "SCOPE_2" | "SCOPE_3";
  category: string;
  sourceName: string;
  quantity: string;
  unit: string;
  factorId: string;
  document: {
    storageKey: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    sha256: string;
    docType: string;
    invoiceNumber?: string | null;
    invoiceDate?: string | null;
  };
}) {
  const ctx = await requireSiteContext();

  const fy = await db
    .select({ lockedAt: fyConfig.lockedAt })
    .from(fyConfig)
    .where(eq(fyConfig.financialYear, data.financialYear))
    .limit(1);

  if (fy.length > 0 && fy[0].lockedAt) {
    throw new Error(
      `Financial year ${data.financialYear} is locked. No new entries can be added.`
    );
  }

  const factor = await db
    .select()
    .from(emissionFactors)
    .where(eq(emissionFactors.id, data.factorId))
    .limit(1);

  if (factor.length === 0) {
    throw new Error("Specified emission factor not found");
  }

  const factorValue = factor[0].kgCo2ePerUnit;
  const qty = parseFloat(data.quantity);
  const factorNum = parseFloat(factorValue);

  if (isNaN(qty) || qty <= 0) {
    throw new Error("Quantity must be a positive number");
  }

  const tco2e = ((qty * factorNum) / 1000).toFixed(6);

  if (!data.document || !data.document.storageKey || !data.document.sha256) {
    throw new Error("Proof document is mandatory. No entry can be saved without evidence.");
  }

  const result = await db.transaction(async (tx) => {
    const [insertedEntry] = await tx
      .insert(emissionEntries)
      .values({
        siteId: ctx.site.id,
        financialYear: data.financialYear,
        entryDate: data.entryDate,
        scope: data.scope,
        category: data.category,
        sourceName: data.sourceName,
        quantity: data.quantity,
        unit: data.unit,
        factorId: data.factorId,
        factorValue: factorValue,
        tco2e: tco2e,
        status: "DRAFT",
        createdBy: ctx.userId,
      })
      .returning();

    await tx.insert(documents).values({
      entryId: insertedEntry.id,
      siteId: ctx.site.id,
      storageKey: data.document.storageKey,
      originalName: data.document.originalName,
      mimeType: data.document.mimeType,
      sizeBytes: data.document.sizeBytes,
      sha256: data.document.sha256,
      docType: data.document.docType,
      invoiceNumber: data.document.invoiceNumber || null,
      invoiceDate: data.document.invoiceDate || null,
      uploadedBy: ctx.userId,
    });

    await tx.insert(auditLog).values({
      entryId: insertedEntry.id,
      action: "CREATE",
      actorClerkId: ctx.userId,
      detail: `Created draft emission entry for ${data.sourceName} (${tco2e} tCO2e) with proof ${data.document.originalName}`,
    });

    return insertedEntry;
  });

  revalidatePath("/site");
  revalidatePath("/site/entries");
  return { success: true, entryId: result.id };
}

export async function updateDraftEntry(
  entryId: string,
  data: {
    entryDate: string;
    sourceName: string;
    quantity: string;
    unit: string;
    factorId: string;
    docType?: string;
    invoiceNumber?: string;
    document?: {
      originalName: string;
      mimeType: string;
      sha256: string;
      storageKey: string;
      sizeBytes?: number;
      docType?: string;
      invoiceNumber?: string;
    } | null;
  }
) {
  const ctx = await requireSiteContext();

  const [existing] = await db
    .select()
    .from(emissionEntries)
    .where(
      and(
        eq(emissionEntries.id, entryId),
        eq(emissionEntries.siteId, ctx.site.id)
      )
    )
    .limit(1);

  if (!existing) {
    throw new Error("Entry not found");
  }

  if (existing.status !== "DRAFT" && existing.status !== "REJECTED") {
    throw new Error("Only draft or rejected entries can be edited");
  }

  const [factor] = await db
    .select()
    .from(emissionFactors)
    .where(eq(emissionFactors.id, data.factorId))
    .limit(1);

  if (!factor) {
    throw new Error("Factor not found");
  }

  const factorValue = factor.kgCo2ePerUnit;
  const qty = parseFloat(data.quantity);
  const factorNum = parseFloat(factorValue);
  const tco2e = ((qty * factorNum) / 1000).toFixed(6);

  await db.transaction(async (tx) => {
    await tx
      .update(emissionEntries)
      .set({
        entryDate: data.entryDate,
        sourceName: data.sourceName,
        quantity: data.quantity,
        unit: data.unit,
        factorId: data.factorId,
        factorValue: factorValue,
        tco2e: tco2e,
        status: "DRAFT",
        rejectReason: null,
        updatedAt: new Date(),
      })
      .where(eq(emissionEntries.id, entryId));

    if (data.document) {
      const [existingDoc] = await tx
        .select({ id: documents.id })
        .from(documents)
        .where(eq(documents.entryId, entryId))
        .limit(1);

      if (existingDoc) {
        await tx
          .update(documents)
          .set({
            originalName: data.document.originalName,
            mimeType: data.document.mimeType,
            sha256: data.document.sha256,
            storageKey: data.document.storageKey,
            sizeBytes: data.document.sizeBytes ?? 0,
            docType: (data.document.docType || data.docType || "OTHER_PROOF") as any,
            invoiceNumber: data.document.invoiceNumber ?? data.invoiceNumber ?? null,
          })
          .where(eq(documents.id, existingDoc.id));
      } else {
        await tx.insert(documents).values({
          entryId: entryId,
          siteId: ctx.site.id,
          originalName: data.document.originalName,
          mimeType: data.document.mimeType,
          sizeBytes: data.document.sizeBytes ?? 0,
          sha256: data.document.sha256,
          storageKey: data.document.storageKey,
          docType: (data.document.docType || data.docType || "OTHER_PROOF") as any,
          invoiceNumber: data.document.invoiceNumber ?? data.invoiceNumber ?? null,
          uploadedBy: ctx.userId,
        });
      }
    } else if (data.docType || data.invoiceNumber !== undefined) {
      await tx
        .update(documents)
        .set({
          ...(data.docType ? { docType: data.docType as any } : {}),
          ...(data.invoiceNumber !== undefined ? { invoiceNumber: data.invoiceNumber } : {}),
        })
        .where(eq(documents.entryId, entryId));
    }

    await tx.insert(auditLog).values({
      entryId: entryId,
      action: "UPDATE",
      actorClerkId: ctx.userId,
      detail: `Updated entry to ${data.quantity} ${data.unit} (${tco2e} tCO2e)`,
    });
  });

  revalidatePath("/site");
  revalidatePath("/site/entries");
  return { success: true };
}

export async function submitSingleEntryAction(entryId: string) {
  const ctx = await requireSiteContext();

  const [existing] = await db
    .select()
    .from(emissionEntries)
    .where(
      and(
        eq(emissionEntries.id, entryId),
        eq(emissionEntries.siteId, ctx.site.id)
      )
    )
    .limit(1);

  if (!existing) {
    throw new Error("Entry not found");
  }

  if (existing.status !== "DRAFT" && existing.status !== "REJECTED") {
    throw new Error("Only draft or rejected entries can be submitted");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(emissionEntries)
      .set({
        status: "SUBMITTED",
        rejectReason: null,
        updatedAt: new Date(),
      })
      .where(eq(emissionEntries.id, entryId));

    await tx.insert(auditLog).values({
      entryId: entryId,
      action: "SUBMIT",
      actorClerkId: ctx.userId,
      detail: `Submitted entry for review`,
    });
  });

  revalidatePath("/site");
  revalidatePath("/site/entries");
  revalidatePath("/site/submit");
  revalidatePath("/review");
  return { success: true };
}

export async function submitMonthEntries(
  financialYear: string,
  monthPrefix?: string
) {
  const ctx = await requireSiteContext();

  const fy = await db
    .select({ lockedAt: fyConfig.lockedAt })
    .from(fyConfig)
    .where(eq(fyConfig.financialYear, financialYear))
    .limit(1);

  if (fy.length > 0 && fy[0].lockedAt) {
    throw new Error(`Financial year ${financialYear} is locked`);
  }

  let entriesToSubmit = await db
    .select({ id: emissionEntries.id })
    .from(emissionEntries)
    .where(
      and(
        eq(emissionEntries.siteId, ctx.site.id),
        eq(emissionEntries.financialYear, financialYear),
        inArray(emissionEntries.status, ["DRAFT", "REJECTED"])
      )
    );

  if (entriesToSubmit.length === 0) {
    entriesToSubmit = await db
      .select({ id: emissionEntries.id })
      .from(emissionEntries)
      .where(
        and(
          eq(emissionEntries.siteId, ctx.site.id),
          inArray(emissionEntries.status, ["DRAFT", "REJECTED"])
        )
      );
  }

  if (entriesToSubmit.length === 0) {
    throw new Error("No draft or rejected entries available to submit");
  }

  const ids = entriesToSubmit.map((e) => e.id);

  await db.transaction(async (tx) => {
    await tx
      .update(emissionEntries)
      .set({
        status: "SUBMITTED",
        rejectReason: null,
        updatedAt: new Date(),
      })
      .where(inArray(emissionEntries.id, ids));

    await tx.insert(auditLog).values({
      action: "SUBMIT",
      actorClerkId: ctx.userId,
      detail: `Submitted ${ids.length} entries for site ${ctx.site.id} in FY ${financialYear}`,
    });
  });

  revalidatePath("/site");
  revalidatePath("/site/entries");
  revalidatePath("/site/submit");
  revalidatePath("/review");
  return { success: true, submittedCount: ids.length };
}

export async function reviewSubmissionAction(
  entryIds: string[],
  action: "APPROVE" | "REJECT",
  reason?: string
) {
  const ctx = await getAuthContext();

  const isBuReviewer =
    ctx.orgRole === "org:bu_reviewer" || ctx.orgRole === "bu_reviewer";
  const isCorporateAdmin =
    ctx.orgRole === "org:corporate_admin" || ctx.orgRole === "corporate_admin";

  if (!isBuReviewer && !isCorporateAdmin) {
    throw new Error("Permission denied: BU Reviewer role required");
  }

  if (action === "REJECT" && (!reason || reason.trim().length === 0)) {
    throw new Error("Rejection reason is mandatory");
  }

  const entries = await db
    .select({
      id: emissionEntries.id,
      siteId: emissionEntries.siteId,
      status: emissionEntries.status,
    })
    .from(emissionEntries)
    .where(inArray(emissionEntries.id, entryIds));

  if (entries.length === 0) {
    throw new Error("No matching entries found");
  }

  if (isBuReviewer && !isCorporateAdmin) {
    const siteIds = Array.from(new Set(entries.map((e) => e.siteId)));
    const siteRows = await db
      .select({ id: sites.id, buId: sites.buId })
      .from(sites)
      .where(inArray(sites.id, siteIds));

    for (const s of siteRows) {
      if (!ctx.buIds.includes(s.buId)) {
        throw new Error(
          `Unauthorized: You are not assigned to review Business Unit ${s.buId}`
        );
      }
    }
  }

  const targetStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

  await db.transaction(async (tx) => {
    await tx
      .update(emissionEntries)
      .set({
        status: targetStatus,
        rejectReason: action === "REJECT" ? reason : null,
        updatedAt: new Date(),
      })
      .where(inArray(emissionEntries.id, entryIds));

    for (const id of entryIds) {
      await tx.insert(auditLog).values({
        entryId: id,
        action: action,
        actorClerkId: ctx.userId,
        detail:
          action === "APPROVE"
            ? "Submission approved by reviewer"
            : `Submission rejected: ${reason}`,
      });
    }
  });

  revalidatePath("/review");
  revalidatePath("/site");
  revalidatePath("/site/entries");
  revalidatePath("/reports/brsr");
  return { success: true, count: entryIds.length };
}

export async function auditVerifyAction(
  entryId: string,
  auditStatus: "VERIFIED" | "FLAGGED",
  comment?: string
) {
  const ctx = await getAuthContext();

  const isAuditor =
    ctx.orgRole === "org:external_auditor" ||
    ctx.orgRole === "external_auditor" ||
    ctx.orgRole === "org:corporate_admin" ||
    ctx.orgRole === "corporate_admin";

  if (!isAuditor) {
    throw new Error("Permission denied: Auditor authorization required");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(emissionEntries)
      .set({
        auditStatus,
        auditComment: comment || null,
        updatedAt: new Date(),
      })
      .where(eq(emissionEntries.id, entryId));

    await tx.insert(auditLog).values({
      entryId,
      action: auditStatus,
      actorClerkId: ctx.userId,
      detail: `Auditor marked entry as ${auditStatus}${comment ? ": " + comment : ""}`,
    });
  });

  revalidatePath("/audit");
  revalidatePath("/reports/brsr");
  return { success: true };
}

export async function updateFyConfigAction(
  financialYear: string,
  turnoverInrCr: string,
  assuranceDone: boolean,
  assuranceAgency?: string
) {
  const ctx = await getAuthContext();

  if (
    ctx.orgRole !== "org:corporate_admin" &&
    ctx.orgRole !== "corporate_admin"
  ) {
    throw new Error("Permission denied: Corporate Admin authorization required");
  }

  await db
    .insert(fyConfig)
    .values({
      financialYear,
      turnoverInrCr,
      assuranceDone,
      assuranceAgency: assuranceAgency || null,
    })
    .onConflictDoUpdate({
      target: fyConfig.financialYear,
      set: {
        turnoverInrCr,
        assuranceDone,
        assuranceAgency: assuranceAgency || null,
      },
    });

  await db.insert(auditLog).values({
    action: "UPDATE",
    actorClerkId: ctx.userId,
    detail: `Updated FY ${financialYear} config: Turnover ₹${turnoverInrCr} Cr, Assurance ${assuranceDone}`,
  });

  revalidatePath("/admin/period");
  revalidatePath("/reports/brsr");
  return { success: true };
}

export async function lockFinancialYearAction(financialYear: string) {
  const ctx = await getAuthContext();

  if (
    ctx.orgRole !== "org:corporate_admin" &&
    ctx.orgRole !== "corporate_admin"
  ) {
    throw new Error("Permission denied: Corporate Admin authorization required");
  }

  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .insert(fyConfig)
      .values({
        financialYear,
        lockedAt: now,
      })
      .onConflictDoUpdate({
        target: fyConfig.financialYear,
        set: { lockedAt: now },
      });

    await tx
      .update(emissionEntries)
      .set({
        status: "LOCKED",
        updatedAt: now,
      })
      .where(
        and(
          eq(emissionEntries.financialYear, financialYear),
          eq(emissionEntries.status, "APPROVED")
        )
      );

    await tx.insert(auditLog).values({
      action: "LOCK",
      actorClerkId: ctx.userId,
      detail: `Locked financial year ${financialYear}. All approved entries transitioned to LOCKED.`,
    });
  });

  revalidatePath("/admin/period");
  revalidatePath("/reports/brsr");
  revalidatePath("/site");
  revalidatePath("/site/entries");
  return { success: true };
}

export async function createEmissionFactorAction(data: {
  scope: "SCOPE_1" | "SCOPE_2" | "SCOPE_3";
  category: string;
  unit: string;
  kgCo2ePerUnit: string;
  authority: string;
  version: string;
  validFrom: string;
  validTo?: string | null;
}) {
  const ctx = await getAuthContext();

  if (
    ctx.orgRole !== "org:corporate_admin" &&
    ctx.orgRole !== "corporate_admin"
  ) {
    throw new Error("Permission denied: Corporate Admin authorization required");
  }

  const [inserted] = await db
    .insert(emissionFactors)
    .values({
      scope: data.scope,
      category: data.category,
      unit: data.unit,
      kgCo2ePerUnit: data.kgCo2ePerUnit,
      authority: data.authority,
      version: data.version,
      validFrom: data.validFrom,
      validTo: data.validTo || null,
    })
    .returning();

  await db.insert(auditLog).values({
    action: "CREATE",
    actorClerkId: ctx.userId,
    detail: `Added emission factor ${data.category} (${data.kgCo2ePerUnit} kg CO2e/${data.unit}) authority: ${data.authority}`,
  });

  revalidatePath("/admin/factors");
  return { success: true, id: inserted.id };
}

export async function createSiteAction(data: {
  id: string;
  clerkOrgId: string;
  name: string;
  buId: string;
  stateCode: string;
}) {
  const ctx = await getAuthContext();

  if (
    ctx.orgRole !== "org:corporate_admin" &&
    ctx.orgRole !== "corporate_admin"
  ) {
    throw new Error("Permission denied: Corporate Admin authorization required");
  }

  await db.insert(sites).values({
    id: data.id,
    clerkOrgId: data.clerkOrgId,
    name: data.name,
    buId: data.buId,
    stateCode: data.stateCode,
    active: true,
  });

  await db.insert(auditLog).values({
    action: "CREATE",
    actorClerkId: ctx.userId,
    detail: `Registered site ${data.id} (${data.name}) under BU ${data.buId}`,
  });

  revalidatePath("/admin/sites");
  return { success: true };
}

export async function updateEmissionFactorAction(
  id: string,
  data: {
    unit: string;
    kgCo2ePerUnit: string;
    authority: string;
    version: string;
    validFrom: string;
    validTo?: string | null;
  }
) {
  const ctx = await getAuthContext();

  if (
    ctx.orgRole !== "org:corporate_admin" &&
    ctx.orgRole !== "corporate_admin"
  ) {
    throw new Error("Permission denied: Corporate Admin authorization required");
  }

  await db
    .update(emissionFactors)
    .set({
      unit: data.unit,
      kgCo2ePerUnit: data.kgCo2ePerUnit,
      authority: data.authority,
      version: data.version,
      validFrom: data.validFrom,
      validTo: data.validTo || null,
    })
    .where(eq(emissionFactors.id, id));

  await db.insert(auditLog).values({
    action: "UPDATE",
    actorClerkId: ctx.userId,
    detail: `Updated factor ${id}: ${data.kgCo2ePerUnit} kg CO2e/${data.unit}`,
  });

  revalidatePath("/admin/factors");
  return { success: true };
}

export async function updateSiteAction(
  id: string,
  data: {
    name: string;
    buId: string;
    stateCode: string;
    active: boolean;
  }
) {
  const ctx = await getAuthContext();

  if (
    ctx.orgRole !== "org:corporate_admin" &&
    ctx.orgRole !== "corporate_admin"
  ) {
    throw new Error("Permission denied: Corporate Admin authorization required");
  }

  await db
    .update(sites)
    .set({
      name: data.name,
      buId: data.buId,
      stateCode: data.stateCode,
      active: data.active,
    })
    .where(eq(sites.id, id));

  await db.insert(auditLog).values({
    action: "UPDATE",
    actorClerkId: ctx.userId,
    detail: `Updated site ${id} (${data.name}), BU: ${data.buId}, Active: ${data.active}`,
  });

  revalidatePath("/admin/sites");
  return { success: true };
}

