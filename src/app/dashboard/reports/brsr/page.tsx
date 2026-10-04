import { getAuthContext } from "@/lib/auth";
import { db } from "@/db";
import {
  emissionEntries,
  fyConfig,
  sites,
  documents,
  emissionFactors,
} from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import { BrsrReportClient } from "@/components/reports/brsr-report-client";
import { Badge } from "@/components/ui/badge";

export default async function BrsrReportPage() {
  const ctx = await getAuthContext();

  const currentFy = "2026-2027";
  const previousFy = "2025-2026";

  const [currentFyRow] = await db
    .select()
    .from(fyConfig)
    .where(eq(fyConfig.financialYear, currentFy))
    .limit(1);

  const [previousFyRow] = await db
    .select()
    .from(fyConfig)
    .where(eq(fyConfig.financialYear, previousFy))
    .limit(1);

  const currentScopeTotals = await db
    .select({
      scope: emissionEntries.scope,
      totalTco2e: sql<string>`coalesce(sum(${emissionEntries.tco2e}), 0)`,
    })
    .from(emissionEntries)
    .where(
      and(
        eq(emissionEntries.financialYear, currentFy),
        inArray(emissionEntries.status, ["APPROVED", "LOCKED"])
      )
    )
    .groupBy(emissionEntries.scope);

  const previousScopeTotals = await db
    .select({
      scope: emissionEntries.scope,
      totalTco2e: sql<string>`coalesce(sum(${emissionEntries.tco2e}), 0)`,
    })
    .from(emissionEntries)
    .where(
      and(
        eq(emissionEntries.financialYear, previousFy),
        inArray(emissionEntries.status, ["APPROVED", "LOCKED"])
      )
    )
    .groupBy(emissionEntries.scope);

  const currentMap: Record<string, number> = {
    SCOPE_1: 0,
    SCOPE_2: 0,
    SCOPE_3: 0,
  };
  for (const s of currentScopeTotals) {
    currentMap[s.scope] = parseFloat(s.totalTco2e);
  }

  const previousMap: Record<string, number> = {
    SCOPE_1: 0,
    SCOPE_2: 0,
    SCOPE_3: 0,
  };
  for (const s of previousScopeTotals) {
    previousMap[s.scope] = parseFloat(s.totalTco2e);
  }

  const currentS1 = currentMap.SCOPE_1;
  const currentS2 = currentMap.SCOPE_2;
  const currentS12 = currentS1 + currentS2;
  const currentS3 = currentMap.SCOPE_3;

  const prevS1 = previousMap.SCOPE_1;
  const prevS2 = previousMap.SCOPE_2;
  const prevS12 = prevS1 + prevS2;
  const prevS3 = previousMap.SCOPE_3;

  const currentTurnover = currentFyRow?.turnoverInrCr
    ? parseFloat(currentFyRow.turnoverInrCr)
    : 32500;
  const prevTurnover = previousFyRow?.turnoverInrCr
    ? parseFloat(previousFyRow.turnoverInrCr)
    : 28400;

  const currentIntensity =
    currentTurnover > 0 ? (currentS12 / currentTurnover).toFixed(4) : "0.0000";
  const prevIntensity =
    prevTurnover > 0 ? (prevS12 / prevTurnover).toFixed(4) : "0.0000";

  const metrics = [
    {
      parameter: "Total Scope 1 emissions (Direct greenhouse gas emissions)",
      unit: "tCO₂e",
      currentFyValue: currentS1.toFixed(3),
      previousFyValue: prevS1.toFixed(3),
      source: "Aggregated site fuel, gas & process entries",
    },
    {
      parameter: "Total Scope 2 emissions (Indirect emissions from energy consumption)",
      unit: "tCO₂e",
      currentFyValue: currentS2.toFixed(3),
      previousFyValue: prevS2.toFixed(3),
      source: "Purchased electricity bills (CEA Grid Baseline)",
    },
    {
      parameter: "Total Scope 1 and Scope 2 emissions",
      unit: "tCO₂e",
      currentFyValue: currentS12.toFixed(3),
      previousFyValue: prevS12.toFixed(3),
      source: "Sum of Scope 1 & Scope 2",
    },
    {
      parameter: "Total Scope 1 and Scope 2 emissions per rupee of turnover",
      unit: "tCO₂e / ₹ Cr",
      currentFyValue: currentIntensity,
      previousFyValue: prevIntensity,
      source: `Scope 1+2 / Turnover (₹ ${currentTurnover} Cr)`,
    },
    {
      parameter: "Total Scope 3 emissions (Leadership indicator)",
      unit: "tCO₂e",
      currentFyValue: currentS3.toFixed(3),
      previousFyValue: prevS3.toFixed(3),
      source: "Steel, Cement, Business Travel & Logistics",
    },
  ];

  const rawAuditPack = await db
    .select({
      entryId: emissionEntries.id,
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
      docSha256: documents.sha256,
      docName: documents.originalName,
      docType: documents.docType,
      invoiceNumber: documents.invoiceNumber,
    })
    .from(emissionEntries)
    .innerJoin(sites, eq(emissionEntries.siteId, sites.id))
    .innerJoin(documents, eq(emissionEntries.id, documents.entryId))
    .where(
      and(
        eq(emissionEntries.financialYear, currentFy),
        inArray(emissionEntries.status, ["APPROVED", "LOCKED"])
      )
    );

  const auditPack = rawAuditPack.map((r) => ({
    entryId: r.entryId,
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
    docSha256: r.docSha256,
    docName: r.docName,
    docType: r.docType,
    invoiceNumber: r.invoiceNumber || "",
  }));

  return (
    <div className="space-y-4 max-w-7xl">
      <div className="border-b border-border pb-3 print:hidden">
        <h1 className="text-xl font-bold tracking-tight">
          BRSR Principle 6 Disclosures
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Statutory greenhouse gas emissions table and intensity metrics.
        </p>
      </div>

      <BrsrReportClient
        currentFy={currentFy}
        previousFy={previousFy}
        metrics={metrics}
        assuranceCurrent={{
          done: currentFyRow?.assuranceDone || false,
          agency: currentFyRow?.assuranceAgency,
        }}
        assurancePrevious={{
          done: previousFyRow?.assuranceDone || false,
          agency: previousFyRow?.assuranceAgency,
        }}
        auditPack={auditPack}
      />
    </div>
  );
}
