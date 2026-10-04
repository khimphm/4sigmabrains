// Gọi API backend. Cookie phiên đăng nhập (httpOnly) được gửi kèm tự động.
export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) throw new ApiError(res.status, await res.text())
  return (res.status === 204 ? undefined : await res.json()) as T
}
