import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_crawls_status" AS ENUM('queued', 'running', 'done', 'failed');
  CREATE TABLE "crawls" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"site_id" integer NOT NULL,
  	"start_url" varchar NOT NULL,
  	"status" "enum_crawls_status" DEFAULT 'queued' NOT NULL,
  	"max_pages" numeric DEFAULT 40,
  	"pages_crawled" numeric DEFAULT 0,
  	"pages_left" numeric DEFAULT 0,
  	"facts_found" numeric DEFAULT 0,
  	"facts_new" numeric DEFAULT 0,
  	"ai_pass" jsonb,
  	"audit" jsonb,
  	"log" varchar,
  	"started_by" varchar,
  	"finished_at" timestamp(3) with time zone,
  	"state" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "sites" ADD COLUMN "source_url" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "crawls_id" integer;
  ALTER TABLE "crawls" ADD CONSTRAINT "crawls_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "crawls" ADD CONSTRAINT "crawls_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "crawls_tenant_idx" ON "crawls" USING btree ("tenant_id");
  CREATE INDEX "crawls_site_idx" ON "crawls" USING btree ("site_id");
  CREATE INDEX "crawls_status_idx" ON "crawls" USING btree ("status");
  CREATE INDEX "crawls_updated_at_idx" ON "crawls" USING btree ("updated_at");
  CREATE INDEX "crawls_created_at_idx" ON "crawls" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_crawls_fk" FOREIGN KEY ("crawls_id") REFERENCES "public"."crawls"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_crawls_id_idx" ON "payload_locked_documents_rels" USING btree ("crawls_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "crawls" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "crawls" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_crawls_fk";
  
  DROP INDEX "payload_locked_documents_rels_crawls_id_idx";
  ALTER TABLE "sites" DROP COLUMN "source_url";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "crawls_id";
  DROP TYPE "public"."enum_crawls_status";`)
}
