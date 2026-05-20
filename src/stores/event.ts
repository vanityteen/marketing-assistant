import { defineStore } from 'pinia'
import { api } from '@/api'

interface Event {
  id: number
  title: string
  description?: string
  date?: string
  [key: string]: unknown
}

interface EventState {
  events: Event[]
  currentEvent: Event | null
  loading: boolean
}

export const useEventStore = defineStore('event', {
  state: (): EventState => ({
    events: [],
    currentEvent: null,
    loading: false,
  }),
  actions: {
    async fetchEvents(params: Record<string, string> = {}) {
      this.loading = true
      const res = await api.getEvents(params)
      if (res.events) this.events = res.events as Event[]
      this.loading = false
      return res
    },
    async fetchEvent(id: number | string) {
      this.loading = true
      const res = await api.getEvent(id)
      if (res.event) this.currentEvent = res.event as Event
      this.loading = false
      return res
    },
    async createEvent(data: Partial<Event>) {
      const res = await api.createEvent(data)
      return res
    },
    async updateEvent(id: number | string, data: Partial<Event>) {
      const res = await api.updateEvent(id, data)
      if (res.event && this.currentEvent?.id === Number(id)) {
        this.currentEvent = res.event as Event
      }
      return res
    },
    async deleteEvent(id: number) {
      const res = await api.deleteEvent(id)
      this.events = this.events.filter(e => e.id !== id)
      return res
    },
    async getEventQR(id: number | string) {
      return api.getEventQR(id)
    },
  },
})
