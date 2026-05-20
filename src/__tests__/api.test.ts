import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { api } from '@/api'

describe('api', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  function mockFetchResponse(data: unknown) {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () => Promise.resolve(data),
    })
  }

  it('getMe calls /api/auth/me', async () => {
    mockFetchResponse({ user: { id: 1, name: 'Test' } })
    const res = await api.getMe()
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/auth/me', expect.objectContaining({
      headers: { 'Content-Type': 'application/json' },
    }))
    expect(res.user?.name).toBe('Test')
  })

  it('login sends POST with name', async () => {
    mockFetchResponse({ user: { id: 1, name: 'Alice' } })
    const res = await api.login('Alice')
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }))
    expect(res.user?.name).toBe('Alice')
  })

  it('login serializes body as JSON', async () => {
    mockFetchResponse({})
    await api.login('Bob')
    const callArgs = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    const body = JSON.parse(callArgs[1].body)
    expect(body).toEqual({ name: 'Bob' })
  })

  it('updateRole sends PUT with role', async () => {
    mockFetchResponse({ user: { role: 'admin' } })
    await api.updateRole('admin')
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/auth/role', expect.objectContaining({
      method: 'PUT',
    }))
  })

  it('logout sends POST to /api/auth/logout', async () => {
    mockFetchResponse({})
    await api.logout()
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({
      method: 'POST',
    }))
  })

  it('getEvents appends query string params', async () => {
    mockFetchResponse({ events: [] })
    await api.getEvents({ status: 'active', page: '1' })
    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(calledUrl).toContain('status=active')
    expect(calledUrl).toContain('page=1')
  })

  it('getEvents omits query string when no params', async () => {
    mockFetchResponse({ events: [] })
    await api.getEvents()
    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(calledUrl).toBe('/api/events')
  })

  it('getEvent calls /api/events/:id', async () => {
    mockFetchResponse({ event: { id: 5 } })
    await api.getEvent(5)
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/events/5', expect.any(Object))
  })

  it('createEvent sends POST with body', async () => {
    mockFetchResponse({ event: { id: 1 } })
    const data = { title: 'New Event', date: '2025-01-01' }
    await api.createEvent(data)
    const callArgs = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(callArgs[0]).toBe('/api/events')
    expect(callArgs[1].method).toBe('POST')
    expect(JSON.parse(callArgs[1].body)).toEqual(data)
  })

  it('updateEvent sends PUT with body', async () => {
    mockFetchResponse({ event: { id: 1, title: 'Updated' } })
    await api.updateEvent(1, { title: 'Updated' })
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/events/1', expect.objectContaining({
      method: 'PUT',
    }))
  })

  it('deleteEvent sends DELETE', async () => {
    mockFetchResponse({})
    await api.deleteEvent(99)
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/events/99', expect.objectContaining({
      method: 'DELETE',
    }))
  })

  it('getPublicLeads calls /api/leads/public', async () => {
    mockFetchResponse({ leads: [] })
    await api.getPublicLeads()
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/leads/public', expect.any(Object))
  })

  it('getPersonalLeads appends query string params', async () => {
    mockFetchResponse({ leads: [] })
    await api.getPersonalLeads({ status: 'pending' })
    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(calledUrl).toContain('status=pending')
  })

  it('claimLead sends POST', async () => {
    mockFetchResponse({})
    await api.claimLead(10)
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/leads/10/claim', expect.objectContaining({
      method: 'POST',
    }))
  })

  it('followLead sends POST with body', async () => {
    mockFetchResponse({})
    const data = { note: 'Called client' }
    await api.followLead(10, data)
    const callArgs = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(callArgs[0]).toBe('/api/leads/10/follow')
    expect(callArgs[1].method).toBe('POST')
    expect(JSON.parse(callArgs[1].body)).toEqual(data)
  })

  it('getFollowUps calls /api/leads/:id/follow-ups', async () => {
    mockFetchResponse({ followUps: [] })
    await api.getFollowUps(3)
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/leads/3/follow-ups', expect.any(Object))
  })

  it('submitLead sends POST with body', async () => {
    mockFetchResponse({})
    const data = { name: 'John', phone: '123' }
    await api.submitLead(data)
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/leads/submit', expect.objectContaining({
      method: 'POST',
    }))
  })

  it('getContacts appends query string params', async () => {
    mockFetchResponse({ contacts: [] })
    await api.getContacts({ q: 'test' })
    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(calledUrl).toContain('q=test')
  })

  it('getSettings calls /api/settings', async () => {
    mockFetchResponse({ settings: { recovery_days: 7 } })
    const res = await api.getSettings()
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/settings', expect.any(Object))
    expect(res.settings?.recovery_days).toBe(7)
  })

  it('updateRecovery sends PUT with recovery_days', async () => {
    mockFetchResponse({ settings: { recovery_days: 14 } })
    await api.updateRecovery(14)
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/settings/recovery', expect.objectContaining({
      method: 'PUT',
    }))
  })
})
