import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLeadStore } from '@/stores/lead'
import { api } from '@/api'

vi.mock('@/api', () => ({
  api: {
    getPublicLeads: vi.fn(),
    getPersonalLeads: vi.fn(),
    claimLead: vi.fn(),
    followLead: vi.fn(),
    getFollowUps: vi.fn(),
    submitLead: vi.fn(),
  },
}))

describe('leadStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with default state', () => {
    const store = useLeadStore()
    expect(store.publicLeads).toEqual([])
    expect(store.personalLeads).toEqual([])
    expect(store.followUps).toEqual([])
    expect(store.publicStats).toEqual({ available: 0, today: 0, recovery: 0 })
    expect(store.personalStats).toEqual({ pending: 0, contacted: 0, negotiating: 0, converted: 0, abandoned: 0 })
  })

  it('fetchPublicLeads sets leads and stats', async () => {
    const mockLeads = [{ id: 1, name: 'Lead 1' }]
    const mockStats = { available: 5, today: 2, recovery: 1 }
    vi.mocked(api.getPublicLeads).mockResolvedValue({ leads: mockLeads, stats: mockStats })

    const store = useLeadStore()
    await store.fetchPublicLeads()

    expect(store.publicLeads).toEqual(mockLeads)
    expect(store.publicStats).toEqual(mockStats)
  })

  it('fetchPersonalLeads sets leads and stats', async () => {
    const mockLeads = [{ id: 2, name: 'My Lead' }]
    const mockStats = { pending: 3, contacted: 1, negotiating: 0, converted: 0, abandoned: 0 }
    vi.mocked(api.getPersonalLeads).mockResolvedValue({ leads: mockLeads, stats: mockStats })

    const store = useLeadStore()
    await store.fetchPersonalLeads({ status: 'pending' })

    expect(store.personalLeads).toEqual(mockLeads)
    expect(store.personalStats).toEqual(mockStats)
    expect(api.getPersonalLeads).toHaveBeenCalledWith({ status: 'pending' })
  })

  it('claimLead delegates to api', async () => {
    vi.mocked(api.claimLead).mockResolvedValue({})

    const store = useLeadStore()
    await store.claimLead(42)

    expect(api.claimLead).toHaveBeenCalledWith(42)
  })

  it('followUp delegates to api', async () => {
    const data = { note: 'Followed up' }
    vi.mocked(api.followLead).mockResolvedValue({})

    const store = useLeadStore()
    await store.followUp(1, data)

    expect(api.followLead).toHaveBeenCalledWith(1, data)
  })

  it('fetchFollowUps sets followUps from response', async () => {
    const mockFollowUps = [{ id: 1, note: 'Call 1' }]
    vi.mocked(api.getFollowUps).mockResolvedValue({ followUps: mockFollowUps })

    const store = useLeadStore()
    await store.fetchFollowUps(1)

    expect(store.followUps).toEqual(mockFollowUps)
  })

  it('submitLead delegates to api', async () => {
    const data = { name: 'New', phone: '12345' }
    vi.mocked(api.submitLead).mockResolvedValue({})

    const store = useLeadStore()
    await store.submitLead(data)

    expect(api.submitLead).toHaveBeenCalledWith(data)
  })
})
