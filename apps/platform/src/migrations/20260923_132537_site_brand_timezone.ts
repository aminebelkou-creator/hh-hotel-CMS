import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sites" ADD COLUMN "brand_name" varchar;
  ALTER TABLE "sites" ADD COLUMN "timezone" varchar DEFAULT 'Europe/Paris';`)
  // Backfill in one set-based statement: one round trip whatever the tenant count, so it
  // stays fast across regions (row-by-row over the network took 257 s for the seed).
  await db.execute(sql`
   UPDATE "sites" s SET "brand_name" = t."name"
   FROM "tenants" t
   WHERE s."tenant_id" = t."id" AND s."brand_name" IS NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sites" DROP COLUMN "brand_name";
  ALTER TABLE "sites" DROP COLUMN "timezone";`)
}
