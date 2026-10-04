import type { DataSourceOptions } from 'typeorm';

import { User } from '../users/user.entity.js';
import { CreateUsers1790000000000 } from './migrations/1790000000000-create-users.js';

// Dùng chung cho Nest (TypeOrmModule) và CLI migration (data-source.ts).
// Mỗi migration mới cần được thêm vào danh sách bên dưới.
export function databaseOptions(url: string): DataSourceOptions {
  return {
    type: 'postgres',
    url,
    entities: [User],
    migrations: [CreateUsers1790000000000],
    synchronize: false,
  };
}
