import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { del, get, patch, post } from "@/lib/api";
import type { Client, ProjectStatus, User } from "@/types/api";

// GET /clients: kèm số dự án, dự án đang chạy, số tài khoản cổng khách hàng
export interface ClientSummary extends Client {
  projectCount: number;
  activeProjectCount: number;
  accountCount: number;
}

export interface ClientProject {
  id: string;
  name: string;
  key: string;
  color: string;
  status: ProjectStatus;
  dueDate: string | null;
  total: number;
  done: number;
}

export interface ClientDetail extends Client {
  projects: ClientProject[];
  accounts: User[];
}

export type ClientInput = {
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
};

export const useClients = () =>
  useQuery({
    queryKey: ["clients"],
    queryFn: () => get<ClientSummary[]>("/clients"),
    staleTime: 60_000,
  });

export const useClient = (id?: string) =>
  useQuery({
    queryKey: ["clients", id],
    queryFn: () => get<ClientDetail>(`/clients/${id}`),
    enabled: !!id,
  });

export function useSaveClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: ClientInput & { id?: string }) =>
      id
        ? patch<ClientDetail>(`/clients/${id}`, data)
        : post<ClientDetail>("/clients", data),
    onSuccess: (c) => {
      qc.setQueryData(["clients", c.id], c);
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del(`/clients/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
