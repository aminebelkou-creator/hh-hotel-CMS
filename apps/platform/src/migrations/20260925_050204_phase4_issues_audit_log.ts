import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_issues_kind" AS ENUM('broken-link', 'missing-alt', 'missing-meta', 'stale-content', 'expired-offer', 'missing-fact', 'uptime', 'performance', 'accessibility', 'unanswered');
  CREATE TYPE "public"."enum_issues_severity" AS ENUM('info', 'warning', 'error');
  CREATE TYPE "public"."enum_issues_status" AS ENUM('open', 'applied', 'resolved', 'dismissed');
  CREATE TYPE "public"."enum_audit_log_operation" AS ENUM('create', 'update', 'delete');
  CREATE TABLE "issues" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"site_id" integer NOT NULL,
  	"kind" "enum_issues_kind" NOT NULL,
  	"severity" "enum_issues_severity" DEFAULT 'warning' NOT NULL,
  	"title" varchar NOT NULL,
  	"detail" varchar,
  	"url" varchar,
  	"status" "enum_issues_status" DEFAULT 'open' NOT NULL,
  	"fingerprint" varchar NOT NULL,
  	"fix_label" varchar,
  	"fix" jsonb,
  	"source" varchar,
  	"detected_at" timestamp(3) with time zone,
  	"resolved_at" timestamp(3) with time zone,
  	"applied_by" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "audit_log" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"collection_slug" varchar NOT NULL,
  	"doc_id" varchar NOT NULL,
  	"operation" "enum_audit_log_operation" NOT NULL,
  	"actor" varchar NOT NULL,
  	"summary" varchar NOT NULL,
  	"changed" jsonb,
  	"context" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "issues_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "audit_log_id" integer;
  ALTER TABLE "issues" ADD CONSTRAINT "issues_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "issues" ADD CONSTRAINT "issues_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "issues_tenant_idx" ON "issues" USING btree ("tenant_id");
  CREATE INDEX "issues_site_idx" ON "issues" USING btree ("site_id");
  CREATE INDEX "issues_kind_idx" ON "issues" USING btree ("kind");
  CREATE INDEX "issues_status_idx" ON "issues" USING btree ("status");
  CREATE INDEX "issues_fingerprint_idx" ON "issues" USING btree ("fingerprint");
  CREATE INDEX "issues_updated_at_idx" ON "issues" USING btree ("updated_at");
  CREATE INDEX "issues_created_at_idx" ON "issues" USING btree ("created_at");
  CREATE INDEX "audit_log_tenant_idx" ON "audit_log" USING btree ("tenant_id");
  CREATE INDEX "audit_log_collection_slug_idx" ON "audit_log" USING btree ("collection_slug");
  CREATE INDEX "audit_log_doc_id_idx" ON "audit_log" USING btree ("doc_id");
  CREATE INDEX "audit_log_updated_at_idx" ON "audit_log" USING btree ("updated_at");
  CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_issues_fk" FOREIGN KEY ("issues_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_log_fk" FOREIGN KEY ("audit_log_id") REFERENCES "public"."audit_log"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_issues_id_idx" ON "payload_locked_documents_rels" USING btree ("issues_id");
  CREATE INDEX "payload_locked_documents_rels_audit_log_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_log_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "issues" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "audit_log" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "issues" CASCADE;
  DROP TABLE "audit_log" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_issues_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_audit_log_fk";
  
  DROP INDEX "payload_locked_documents_rels_issues_id_idx";
  DROP INDEX "payload_locked_documents_rels_audit_log_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "issues_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "audit_log_id";
  DROP TYPE "public"."enum_issues_kind";
  DROP TYPE "public"."enum_issues_severity";
  DROP TYPE "public"."enum_issues_status";
  DROP TYPE "public"."enum_audit_log_operation";`)
}
