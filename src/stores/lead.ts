import { defineStore } from 'pinia'
import { api } from '@/api'

interface Lead {
  id: number
  name: string
  status?: string
  [key: string]: unknown
}

interface FollowUp {
  id: number
  note: string
  date?: string
  [key: string]: unknown
}

interface PublicStats {
  available: number
  today: number
  recovery: number
}

interface PersonalStats {
  pending: number
  contacted: number
  negotiating: number
  converted: number
  abandoned: number
}

interface LeadState {
  publicLeads: Lead[]
  publicStats: PublicStats
  personalLeads: Lead[]
  personalStats: PersonalStats
  followUps: FollowUp[]
}

export const useLeadStore = defineStore('lead', {
  state: (): LeadState => ({
    publicLeads: [],
    publicStats: { available: 0, today: 0, recovery: 0 },
    personalLeads: [],
    personalStats: { pending: 0, contacted: 0, negotiating: 0, converted: 0, abandoned: 0 },
    followUps: [],
  }),
  actions: {
    async fetchPublicLeads() {
      const res = await api.getPublicLeads()
      if (res.leads) this.publicLeads = res.leads as Lead[]
      if (res.stats) this.publicStats = res.stats as PublicStats
      return res
    },
    async fetchPersonalLeads(params: Record<string, string> = {}) {
      const res = await api.getPersonalLeads(params)
      if (res.leads) this.personalLeads = res.leads as Lead[]
      if (res.stats) this.personalStats = res.stats as PersonalStats
      return res
    },
    async claimLead(id: number | string) {
      const res = await api.claimLead(id)
      return res
    },
    async followUp(id: number | string, data: any) {
      const res = await api.followLead(id, data)
      return res
    },
    async fetchFollowUps(id: number | string) {
      const res = await api.getFollowUps(id)
      if (res.followUps) this.followUps = res.followUps as FollowUp[]
      return res
    },
    async submitLead(data: any) {
      return api.submitLead(data)
    },
  },
})
