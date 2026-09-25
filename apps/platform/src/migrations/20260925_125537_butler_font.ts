import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_sites_brand_heading_font" ADD VALUE 'butler';
  ALTER TYPE "public"."enum_sites_brand_body_font" ADD VALUE 'butler';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sites" ALTER COLUMN "brand_heading_font" SET DATA TYPE text;
  DROP TYPE "public"."enum_sites_brand_heading_font";
  CREATE TYPE "public"."enum_sites_brand_heading_font" AS ENUM('inter', 'manrope', 'playfair', 'cormorant');
  ALTER TABLE "sites" ALTER COLUMN "brand_heading_font" SET DATA TYPE "public"."enum_sites_brand_heading_font" USING "brand_heading_font"::"public"."enum_sites_brand_heading_font";
  ALTER TABLE "sites" ALTER COLUMN "brand_body_font" SET DATA TYPE text;
  DROP TYPE "public"."enum_sites_brand_body_font";
  CREATE TYPE "public"."enum_sites_brand_body_font" AS ENUM('inter', 'manrope', 'playfair', 'cormorant');
  ALTER TABLE "sites" ALTER COLUMN "brand_body_font" SET DATA TYPE "public"."enum_sites_brand_body_font" USING "brand_body_font"::"public"."enum_sites_brand_body_font";`)
}
