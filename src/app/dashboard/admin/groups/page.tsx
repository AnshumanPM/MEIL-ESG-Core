import { requireCorporateAdminContext } from "@/lib/auth";
import { db } from "@/db";
import { groups } from "@/db/schema";
import { GroupsManager } from "@/components/admin/groups-manager";
import { OrgHierarchyNav } from "@/components/admin/org-nav";

export default async function AdminGroupsPage() {
  await requireCorporateAdminContext();

  const groupRows = await db
    .select({
      id: groups.id,
      name: groups.name,
    })
    .from(groups);

  return (
    <div className="w-full space-y-4">
      <div className="border-border border-b pb-3">
        <h1 className="text-xl font-bold tracking-tight">
          Organizational Hierarchy: Groups
        </h1>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Apex enterprise conglomerate groups.
        </p>
      </div>

      <OrgHierarchyNav />

      <GroupsManager groups={groupRows} />
    </div>
  );
}
