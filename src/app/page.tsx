import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { SignInButton, OrganizationSwitcher } from "@clerk/nextjs";
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
  CheckCircle2,
  FileCheck2,
  FilePlus2,
  FolderLock,
  Layers,
  LayoutDashboard,
  ShieldCheck,
  Send,
  ArrowRight,
} from "lucide-react";

export default async function HomePage() {
  const session = await auth();
  const { userId, orgId, orgRole } = session;
  const user = userId ? await currentUser() : null;

  if (!userId) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
        <Card className="max-w-md w-full border-border">
          <CardHeader className="text-center space-y-1.5 pb-4">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-primary font-bold text-base text-primary-foreground mb-1">
              M
            </div>
            <CardTitle className="text-xl font-bold">
              MEIL GHG Emissions Platform
            </CardTitle>
            <CardDescription className="text-xs">
              SEBI BRSR Principle 6 Compliance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <SignInButton mode="modal">
              <Button className="w-full">
                Sign In to Portal
              </Button>
            </SignInButton>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const roleName = orgRole ? orgRole.replace("org:", "").replace("_", " ").toUpperCase() : "NO ORG";

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs">FY 2026-2027</Badge>
            <Badge variant="secondary" className="text-xs">{roleName}</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            GHG Emissions Overview
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Logged in as {user?.firstName || user?.emailAddresses[0]?.emailAddress}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!orgId ? (
            <OrganizationSwitcher hidePersonal />
          ) : (
            <div className="flex items-center gap-2 border border-border bg-card rounded-md px-3 py-1.5 text-xs font-medium">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{site ? `${site.name} (${site.id})` : "MEIL HQ"}</span>
            </div>
          )}
        </div>
      </div>

      {!orgId && (
        <Alert>
          <AlertTitle className="text-xs font-semibold">Select Organization</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground mt-0.5">
            Choose an organization to access your project site or corporate workspace.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-medium">Recorded Emissions</CardDescription>
            <CardTitle className="text-2xl font-bold">
              {Number(stats?.totalTco2e || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              <span className="text-xs font-normal text-muted-foreground">tCO₂e</span>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-medium">Activity Entries</CardDescription>
            <CardTitle className="text-2xl font-bold">
              {stats?.totalEntries || 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-medium">Verified Documents</CardDescription>
            <CardTitle className="text-2xl font-bold">
              {docStats?.totalDocs || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border hover:bg-muted/30 transition-colors">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="text-[10px]">Site</Badge>
            </div>
            <CardTitle className="text-sm font-bold mt-2">Site Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <Button asChild variant="outline" size="xs" className="w-full justify-between">
              <Link href="/site">
                Open <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border hover:bg-muted/30 transition-colors">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <FileCheck2 className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="text-[10px]">Review</Badge>
            </div>
            <CardTitle className="text-sm font-bold mt-2">Review Queue</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <Button asChild variant="outline" size="xs" className="w-full justify-between">
              <Link href="/review">
                Open <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border hover:bg-muted/30 transition-colors">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="text-[10px]">BRSR</Badge>
            </div>
            <CardTitle className="text-sm font-bold mt-2">BRSR Report</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <Button asChild variant="outline" size="xs" className="w-full justify-between">
              <Link href="/reports/brsr">
                Open <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border hover:bg-muted/30 transition-colors">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="text-[10px]">Audit</Badge>
            </div>
            <CardTitle className="text-sm font-bold mt-2">Auditor Console</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <Button asChild variant="outline" size="xs" className="w-full justify-between">
              <Link href="/audit">
                Open <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
