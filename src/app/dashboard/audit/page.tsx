import { requireAuditorContext } from "@/lib/auth";
import { db } from "@/db";
import { emissionEntries, sites, documents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
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
    <div className="space-y-4 max-w-7xl">
      <div className="border-b border-border pb-3">
        <h1 className="text-xl font-bold tracking-tight">
          Auditor Console
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Cross-site ledger verification and evidence validation.
        </p>
      </div>

      <AuditorConsole entries={entries} />
    </div>
  );
}
