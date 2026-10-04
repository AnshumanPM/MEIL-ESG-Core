import { requireCorporateAdminContext } from "@/lib/auth";
import { db } from "@/db";
import { sites, businessUnits } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SitesManager } from "@/components/admin/sites-manager";

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
      stateCode: sites.stateCode,
      active: sites.active,
    })
    .from(sites)
    .innerJoin(businessUnits, eq(sites.buId, businessUnits.id));

  return (
    <div className="max-w-7xl space-y-4">
      <div className="border-border border-b pb-3">
        <h1 className="text-xl font-bold tracking-tight">
          Sites &amp; Business Units
        </h1>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Project sites and organization mapping.
        </p>
      </div>

      <SitesManager sites={siteRows} businessUnits={buRows} />
    </div>
  );
}
