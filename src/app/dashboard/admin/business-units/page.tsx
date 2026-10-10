import { requireCorporateAdminContext } from "@/lib/auth";
import { db } from "@/db";
import { businessUnits, companies, groups } from "@/db/schema";
import { eq } from "drizzle-orm";
import { BusinessUnitsManager } from "@/components/admin/business-units-manager";
import { OrgHierarchyNav } from "@/components/admin/org-nav";

export default async function AdminBusinessUnitsPage() {
  await requireCorporateAdminContext();

  const companyRows = await db
    .select({
      id: companies.id,
      name: companies.name,
    })
    .from(companies);

  const buRows = await db
    .select({
      id: businessUnits.id,
      name: businessUnits.name,
      companyId: businessUnits.companyId,
      companyName: companies.name,
      groupName: groups.name,
    })
    .from(businessUnits)
    .leftJoin(companies, eq(businessUnits.companyId, companies.id))
    .leftJoin(groups, eq(companies.groupId, groups.id));

  return (
    <div className="w-full space-y-4">
      <div className="border-border border-b pb-3">
        <h1 className="text-xl font-bold tracking-tight">
          Organizational Hierarchy: Business Units
        </h1>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Operational divisions and industry verticals.
        </p>
      </div>

      <OrgHierarchyNav />

      <BusinessUnitsManager businessUnits={buRows} companies={companyRows} />
    </div>
  );
}
