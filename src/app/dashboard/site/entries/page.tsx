import Link from "next/link";
import { getAuthContext } from "@/lib/auth";
import { HqNotice } from "@/components/emissions/hq-notice";
import { db } from "@/db";
import { emissionEntries, documents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { EntriesTable } from "@/components/emissions/entries-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilePlus2, Send } from "lucide-react";

export default async function SiteEntriesPage() {
  const ctx = await getAuthContext();

  if (!ctx.site) {
    return <HqNotice orgId={ctx.orgId} isHq={ctx.isHq} orgRole={ctx.orgRole} />;
  }

  const site = ctx.site;

  const rawEntries = await db
    .select({
      id: emissionEntries.id,
      financialYear: emissionEntries.financialYear,
      entryDate: emissionEntries.entryDate,
      scope: emissionEntries.scope,
      category: emissionEntries.category,
      sourceName: emissionEntries.sourceName,
      quantity: emissionEntries.quantity,
      unit: emissionEntries.unit,
      factorId: emissionEntries.factorId,
      factorValue: emissionEntries.factorValue,
      tco2e: emissionEntries.tco2e,
      status: emissionEntries.status,
      rejectReason: emissionEntries.rejectReason,
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
    .leftJoin(documents, eq(emissionEntries.id, documents.entryId))
    .where(eq(emissionEntries.siteId, site.id))
    .orderBy(desc(emissionEntries.entryDate), desc(emissionEntries.createdAt));

  const entries = rawEntries.map((r) => ({
    id: r.id,
    siteId: site.id,
    financialYear: r.financialYear,
    entryDate: r.entryDate,
    scope: r.scope,
    category: r.category,
    sourceName: r.sourceName,
    quantity: r.quantity,
    unit: r.unit,
    factorId: r.factorId,
    factorValue: r.factorValue,
    tco2e: r.tco2e,
    status: r.status,
    rejectReason: r.rejectReason,
    auditStatus: r.auditStatus,
    auditComment: r.auditComment,
    createdBy: r.createdBy,
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

  const isManager = true;

  return (
    <div className="w-full space-y-4">
      <div className="border-border flex flex-col justify-between gap-3 border-b pb-3 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {site.id}
            </Badge>
            <Badge variant="secondary">Ledger</Badge>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Emissions Ledger</h1>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {site.name} ({site.id})
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button asChild>
            <Link href="/dashboard/site/entries/new">
              <FilePlus2 className="mr-1.5 h-4 w-4" />
              Log Entry
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/site/submit">
              <Send className="mr-1.5 h-4 w-4" />
              Submit Month
            </Link>
          </Button>
        </div>
      </div>

      <EntriesTable
        entries={entries}
        currentUserId={ctx.userId}
        siteId={site.id}
        isManager={isManager}
      />
    </div>
  );
}
