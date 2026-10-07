import type { DataSourceOptions } from 'typeorm';

import { entities } from './entities.js';
import { migrations } from './migrations/index.js';

// Dùng chung cho Nest (TypeOrmModule) và CLI migration (data-source.ts).
export function databaseOptions(url: string, ssl = false): DataSourceOptions {
  return {
    type: 'postgres',
    url,
    ssl: ssl ? { rejectUnauthorized: false } : false,
    entities,
    migrations,
    synchronize: false,
    // gen_random_uuid() có sẵn từ Postgres 13, không cần extension uuid-ossp
    uuidExtension: 'pgcrypto',
  };
}
