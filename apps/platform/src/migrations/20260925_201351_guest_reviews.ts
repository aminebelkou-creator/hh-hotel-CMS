import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_reviews_provenance_origin" AS ENUM('generated', 'human', 'locked');
  CREATE TYPE "public"."enum__pages_v_blocks_reviews_provenance_origin" AS ENUM('generated', 'human', 'locked');
  CREATE TYPE "public"."enum_reviews_language" AS ENUM('fr', 'en', 'de', 'es', 'it', 'nl', 'pt', 'other');
  CREATE TYPE "public"."enum_reviews_source" AS ENUM('google', 'booking', 'tripadvisor', 'expedia', 'direct', 'other');
  CREATE TYPE "public"."enum_reviews_status" AS ENUM('draft', 'published');
  CREATE TABLE "pages_blocks_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"limit" numeric DEFAULT 6,
  	"provenance_origin" "enum_pages_blocks_reviews_provenance_origin" DEFAULT 'human',
  	"provenance_source_fact" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_reviews_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"limit" numeric DEFAULT 6,
  	"provenance_origin" "enum__pages_v_blocks_reviews_provenance_origin" DEFAULT 'human',
  	"provenance_source_fact" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_reviews_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "reviews" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"text" varchar NOT NULL,
  	"language" "enum_reviews_language" DEFAULT 'fr' NOT NULL,
  	"author" varchar NOT NULL,
  	"origin" varchar,
  	"source" "enum_reviews_source" DEFAULT 'google' NOT NULL,
  	"source_url" varchar,
  	"rating" numeric,
  	"rating_scale" numeric DEFAULT 5,
  	"visited_at" timestamp(3) with time zone,
  	"site_id" integer NOT NULL,
  	"status" "enum_reviews_status" DEFAULT 'draft' NOT NULL,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "reviews_id" integer;
  ALTER TABLE "pages_blocks_reviews" ADD CONSTRAINT "pages_blocks_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_reviews_locales" ADD CONSTRAINT "pages_blocks_reviews_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_reviews" ADD CONSTRAINT "_pages_v_blocks_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_reviews_locales" ADD CONSTRAINT "_pages_v_blocks_reviews_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_blocks_reviews_order_idx" ON "pages_blocks_reviews" USING btree ("_order");
  CREATE INDEX "pages_blocks_reviews_parent_id_idx" ON "pages_blocks_reviews" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_reviews_path_idx" ON "pages_blocks_reviews" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_reviews_locales_locale_parent_id_unique" ON "pages_blocks_reviews_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_reviews_order_idx" ON "_pages_v_blocks_reviews" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_reviews_parent_id_idx" ON "_pages_v_blocks_reviews" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_reviews_path_idx" ON "_pages_v_blocks_reviews" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_reviews_locales_locale_parent_id_unique" ON "_pages_v_blocks_reviews_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "reviews_tenant_idx" ON "reviews" USING btree ("tenant_id");
  CREATE INDEX "reviews_site_idx" ON "reviews" USING btree ("site_id");
  CREATE INDEX "reviews_updated_at_idx" ON "reviews" USING btree ("updated_at");
  CREATE INDEX "reviews_created_at_idx" ON "reviews" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_reviews_id_idx" ON "payload_locked_documents_rels" USING btree ("reviews_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_reviews_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_reviews_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reviews" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_reviews" CASCADE;
  DROP TABLE "pages_blocks_reviews_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_reviews" CASCADE;
  DROP TABLE "_pages_v_blocks_reviews_locales" CASCADE;
  DROP TABLE "reviews" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_reviews_fk";
  
  DROP INDEX "payload_locked_documents_rels_reviews_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "reviews_id";
  DROP TYPE "public"."enum_pages_blocks_reviews_provenance_origin";
  DROP TYPE "public"."enum__pages_v_blocks_reviews_provenance_origin";
  DROP TYPE "public"."enum_reviews_language";
  DROP TYPE "public"."enum_reviews_source";
  DROP TYPE "public"."enum_reviews_status";`)
}
