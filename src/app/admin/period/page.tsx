import { requireCorporateAdminContext } from "@/lib/auth";
import { db } from "@/db";
import { fyConfig } from "@/db/schema";
import { PeriodManager } from "@/components/admin/period-manager";

export default async function AdminPeriodPage() {
  await requireCorporateAdminContext();

  const configs = await db
    .select({
      financialYear: fyConfig.financialYear,
      turnoverInrCr: fyConfig.turnoverInrCr,
      assuranceDone: fyConfig.assuranceDone,
      assuranceAgency: fyConfig.assuranceAgency,
      lockedAt: fyConfig.lockedAt,
    })
    .from(fyConfig);

  return (
    <div className="space-y-4 max-w-7xl">
      <div className="border-b border-border pb-3">
        <h1 className="text-xl font-bold tracking-tight">
          Period Governance
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Turnover parameters and financial year lock.
        </p>
      </div>

      <PeriodManager configs={configs} />
    </div>
  );
}
