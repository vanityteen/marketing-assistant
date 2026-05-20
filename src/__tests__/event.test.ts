import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEventStore } from '@/stores/event'
import { api } from '@/api'

vi.mock('@/api', () => ({
  api: {
    getEvents: vi.fn(),
    getEvent: vi.fn(),
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
    deleteEvent: vi.fn(),
    getEventQR: vi.fn(),
  },
}))

describe('eventStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const store = useEventStore()
    expect(store.events).toEqual([])
    expect(store.currentEvent).toBeNull()
    expect(store.loading).toBe(false)
  })

  it('fetchEvents sets events from api response', async () => {
    const mockEvents = [{ id: 1, title: 'Event 1' }]
    vi.mocked(api.getEvents).mockResolvedValue({ events: mockEvents })

    const store = useEventStore()
    const res = await store.fetchEvents()

    expect(store.events).toEqual(mockEvents)
    expect(store.loading).toBe(false)
    expect(res).toEqual({ events: mockEvents })
  })

  it('fetchEvents has loading false after completion', async () => {
    vi.mocked(api.getEvents).mockResolvedValue({ events: [] })

    const store = useEventStore()
    await store.fetchEvents()

    expect(store.loading).toBe(false)
  })

  it('fetchEvent sets currentEvent', async () => {
    const mockEvent = { id: 42, title: 'Test Event' }
    vi.mocked(api.getEvent).mockResolvedValue({ event: mockEvent })

    const store = useEventStore()
    await store.fetchEvent(42)

    expect(store.currentEvent).toEqual(mockEvent)
    expect(store.loading).toBe(false)
  })

  it('createEvent calls api and returns result', async () => {
    const newEvent = { title: 'New Event', date: '2025-06-01' }
    vi.mocked(api.createEvent).mockResolvedValue({ event: { id: 3, ...newEvent } })

    const store = useEventStore()
    const res = await store.createEvent(newEvent)

    expect(api.createEvent).toHaveBeenCalledWith(newEvent)
    expect(res.event).toBeDefined()
  })

  it('updateEvent updates currentEvent if IDs match', async () => {
    const updatedEvent = { id: 1, title: 'Updated', date: '2025-06-01' }
    vi.mocked(api.updateEvent).mockResolvedValue({ event: updatedEvent })

    const store = useEventStore()
    store.currentEvent = { id: 1, title: 'Original' }
    await store.updateEvent(1, { title: 'Updated' })

    expect(store.currentEvent?.title).toBe('Updated')
  })

  it('updateEvent does not update currentEvent if IDs differ', async () => {
    vi.mocked(api.updateEvent).mockResolvedValue({ event: { id: 2, title: 'Other' } })

    const store = useEventStore()
    store.currentEvent = { id: 1, title: 'Original' }
    await store.updateEvent(2, { title: 'Other' })

    expect(store.currentEvent?.title).toBe('Original')
  })

  it('deleteEvent removes event from list', async () => {
    vi.mocked(api.deleteEvent).mockResolvedValue({})

    const store = useEventStore()
    store.events = [
      { id: 1, title: 'A' },
      { id: 2, title: 'B' },
      { id: 3, title: 'C' },
    ]
    await store.deleteEvent(2)

    expect(store.events.map(e => e.id)).toEqual([1, 3])
  })

  it('getEventQR delegates to api', async () => {
    const qrData = { qrCode: 'data:image/png;base64,...' }
    vi.mocked(api.getEventQR).mockResolvedValue(qrData)

    const store = useEventStore()
    const res = await store.getEventQR(1)

    expect(api.getEventQR).toHaveBeenCalledWith(1)
    expect(res).toEqual(qrData)
  })
})
