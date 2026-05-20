const BASE = '/api'

interface RequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
}

interface ApiResponse {
  user?: any
  events?: any[]
  event?: any
  leads?: any[]
  stats?: any
  followUps?: any[]
  contacts?: any[]
  settings?: any
  qrCode?: string
  [key: string]: unknown
}

async function request<T = ApiResponse>(url: string, options: RequestOptions = {}): Promise<T> {
  const res = await fetch(BASE + url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  return res.json()
}

export const api = {
  // Auth
  getMe: () => request<ApiResponse>('/auth/me'),
  login: (name: string) => request<ApiResponse>('/auth/login', { method: 'POST', body: { name } }),
  updateRole: (role: string) => request<ApiResponse>('/auth/role', { method: 'PUT', body: { role } }),
  logout: () => request<ApiResponse>('/auth/logout', { method: 'POST' }),

  // Events
  getEvents: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request<ApiResponse>(`/events${qs ? '?' + qs : ''}`)
  },
  getEvent: (id: number | string) => request<ApiResponse>(`/events/${id}`),
  createEvent: (data: any) => request<ApiResponse>('/events', { method: 'POST', body: data }),
  updateEvent: (id: number | string, data: any) => request<ApiResponse>(`/events/${id}`, { method: 'PUT', body: data }),
  deleteEvent: (id: number | string) => request<ApiResponse>(`/events/${id}`, { method: 'DELETE' }),
  getEventQR: (id: number | string) => request<ApiResponse>(`/events/${id}/qrcode`),

  // Leads
  getPublicLeads: () => request<ApiResponse>('/leads/public'),
  getPersonalLeads: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request<ApiResponse>(`/leads/personal${qs ? '?' + qs : ''}`)
  },
  claimLead: (id: number | string) => request<ApiResponse>(`/leads/${id}/claim`, { method: 'POST' }),
  followLead: (id: number | string, data: any) => request<ApiResponse>(`/leads/${id}/follow`, { method: 'POST', body: data }),
  getFollowUps: (id: number | string) => request<ApiResponse>(`/leads/${id}/follow-ups`),
  submitLead: (data: any) => request<ApiResponse>('/leads/submit', { method: 'POST', body: data }),

  // Contacts
  getContacts: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request<ApiResponse>(`/contacts${qs ? '?' + qs : ''}`)
  },

  // Settings
  getSettings: () => request<ApiResponse>('/settings'),
  updateRecovery: (days: number) => request<ApiResponse>('/settings/recovery', { method: 'PUT', body: { recovery_days: days } }),
}
