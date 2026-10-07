import { TaskPriority, TaskStatus } from './task.entity.js';

export const STATUS_LABEL: Record<TaskStatus, string> = {
  [TaskStatus.Todo]: 'Cần làm',
  [TaskStatus.InProgress]: 'Đang làm',
  [TaskStatus.Review]: 'Chờ duyệt',
  [TaskStatus.Done]: 'Hoàn thành',
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  [TaskPriority.Low]: 'Thấp',
  [TaskPriority.Medium]: 'Trung bình',
  [TaskPriority.High]: 'Cao',
  [TaskPriority.Urgent]: 'Khẩn cấp',
};
