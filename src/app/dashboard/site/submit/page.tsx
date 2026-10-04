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
    return <HqNotice orgId={ctx.orgId} isHq={ctx.isHq} orgRole={ctx.orgRole} />;
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
        inArray(emissionEntries.status, ["DRAFT", "REJECTED"]),
      ),
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
    <div className="max-w-6xl space-y-6">
      <div className="border-border border-b pb-4">
        <div className="mb-1 flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            {site.id}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Submission
          </Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Submit Reporting Period
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Card className="border-border">
          <CardHeader className="p-3.5 pb-1">
            <CardDescription className="text-xs font-medium uppercase">
              Entries
            </CardDescription>
            <CardTitle className="text-xl font-bold">{drafts.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border">
          <CardHeader className="p-3.5 pb-1">
            <CardDescription className="text-xs font-medium uppercase">
              Scope 1
            </CardDescription>
            <CardTitle className="text-xl font-bold">
              {scope1Total.toFixed(3)}{" "}
              <span className="text-muted-foreground text-xs font-normal">
                tCO₂e
              </span>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border">
          <CardHeader className="p-3.5 pb-1">
            <CardDescription className="text-xs font-medium uppercase">
              Scope 2
            </CardDescription>
            <CardTitle className="text-xl font-bold">
              {scope2Total.toFixed(3)}{" "}
              <span className="text-muted-foreground text-xs font-normal">
                tCO₂e
              </span>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border">
          <CardHeader className="p-3.5 pb-1">
            <CardDescription className="text-xs font-medium uppercase">
              Scope 3
            </CardDescription>
            <CardTitle className="text-xl font-bold">
              {scope3Total.toFixed(3)}{" "}
              <span className="text-muted-foreground text-xs font-normal">
                tCO₂e
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="bg-card overflow-hidden rounded-lg border">
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
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground h-20 text-center text-xs"
                >
                  No draft entries available to submit.
                </TableCell>
              </TableRow>
            ) : (
              drafts.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {d.entryDate}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {d.scope.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-medium">
                    {d.sourceName}
                  </TableCell>
                  <TableCell className="text-xs">
                    {d.quantity} {d.unit}
                  </TableCell>
                  <TableCell className="text-xs font-semibold">
                    {d.tco2e}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
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
