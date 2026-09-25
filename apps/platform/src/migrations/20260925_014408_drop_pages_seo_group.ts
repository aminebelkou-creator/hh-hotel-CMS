import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_locales" DROP COLUMN "seo_title";
  ALTER TABLE "pages_locales" DROP COLUMN "seo_description";
  ALTER TABLE "_pages_v_locales" DROP COLUMN "version_seo_title";
  ALTER TABLE "_pages_v_locales" DROP COLUMN "version_seo_description";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_locales" ADD COLUMN "seo_title" varchar;
  ALTER TABLE "pages_locales" ADD COLUMN "seo_description" varchar;
  ALTER TABLE "_pages_v_locales" ADD COLUMN "version_seo_title" varchar;
  ALTER TABLE "_pages_v_locales" ADD COLUMN "version_seo_description" varchar;`)
}
