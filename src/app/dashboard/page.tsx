import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { OrganizationSwitcher } from "@clerk/nextjs";
import { db } from "@/db";
import { sites, businessUnits, emissionEntries, documents } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
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
  BarChart3,
  Building2,
  FileCheck2,
  FilePlus2,
  FolderLock,
  Layers,
  LayoutDashboard,
  ShieldCheck,
  Send,
  ArrowRight,
} from "lucide-react";

export default async function DashboardOverviewPage() {
  const session = await auth();
  const { userId, orgId, orgRole } = session;

  if (!userId) {
    redirect("/login");
  }

  const user = await currentUser();

  let site = null;
  let bu = null;

  if (orgId) {
    const siteRows = await db
      .select()
      .from(sites)
      .where(eq(sites.clerkOrgId, orgId))
      .limit(1);

    if (siteRows.length > 0) {
      site = siteRows[0];
      const buRows = await db
        .select()
        .from(businessUnits)
        .where(eq(businessUnits.id, site.buId))
        .limit(1);
      if (buRows.length > 0) {
        bu = buRows[0];
      }
    }
  }

  const [stats] = await db
    .select({
      totalEntries: sql<number>`count(${emissionEntries.id})`,
      totalTco2e: sql<string>`coalesce(sum(${emissionEntries.tco2e}), 0)`,
    })
    .from(emissionEntries);

  const [docStats] = await db
    .select({
      totalDocs: sql<number>`count(${documents.id})`,
    })
    .from(documents);

  const roleName = orgRole
    ? orgRole.replace("org:", "").replace("_", " ").toUpperCase()
    : "NO ORG";

  return (
    <div className="max-w-6xl space-y-6">
      <div className="border-border flex flex-col justify-between gap-3 border-b pb-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              FY 2026-2027
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {roleName}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            GHG Emissions Overview
          </h1>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Logged in as{" "}
            {user?.firstName || user?.emailAddresses[0]?.emailAddress}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!orgId ? (
            <OrganizationSwitcher hidePersonal />
          ) : (
            <div className="border-border bg-card flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium">
              <Building2 className="text-muted-foreground h-3.5 w-3.5" />
              <span>{site ? `${site.name} (${site.id})` : "MEIL HQ"}</span>
            </div>
          )}
        </div>
      </div>

      {!orgId && (
        <Alert>
          <AlertTitle className="text-xs font-semibold">
            Select Organization
          </AlertTitle>
          <AlertDescription className="text-muted-foreground mt-0.5 text-xs">
            Choose an organization to access your project site or corporate
            workspace.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium uppercase">
              Recorded Emissions
            </CardDescription>
            <CardTitle className="text-2xl font-bold">
              {Number(stats?.totalTco2e || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              <span className="text-muted-foreground text-xs font-normal">
                tCO₂e
              </span>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium uppercase">
              Activity Entries
            </CardDescription>
            <CardTitle className="text-2xl font-bold">
              {stats?.totalEntries || 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium uppercase">
              Verified Documents
            </CardDescription>
            <CardTitle className="text-2xl font-bold">
              {docStats?.totalDocs || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {site ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border hover:bg-muted/30 transition-colors">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <LayoutDashboard className="text-muted-foreground h-4 w-4" />
                <Badge variant="outline" className="text-[10px]">
                  Site
                </Badge>
              </div>
              <CardTitle className="mt-2 text-sm font-bold">
                Site Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <Button
                asChild
                variant="outline"
                size="xs"
                className="w-full justify-between"
              >
                <Link href="/dashboard/site">
                  Open <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border hover:bg-muted/30 transition-colors">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <FilePlus2 className="text-muted-foreground h-4 w-4" />
                <Badge variant="outline" className="text-[10px]">
                  Activity
                </Badge>
              </div>
              <CardTitle className="mt-2 text-sm font-bold">
                Log Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <Button
                asChild
                variant="outline"
                size="xs"
                className="w-full justify-between"
              >
                <Link href="/dashboard/site/entries/new">
                  Open <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border hover:bg-muted/30 transition-colors">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <Layers className="text-muted-foreground h-4 w-4" />
                <Badge variant="outline" className="text-[10px]">
                  Records
                </Badge>
              </div>
              <CardTitle className="mt-2 text-sm font-bold">
                Emissions Ledger
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <Button
                asChild
                variant="outline"
                size="xs"
                className="w-full justify-between"
              >
                <Link href="/dashboard/site/entries">
                  Open <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border hover:bg-muted/30 transition-colors">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <Send className="text-muted-foreground h-4 w-4" />
                <Badge variant="outline" className="text-[10px]">
                  Period
                </Badge>
              </div>
              <CardTitle className="mt-2 text-sm font-bold">
                Submit Period
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <Button
                asChild
                variant="outline"
                size="xs"
                className="w-full justify-between"
              >
                <Link href="/dashboard/site/submit">
                  Open <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-border hover:bg-muted/30 transition-colors">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <Building2 className="text-muted-foreground h-4 w-4" />
                <Badge variant="outline" className="text-[10px]">
                  Admin
                </Badge>
              </div>
              <CardTitle className="mt-2 text-sm font-bold">
                Sites &amp; BUs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <Button
                asChild
                variant="outline"
                size="xs"
                className="w-full justify-between"
              >
                <Link href="/dashboard/admin/sites">
                  Open <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border hover:bg-muted/30 transition-colors">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <Layers className="text-muted-foreground h-4 w-4" />
                <Badge variant="outline" className="text-[10px]">
                  Library
                </Badge>
              </div>
              <CardTitle className="mt-2 text-sm font-bold">
                Emission Factors
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <Button
                asChild
                variant="outline"
                size="xs"
                className="w-full justify-between"
              >
                <Link href="/dashboard/admin/factors">
                  Open <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border hover:bg-muted/30 transition-colors">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <FileCheck2 className="text-muted-foreground h-4 w-4" />
                <Badge variant="outline" className="text-[10px]">
                  Review
                </Badge>
              </div>
              <CardTitle className="mt-2 text-sm font-bold">
                Review Queue
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <Button
                asChild
                variant="outline"
                size="xs"
                className="w-full justify-between"
              >
                <Link href="/dashboard/review">
                  Open <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border hover:bg-muted/30 transition-colors">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <BarChart3 className="text-muted-foreground h-4 w-4" />
                <Badge variant="outline" className="text-[10px]">
                  BRSR
                </Badge>
              </div>
              <CardTitle className="mt-2 text-sm font-bold">
                BRSR Report
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <Button
                asChild
                variant="outline"
                size="xs"
                className="w-full justify-between"
              >
                <Link href="/dashboard/reports/brsr">
                  Open <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border hover:bg-muted/30 transition-colors">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <FolderLock className="text-muted-foreground h-4 w-4" />
                <Badge variant="outline" className="text-[10px]">
                  Control
                </Badge>
              </div>
              <CardTitle className="mt-2 text-sm font-bold">
                Period Lock
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <Button
                asChild
                variant="outline"
                size="xs"
                className="w-full justify-between"
              >
                <Link href="/dashboard/admin/period">
                  Open <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border hover:bg-muted/30 transition-colors">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <ShieldCheck className="text-muted-foreground h-4 w-4" />
                <Badge variant="outline" className="text-[10px]">
                  Audit
                </Badge>
              </div>
              <CardTitle className="mt-2 text-sm font-bold">
                Auditor Console
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <Button
                asChild
                variant="outline"
                size="xs"
                className="w-full justify-between"
              >
                <Link href="/dashboard/audit">
                  Open <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
