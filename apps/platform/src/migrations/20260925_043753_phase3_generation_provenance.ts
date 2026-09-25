import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_cta_provenance_origin" AS ENUM('generated', 'human', 'locked');
  CREATE TYPE "public"."enum_pages_blocks_contact_provenance_origin" AS ENUM('generated', 'human', 'locked');
  CREATE TYPE "public"."enum_pages_blocks_map_provenance_origin" AS ENUM('generated', 'human', 'locked');
  CREATE TYPE "public"."enum_pages_blocks_rooms_provenance_origin" AS ENUM('generated', 'human', 'locked');
  CREATE TYPE "public"."enum_pages_blocks_offers_provenance_origin" AS ENUM('generated', 'human', 'locked');
  CREATE TYPE "public"."enum_pages_blocks_policies_provenance_origin" AS ENUM('generated', 'human', 'locked');
  CREATE TYPE "public"."enum__pages_v_blocks_cta_provenance_origin" AS ENUM('generated', 'human', 'locked');
  CREATE TYPE "public"."enum__pages_v_blocks_contact_provenance_origin" AS ENUM('generated', 'human', 'locked');
  CREATE TYPE "public"."enum__pages_v_blocks_map_provenance_origin" AS ENUM('generated', 'human', 'locked');
  CREATE TYPE "public"."enum__pages_v_blocks_rooms_provenance_origin" AS ENUM('generated', 'human', 'locked');
  CREATE TYPE "public"."enum__pages_v_blocks_offers_provenance_origin" AS ENUM('generated', 'human', 'locked');
  CREATE TYPE "public"."enum__pages_v_blocks_policies_provenance_origin" AS ENUM('generated', 'human', 'locked');
  ALTER TABLE "pages_blocks_cta" ADD COLUMN "provenance_origin" "enum_pages_blocks_cta_provenance_origin" DEFAULT 'human';
  ALTER TABLE "pages_blocks_cta" ADD COLUMN "provenance_source_fact" varchar;
  ALTER TABLE "pages_blocks_contact" ADD COLUMN "provenance_origin" "enum_pages_blocks_contact_provenance_origin" DEFAULT 'human';
  ALTER TABLE "pages_blocks_contact" ADD COLUMN "provenance_source_fact" varchar;
  ALTER TABLE "pages_blocks_map" ADD COLUMN "provenance_origin" "enum_pages_blocks_map_provenance_origin" DEFAULT 'human';
  ALTER TABLE "pages_blocks_map" ADD COLUMN "provenance_source_fact" varchar;
  ALTER TABLE "pages_blocks_rooms" ADD COLUMN "provenance_origin" "enum_pages_blocks_rooms_provenance_origin" DEFAULT 'human';
  ALTER TABLE "pages_blocks_rooms" ADD COLUMN "provenance_source_fact" varchar;
  ALTER TABLE "pages_blocks_offers" ADD COLUMN "provenance_origin" "enum_pages_blocks_offers_provenance_origin" DEFAULT 'human';
  ALTER TABLE "pages_blocks_offers" ADD COLUMN "provenance_source_fact" varchar;
  ALTER TABLE "pages_blocks_policies" ADD COLUMN "provenance_origin" "enum_pages_blocks_policies_provenance_origin" DEFAULT 'human';
  ALTER TABLE "pages_blocks_policies" ADD COLUMN "provenance_source_fact" varchar;
  ALTER TABLE "_pages_v_blocks_cta" ADD COLUMN "provenance_origin" "enum__pages_v_blocks_cta_provenance_origin" DEFAULT 'human';
  ALTER TABLE "_pages_v_blocks_cta" ADD COLUMN "provenance_source_fact" varchar;
  ALTER TABLE "_pages_v_blocks_contact" ADD COLUMN "provenance_origin" "enum__pages_v_blocks_contact_provenance_origin" DEFAULT 'human';
  ALTER TABLE "_pages_v_blocks_contact" ADD COLUMN "provenance_source_fact" varchar;
  ALTER TABLE "_pages_v_blocks_map" ADD COLUMN "provenance_origin" "enum__pages_v_blocks_map_provenance_origin" DEFAULT 'human';
  ALTER TABLE "_pages_v_blocks_map" ADD COLUMN "provenance_source_fact" varchar;
  ALTER TABLE "_pages_v_blocks_rooms" ADD COLUMN "provenance_origin" "enum__pages_v_blocks_rooms_provenance_origin" DEFAULT 'human';
  ALTER TABLE "_pages_v_blocks_rooms" ADD COLUMN "provenance_source_fact" varchar;
  ALTER TABLE "_pages_v_blocks_offers" ADD COLUMN "provenance_origin" "enum__pages_v_blocks_offers_provenance_origin" DEFAULT 'human';
  ALTER TABLE "_pages_v_blocks_offers" ADD COLUMN "provenance_source_fact" varchar;
  ALTER TABLE "_pages_v_blocks_policies" ADD COLUMN "provenance_origin" "enum__pages_v_blocks_policies_provenance_origin" DEFAULT 'human';
  ALTER TABLE "_pages_v_blocks_policies" ADD COLUMN "provenance_source_fact" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_cta" DROP COLUMN "provenance_origin";
  ALTER TABLE "pages_blocks_cta" DROP COLUMN "provenance_source_fact";
  ALTER TABLE "pages_blocks_contact" DROP COLUMN "provenance_origin";
  ALTER TABLE "pages_blocks_contact" DROP COLUMN "provenance_source_fact";
  ALTER TABLE "pages_blocks_map" DROP COLUMN "provenance_origin";
  ALTER TABLE "pages_blocks_map" DROP COLUMN "provenance_source_fact";
  ALTER TABLE "pages_blocks_rooms" DROP COLUMN "provenance_origin";
  ALTER TABLE "pages_blocks_rooms" DROP COLUMN "provenance_source_fact";
  ALTER TABLE "pages_blocks_offers" DROP COLUMN "provenance_origin";
  ALTER TABLE "pages_blocks_offers" DROP COLUMN "provenance_source_fact";
  ALTER TABLE "pages_blocks_policies" DROP COLUMN "provenance_origin";
  ALTER TABLE "pages_blocks_policies" DROP COLUMN "provenance_source_fact";
  ALTER TABLE "_pages_v_blocks_cta" DROP COLUMN "provenance_origin";
  ALTER TABLE "_pages_v_blocks_cta" DROP COLUMN "provenance_source_fact";
  ALTER TABLE "_pages_v_blocks_contact" DROP COLUMN "provenance_origin";
  ALTER TABLE "_pages_v_blocks_contact" DROP COLUMN "provenance_source_fact";
  ALTER TABLE "_pages_v_blocks_map" DROP COLUMN "provenance_origin";
  ALTER TABLE "_pages_v_blocks_map" DROP COLUMN "provenance_source_fact";
  ALTER TABLE "_pages_v_blocks_rooms" DROP COLUMN "provenance_origin";
  ALTER TABLE "_pages_v_blocks_rooms" DROP COLUMN "provenance_source_fact";
  ALTER TABLE "_pages_v_blocks_offers" DROP COLUMN "provenance_origin";
  ALTER TABLE "_pages_v_blocks_offers" DROP COLUMN "provenance_source_fact";
  ALTER TABLE "_pages_v_blocks_policies" DROP COLUMN "provenance_origin";
  ALTER TABLE "_pages_v_blocks_policies" DROP COLUMN "provenance_source_fact";
  DROP TYPE "public"."enum_pages_blocks_cta_provenance_origin";
  DROP TYPE "public"."enum_pages_blocks_contact_provenance_origin";
  DROP TYPE "public"."enum_pages_blocks_map_provenance_origin";
  DROP TYPE "public"."enum_pages_blocks_rooms_provenance_origin";
  DROP TYPE "public"."enum_pages_blocks_offers_provenance_origin";
  DROP TYPE "public"."enum_pages_blocks_policies_provenance_origin";
  DROP TYPE "public"."enum__pages_v_blocks_cta_provenance_origin";
  DROP TYPE "public"."enum__pages_v_blocks_contact_provenance_origin";
  DROP TYPE "public"."enum__pages_v_blocks_map_provenance_origin";
  DROP TYPE "public"."enum__pages_v_blocks_rooms_provenance_origin";
  DROP TYPE "public"."enum__pages_v_blocks_offers_provenance_origin";
  DROP TYPE "public"."enum__pages_v_blocks_policies_provenance_origin";`)
}
