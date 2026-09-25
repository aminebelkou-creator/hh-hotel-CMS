import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_hero_rating" AS ENUM('none', 'classification');
  CREATE TYPE "public"."enum_pages_blocks_features_items_icon" AS ENUM('clock', 'phone', 'coffee', 'tablet', 'wifi', 'paw', 'bed', 'user', 'key', 'car', 'lift', 'leaf', 'star', 'pin', 'sun', 'shield', 'sparkle', 'utensils', 'bath', 'snowflake');
  CREATE TYPE "public"."enum_pages_blocks_banners_provenance_origin" AS ENUM('generated', 'human', 'locked');
  CREATE TYPE "public"."enum_pages_blocks_media_band_provenance_origin" AS ENUM('generated', 'human', 'locked');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_rating" AS ENUM('none', 'classification');
  CREATE TYPE "public"."enum__pages_v_blocks_features_items_icon" AS ENUM('clock', 'phone', 'coffee', 'tablet', 'wifi', 'paw', 'bed', 'user', 'key', 'car', 'lift', 'leaf', 'star', 'pin', 'sun', 'shield', 'sparkle', 'utensils', 'bath', 'snowflake');
  CREATE TYPE "public"."enum__pages_v_blocks_banners_provenance_origin" AS ENUM('generated', 'human', 'locked');
  CREATE TYPE "public"."enum__pages_v_blocks_media_band_provenance_origin" AS ENUM('generated', 'human', 'locked');
  CREATE TABLE "pages_blocks_text_image_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_text_image_points_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_banners_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_url" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "pages_blocks_banners_items_locales" (
  	"image_alt" varchar,
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_banners" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"provenance_origin" "enum_pages_blocks_banners_provenance_origin" DEFAULT 'human',
  	"provenance_source_fact" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_banners_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_media_band" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_url" varchar,
  	"provenance_origin" "enum_pages_blocks_media_band_provenance_origin" DEFAULT 'human',
  	"provenance_source_fact" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_media_band_locales" (
  	"image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_text_image_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_text_image_points_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_banners_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_url" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_banners_items_locales" (
  	"image_alt" varchar,
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_banners" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"provenance_origin" "enum__pages_v_blocks_banners_provenance_origin" DEFAULT 'human',
  	"provenance_source_fact" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_banners_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_media_band" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_url" varchar,
  	"provenance_origin" "enum__pages_v_blocks_media_band_provenance_origin" DEFAULT 'human',
  	"provenance_source_fact" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_media_band_locales" (
  	"image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "pages_blocks_hero" ADD COLUMN "rating" "enum_pages_blocks_hero_rating" DEFAULT 'none';
  ALTER TABLE "pages_blocks_hero" ADD COLUMN "booking_bar" boolean DEFAULT false;
  ALTER TABLE "pages_blocks_features_items" ADD COLUMN "icon" "enum_pages_blocks_features_items_icon";
  ALTER TABLE "pages_blocks_rooms" ADD COLUMN "link_href" varchar;
  ALTER TABLE "pages_blocks_rooms_locales" ADD COLUMN "link_label" varchar;
  ALTER TABLE "_pages_v_blocks_hero" ADD COLUMN "rating" "enum__pages_v_blocks_hero_rating" DEFAULT 'none';
  ALTER TABLE "_pages_v_blocks_hero" ADD COLUMN "booking_bar" boolean DEFAULT false;
  ALTER TABLE "_pages_v_blocks_features_items" ADD COLUMN "icon" "enum__pages_v_blocks_features_items_icon";
  ALTER TABLE "_pages_v_blocks_rooms" ADD COLUMN "link_href" varchar;
  ALTER TABLE "_pages_v_blocks_rooms_locales" ADD COLUMN "link_label" varchar;
  ALTER TABLE "pages_blocks_text_image_points" ADD CONSTRAINT "pages_blocks_text_image_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_text_image"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_text_image_points_locales" ADD CONSTRAINT "pages_blocks_text_image_points_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_text_image_points"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_banners_items" ADD CONSTRAINT "pages_blocks_banners_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_banners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_banners_items_locales" ADD CONSTRAINT "pages_blocks_banners_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_banners_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_banners" ADD CONSTRAINT "pages_blocks_banners_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_banners_locales" ADD CONSTRAINT "pages_blocks_banners_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_banners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_media_band" ADD CONSTRAINT "pages_blocks_media_band_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_media_band_locales" ADD CONSTRAINT "pages_blocks_media_band_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_media_band"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_text_image_points" ADD CONSTRAINT "_pages_v_blocks_text_image_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_text_image"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_text_image_points_locales" ADD CONSTRAINT "_pages_v_blocks_text_image_points_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_text_image_points"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_banners_items" ADD CONSTRAINT "_pages_v_blocks_banners_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_banners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_banners_items_locales" ADD CONSTRAINT "_pages_v_blocks_banners_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_banners_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_banners" ADD CONSTRAINT "_pages_v_blocks_banners_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_banners_locales" ADD CONSTRAINT "_pages_v_blocks_banners_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_banners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_media_band" ADD CONSTRAINT "_pages_v_blocks_media_band_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_media_band_locales" ADD CONSTRAINT "_pages_v_blocks_media_band_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_media_band"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_text_image_points_order_idx" ON "pages_blocks_text_image_points" USING btree ("_order");
  CREATE INDEX "pages_blocks_text_image_points_parent_id_idx" ON "pages_blocks_text_image_points" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_text_image_points_locales_locale_parent_id_uniq" ON "pages_blocks_text_image_points_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_banners_items_order_idx" ON "pages_blocks_banners_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_banners_items_parent_id_idx" ON "pages_blocks_banners_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_banners_items_locales_locale_parent_id_unique" ON "pages_blocks_banners_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_banners_order_idx" ON "pages_blocks_banners" USING btree ("_order");
  CREATE INDEX "pages_blocks_banners_parent_id_idx" ON "pages_blocks_banners" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_banners_path_idx" ON "pages_blocks_banners" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_banners_locales_locale_parent_id_unique" ON "pages_blocks_banners_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_media_band_order_idx" ON "pages_blocks_media_band" USING btree ("_order");
  CREATE INDEX "pages_blocks_media_band_parent_id_idx" ON "pages_blocks_media_band" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_media_band_path_idx" ON "pages_blocks_media_band" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_media_band_locales_locale_parent_id_unique" ON "pages_blocks_media_band_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_text_image_points_order_idx" ON "_pages_v_blocks_text_image_points" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_text_image_points_parent_id_idx" ON "_pages_v_blocks_text_image_points" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_text_image_points_locales_locale_parent_id_u" ON "_pages_v_blocks_text_image_points_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_banners_items_order_idx" ON "_pages_v_blocks_banners_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_banners_items_parent_id_idx" ON "_pages_v_blocks_banners_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_banners_items_locales_locale_parent_id_uniqu" ON "_pages_v_blocks_banners_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_banners_order_idx" ON "_pages_v_blocks_banners" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_banners_parent_id_idx" ON "_pages_v_blocks_banners" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_banners_path_idx" ON "_pages_v_blocks_banners" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_banners_locales_locale_parent_id_unique" ON "_pages_v_blocks_banners_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_media_band_order_idx" ON "_pages_v_blocks_media_band" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_media_band_parent_id_idx" ON "_pages_v_blocks_media_band" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_media_band_path_idx" ON "_pages_v_blocks_media_band" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_media_band_locales_locale_parent_id_unique" ON "_pages_v_blocks_media_band_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_text_image_points" CASCADE;
  DROP TABLE "pages_blocks_text_image_points_locales" CASCADE;
  DROP TABLE "pages_blocks_banners_items" CASCADE;
  DROP TABLE "pages_blocks_banners_items_locales" CASCADE;
  DROP TABLE "pages_blocks_banners" CASCADE;
  DROP TABLE "pages_blocks_banners_locales" CASCADE;
  DROP TABLE "pages_blocks_media_band" CASCADE;
  DROP TABLE "pages_blocks_media_band_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_text_image_points" CASCADE;
  DROP TABLE "_pages_v_blocks_text_image_points_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_banners_items" CASCADE;
  DROP TABLE "_pages_v_blocks_banners_items_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_banners" CASCADE;
  DROP TABLE "_pages_v_blocks_banners_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_media_band" CASCADE;
  DROP TABLE "_pages_v_blocks_media_band_locales" CASCADE;
  ALTER TABLE "pages_blocks_hero" DROP COLUMN "rating";
  ALTER TABLE "pages_blocks_hero" DROP COLUMN "booking_bar";
  ALTER TABLE "pages_blocks_features_items" DROP COLUMN "icon";
  ALTER TABLE "pages_blocks_rooms" DROP COLUMN "link_href";
  ALTER TABLE "pages_blocks_rooms_locales" DROP COLUMN "link_label";
  ALTER TABLE "_pages_v_blocks_hero" DROP COLUMN "rating";
  ALTER TABLE "_pages_v_blocks_hero" DROP COLUMN "booking_bar";
  ALTER TABLE "_pages_v_blocks_features_items" DROP COLUMN "icon";
  ALTER TABLE "_pages_v_blocks_rooms" DROP COLUMN "link_href";
  ALTER TABLE "_pages_v_blocks_rooms_locales" DROP COLUMN "link_label";
  DROP TYPE "public"."enum_pages_blocks_hero_rating";
  DROP TYPE "public"."enum_pages_blocks_features_items_icon";
  DROP TYPE "public"."enum_pages_blocks_banners_provenance_origin";
  DROP TYPE "public"."enum_pages_blocks_media_band_provenance_origin";
  DROP TYPE "public"."enum__pages_v_blocks_hero_rating";
  DROP TYPE "public"."enum__pages_v_blocks_features_items_icon";
  DROP TYPE "public"."enum__pages_v_blocks_banners_provenance_origin";
  DROP TYPE "public"."enum__pages_v_blocks_media_band_provenance_origin";`)
}
