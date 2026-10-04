import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  date,
  timestamp,
  bigint,
  boolean,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const scopeEnum = pgEnum("scope", ["SCOPE_1", "SCOPE_2", "SCOPE_3"]);

export const statusEnum = pgEnum("entry_status", [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "LOCKED",
]);

export const auditEnum = pgEnum("audit_status", [
  "NONE",
  "VERIFIED",
  "FLAGGED",
]);

export const businessUnits = pgTable("business_units", {
  id: varchar("id", { length: 40 }).primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
});

export const sites = pgTable("sites", {
  id: varchar("id", { length: 40 }).primaryKey(),
  clerkOrgId: varchar("clerk_org_id", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  buId: varchar("bu_id", { length: 40 })
    .notNull()
    .references(() => businessUnits.id),
  stateCode: varchar("state_code", { length: 5 }).notNull(),
  active: boolean("active").notNull().default(true),
});

export const emissionFactors = pgTable("emission_factors", {
  id: uuid("id").primaryKey().defaultRandom(),
  scope: scopeEnum("scope").notNull(),
  category: varchar("category", { length: 60 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  kgCo2ePerUnit: numeric("kg_co2e_per_unit", {
    precision: 14,
    scale: 6,
  }).notNull(),
  authority: varchar("authority", { length: 120 }).notNull(),
  version: varchar("version", { length: 40 }).notNull(),
  validFrom: date("valid_from").notNull(),
  validTo: date("valid_to"),
});

export const emissionEntries = pgTable(
  "emission_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: varchar("site_id", { length: 40 })
      .notNull()
      .references(() => sites.id),
    financialYear: varchar("financial_year", { length: 9 }).notNull(),
    entryDate: date("entry_date").notNull(),
    scope: scopeEnum("scope").notNull(),
    category: varchar("category", { length: 60 }).notNull(),
    sourceName: varchar("source_name", { length: 150 }).notNull(),
    quantity: numeric("quantity", { precision: 14, scale: 3 }).notNull(),
    unit: varchar("unit", { length: 20 }).notNull(),
    factorId: uuid("factor_id")
      .notNull()
      .references(() => emissionFactors.id),
    factorValue: numeric("factor_value", { precision: 14, scale: 6 }).notNull(),
    tco2e: numeric("tco2e", { precision: 16, scale: 6 }).notNull(),
    status: statusEnum("status").notNull().default("DRAFT"),
    rejectReason: text("reject_reason"),
    auditStatus: auditEnum("audit_status").notNull().default("NONE"),
    auditComment: text("audit_comment"),
    createdBy: varchar("created_by", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("entries_site_fy_idx").on(table.siteId, table.financialYear),
    index("entries_status_idx").on(table.status),
  ],
);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => emissionEntries.id, { onDelete: "restrict" }),
    siteId: varchar("site_id", { length: 40 }).notNull(),
    storageKey: varchar("storage_key", { length: 500 }).notNull(),
    originalName: varchar("original_name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    sha256: varchar("sha256", { length: 64 }).notNull(),
    docType: varchar("doc_type", { length: 40 }).notNull(),
    invoiceNumber: varchar("invoice_number", { length: 100 }),
    invoiceDate: date("invoice_date"),
    uploadedBy: varchar("uploaded_by", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("doc_hash_site_idx").on(table.siteId, table.sha256)],
);

export const fyConfig = pgTable("fy_config", {
  financialYear: varchar("financial_year", { length: 9 }).primaryKey(),
  turnoverInrCr: numeric("turnover_inr_cr", { precision: 14, scale: 2 }),
  assuranceDone: boolean("assurance_done").notNull().default(false),
  assuranceAgency: varchar("assurance_agency", { length: 100 }),
  lockedAt: timestamp("locked_at", { withTimezone: true }),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  entryId: uuid("entry_id"),
  action: varchar("action", { length: 40 }).notNull(),
  actorClerkId: varchar("actor_clerk_id", { length: 64 }).notNull(),
  detail: text("detail"),
  at: timestamp("at", { withTimezone: true }).defaultNow().notNull(),
});
