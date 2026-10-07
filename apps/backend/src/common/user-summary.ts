import type { User } from '../modules/users/user.entity.js';

// Thông tin công khai của một người dùng, dùng khi trả kèm trong dữ liệu khác.
export function userSummary(u: User | null | undefined) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatarUrl: u.avatarUrl,
    title: u.title,
  };
}
