import * as migration_20260923_120049_baseline from './20260923_120049_baseline';
import * as migration_20260923_132537_site_brand_timezone from './20260923_132537_site_brand_timezone';

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
];
