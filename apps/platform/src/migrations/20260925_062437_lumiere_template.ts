import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_sites_template" ADD VALUE 'lumiere';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sites" ALTER COLUMN "template" SET DATA TYPE text;
  ALTER TABLE "sites" ALTER COLUMN "template" SET DEFAULT 'maison'::text;
  DROP TYPE "public"."enum_sites_template";
  CREATE TYPE "public"."enum_sites_template" AS ENUM('maison', 'atelier', 'soiree');
  ALTER TABLE "sites" ALTER COLUMN "template" SET DEFAULT 'maison'::"public"."enum_sites_template";
  ALTER TABLE "sites" ALTER COLUMN "template" SET DATA TYPE "public"."enum_sites_template" USING "template"::"public"."enum_sites_template";`)
}
