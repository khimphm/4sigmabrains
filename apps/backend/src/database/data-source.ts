import { DataSource } from 'typeorm';

import { databaseOptions } from './database.options.js';

// Dùng cho CLI: npm run migration:run / migration:generate
export default new DataSource(
  databaseOptions(
    process.env.DATABASE_URL ?? '',
    process.env.DATABASE_SSL === 'true',
  ),
);
