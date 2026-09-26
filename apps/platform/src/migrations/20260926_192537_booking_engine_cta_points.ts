import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_sites_booking_engine" AS ENUM('link', 'clock-pms');
  CREATE TYPE "public"."enum_pages_blocks_cta_variant" AS ENUM('band', 'strip');
  CREATE TYPE "public"."enum_pages_nav_condition" AS ENUM('always', 'offers');
  CREATE TYPE "public"."enum__pages_v_blocks_cta_variant" AS ENUM('band', 'strip');
  CREATE TYPE "public"."enum__pages_v_version_nav_condition" AS ENUM('always', 'offers');
  CREATE TABLE "pages_blocks_cta_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_cta_points_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_cta_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_cta_points_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "sites" ADD COLUMN "booking_engine" "enum_sites_booking_engine" DEFAULT 'link';
  ALTER TABLE "sites" ADD COLUMN "booking_url" varchar;
  ALTER TABLE "pages_blocks_cta" ADD COLUMN "variant" "enum_pages_blocks_cta_variant" DEFAULT 'band';
  ALTER TABLE "pages" ADD COLUMN "nav_condition" "enum_pages_nav_condition" DEFAULT 'always';
  ALTER TABLE "_pages_v_blocks_cta" ADD COLUMN "variant" "enum__pages_v_blocks_cta_variant" DEFAULT 'band';
  ALTER TABLE "_pages_v" ADD COLUMN "version_nav_condition" "enum__pages_v_version_nav_condition" DEFAULT 'always';
  ALTER TABLE "pages_blocks_cta_points" ADD CONSTRAINT "pages_blocks_cta_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_cta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta_points_locales" ADD CONSTRAINT "pages_blocks_cta_points_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_cta_points"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta_points" ADD CONSTRAINT "_pages_v_blocks_cta_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_cta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta_points_locales" ADD CONSTRAINT "_pages_v_blocks_cta_points_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_cta_points"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_cta_points_order_idx" ON "pages_blocks_cta_points" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_points_parent_id_idx" ON "pages_blocks_cta_points" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_cta_points_locales_locale_parent_id_unique" ON "pages_blocks_cta_points_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_points_order_idx" ON "_pages_v_blocks_cta_points" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cta_points_parent_id_idx" ON "_pages_v_blocks_cta_points" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_cta_points_locales_locale_parent_id_unique" ON "_pages_v_blocks_cta_points_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_cta_points" CASCADE;
  DROP TABLE "pages_blocks_cta_points_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_cta_points" CASCADE;
  DROP TABLE "_pages_v_blocks_cta_points_locales" CASCADE;
  ALTER TABLE "sites" DROP COLUMN "booking_engine";
  ALTER TABLE "sites" DROP COLUMN "booking_url";
  ALTER TABLE "pages_blocks_cta" DROP COLUMN "variant";
  ALTER TABLE "pages" DROP COLUMN "nav_condition";
  ALTER TABLE "_pages_v_blocks_cta" DROP COLUMN "variant";
  ALTER TABLE "_pages_v" DROP COLUMN "version_nav_condition";
  DROP TYPE "public"."enum_sites_booking_engine";
  DROP TYPE "public"."enum_pages_blocks_cta_variant";
  DROP TYPE "public"."enum_pages_nav_condition";
  DROP TYPE "public"."enum__pages_v_blocks_cta_variant";
  DROP TYPE "public"."enum__pages_v_version_nav_condition";`)
}
