import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_sites_design_channel" AS ENUM('stable', 'canary');
  ALTER TABLE "sites" ADD COLUMN "design_channel" "enum_sites_design_channel" DEFAULT 'stable';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sites" DROP COLUMN "design_channel";
  DROP TYPE "public"."enum_sites_design_channel";`)
}
