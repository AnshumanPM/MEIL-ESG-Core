import "dotenv/config";
import { db } from "./index";
import {
  businessUnits,
  sites,
  emissionFactors,
  fyConfig,
} from "./schema";
import { eq } from "drizzle-orm";

async function seed() {
  const buData = [
    { id: "BU-WATER", name: "Water & Waste Water Infrastructure" },
    { id: "BU-POWER", name: "Power Transmission & Distribution" },
    { id: "BU-HYDRO", name: "Hydrocarbon & Irrigation" },
    { id: "BU-TRANSPORT", name: "Roads, Bridges & Urban Rail" },
    { id: "BU-BUILDINGS", name: "Industrial & Commercial Buildings" },
  ];

  for (const bu of buData) {
    await db
      .insert(businessUnits)
      .values(bu)
      .onConflictDoUpdate({ target: businessUnits.id, set: { name: bu.name } });
  }

  const demoSites = [
    {
      id: "PRJ-304",
      clerkOrgId: "org_demo_prj304",
      name: "Polavaram Bulk Water Project Site",
      buId: "BU-WATER",
      stateCode: "AP",
      active: true,
    },
    {
      id: "PRJ-305",
      clerkOrgId: "org_demo_prj305",
      name: "Ananthapur Green Transmission Grid",
      buId: "BU-POWER",
      stateCode: "AP",
      active: true,
    },
    {
      id: "PRJ-306",
      clerkOrgId: "org_demo_prj306",
      name: "Kaleshwaram Lift Irrigation Site",
      buId: "BU-HYDRO",
      stateCode: "TS",
      active: true,
    },
    {
      id: "PRJ-307",
      clerkOrgId: "org_demo_prj307",
      name: "Hyderabad Metro Phase 2 Works",
      buId: "BU-TRANSPORT",
      stateCode: "TS",
      active: true,
    },
  ];

  for (const s of demoSites) {
    await db
      .insert(sites)
      .values(s)
      .onConflictDoUpdate({
        target: sites.id,
        set: {
          name: s.name,
          buId: s.buId,
          stateCode: s.stateCode,
          active: s.active,
        },
      });
  }

  const factorsData = [
    {
      scope: "SCOPE_1" as const,
      category: "DIESEL",
      unit: "LITRE",
      kgCo2ePerUnit: "2.680000",
      authority: "MoEFCC/BEE",
      version: "2024-v1",
      validFrom: "2024-04-01",
    },
    {
      scope: "SCOPE_1" as const,
      category: "PETROL",
      unit: "LITRE",
      kgCo2ePerUnit: "2.310000",
      authority: "MoEFCC/BEE",
      version: "2024-v1",
      validFrom: "2024-04-01",
    },
    {
      scope: "SCOPE_1" as const,
      category: "CNG",
      unit: "KG",
      kgCo2ePerUnit: "2.750000",
      authority: "MoEFCC/BEE",
      version: "2024-v1",
      validFrom: "2024-04-01",
    },
    {
      scope: "SCOPE_1" as const,
      category: "PNG",
      unit: "SCM",
      kgCo2ePerUnit: "1.890000",
      authority: "MoEFCC/BEE",
      version: "2024-v1",
      validFrom: "2024-04-01",
    },
    {
      scope: "SCOPE_1" as const,
      category: "COAL",
      unit: "TONNE",
      kgCo2ePerUnit: "1800.000000",
      authority: "MoEFCC/BEE",
      version: "2024-v1",
      validFrom: "2024-04-01",
    },
    {
      scope: "SCOPE_1" as const,
      category: "REFRIGERANT_R134A",
      unit: "KG",
      kgCo2ePerUnit: "1430.000000",
      authority: "IPCC AR5 / MoEFCC",
      version: "2024-v1",
      validFrom: "2024-04-01",
    },
    {
      scope: "SCOPE_1" as const,
      category: "REFRIGERANT_R410A",
      unit: "KG",
      kgCo2ePerUnit: "2088.000000",
      authority: "IPCC AR5 / MoEFCC",
      version: "2024-v1",
      validFrom: "2024-04-01",
    },
    {
      scope: "SCOPE_1" as const,
      category: "SF6",
      unit: "KG",
      kgCo2ePerUnit: "22800.000000",
      authority: "IPCC AR5 / MoEFCC",
      version: "2024-v1",
      validFrom: "2024-04-01",
    },
    {
      scope: "SCOPE_2" as const,
      category: "GRID_ELECTRICITY",
      unit: "KWH",
      kgCo2ePerUnit: "0.716000",
      authority: "CEA CO2 Baseline Database v20.0",
      version: "2024-v20",
      validFrom: "2024-04-01",
    },
    {
      scope: "SCOPE_2" as const,
      category: "RENEWABLE_PPA",
      unit: "KWH",
      kgCo2ePerUnit: "0.000000",
      authority: "Supplier Specific / CEA",
      version: "2024-v1",
      validFrom: "2024-04-01",
    },
    {
      scope: "SCOPE_3" as const,
      category: "PURCHASED_STEEL",
      unit: "TONNE",
      kgCo2ePerUnit: "1850.000000",
      authority: "Indian Steel Industry Benchmark / MoS",
      version: "2024-v1",
      validFrom: "2024-04-01",
    },
    {
      scope: "SCOPE_3" as const,
      category: "PURCHASED_CEMENT",
      unit: "TONNE",
      kgCo2ePerUnit: "620.000000",
      authority: "CMA India / BEE",
      version: "2024-v1",
      validFrom: "2024-04-01",
    },
    {
      scope: "SCOPE_3" as const,
      category: "BUSINESS_TRAVEL_AIR",
      unit: "PASSENGER_KM",
      kgCo2ePerUnit: "0.195000",
      authority: "DGCA / ICAO India",
      version: "2024-v1",
      validFrom: "2024-04-01",
    },
    {
      scope: "SCOPE_3" as const,
      category: "BUSINESS_TRAVEL_RAIL",
      unit: "PASSENGER_KM",
      kgCo2ePerUnit: "0.028000",
      authority: "Indian Railways GHG Benchmark",
      version: "2024-v1",
      validFrom: "2024-04-01",
    },
    {
      scope: "SCOPE_3" as const,
      category: "BUSINESS_TRAVEL_BUS",
      unit: "PASSENGER_KM",
      kgCo2ePerUnit: "0.065000",
      authority: "MoRTH India",
      version: "2024-v1",
      validFrom: "2024-04-01",
    },
    {
      scope: "SCOPE_3" as const,
      category: "FREIGHT_ROAD",
      unit: "TONNE_KM",
      kgCo2ePerUnit: "0.095000",
      authority: "MoRTH India Logistics GHG",
      version: "2024-v1",
      validFrom: "2024-04-01",
    },
  ];

  for (const factor of factorsData) {
    const existing = await db
      .select({ id: emissionFactors.id })
      .from(emissionFactors)
      .where(eq(emissionFactors.category, factor.category))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(emissionFactors).values(factor);
    }
  }

  const fyData = [
    {
      financialYear: "2025-2026",
      turnoverInrCr: "28400.00",
      assuranceDone: true,
      assuranceAgency: "KPMG India ESG Advisory",
      lockedAt: new Date("2026-05-15T00:00:00Z"),
    },
    {
      financialYear: "2026-2027",
      turnoverInrCr: "32500.00",
      assuranceDone: false,
      assuranceAgency: null,
      lockedAt: null,
    },
  ];

  for (const fy of fyData) {
    await db
      .insert(fyConfig)
      .values(fy)
      .onConflictDoUpdate({
        target: fyConfig.financialYear,
        set: {
          turnoverInrCr: fy.turnoverInrCr,
          assuranceDone: fy.assuranceDone,
          assuranceAgency: fy.assuranceAgency,
        },
      });
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
