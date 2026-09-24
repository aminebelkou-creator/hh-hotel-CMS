import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sites" DROP COLUMN "booking_engine";
  ALTER TABLE "sites" DROP COLUMN "booking_property_code";
  ALTER TABLE "sites" DROP COLUMN "booking_currency";
  DROP TYPE "public"."enum_sites_booking_engine";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_sites_booking_engine" AS ENUM('none', 'clockpms-be-mock');
  ALTER TABLE "sites" ADD COLUMN "booking_engine" "enum_sites_booking_engine" DEFAULT 'none';
  ALTER TABLE "sites" ADD COLUMN "booking_property_code" varchar;
  ALTER TABLE "sites" ADD COLUMN "booking_currency" varchar DEFAULT 'EUR';`)
}
