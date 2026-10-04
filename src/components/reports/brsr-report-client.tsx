"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Download,
  FileSpreadsheet,
  Printer,
} from "lucide-react";

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

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
      "\n"
    );

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

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
      "\n"
    );

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `MEIL_AuditPack_${currentFy}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-card border border-border rounded-lg p-3 print:hidden">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            SEBI BRSR Principle 6
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="xs"
            variant="outline"
            onClick={downloadBrsrCsv}
          >
            <Download className="h-3 w-3 mr-1" />
            Table CSV
          </Button>

          <Button
            size="xs"
            variant="outline"
            onClick={downloadAuditPackCsv}
          >
            <FileSpreadsheet className="h-3 w-3 mr-1" />
            Audit Pack CSV
          </Button>

          <Button
            size="xs"
            variant="secondary"
            onClick={handlePrint}
          >
            <Printer className="h-3 w-3 mr-1" />
            Print
          </Button>
        </div>
      </div>

      <Card className="border-border">
        <CardHeader className="p-4 pb-2 border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold">
              Principle 6: Environmental Performance &amp; GHG Emissions
            </CardTitle>
            <div className="text-right text-xs text-muted-foreground font-mono">
              Megha Engineering &amp; Infrastructures Ltd.
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="font-semibold text-foreground">Parameter</TableHead>
                <TableHead className="w-24">Unit</TableHead>
                <TableHead className="font-semibold text-foreground text-right">
                  FY {currentFy}
                </TableHead>
                <TableHead className="font-semibold text-foreground text-right">
                  FY {previousFy}
                </TableHead>
                <TableHead className="w-48 text-muted-foreground text-xs">
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
                  <TableCell className="font-medium text-xs">
                    {row.parameter}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {row.unit}
                  </TableCell>
                  <TableCell className="font-mono font-bold text-xs text-right">
                    {row.currentFyValue}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-right text-muted-foreground">
                    {row.previousFyValue}
                  </TableCell>
                  <TableCell className="text-[11px] text-muted-foreground">
                    {row.source}
                  </TableCell>
                </TableRow>
              ))}

              <TableRow className="border-t">
                <TableCell className="font-medium text-xs">
                  Independent assessment / assurance carried out by external agency
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  Yes / No
                </TableCell>
                <TableCell className="text-xs text-right font-medium">
                  {assuranceCurrent.done ? (
                    <Badge variant="secondary" className="text-[10px]">
                      Yes ({assuranceCurrent.agency || "Certified"})
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">Pending</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-right text-muted-foreground">
                  {assurancePrevious.done ? (
                    <span>Yes ({assurancePrevious.agency})</span>
                  ) : (
                    <span>No</span>
                  )}
                </TableCell>
                <TableCell className="text-[11px] text-muted-foreground">
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
