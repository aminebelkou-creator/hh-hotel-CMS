import * as migration_20260923_120049_baseline from './20260923_120049_baseline';
import * as migration_20260923_132537_site_brand_timezone from './20260923_132537_site_brand_timezone';
import * as migration_20260923_142013_add_jobs from './20260923_142013_add_jobs';
import * as migration_20260923_165351_facts_booking_releases from './20260923_165351_facts_booking_releases';
import * as migration_20260924_012331_hotel_site_content from './20260924_012331_hotel_site_content';
import * as migration_20260924_012402_drop_booking_mock_settings from './20260924_012402_drop_booking_mock_settings';
import * as migration_20260924_093504_phase1_selfservice from './20260924_093504_phase1_selfservice';
import * as migration_20260924_222418_site_templates from './20260924_222418_site_templates';
import * as migration_20260925_014324_plugins_seo_redirects_forms from './20260925_014324_plugins_seo_redirects_forms';
import * as migration_20260925_014408_drop_pages_seo_group from './20260925_014408_drop_pages_seo_group';
import * as migration_20260925_043231_phase3_ingest from './20260925_043231_phase3_ingest';
import * as migration_20260925_043753_phase3_generation_provenance from './20260925_043753_phase3_generation_provenance';
import * as migration_20260925_044352_phase3_brand_proposal from './20260925_044352_phase3_brand_proposal';
import * as migration_20260925_050204_phase4_issues_audit_log from './20260925_050204_phase4_issues_audit_log';
import * as migration_20260925_050923_phase5_design_channel from './20260925_050923_phase5_design_channel';

export const migrations = [
  {
    up: migration_20260923_120049_baseline.up,
    down: migration_20260923_120049_baseline.down,
    name: '20260923_120049_baseline',
  },
  {
    up: migration_20260923_132537_site_brand_timezone.up,
    down: migration_20260923_132537_site_brand_timezone.down,
    name: '20260923_132537_site_brand_timezone',
  },
  {
    up: migration_20260923_142013_add_jobs.up,
    down: migration_20260923_142013_add_jobs.down,
    name: '20260923_142013_add_jobs',
  },
  {
    up: migration_20260923_165351_facts_booking_releases.up,
    down: migration_20260923_165351_facts_booking_releases.down,
    name: '20260923_165351_facts_booking_releases',
  },
  {
    up: migration_20260924_012331_hotel_site_content.up,
    down: migration_20260924_012331_hotel_site_content.down,
    name: '20260924_012331_hotel_site_content',
  },
  {
    up: migration_20260924_012402_drop_booking_mock_settings.up,
    down: migration_20260924_012402_drop_booking_mock_settings.down,
    name: '20260924_012402_drop_booking_mock_settings',
  },
  {
    up: migration_20260924_093504_phase1_selfservice.up,
    down: migration_20260924_093504_phase1_selfservice.down,
    name: '20260924_093504_phase1_selfservice',
  },
  {
    up: migration_20260924_222418_site_templates.up,
    down: migration_20260924_222418_site_templates.down,
    name: '20260924_222418_site_templates',
  },
  {
    up: migration_20260925_014324_plugins_seo_redirects_forms.up,
    down: migration_20260925_014324_plugins_seo_redirects_forms.down,
    name: '20260925_014324_plugins_seo_redirects_forms',
  },
  {
    up: migration_20260925_014408_drop_pages_seo_group.up,
    down: migration_20260925_014408_drop_pages_seo_group.down,
    name: '20260925_014408_drop_pages_seo_group',
  },
  {
    up: migration_20260925_043231_phase3_ingest.up,
    down: migration_20260925_043231_phase3_ingest.down,
    name: '20260925_043231_phase3_ingest',
  },
  {
    up: migration_20260925_043753_phase3_generation_provenance.up,
    down: migration_20260925_043753_phase3_generation_provenance.down,
    name: '20260925_043753_phase3_generation_provenance',
  },
  {
    up: migration_20260925_044352_phase3_brand_proposal.up,
    down: migration_20260925_044352_phase3_brand_proposal.down,
    name: '20260925_044352_phase3_brand_proposal',
  },
  {
    up: migration_20260925_050204_phase4_issues_audit_log.up,
    down: migration_20260925_050204_phase4_issues_audit_log.down,
    name: '20260925_050204_phase4_issues_audit_log',
  },
  {
    up: migration_20260925_050923_phase5_design_channel.up,
    down: migration_20260925_050923_phase5_design_channel.down,
    name: '20260925_050923_phase5_design_channel'
  },
];
