import { requireCorporateAdminContext } from "@/lib/auth";
import { db } from "@/db";
import { companies, groups } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CompaniesManager } from "@/components/admin/companies-manager";
import { OrgHierarchyNav } from "@/components/admin/org-nav";

export default async function AdminCompaniesPage() {
  await requireCorporateAdminContext();

  const groupRows = await db
    .select({
      id: groups.id,
      name: groups.name,
    })
    .from(groups);

  const companyRows = await db
    .select({
      id: companies.id,
      name: companies.name,
      groupId: companies.groupId,
      groupName: groups.name,
    })
    .from(companies)
    .innerJoin(groups, eq(companies.groupId, groups.id));

  return (
    <div className="w-full space-y-4">
      <div className="border-border border-b pb-3">
        <h1 className="text-xl font-bold tracking-tight">
          Organizational Hierarchy: Companies
        </h1>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Corporate legal entities mapped to enterprise groups.
        </p>
      </div>

      <OrgHierarchyNav />

      <CompaniesManager companies={companyRows} groups={groupRows} />
    </div>
  );
}
