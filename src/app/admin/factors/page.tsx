import { requireCorporateAdminContext } from "@/lib/auth";
import { db } from "@/db";
import { emissionFactors } from "@/db/schema";
import { FactorsManager } from "@/components/admin/factors-manager";

export default async function AdminFactorsPage() {
  await requireCorporateAdminContext();

  const factors = await db
    .select({
      id: emissionFactors.id,
      scope: emissionFactors.scope,
      category: emissionFactors.category,
      unit: emissionFactors.unit,
      kgCo2ePerUnit: emissionFactors.kgCo2ePerUnit,
      authority: emissionFactors.authority,
      version: emissionFactors.version,
      validFrom: emissionFactors.validFrom,
      validTo: emissionFactors.validTo,
    })
    .from(emissionFactors);

  return (
    <div className="space-y-4 max-w-7xl">
      <div className="border-b border-border pb-3">
        <h1 className="text-xl font-bold tracking-tight">
          Emission Factors
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Statutory emission factors library.
        </p>
      </div>

      <FactorsManager factors={factors} />
    </div>
  );
}
