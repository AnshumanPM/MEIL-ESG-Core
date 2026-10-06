import Link from "next/link";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/db";
import { emissionEntries, sites, businessUnits, documents } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { ReviewWorkspace } from "@/components/emissions/review-workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function SubmissionReviewPage({
  params,
}: {
  params: Promise<{ siteId: string; month: string }>;
}) {
  const { siteId, month } = await params;
  const ctx = await getAuthContext();

  const isBuReviewer =
    ctx.orgRole === "org:bu_reviewer" || ctx.orgRole === "bu_reviewer";
  const isCorporateAdmin =
    ctx.orgRole === "org:corporate_admin" || ctx.orgRole === "corporate_admin";

  if (!isBuReviewer && !isCorporateAdmin) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-12 text-center">
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground mt-2 text-xs">
          BU Reviewer or Corporate Admin role is required.
        </p>
      </div>
    );
  }

  const [site] = await db
    .select({
      id: sites.id,
      name: sites.name,
      buId: sites.buId,
      stateCode: sites.stateCode,
      buName: businessUnits.name,
    })
    .from(sites)
    .innerJoin(businessUnits, eq(sites.buId, businessUnits.id))
    .where(eq(sites.id, siteId))
    .limit(1);

  if (!site) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-12 text-center">
        <h2 className="text-xl font-bold">Site Not Found</h2>
      </div>
    );
  }

  if (!isCorporateAdmin && !ctx.buIds.includes(site.buId)) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-12 text-center">
        <h2 className="text-destructive text-xl font-bold">
          Access Prohibited
        </h2>
        <p className="text-muted-foreground mt-2 text-xs">
          You are not assigned to review submissions from Business Unit{" "}
          {site.buId}.
        </p>
      </div>
    );
  }

  const rawEntries = await db
    .select({
      id: emissionEntries.id,
      entryDate: emissionEntries.entryDate,
      scope: emissionEntries.scope,
      category: emissionEntries.category,
      sourceName: emissionEntries.sourceName,
      quantity: emissionEntries.quantity,
      unit: emissionEntries.unit,
      factorValue: emissionEntries.factorValue,
      tco2e: emissionEntries.tco2e,
      status: emissionEntries.status,
      docId: documents.id,
      docOriginalName: documents.originalName,
      docMimeType: documents.mimeType,
      docSha256: documents.sha256,
      docType: documents.docType,
      docInvoiceNumber: documents.invoiceNumber,
    })
    .from(emissionEntries)
    .leftJoin(documents, eq(emissionEntries.id, documents.entryId))
    .where(
      and(
        eq(emissionEntries.siteId, siteId),
        eq(emissionEntries.financialYear, month),
        eq(emissionEntries.status, "SUBMITTED"),
      ),
    );

  const entries = rawEntries.map((r) => ({
    id: r.id,
    entryDate: r.entryDate,
    scope: r.scope,
    category: r.category,
    sourceName: r.sourceName,
    quantity: r.quantity,
    unit: r.unit,
    factorValue: r.factorValue,
    tco2e: r.tco2e,
    status: r.status,
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
    <div className="w-full space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="xs"
              className="h-6 px-1.5 text-xs"
            >
              <Link href="/dashboard/review">
                <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                Queue
              </Link>
            </Button>
            <Badge variant="outline" className="font-mono text-xs">
              {site.id}
            </Badge>
            <Badge variant="secondary">{site.buName}</Badge>
            <Badge variant="outline">Period: {month}</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Review Submission: {site.name}
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Cross-verify invoice documentation against claimed activity metrics.
          </p>
        </div>
      </div>

      <ReviewWorkspace
        siteId={site.id}
        siteName={site.name}
        period={month}
        entries={entries}
      />
    </div>
  );
}
