import { CreateUsers1790000000000 } from './1790000000000-create-users.js';
import { CoreModules1791089560968 } from './1791089560968-core-modules.js';
import { V2Workspace1791376225451 } from './1791376225451-v2-workspace.js';

// Mỗi migration mới cần được thêm vào danh sách này (theo thứ tự thời gian).
export const migrations = [
  CreateUsers1790000000000,
  CoreModules1791089560968,
  V2Workspace1791376225451,
];
