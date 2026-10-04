import Link from "next/link";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/db";
import { emissionEntries, sites, businessUnits } from "@/db/schema";
import { eq, inArray, and, sql } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowRight } from "lucide-react";

export default async function ReviewQueuePage() {
  const ctx = await getAuthContext();

  const isBuReviewer =
    ctx.orgRole === "org:bu_reviewer" || ctx.orgRole === "bu_reviewer";
  const isCorporateAdmin =
    ctx.orgRole === "org:corporate_admin" || ctx.orgRole === "corporate_admin";

  if (!isBuReviewer && !isCorporateAdmin) {
    return (
      <div className="max-w-md py-8">
        <h2 className="text-base font-bold">Access Denied</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Reviewer or Admin role is required.
        </p>
      </div>
    );
  }

  const assignedBuIds = ctx.buIds;

  let siteFilterCondition = undefined;
  if (!isCorporateAdmin && assignedBuIds.length > 0) {
    siteFilterCondition = inArray(sites.buId, assignedBuIds);
  }

  const pendingSubmissions = await db
    .select({
      siteId: emissionEntries.siteId,
      siteName: sites.name,
      buId: sites.buId,
      buName: businessUnits.name,
      financialYear: emissionEntries.financialYear,
      entryCount: sql<number>`count(${emissionEntries.id})`,
      totalTco2e: sql<string>`coalesce(sum(${emissionEntries.tco2e}), 0)`,
    })
    .from(emissionEntries)
    .innerJoin(sites, eq(emissionEntries.siteId, sites.id))
    .innerJoin(businessUnits, eq(sites.buId, businessUnits.id))
    .where(
      and(
        eq(emissionEntries.status, "SUBMITTED"),
        siteFilterCondition
      )
    )
    .groupBy(
      emissionEntries.siteId,
      sites.name,
      sites.buId,
      businessUnits.name,
      emissionEntries.financialYear
    );

  const totalPendingTco2e = pendingSubmissions.reduce(
    (acc, curr) => acc + parseFloat(curr.totalTco2e),
    0
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs">Review Queue</Badge>
            <Badge variant="secondary" className="text-xs">
              {isCorporateAdmin ? "All BUs" : assignedBuIds.join(", ") || "No BUs"}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Pending Submissions
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-border">
          <CardHeader className="p-3.5 pb-1">
            <CardDescription className="text-xs uppercase font-medium">Pending Packages</CardDescription>
            <CardTitle className="text-xl font-bold">{pendingSubmissions.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border">
          <CardHeader className="p-3.5 pb-1">
            <CardDescription className="text-xs uppercase font-medium">Pending Emissions</CardDescription>
            <CardTitle className="text-xl font-bold">
              {totalPendingTco2e.toFixed(3)}{" "}
              <span className="text-xs font-normal text-muted-foreground">tCO₂e</span>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border">
          <CardHeader className="p-3.5 pb-1">
            <CardDescription className="text-xs uppercase font-medium">Assigned BUs</CardDescription>
            <CardTitle className="text-xl font-bold">
              {isCorporateAdmin ? "ALL" : assignedBuIds.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project Site</TableHead>
              <TableHead>Business Unit</TableHead>
              <TableHead>Financial Year</TableHead>
              <TableHead>Entries</TableHead>
              <TableHead>Emissions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingSubmissions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground text-xs"
                >
                  No pending submissions waiting for review.
                </TableCell>
              </TableRow>
            ) : (
              pendingSubmissions.map((sub) => (
                <TableRow key={`${sub.siteId}-${sub.financialYear}`}>
                  <TableCell>
                    <div className="font-semibold text-xs text-foreground">
                      {sub.siteName}
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {sub.siteId}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {sub.buId}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {sub.financialYear}
                  </TableCell>
                  <TableCell className="text-xs">
                    {sub.entryCount}
                  </TableCell>
                  <TableCell className="font-semibold text-xs">
                    {parseFloat(sub.totalTco2e).toFixed(3)} tCO₂e
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">
                      Submitted
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="xs" variant="outline">
                      <Link href={`/dashboard/review/${sub.siteId}/${sub.financialYear}`}>
                        Review <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
