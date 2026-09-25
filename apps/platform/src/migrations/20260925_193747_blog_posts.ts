import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_news_layout" AS ENUM('latest', 'list');
  CREATE TYPE "public"."enum_pages_blocks_news_provenance_origin" AS ENUM('generated', 'human', 'locked');
  CREATE TYPE "public"."enum__pages_v_blocks_news_layout" AS ENUM('latest', 'list');
  CREATE TYPE "public"."enum__pages_v_blocks_news_provenance_origin" AS ENUM('generated', 'human', 'locked');
  CREATE TYPE "public"."enum_posts_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_posts_provenance_origin" AS ENUM('generated', 'human', 'locked');
  CREATE TABLE "pages_blocks_news" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"layout" "enum_pages_blocks_news_layout" DEFAULT 'latest',
  	"limit" numeric DEFAULT 3,
  	"link_href" varchar,
  	"provenance_origin" "enum_pages_blocks_news_provenance_origin" DEFAULT 'human',
  	"provenance_source_fact" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_news_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_news" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"layout" "enum__pages_v_blocks_news_layout" DEFAULT 'latest',
  	"limit" numeric DEFAULT 3,
  	"link_href" varchar,
  	"provenance_origin" "enum__pages_v_blocks_news_provenance_origin" DEFAULT 'human',
  	"provenance_source_fact" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_news_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"slug" varchar NOT NULL,
  	"site_id" integer NOT NULL,
  	"status" "enum_posts_status" DEFAULT 'draft' NOT NULL,
  	"published_at" timestamp(3) with time zone NOT NULL,
  	"image_id" integer,
  	"image_url" varchar,
  	"provenance_origin" "enum_posts_provenance_origin" DEFAULT 'human',
  	"provenance_source_fact" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "posts_locales" (
  	"title" varchar NOT NULL,
  	"excerpt" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"image_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "posts_id" integer;
  ALTER TABLE "pages_blocks_news" ADD CONSTRAINT "pages_blocks_news_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_news_locales" ADD CONSTRAINT "pages_blocks_news_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_news" ADD CONSTRAINT "_pages_v_blocks_news_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_news_locales" ADD CONSTRAINT "_pages_v_blocks_news_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_locales" ADD CONSTRAINT "posts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_news_order_idx" ON "pages_blocks_news" USING btree ("_order");
  CREATE INDEX "pages_blocks_news_parent_id_idx" ON "pages_blocks_news" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_news_path_idx" ON "pages_blocks_news" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_news_locales_locale_parent_id_unique" ON "pages_blocks_news_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_news_order_idx" ON "_pages_v_blocks_news" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_news_parent_id_idx" ON "_pages_v_blocks_news" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_news_path_idx" ON "_pages_v_blocks_news" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_news_locales_locale_parent_id_unique" ON "_pages_v_blocks_news_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "posts_tenant_idx" ON "posts" USING btree ("tenant_id");
  CREATE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");
  CREATE INDEX "posts_site_idx" ON "posts" USING btree ("site_id");
  CREATE INDEX "posts_image_idx" ON "posts" USING btree ("image_id");
  CREATE INDEX "posts_updated_at_idx" ON "posts" USING btree ("updated_at");
  CREATE INDEX "posts_created_at_idx" ON "posts" USING btree ("created_at");
  CREATE UNIQUE INDEX "posts_locales_locale_parent_id_unique" ON "posts_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("posts_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_news" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_news_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_news" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_news_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "posts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "posts_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_news" CASCADE;
  DROP TABLE "pages_blocks_news_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_news" CASCADE;
  DROP TABLE "_pages_v_blocks_news_locales" CASCADE;
  DROP TABLE "posts" CASCADE;
  DROP TABLE "posts_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_posts_fk";
  
  DROP INDEX "payload_locked_documents_rels_posts_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "posts_id";
  DROP TYPE "public"."enum_pages_blocks_news_layout";
  DROP TYPE "public"."enum_pages_blocks_news_provenance_origin";
  DROP TYPE "public"."enum__pages_v_blocks_news_layout";
  DROP TYPE "public"."enum__pages_v_blocks_news_provenance_origin";
  DROP TYPE "public"."enum_posts_status";
  DROP TYPE "public"."enum_posts_provenance_origin";`)
}
