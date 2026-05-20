import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'
import { api } from '@/api'

vi.mock('@/api', () => ({
  api: {
    getMe: vi.fn(),
    login: vi.fn(),
    updateRole: vi.fn(),
    logout: vi.fn(),
    getSettings: vi.fn(),
    updateRecovery: vi.fn(),
  },
}))

describe('userStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with null user and settings', () => {
    const store = useUserStore()
    expect(store.user).toBeNull()
    expect(store.settings).toBeNull()
  })

  it('isLoggedIn returns false when no user', () => {
    const store = useUserStore()
    expect(store.isLoggedIn).toBe(false)
  })

  it('isLoggedIn returns true when user exists', () => {
    const store = useUserStore()
    store.user = { id: 1, name: 'Test', role: 'marketer' }
    expect(store.isLoggedIn).toBe(true)
  })

  it('role returns "marketer" as default', () => {
    const store = useUserStore()
    expect(store.role).toBe('marketer')
  })

  it('role returns user role when set', () => {
    const store = useUserStore()
    store.user = { id: 1, name: 'Admin', role: 'admin' }
    expect(store.role).toBe('admin')
  })

  it('fetchUser sets user from api.getMe', async () => {
    const mockUser = { id: 1, name: 'Alice', role: 'marketer' }
    vi.mocked(api.getMe).mockResolvedValue({ user: mockUser })

    const store = useUserStore()
    await store.fetchUser()

    expect(api.getMe).toHaveBeenCalledOnce()
    expect(store.user).toEqual(mockUser)
  })

  it('fetchUser does not set user on empty response', async () => {
    vi.mocked(api.getMe).mockResolvedValue({})

    const store = useUserStore()
    store.user = { id: 1, name: 'Existing', role: 'admin' }
    await store.fetchUser()

    expect(store.user).toEqual({ id: 1, name: 'Existing', role: 'admin' })
  })

  it('login sets user on success', async () => {
    const mockUser = { id: 2, name: 'Bob', role: 'marketer' }
    vi.mocked(api.login).mockResolvedValue({ user: mockUser })

    const store = useUserStore()
    const res = await store.login('Bob')

    expect(api.login).toHaveBeenCalledWith('Bob')
    expect(store.user).toEqual(mockUser)
    expect(res).toEqual({ user: mockUser })
  })

  it('logout clears user', async () => {
    vi.mocked(api.logout).mockResolvedValue({})

    const store = useUserStore()
    store.user = { id: 1, name: 'Test', role: 'marketer' }
    await store.logout()

    expect(api.logout).toHaveBeenCalledOnce()
    expect(store.user).toBeNull()
  })

  it('updateRole sets user and calls fetchSettings', async () => {
    vi.mocked(api.updateRole).mockResolvedValue({
      user: { id: 1, name: 'Alice', role: 'admin' },
    })
    vi.mocked(api.getSettings).mockResolvedValue({
      settings: { recovery_days: 30 },
    })

    const store = useUserStore()
    store.user = { id: 1, name: 'Alice', role: 'marketer' }
    await store.updateRole('admin')

    expect(api.updateRole).toHaveBeenCalledWith('admin')
    expect(store.user?.role).toBe('admin')
    expect(api.getSettings).toHaveBeenCalledOnce()
  })

  it('fetchSettings sets settings from api', async () => {
    const mockSettings = { recovery_days: 14 }
    vi.mocked(api.getSettings).mockResolvedValue({ settings: mockSettings })

    const store = useUserStore()
    await store.fetchSettings()

    expect(store.settings).toEqual(mockSettings)
  })

  it('updateRecovery calls api and updates settings', async () => {
    const mockSettings = { recovery_days: 7 }
    vi.mocked(api.updateRecovery).mockResolvedValue({ settings: mockSettings })

    const store = useUserStore()
    await store.updateRecovery(7)

    expect(api.updateRecovery).toHaveBeenCalledWith(7)
    expect(store.settings).toEqual(mockSettings)
  })
})
