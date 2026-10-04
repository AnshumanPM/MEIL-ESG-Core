"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  OrganizationSwitcher,
  UserButton,
  useAuth,
  useOrganization,
} from "@clerk/nextjs";
import {
  BarChart3,
  Building2,
  FileCheck2,
  FilePlus2,
  FolderLock,
  Layers,
  LayoutDashboard,
  Send,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { orgRole } = useAuth();
  const { organization } = useOrganization();

  const orgMeta = (organization?.publicMetadata || {}) as Record<string, any>;
  const isHqOrg = Boolean(
    orgMeta.node_type === "HQ" ||
    organization?.name?.toLowerCase().includes("hq") ||
    organization?.slug?.toLowerCase().includes("hq") ||
    orgRole === "org:corporate_admin" ||
    orgRole === "corporate_admin"
  );

  const isCorporateAdmin = Boolean(
    orgRole === "org:corporate_admin" ||
    orgRole === "corporate_admin" ||
    (isHqOrg && (orgRole === "org:admin" || orgRole === "admin")) ||
    (isHqOrg && !orgRole?.includes("auditor") && !orgRole?.includes("reviewer"))
  );

  const isAuditor = Boolean(
    orgRole === "org:external_auditor" ||
    orgRole === "external_auditor"
  );

  const isBuReviewer = Boolean(
    orgRole === "org:bu_reviewer" ||
    orgRole === "bu_reviewer" ||
    isCorporateAdmin
  );

  const isSiteRole = Boolean(
    !isHqOrg &&
    !isCorporateAdmin &&
    !isAuditor &&
    (orgRole === "org:site_manager" ||
      orgRole === "site_manager" ||
      orgRole === "org:site_operator" ||
      orgRole === "site_operator" ||
      orgRole?.includes("site") ||
      orgRole === "org:member" ||
      orgRole === "member" ||
      !orgRole)
  );

  const isSiteManager = Boolean(
    isSiteRole &&
    (orgRole === "org:site_manager" ||
      orgRole === "site_manager" ||
      orgRole === "org:site_operator" ||
      orgRole === "site_operator" ||
      !orgRole)
  );

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar collapsible="icon" className="border-r border-border bg-sidebar">
          <SidebarHeader className="border-b border-border p-3">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <Link href="/dashboard">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary font-bold text-xs text-primary-foreground">
                      M
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="text-xs font-semibold tracking-tight text-foreground">
                        MEIL ESG
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        BRSR Principle 6
                      </span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent>
            {isSiteRole && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Site Operations
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === "/dashboard/site"}>
                        <Link href="/dashboard/site">
                          <LayoutDashboard className="h-4 w-4 shrink-0" />
                          <span>Dashboard</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === "/dashboard/site/entries/new"}>
                        <Link href="/dashboard/site/entries/new">
                          <FilePlus2 className="h-4 w-4 shrink-0" />
                          <span>Log Entry</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === "/dashboard/site/entries"}>
                        <Link href="/dashboard/site/entries">
                          <Layers className="h-4 w-4 shrink-0" />
                          <span>Ledger</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    {isSiteManager && (
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === "/dashboard/site/submit"}>
                          <Link href="/dashboard/site/submit">
                            <Send className="h-4 w-4 shrink-0" />
                            <span>Submit Month</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {isBuReviewer && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Verification
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard/review")}>
                        <Link href="/dashboard/review">
                          <FileCheck2 className="h-4 w-4 shrink-0" />
                          <span>Review Queue</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {isCorporateAdmin && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Administration
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === "/dashboard/admin/factors"}>
                        <Link href="/dashboard/admin/factors">
                          <Layers className="h-4 w-4 shrink-0" />
                          <span>Factors Library</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === "/dashboard/admin/sites"}>
                        <Link href="/dashboard/admin/sites">
                          <Building2 className="h-4 w-4 shrink-0" />
                          <span>Sites &amp; BUs</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === "/dashboard/admin/period"}>
                        <Link href="/dashboard/admin/period">
                          <FolderLock className="h-4 w-4 shrink-0" />
                          <span>Period Lock</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {(isCorporateAdmin || isAuditor || isBuReviewer) && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Compliance &amp; Audit
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === "/dashboard/reports/brsr"}>
                        <Link href="/dashboard/reports/brsr">
                          <BarChart3 className="h-4 w-4 shrink-0" />
                          <span>BRSR Report</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    {(isAuditor || isCorporateAdmin) && (
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === "/dashboard/audit"}>
                          <Link href="/dashboard/audit">
                            <ShieldCheck className="h-4 w-4 shrink-0" />
                            <span>Auditor Console</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <SidebarFooter className="border-t border-border p-3 space-y-2">
            <OrganizationSwitcher
              hidePersonal
              appearance={{
                elements: {
                  rootBox: "w-full",
                  organizationSwitcherTrigger:
                    "w-full justify-between border border-border bg-background px-2.5 py-1.5 text-xs rounded-md",
                },
              }}
            />
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] text-muted-foreground truncate">
                {orgRole ? orgRole.replace("org:", "").replace("_", " ") : "Member"}
              </span>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-7 w-7",
                  },
                }}
              />
            </div>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset className="bg-background">
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-4" />
              <span className="text-xs font-medium text-foreground truncate">
                {organization?.name || "MEIL Enterprise"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                FY 2026-2027
              </Badge>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
