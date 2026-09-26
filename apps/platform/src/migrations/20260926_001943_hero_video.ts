import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_hero" ADD COLUMN "video_url" varchar;
  ALTER TABLE "pages_blocks_hero" ADD COLUMN "video_mobile_url" varchar;
  ALTER TABLE "_pages_v_blocks_hero" ADD COLUMN "video_url" varchar;
  ALTER TABLE "_pages_v_blocks_hero" ADD COLUMN "video_mobile_url" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_hero" DROP COLUMN "video_url";
  ALTER TABLE "pages_blocks_hero" DROP COLUMN "video_mobile_url";
  ALTER TABLE "_pages_v_blocks_hero" DROP COLUMN "video_url";
  ALTER TABLE "_pages_v_blocks_hero" DROP COLUMN "video_mobile_url";`)
}
