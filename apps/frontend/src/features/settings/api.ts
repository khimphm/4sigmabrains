import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { get, patch } from '@/lib/api'
import type { WorkspaceSettings } from '@/types/api'

// Cấu hình chung: thông tin công ty, nhãn công việc (có màu), giờ làm việc
export const useSettings = () =>
  useQuery({ queryKey: ['settings'], queryFn: () => get<WorkspaceSettings>('/settings'), staleTime: 5 * 60_000 })

// Tra màu nhãn theo tên (không có thì trả undefined)
export function useLabelColor() {
  const { data } = useSettings()
  const map = new Map((data?.taskLabels ?? []).map((l) => [l.name.toLowerCase(), l.color]))
  return (name: string) => map.get(name.toLowerCase())
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<WorkspaceSettings>) => patch<WorkspaceSettings>('/settings', data),
    onSuccess: (s) => qc.setQueryData(['settings'], s),
  })
}
