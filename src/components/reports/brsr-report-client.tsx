"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, Printer } from "lucide-react";

interface BrsrMetricRow {
  parameter: string;
  unit: string;
  currentFyValue: string;
  previousFyValue: string;
  source: string;
}

interface AuditPackEntry {
  entryId: string;
  siteId: string;
  siteName: string;
  financialYear: string;
  entryDate: string;
  scope: string;
  category: string;
  sourceName: string;
  quantity: string;
  unit: string;
  factorValue: string;
  tco2e: string;
  docSha256: string;
  docName: string;
  docType: string;
  invoiceNumber: string;
}

export function BrsrReportClient({
  currentFy,
  previousFy,
  metrics,
  assuranceCurrent,
  assurancePrevious,
  auditPack,
}: {
  currentFy: string;
  previousFy: string;
  metrics: BrsrMetricRow[];
  assuranceCurrent: { done: boolean; agency?: string | null };
  assurancePrevious: { done: boolean; agency?: string | null };
  auditPack: AuditPackEntry[];
}) {
  const downloadBrsrCsv = () => {
    const headers = [
      "Parameter",
      "Unit",
      `FY ${currentFy}`,
      `FY ${previousFy}`,
      "Data Source",
    ];
    const rows = metrics.map((m) => [
      `"${m.parameter}"`,
      `"${m.unit}"`,
      `"${m.currentFyValue}"`,
      `"${m.previousFyValue}"`,
      `"${m.source}"`,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `MEIL_BRSR_P6_${currentFy}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAuditPackCsv = () => {
    const headers = [
      "Entry ID",
      "Site ID",
      "Site Name",
      "Financial Year",
      "Date",
      "Scope",
      "Category",
      "Source Name",
      "Quantity",
      "Unit",
      "Snapshotted Factor",
      "tCO2e",
      "Document Type",
      "Invoice Number",
      "Document Name",
      "Document Evidence Ref",
    ];

    const rows = auditPack.map((e) => [
      `"${e.entryId}"`,
      `"${e.siteId}"`,
      `"${e.siteName}"`,
      `"${e.financialYear}"`,
      `"${e.entryDate}"`,
      `"${e.scope}"`,
      `"${e.category}"`,
      `"${e.sourceName}"`,
      `"${e.quantity}"`,
      `"${e.unit}"`,
      `"${e.factorValue}"`,
      `"${e.tco2e}"`,
      `"${e.docType}"`,
      `"${e.invoiceNumber || ""}"`,
      `"${e.docName}"`,
      `"${e.docSha256}"`,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `MEIL_AuditPack_${currentFy}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-4">
      <div className="bg-card border-border flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 print:hidden">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            SEBI BRSR Principle 6
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button size="xs" variant="outline" onClick={downloadBrsrCsv}>
            <Download className="mr-1 h-3 w-3" />
            Table CSV
          </Button>

          <Button size="xs" variant="outline" onClick={downloadAuditPackCsv}>
            <FileSpreadsheet className="mr-1 h-3 w-3" />
            Audit Pack CSV
          </Button>

          <Button size="xs" variant="secondary" onClick={handlePrint}>
            <Printer className="mr-1 h-3 w-3" />
            Print
          </Button>
        </div>
      </div>

      <Card className="border-border">
        <CardHeader className="border-border border-b p-4 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold">
              Principle 6: Environmental Performance &amp; GHG Emissions
            </CardTitle>
            <div className="text-muted-foreground text-right font-mono text-xs">
              Megha Engineering &amp; Infrastructures Ltd.
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-foreground font-semibold">
                  Parameter
                </TableHead>
                <TableHead className="w-24">Unit</TableHead>
                <TableHead className="text-foreground text-right font-semibold">
                  FY {currentFy}
                </TableHead>
                <TableHead className="text-foreground text-right font-semibold">
                  FY {previousFy}
                </TableHead>
                <TableHead className="text-muted-foreground w-48 text-xs">
                  Source
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.map((row, idx) => (
                <TableRow
                  key={row.parameter}
                  className={idx % 2 === 0 ? "bg-background" : "bg-muted/10"}
                >
                  <TableCell className="text-xs font-medium">
                    {row.parameter}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {row.unit}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold">
                    {row.currentFyValue}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right font-mono text-xs">
                    {row.previousFyValue}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-[11px]">
                    {row.source}
                  </TableCell>
                </TableRow>
              ))}

              <TableRow className="border-t">
                <TableCell className="text-xs font-medium">
                  Independent assessment / assurance carried out by external
                  agency
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-xs">
                  Yes / No
                </TableCell>
                <TableCell className="text-right text-xs font-medium">
                  {assuranceCurrent.done ? (
                    <Badge variant="secondary" className="text-[10px]">
                      Yes ({assuranceCurrent.agency || "Certified"})
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">Pending</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-right text-xs">
                  {assurancePrevious.done ? (
                    <span>Yes ({assurancePrevious.agency})</span>
                  ) : (
                    <span>No</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-[11px]">
                  Assurance Disclosure
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
