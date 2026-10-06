import { getAuthContext } from "@/lib/auth";
import { HqNotice } from "@/components/emissions/hq-notice";
import { db } from "@/db";
import { emissionFactors } from "@/db/schema";
import { EntryForm } from "@/components/emissions/entry-form";
import { Badge } from "@/components/ui/badge";

export default async function NewEntryPage() {
  const ctx = await getAuthContext();

  if (!ctx.site) {
    return <HqNotice orgId={ctx.orgId} isHq={ctx.isHq} orgRole={ctx.orgRole} />;
  }

  const site = ctx.site;

  const factors = await db
    .select({
      id: emissionFactors.id,
      scope: emissionFactors.scope,
      category: emissionFactors.category,
      unit: emissionFactors.unit,
      kgCo2ePerUnit: emissionFactors.kgCo2ePerUnit,
      authority: emissionFactors.authority,
      version: emissionFactors.version,
    })
    .from(emissionFactors);

  return (
    <div className="w-full space-y-4">
      <div className="border-border border-b pb-3">
        <h1 className="text-xl font-bold tracking-tight">Log Emission Entry</h1>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {site.name} ({site.id})
        </p>
      </div>

      <EntryForm factors={factors} siteId={site.id} siteName={site.name} />
    </div>
  );
}
