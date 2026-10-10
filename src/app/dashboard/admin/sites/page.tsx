import { requireCorporateAdminContext } from "@/lib/auth";
import { db } from "@/db";
import { sites, businessUnits, companies, groups } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SitesManager } from "@/components/admin/sites-manager";
import { OrgHierarchyNav } from "@/components/admin/org-nav";

export default async function AdminSitesPage() {
  await requireCorporateAdminContext();

  const buRows = await db
    .select({
      id: businessUnits.id,
      name: businessUnits.name,
    })
    .from(businessUnits);

  const siteRows = await db
    .select({
      id: sites.id,
      clerkOrgId: sites.clerkOrgId,
      name: sites.name,
      buId: sites.buId,
      buName: businessUnits.name,
      companyName: companies.name,
      groupName: groups.name,
      stateCode: sites.stateCode,
      active: sites.active,
    })
    .from(sites)
    .innerJoin(businessUnits, eq(sites.buId, businessUnits.id))
    .leftJoin(companies, eq(businessUnits.companyId, companies.id))
    .leftJoin(groups, eq(companies.groupId, groups.id));

  return (
    <div className="w-full space-y-4">
      <div className="border-border border-b pb-3">
        <h1 className="text-xl font-bold tracking-tight">
          Organizational Hierarchy: Sites &amp; Projects
        </h1>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Project sites mapped across Business Units, Companies, and Groups.
        </p>
      </div>

      <OrgHierarchyNav />

      <SitesManager sites={siteRows} businessUnits={buRows} />
    </div>
  );
}
