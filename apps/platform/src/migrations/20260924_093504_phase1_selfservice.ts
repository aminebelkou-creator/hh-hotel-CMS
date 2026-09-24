import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_text_provenance_origin" AS ENUM('generated', 'human', 'locked');
  CREATE TYPE "public"."enum_pages_blocks_faq_provenance_origin" AS ENUM('generated', 'human', 'locked');
  CREATE TYPE "public"."enum__pages_v_blocks_text_provenance_origin" AS ENUM('generated', 'human', 'locked');
  CREATE TYPE "public"."enum__pages_v_blocks_faq_provenance_origin" AS ENUM('generated', 'human', 'locked');
  CREATE TABLE "pages_blocks_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"provenance_origin" "enum_pages_blocks_text_provenance_origin" DEFAULT 'human',
  	"provenance_source_fact" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_text_locales" (
  	"heading" varchar,
  	"body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_faq_items_locales" (
  	"question" varchar,
  	"answer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"provenance_origin" "enum_pages_blocks_faq_provenance_origin" DEFAULT 'human',
  	"provenance_source_fact" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_faq_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_offers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"limit" numeric,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_offers_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_policies_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_policies_items_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_policies" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"show_times" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_policies_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"provenance_origin" "enum__pages_v_blocks_text_provenance_origin" DEFAULT 'human',
  	"provenance_source_fact" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_text_locales" (
  	"heading" varchar,
  	"body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_faq_items_locales" (
  	"question" varchar,
  	"answer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"provenance_origin" "enum__pages_v_blocks_faq_provenance_origin" DEFAULT 'human',
  	"provenance_source_fact" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_faq_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_offers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"limit" numeric,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_offers_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_policies_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_policies_items_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_policies" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"show_times" boolean DEFAULT true,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_policies_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "offers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"slug" varchar NOT NULL,
  	"active" boolean DEFAULT true,
  	"order" numeric DEFAULT 0,
  	"valid_from" timestamp(3) with time zone,
  	"valid_to" timestamp(3) with time zone,
  	"image_url" varchar,
  	"cta_href" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "offers_locales" (
  	"title" varchar NOT NULL,
  	"highlight" varchar,
  	"summary" varchar NOT NULL,
  	"conditions" varchar,
  	"image_alt" varchar,
  	"cta_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "pages" ADD COLUMN "show_in_footer" boolean DEFAULT false;
  ALTER TABLE "_pages_v" ADD COLUMN "version_show_in_footer" boolean DEFAULT false;
  ALTER TABLE "media" ADD COLUMN "source_url" varchar;
  ALTER TABLE "media" ADD COLUMN "_objectkey" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "offers_id" integer;
  ALTER TABLE "pages_blocks_text" ADD CONSTRAINT "pages_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_text_locales" ADD CONSTRAINT "pages_blocks_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq_items" ADD CONSTRAINT "pages_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq_items_locales" ADD CONSTRAINT "pages_blocks_faq_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_faq_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq" ADD CONSTRAINT "pages_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq_locales" ADD CONSTRAINT "pages_blocks_faq_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_offers" ADD CONSTRAINT "pages_blocks_offers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_offers_locales" ADD CONSTRAINT "pages_blocks_offers_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_offers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_policies_items" ADD CONSTRAINT "pages_blocks_policies_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_policies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_policies_items_locales" ADD CONSTRAINT "pages_blocks_policies_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_policies_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_policies" ADD CONSTRAINT "pages_blocks_policies_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_policies_locales" ADD CONSTRAINT "pages_blocks_policies_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_policies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_text" ADD CONSTRAINT "_pages_v_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_text_locales" ADD CONSTRAINT "_pages_v_blocks_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq_items" ADD CONSTRAINT "_pages_v_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq_items_locales" ADD CONSTRAINT "_pages_v_blocks_faq_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_faq_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq" ADD CONSTRAINT "_pages_v_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq_locales" ADD CONSTRAINT "_pages_v_blocks_faq_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_offers" ADD CONSTRAINT "_pages_v_blocks_offers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_offers_locales" ADD CONSTRAINT "_pages_v_blocks_offers_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_offers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_policies_items" ADD CONSTRAINT "_pages_v_blocks_policies_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_policies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_policies_items_locales" ADD CONSTRAINT "_pages_v_blocks_policies_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_policies_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_policies" ADD CONSTRAINT "_pages_v_blocks_policies_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_policies_locales" ADD CONSTRAINT "_pages_v_blocks_policies_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_policies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "offers" ADD CONSTRAINT "offers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "offers_locales" ADD CONSTRAINT "offers_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."offers"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_text_order_idx" ON "pages_blocks_text" USING btree ("_order");
  CREATE INDEX "pages_blocks_text_parent_id_idx" ON "pages_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_text_path_idx" ON "pages_blocks_text" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_text_locales_locale_parent_id_unique" ON "pages_blocks_text_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_faq_items_order_idx" ON "pages_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_items_parent_id_idx" ON "pages_blocks_faq_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_faq_items_locales_locale_parent_id_unique" ON "pages_blocks_faq_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_faq_order_idx" ON "pages_blocks_faq" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_parent_id_idx" ON "pages_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_path_idx" ON "pages_blocks_faq" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_faq_locales_locale_parent_id_unique" ON "pages_blocks_faq_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_offers_order_idx" ON "pages_blocks_offers" USING btree ("_order");
  CREATE INDEX "pages_blocks_offers_parent_id_idx" ON "pages_blocks_offers" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_offers_path_idx" ON "pages_blocks_offers" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_offers_locales_locale_parent_id_unique" ON "pages_blocks_offers_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_policies_items_order_idx" ON "pages_blocks_policies_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_policies_items_parent_id_idx" ON "pages_blocks_policies_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_policies_items_locales_locale_parent_id_unique" ON "pages_blocks_policies_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_policies_order_idx" ON "pages_blocks_policies" USING btree ("_order");
  CREATE INDEX "pages_blocks_policies_parent_id_idx" ON "pages_blocks_policies" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_policies_path_idx" ON "pages_blocks_policies" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_policies_locales_locale_parent_id_unique" ON "pages_blocks_policies_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_text_order_idx" ON "_pages_v_blocks_text" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_text_parent_id_idx" ON "_pages_v_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_text_path_idx" ON "_pages_v_blocks_text" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_text_locales_locale_parent_id_unique" ON "_pages_v_blocks_text_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_items_order_idx" ON "_pages_v_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_items_parent_id_idx" ON "_pages_v_blocks_faq_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_faq_items_locales_locale_parent_id_unique" ON "_pages_v_blocks_faq_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_order_idx" ON "_pages_v_blocks_faq" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_parent_id_idx" ON "_pages_v_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_path_idx" ON "_pages_v_blocks_faq" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_faq_locales_locale_parent_id_unique" ON "_pages_v_blocks_faq_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_offers_order_idx" ON "_pages_v_blocks_offers" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_offers_parent_id_idx" ON "_pages_v_blocks_offers" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_offers_path_idx" ON "_pages_v_blocks_offers" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_offers_locales_locale_parent_id_unique" ON "_pages_v_blocks_offers_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_policies_items_order_idx" ON "_pages_v_blocks_policies_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_policies_items_parent_id_idx" ON "_pages_v_blocks_policies_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_policies_items_locales_locale_parent_id_uniq" ON "_pages_v_blocks_policies_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_policies_order_idx" ON "_pages_v_blocks_policies" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_policies_parent_id_idx" ON "_pages_v_blocks_policies" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_policies_path_idx" ON "_pages_v_blocks_policies" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_policies_locales_locale_parent_id_unique" ON "_pages_v_blocks_policies_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "offers_tenant_idx" ON "offers" USING btree ("tenant_id");
  CREATE INDEX "offers_slug_idx" ON "offers" USING btree ("slug");
  CREATE INDEX "offers_updated_at_idx" ON "offers" USING btree ("updated_at");
  CREATE INDEX "offers_created_at_idx" ON "offers" USING btree ("created_at");
  CREATE UNIQUE INDEX "offers_locales_locale_parent_id_unique" ON "offers_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_offers_fk" FOREIGN KEY ("offers_id") REFERENCES "public"."offers"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "media_source_url_idx" ON "media" USING btree ("source_url");
  CREATE INDEX "payload_locked_documents_rels_offers_id_idx" ON "payload_locked_documents_rels" USING btree ("offers_id");`)
  // Media storage v0 (src/media/postgres-storage.ts): not a Payload collection, so not generated.
  await db.execute(sql`
  CREATE TABLE IF NOT EXISTS "media_blobs" (
    "key" text PRIMARY KEY,
    "mime" text NOT NULL,
    "bytes" bytea NOT NULL,
    "size" integer,
    "created_at" timestamptz DEFAULT now()
  );`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_text_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_faq_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_faq_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_faq_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_offers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_offers_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_policies_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_policies_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_policies" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_policies_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_text_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_faq_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_faq_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_faq_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_offers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_offers_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_policies_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_policies_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_policies" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_policies_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "offers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "offers_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_text" CASCADE;
  DROP TABLE "pages_blocks_text_locales" CASCADE;
  DROP TABLE "pages_blocks_faq_items" CASCADE;
  DROP TABLE "pages_blocks_faq_items_locales" CASCADE;
  DROP TABLE "pages_blocks_faq" CASCADE;
  DROP TABLE "pages_blocks_faq_locales" CASCADE;
  DROP TABLE "pages_blocks_offers" CASCADE;
  DROP TABLE "pages_blocks_offers_locales" CASCADE;
  DROP TABLE "pages_blocks_policies_items" CASCADE;
  DROP TABLE "pages_blocks_policies_items_locales" CASCADE;
  DROP TABLE "pages_blocks_policies" CASCADE;
  DROP TABLE "pages_blocks_policies_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_text" CASCADE;
  DROP TABLE "_pages_v_blocks_text_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_faq_items" CASCADE;
  DROP TABLE "_pages_v_blocks_faq_items_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_faq" CASCADE;
  DROP TABLE "_pages_v_blocks_faq_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_offers" CASCADE;
  DROP TABLE "_pages_v_blocks_offers_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_policies_items" CASCADE;
  DROP TABLE "_pages_v_blocks_policies_items_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_policies" CASCADE;
  DROP TABLE "_pages_v_blocks_policies_locales" CASCADE;
  DROP TABLE "offers" CASCADE;
  DROP TABLE "offers_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_offers_fk";
  
  DROP INDEX "media_source_url_idx";
  DROP INDEX "payload_locked_documents_rels_offers_id_idx";
  ALTER TABLE "pages" DROP COLUMN "show_in_footer";
  ALTER TABLE "_pages_v" DROP COLUMN "version_show_in_footer";
  ALTER TABLE "media" DROP COLUMN "source_url";
  ALTER TABLE "media" DROP COLUMN "_objectkey";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "offers_id";
  DROP TYPE "public"."enum_pages_blocks_text_provenance_origin";
  DROP TYPE "public"."enum_pages_blocks_faq_provenance_origin";
  DROP TYPE "public"."enum__pages_v_blocks_text_provenance_origin";
  DROP TYPE "public"."enum__pages_v_blocks_faq_provenance_origin";`)
  await db.execute(sql`DROP TABLE IF EXISTS "media_blobs";`)
}
