import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_sites_booking_engine" AS ENUM('none', 'clockpms-be-mock');
  CREATE TYPE "public"."enum_facts_status" AS ENUM('unconfirmed', 'confirmed', 'rejected');
  CREATE TYPE "public"."enum_facts_method" AS ENUM('structured-data', 'meta', 'link', 'text', 'keyword', 'heading', 'pms', 'manual', 'agent');
  ALTER TYPE "public"."enum_releases_status" ADD VALUE 'failed';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'publishSite';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'publishSite';
  CREATE TABLE "facts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"key" varchar NOT NULL,
  	"value" varchar NOT NULL,
  	"site_id" integer,
  	"status" "enum_facts_status" DEFAULT 'unconfirmed' NOT NULL,
  	"confidence" numeric,
  	"method" "enum_facts_method",
  	"source" varchar,
  	"occurrences" numeric DEFAULT 1,
  	"evidence" jsonb,
  	"decision_note" varchar,
  	"decided_by_id" integer,
  	"decided_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  DROP INDEX "sites_slug_idx";
  ALTER TABLE "sites" ADD COLUMN "booking_engine" "enum_sites_booking_engine" DEFAULT 'none';
  ALTER TABLE "sites" ADD COLUMN "booking_property_code" varchar;
  ALTER TABLE "sites" ADD COLUMN "booking_currency" varchar DEFAULT 'EUR';
  ALTER TABLE "sites" ADD COLUMN "current_release_id" integer;
  ALTER TABLE "sites" ADD COLUMN "publish_request_seq" numeric DEFAULT 0;
  ALTER TABLE "sites" ADD COLUMN "publish_locked_until" timestamp(3) with time zone;
  ALTER TABLE "sites" ADD COLUMN "publish_locked_by" varchar;
  ALTER TABLE "releases" ADD COLUMN "request_seq" numeric;
  ALTER TABLE "releases" ADD COLUMN "published_by" varchar;
  ALTER TABLE "releases" ADD COLUMN "checksum" varchar;
  ALTER TABLE "releases" ADD COLUMN "page_count" numeric;
  ALTER TABLE "releases" ADD COLUMN "duration_ms" numeric;
  ALTER TABLE "releases" ADD COLUMN "verified_at" timestamp(3) with time zone;
  ALTER TABLE "releases" ADD COLUMN "error" varchar;
  ALTER TABLE "releases" ADD COLUMN "snapshot" jsonb;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "facts_find" boolean DEFAULT false;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "facts_create" boolean DEFAULT false;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "facts_id" integer;
  ALTER TABLE "facts" ADD CONSTRAINT "facts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "facts" ADD CONSTRAINT "facts_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "facts" ADD CONSTRAINT "facts_decided_by_id_users_id_fk" FOREIGN KEY ("decided_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "facts_tenant_idx" ON "facts" USING btree ("tenant_id");
  CREATE INDEX "facts_key_idx" ON "facts" USING btree ("key");
  CREATE INDEX "facts_site_idx" ON "facts" USING btree ("site_id");
  CREATE INDEX "facts_status_idx" ON "facts" USING btree ("status");
  CREATE INDEX "facts_decided_by_idx" ON "facts" USING btree ("decided_by_id");
  CREATE INDEX "facts_updated_at_idx" ON "facts" USING btree ("updated_at");
  CREATE INDEX "facts_created_at_idx" ON "facts" USING btree ("created_at");
  ALTER TABLE "sites" ADD CONSTRAINT "sites_current_release_id_releases_id_fk" FOREIGN KEY ("current_release_id") REFERENCES "public"."releases"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_facts_fk" FOREIGN KEY ("facts_id") REFERENCES "public"."facts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "sites_current_release_idx" ON "sites" USING btree ("current_release_id");
  CREATE INDEX "payload_locked_documents_rels_facts_id_idx" ON "payload_locked_documents_rels" USING btree ("facts_id");
  CREATE UNIQUE INDEX "sites_slug_idx" ON "sites" USING btree ("slug");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "facts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "facts" CASCADE;
  ALTER TABLE "sites" DROP CONSTRAINT "sites_current_release_id_releases_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_facts_fk";
  
  ALTER TABLE "releases" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "releases" ALTER COLUMN "status" SET DEFAULT 'built'::text;
  DROP TYPE "public"."enum_releases_status";
  CREATE TYPE "public"."enum_releases_status" AS ENUM('built', 'live', 'superseded', 'rolled-back');
  ALTER TABLE "releases" ALTER COLUMN "status" SET DEFAULT 'built'::"public"."enum_releases_status";
  ALTER TABLE "releases" ALTER COLUMN "status" SET DATA TYPE "public"."enum_releases_status" USING "status"::"public"."enum_releases_status";
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'touchPageSeo');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'touchPageSeo');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  DROP INDEX "sites_current_release_idx";
  DROP INDEX "payload_locked_documents_rels_facts_id_idx";
  DROP INDEX "sites_slug_idx";
  CREATE INDEX "sites_slug_idx" ON "sites" USING btree ("slug");
  ALTER TABLE "sites" DROP COLUMN "booking_engine";
  ALTER TABLE "sites" DROP COLUMN "booking_property_code";
  ALTER TABLE "sites" DROP COLUMN "booking_currency";
  ALTER TABLE "sites" DROP COLUMN "current_release_id";
  ALTER TABLE "sites" DROP COLUMN "publish_request_seq";
  ALTER TABLE "sites" DROP COLUMN "publish_locked_until";
  ALTER TABLE "sites" DROP COLUMN "publish_locked_by";
  ALTER TABLE "releases" DROP COLUMN "request_seq";
  ALTER TABLE "releases" DROP COLUMN "published_by";
  ALTER TABLE "releases" DROP COLUMN "checksum";
  ALTER TABLE "releases" DROP COLUMN "page_count";
  ALTER TABLE "releases" DROP COLUMN "duration_ms";
  ALTER TABLE "releases" DROP COLUMN "verified_at";
  ALTER TABLE "releases" DROP COLUMN "error";
  ALTER TABLE "releases" DROP COLUMN "snapshot";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "facts_find";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "facts_create";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "facts_id";
  DROP TYPE "public"."enum_sites_booking_engine";
  DROP TYPE "public"."enum_facts_status";
  DROP TYPE "public"."enum_facts_method";`)
}
