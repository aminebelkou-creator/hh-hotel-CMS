import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_sites_template" AS ENUM('maison', 'atelier', 'soiree');
  CREATE TYPE "public"."enum_sites_brand_heading_font" AS ENUM('inter', 'manrope', 'playfair', 'cormorant');
  CREATE TYPE "public"."enum_sites_brand_body_font" AS ENUM('inter', 'manrope', 'playfair', 'cormorant');
  CREATE TYPE "public"."enum_sites_brand_corners" AS ENUM('square', 'soft', 'round');
  ALTER TABLE "sites" ADD COLUMN "template" "enum_sites_template" DEFAULT 'maison';
  ALTER TABLE "sites" ADD COLUMN "brand_accent" varchar;
  ALTER TABLE "sites" ADD COLUMN "brand_background" varchar;
  ALTER TABLE "sites" ADD COLUMN "brand_text" varchar;
  ALTER TABLE "sites" ADD COLUMN "brand_heading_font" "enum_sites_brand_heading_font";
  ALTER TABLE "sites" ADD COLUMN "brand_body_font" "enum_sites_brand_body_font";
  ALTER TABLE "sites" ADD COLUMN "brand_corners" "enum_sites_brand_corners";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sites" DROP COLUMN "template";
  ALTER TABLE "sites" DROP COLUMN "brand_accent";
  ALTER TABLE "sites" DROP COLUMN "brand_background";
  ALTER TABLE "sites" DROP COLUMN "brand_text";
  ALTER TABLE "sites" DROP COLUMN "brand_heading_font";
  ALTER TABLE "sites" DROP COLUMN "brand_body_font";
  ALTER TABLE "sites" DROP COLUMN "brand_corners";
  DROP TYPE "public"."enum_sites_template";
  DROP TYPE "public"."enum_sites_brand_heading_font";
  DROP TYPE "public"."enum_sites_brand_body_font";
  DROP TYPE "public"."enum_sites_brand_corners";`)
}
