import { requireAuditorContext } from "@/lib/auth";
import { db } from "@/db";
import { emissionEntries, sites, documents, auditLog } from "@/db/schema";
import { eq, desc, inArray, and, or } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";
import { AuditorConsole } from "@/components/audit/auditor-console";
import { Badge } from "@/components/ui/badge";

export default async function AuditPage() {
  await requireAuditorContext();

  const rawEntries = await db
    .select({
      id: emissionEntries.id,
      siteId: emissionEntries.siteId,
      siteName: sites.name,
      financialYear: emissionEntries.financialYear,
      entryDate: emissionEntries.entryDate,
      scope: emissionEntries.scope,
      category: emissionEntries.category,
      sourceName: emissionEntries.sourceName,
      quantity: emissionEntries.quantity,
      unit: emissionEntries.unit,
      factorValue: emissionEntries.factorValue,
      tco2e: emissionEntries.tco2e,
      status: emissionEntries.status,
      auditStatus: emissionEntries.auditStatus,
      auditComment: emissionEntries.auditComment,
      createdBy: emissionEntries.createdBy,
      docId: documents.id,
      docOriginalName: documents.originalName,
      docMimeType: documents.mimeType,
      docSha256: documents.sha256,
      docType: documents.docType,
      docInvoiceNumber: documents.invoiceNumber,
    })
    .from(emissionEntries)
    .innerJoin(sites, eq(emissionEntries.siteId, sites.id))
    .leftJoin(documents, eq(emissionEntries.id, documents.entryId))
    .orderBy(desc(emissionEntries.entryDate), desc(emissionEntries.createdAt));

  const entryIds = rawEntries.map((r) => r.id);
  const reviewLogs =
    entryIds.length > 0
      ? await db
          .select({
            entryId: auditLog.entryId,
            actorClerkId: auditLog.actorClerkId,
            action: auditLog.action,
            at: auditLog.at,
          })
          .from(auditLog)
          .where(
            and(
              inArray(auditLog.entryId, entryIds),
              or(eq(auditLog.action, "APPROVE"), eq(auditLog.action, "REJECT")),
            ),
          )
          .orderBy(desc(auditLog.at))
      : [];

  const reviewerByEntry = new Map<string, string>();
  for (const log of reviewLogs) {
    if (log.entryId && !reviewerByEntry.has(log.entryId)) {
      reviewerByEntry.set(log.entryId, log.actorClerkId);
    }
  }

  const submitterIds = Array.from(new Set(rawEntries.map((r) => r.createdBy)));
  const reviewerIds = Array.from(new Set(reviewerByEntry.values()));
  const allUserIds = Array.from(new Set([...submitterIds, ...reviewerIds]));

  const userNameMap = new Map<string, string>();
  if (allUserIds.length > 0) {
    try {
      const clerk = await clerkClient();
      await Promise.all(
        allUserIds.map(async (uid) => {
          try {
            const u = await clerk.users.getUser(uid);
            const name =
              [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
              u.emailAddresses?.[0]?.emailAddress ||
              uid;
            userNameMap.set(uid, name);
          } catch {
            userNameMap.set(uid, uid);
          }
        }),
      );
    } catch {}
  }

  const entries = rawEntries.map((r) => ({
    id: r.id,
    siteId: r.siteId,
    siteName: r.siteName,
    financialYear: r.financialYear,
    entryDate: r.entryDate,
    scope: r.scope,
    category: r.category,
    sourceName: r.sourceName,
    quantity: r.quantity,
    unit: r.unit,
    factorValue: r.factorValue,
    tco2e: r.tco2e,
    status: r.status,
    auditStatus: r.auditStatus,
    auditComment: r.auditComment,
    submitterName: userNameMap.get(r.createdBy) || r.createdBy,
    reviewedBy: reviewerByEntry.has(r.id)
      ? userNameMap.get(reviewerByEntry.get(r.id)!) ||
        reviewerByEntry.get(r.id)!
      : null,
    document: r.docId
      ? {
          id: r.docId,
          originalName: r.docOriginalName!,
          mimeType: r.docMimeType!,
          sha256: r.docSha256!,
          docType: r.docType!,
          invoiceNumber: r.docInvoiceNumber,
        }
      : null,
  }));

  return (
    <div className="w-full space-y-4">
      <div className="border-border border-b pb-3">
        <h1 className="text-xl font-bold tracking-tight">Auditor Console</h1>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Cross-site ledger verification and evidence validation.
        </p>
      </div>

      <AuditorConsole entries={entries} />
    </div>
  );
}
