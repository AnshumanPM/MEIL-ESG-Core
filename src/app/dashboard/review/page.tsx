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
        <p className="text-muted-foreground mt-1 text-xs">
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
    .where(and(eq(emissionEntries.status, "SUBMITTED"), siteFilterCondition))
    .groupBy(
      emissionEntries.siteId,
      sites.name,
      sites.buId,
      businessUnits.name,
      emissionEntries.financialYear,
    );

  const totalPendingTco2e = pendingSubmissions.reduce(
    (acc, curr) => acc + parseFloat(curr.totalTco2e),
    0,
  );

  return (
    <div className="max-w-6xl space-y-6">
      <div className="border-border flex flex-col justify-between gap-3 border-b pb-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Review Queue
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {isCorporateAdmin
                ? "All BUs"
                : assignedBuIds.join(", ") || "No BUs"}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Pending Submissions
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="border-border">
          <CardHeader className="p-3.5 pb-1">
            <CardDescription className="text-xs font-medium uppercase">
              Pending Packages
            </CardDescription>
            <CardTitle className="text-xl font-bold">
              {pendingSubmissions.length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border">
          <CardHeader className="p-3.5 pb-1">
            <CardDescription className="text-xs font-medium uppercase">
              Pending Emissions
            </CardDescription>
            <CardTitle className="text-xl font-bold">
              {totalPendingTco2e.toFixed(3)}{" "}
              <span className="text-muted-foreground text-xs font-normal">
                tCO₂e
              </span>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border">
          <CardHeader className="p-3.5 pb-1">
            <CardDescription className="text-xs font-medium uppercase">
              Assigned BUs
            </CardDescription>
            <CardTitle className="text-xl font-bold">
              {isCorporateAdmin ? "ALL" : assignedBuIds.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="bg-card overflow-hidden rounded-lg border">
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
                  className="text-muted-foreground h-24 text-center text-xs"
                >
                  No pending submissions waiting for review.
                </TableCell>
              </TableRow>
            ) : (
              pendingSubmissions.map((sub) => (
                <TableRow key={`${sub.siteId}-${sub.financialYear}`}>
                  <TableCell>
                    <div className="text-foreground text-xs font-semibold">
                      {sub.siteName}
                    </div>
                    <div className="text-muted-foreground font-mono text-[10px]">
                      {sub.siteId}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {sub.buId}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {sub.financialYear}
                  </TableCell>
                  <TableCell className="text-xs">{sub.entryCount}</TableCell>
                  <TableCell className="text-xs font-semibold">
                    {parseFloat(sub.totalTco2e).toFixed(3)} tCO₂e
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">
                      Submitted
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="xs" variant="outline">
                      <Link
                        href={`/dashboard/review/${sub.siteId}/${sub.financialYear}`}
                      >
                        Review <ArrowRight className="ml-1 h-3 w-3" />
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
