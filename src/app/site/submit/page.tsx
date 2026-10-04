import { getAuthContext } from "@/lib/auth";
import { HqNotice } from "@/components/emissions/hq-notice";
import { db } from "@/db";
import { emissionEntries, documents } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MonthSubmitClient } from "@/components/emissions/month-submit-client";

export default async function SiteSubmitPage() {
  const ctx = await getAuthContext();

  if (!ctx.site) {
    return (
      <HqNotice
        orgId={ctx.orgId}
        isHq={ctx.isHq}
        orgRole={ctx.orgRole}
      />
    );
  }
  const site = ctx.site;
  const currentFy = "2026-2027";

  const isManager = true;

  const drafts = await db
    .select({
      id: emissionEntries.id,
      entryDate: emissionEntries.entryDate,
      scope: emissionEntries.scope,
      category: emissionEntries.category,
      sourceName: emissionEntries.sourceName,
      quantity: emissionEntries.quantity,
      unit: emissionEntries.unit,
      tco2e: emissionEntries.tco2e,
      status: emissionEntries.status,
      docId: documents.id,
      originalName: documents.originalName,
    })
    .from(emissionEntries)
    .leftJoin(documents, eq(emissionEntries.id, documents.entryId))
    .where(
      and(
        eq(emissionEntries.siteId, site.id),
        inArray(emissionEntries.status, ["DRAFT", "REJECTED"])
      )
    );

  const scope1Total = drafts
    .filter((d) => d.scope === "SCOPE_1")
    .reduce((acc, curr) => acc + parseFloat(curr.tco2e), 0);

  const scope2Total = drafts
    .filter((d) => d.scope === "SCOPE_2")
    .reduce((acc, curr) => acc + parseFloat(curr.tco2e), 0);

  const scope3Total = drafts
    .filter((d) => d.scope === "SCOPE_3")
    .reduce((acc, curr) => acc + parseFloat(curr.tco2e), 0);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="font-mono text-xs">
            {site.id}
          </Badge>
          <Badge variant="secondary" className="text-xs">Submission</Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Submit Reporting Period
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Card className="border-border">
          <CardHeader className="p-3.5 pb-1">
            <CardDescription className="text-xs uppercase font-medium">Entries</CardDescription>
            <CardTitle className="text-xl font-bold">{drafts.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border">
          <CardHeader className="p-3.5 pb-1">
            <CardDescription className="text-xs uppercase font-medium">Scope 1</CardDescription>
            <CardTitle className="text-xl font-bold">
              {scope1Total.toFixed(3)}{" "}
              <span className="text-xs font-normal text-muted-foreground">tCO₂e</span>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border">
          <CardHeader className="p-3.5 pb-1">
            <CardDescription className="text-xs uppercase font-medium">Scope 2</CardDescription>
            <CardTitle className="text-xl font-bold">
              {scope2Total.toFixed(3)}{" "}
              <span className="text-xs font-normal text-muted-foreground">tCO₂e</span>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border">
          <CardHeader className="p-3.5 pb-1">
            <CardDescription className="text-xs uppercase font-medium">Scope 3</CardDescription>
            <CardTitle className="text-xl font-bold">
              {scope3Total.toFixed(3)}{" "}
              <span className="text-xs font-normal text-muted-foreground">tCO₂e</span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>tCO₂e</TableHead>
              <TableHead>Proof File</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drafts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-20 text-center text-muted-foreground text-xs">
                  No draft entries available to submit.
                </TableCell>
              </TableRow>
            ) : (
              drafts.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{d.entryDate}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {d.scope.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-xs">{d.sourceName}</TableCell>
                  <TableCell className="text-xs">
                    {d.quantity} {d.unit}
                  </TableCell>
                  <TableCell className="font-semibold text-xs">{d.tco2e}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {d.originalName || "Attached"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <MonthSubmitClient
          financialYear={currentFy}
          draftCount={drafts.length}
        />
      </div>
    </div>
  );
}
