import * as migration_20260923_120049_baseline from './20260923_120049_baseline';
import * as migration_20260923_132537_site_brand_timezone from './20260923_132537_site_brand_timezone';
import * as migration_20260923_142013_add_jobs from './20260923_142013_add_jobs';
import * as migration_20260923_165351_facts_booking_releases from './20260923_165351_facts_booking_releases';

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
    name: '20260923_165351_facts_booking_releases'
  },
];
