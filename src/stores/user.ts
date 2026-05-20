import { defineStore } from 'pinia'
import { api } from '@/api'

interface User {
  id: number
  name: string
  role: string
  [key: string]: unknown
}

interface Settings {
  recovery_days: number
  [key: string]: unknown
}

interface UserState {
  user: User | null
  settings: Settings | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    settings: null,
  }),
  getters: {
    isLoggedIn: (state) => !!state.user,
    role: (state) => state.user?.role || 'marketer',
  },
  actions: {
    async fetchUser() {
      const res = await api.getMe()
      if (res.user) this.user = res.user as User
    },
    async login(name: string) {
      const res = await api.login(name)
      if (res.user) this.user = res.user as User
      return res
    },
    async updateRole(role: string) {
      const res = await api.updateRole(role)
      if (res.user) {
        this.user = res.user as User
        this.fetchSettings()
      }
      return res
    },
    async logout() {
      await api.logout()
      this.user = null
    },
    async fetchSettings() {
      const res = await api.getSettings()
      if (res.settings) this.settings = res.settings as Settings
    },
    async updateRecovery(days: number) {
      const res = await api.updateRecovery(days)
      if (res.settings) this.settings = res.settings as Settings
    },
  },
})
