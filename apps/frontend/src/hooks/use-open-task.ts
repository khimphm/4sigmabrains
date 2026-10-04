import { useSearchParams } from 'react-router-dom'

import type { Task } from '@/types/api'

// Mở ngăn chi tiết công việc bằng cách thêm ?task=<id> vào URL hiện tại
export function useOpenTask() {
  const [, setParams] = useSearchParams()
  return (task: Pick<Task, 'id'>) =>
    setParams((p) => {
      const next = new URLSearchParams(p)
      next.set('task', task.id)
      return next
    })
}
