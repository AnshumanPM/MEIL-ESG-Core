import Link from "next/link";
import { getAuthContext } from "@/lib/auth";
import { HqNotice } from "@/components/emissions/hq-notice";
import { db } from "@/db";
import { emissionEntries, businessUnits } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  FilePlus2,
  Layers,
  Send,
} from "lucide-react";

export default async function SiteDashboardPage() {
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

  const [bu] = await db
    .select()
    .from(businessUnits)
    .where(eq(businessUnits.id, site.buId))
    .limit(1);

  const scopeTotals = await db
    .select({
      scope: emissionEntries.scope,
      totalTco2e: sql<string>`coalesce(sum(${emissionEntries.tco2e}), 0)`,
      count: sql<number>`count(${emissionEntries.id})`,
    })
    .from(emissionEntries)
    .where(eq(emissionEntries.siteId, site.id))
    .groupBy(emissionEntries.scope);

  const scopeMap: Record<string, { total: number; count: number }> = {
    SCOPE_1: { total: 0, count: 0 },
    SCOPE_2: { total: 0, count: 0 },
    SCOPE_3: { total: 0, count: 0 },
  };

  for (const s of scopeTotals) {
    if (scopeMap[s.scope]) {
      scopeMap[s.scope] = {
        total: parseFloat(s.totalTco2e),
        count: Number(s.count),
      };
    }
  }

  const statusCounts = await db
    .select({
      status: emissionEntries.status,
      count: sql<number>`count(${emissionEntries.id})`,
    })
    .from(emissionEntries)
    .where(eq(emissionEntries.siteId, site.id))
    .groupBy(emissionEntries.status);

  const statusMap: Record<string, number> = {
    DRAFT: 0,
    SUBMITTED: 0,
    APPROVED: 0,
    REJECTED: 0,
    LOCKED: 0,
  };

  for (const sc of statusCounts) {
    statusMap[sc.status] = Number(sc.count);
  }

  const rejectedEntries = await db
    .select()
    .from(emissionEntries)
    .where(
      and(
        eq(emissionEntries.siteId, site.id),
        eq(emissionEntries.status, "REJECTED")
      )
    )
    .orderBy(desc(emissionEntries.updatedAt))
    .limit(5);

  const recentEntries = await db
    .select()
    .from(emissionEntries)
    .where(eq(emissionEntries.siteId, site.id))
    .orderBy(desc(emissionEntries.createdAt))
    .limit(5);

  const isManager =
    !ctx.orgRole ||
    ctx.orgRole.includes("site") ||
    ctx.orgRole.includes("admin") ||
    ctx.orgRole.includes("member");

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="font-mono text-xs">
              {site.id}
            </Badge>
            <Badge variant="secondary" className="text-xs">{bu?.name || site.buId}</Badge>
            <Badge variant="outline" className="text-xs">{site.stateCode}</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {site.name}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link href="/dashboard/site/entries/new">
              <FilePlus2 className="h-4 w-4 mr-1.5" />
              New Entry
            </Link>
          </Button>

          {statusMap.DRAFT > 0 && (
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/site/submit">
                <Send className="h-4 w-4 mr-1.5" />
                Submit {statusMap.DRAFT} Draft(s)
              </Link>
            </Button>
          )}

          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/site/entries">
              <Layers className="h-4 w-4 mr-1.5" />
              Ledger
            </Link>
          </Button>
        </div>
      </div>

      {rejectedEntries.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-xs font-semibold">
            {rejectedEntries.length} Rejected Submission(s)
          </AlertTitle>
          <AlertDescription className="text-xs mt-1 space-y-1.5">
            {rejectedEntries.map((re) => (
              <div key={re.id} className="flex items-center justify-between border-t border-destructive/20 pt-1.5">
                <div>
                  <span className="font-medium">{re.sourceName}</span> ({re.quantity} {re.unit}) &bull; {re.rejectReason || "Correction needed"}
                </div>
                <Button asChild size="xs" variant="outline">
                  <Link href={`/dashboard/site/entries?edit=${re.id}`}>Edit</Link>
                </Button>
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-medium">Scope 1 (Direct)</CardDescription>
            <CardTitle className="text-2xl font-bold">
              {scopeMap.SCOPE_1.total.toFixed(3)}{" "}
              <span className="text-xs font-normal text-muted-foreground">tCO₂e</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            {scopeMap.SCOPE_1.count} entries
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-medium">Scope 2 (Electricity)</CardDescription>
            <CardTitle className="text-2xl font-bold">
              {scopeMap.SCOPE_2.total.toFixed(3)}{" "}
              <span className="text-xs font-normal text-muted-foreground">tCO₂e</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            {scopeMap.SCOPE_2.count} entries
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-medium">Scope 3 (Value Chain)</CardDescription>
            <CardTitle className="text-2xl font-bold">
              {scopeMap.SCOPE_3.total.toFixed(3)}{" "}
              <span className="text-xs font-normal text-muted-foreground">tCO₂e</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            {scopeMap.SCOPE_3.count} entries
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-5 gap-2">
        <div className="rounded-md border border-border bg-card p-2.5 text-center">
          <div className="text-[10px] text-muted-foreground uppercase font-medium">Drafts</div>
          <div className="text-lg font-bold mt-0.5">{statusMap.DRAFT}</div>
        </div>
        <div className="rounded-md border border-border bg-card p-2.5 text-center">
          <div className="text-[10px] text-muted-foreground uppercase font-medium">Submitted</div>
          <div className="text-lg font-bold mt-0.5">{statusMap.SUBMITTED}</div>
        </div>
        <div className="rounded-md border border-border bg-card p-2.5 text-center">
          <div className="text-[10px] text-muted-foreground uppercase font-medium">Approved</div>
          <div className="text-lg font-bold mt-0.5">{statusMap.APPROVED}</div>
        </div>
        <div className="rounded-md border border-border bg-card p-2.5 text-center">
          <div className="text-[10px] text-muted-foreground uppercase font-medium">Rejected</div>
          <div className="text-lg font-bold mt-0.5">{statusMap.REJECTED}</div>
        </div>
        <div className="rounded-md border border-border bg-card p-2.5 text-center">
          <div className="text-[10px] text-muted-foreground uppercase font-medium">Locked</div>
          <div className="text-lg font-bold mt-0.5">{statusMap.LOCKED}</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">Recent Entries</h2>
          <Button asChild variant="link" size="xs">
            <Link href="/dashboard/site/entries">View All &rarr;</Link>
          </Button>
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
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-20 text-center text-xs text-muted-foreground">
                    No entries logged yet.
                  </TableCell>
                </TableRow>
              ) : (
                recentEntries.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {row.entryDate}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {row.scope === "SCOPE_1" ? "Scope 1" : row.scope === "SCOPE_2" ? "Scope 2" : "Scope 3"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {row.sourceName}
                    </TableCell>
                    <TableCell className="text-xs">
                      {row.quantity} {row.unit}
                    </TableCell>
                    <TableCell className="text-xs font-semibold">
                      {row.tco2e}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={row.status === "APPROVED" ? "default" : "outline"}
                        className="text-[10px]"
                      >
                        {row.status === "DRAFT"
                          ? "Draft"
                          : row.status === "SUBMITTED"
                          ? "Submitted"
                          : row.status === "APPROVED"
                          ? "Approved"
                          : row.status === "REJECTED"
                          ? "Rejected"
                          : "Locked"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="xs" variant="ghost">
                        <Link href="/dashboard/site/entries">View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
