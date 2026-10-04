// Gọi API backend. Cookie phiên đăng nhập (httpOnly) được gửi kèm tự động.
export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function parseError(res: Response) {
  try {
    const body = await res.json()
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message
    return new ApiError(res.status, message ?? res.statusText)
  } catch {
    return new ApiError(res.status, res.statusText)
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const isForm = init?.body instanceof FormData
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    ...init,
    headers: isForm ? init?.headers : { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) throw await parseError(res)
  return (res.status === 204 ? undefined : await res.json()) as T
}

export const get = <T>(path: string) => api<T>(path)
export const post = <T>(path: string, body?: unknown) =>
  api<T>(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body ?? {}) })
export const patch = <T>(path: string, body: unknown) => api<T>(path, { method: 'PATCH', body: JSON.stringify(body) })
export const del = (path: string) => api<void>(path, { method: 'DELETE' })

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Đã có lỗi xảy ra')
