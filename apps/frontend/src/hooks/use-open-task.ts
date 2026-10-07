import { useNavigate } from 'react-router-dom'

import type { Task } from '@/types/api'

// Mở trang chi tiết công việc (Figma 04)
export function useOpenTask() {
  const navigate = useNavigate()
  return (task: Pick<Task, 'id'>) => navigate(`/tasks/${task.id}`)
}
