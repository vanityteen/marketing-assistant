import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useToast } from '@/composables/useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with hidden toast state', () => {
    const { toastState } = useToast()
    expect(toastState.value.visible).toBe(false)
    expect(toastState.value.message).toBe('')
    expect(toastState.value.timer).toBeNull()
  })

  it('should show toast with the given message', () => {
    const { showToast, toastState } = useToast()
    showToast('Hello World')
    expect(toastState.value.message).toBe('Hello World')
    expect(toastState.value.visible).toBe(true)
  })

  it('should auto-hide toast after default duration (2000ms)', () => {
    const { showToast, toastState } = useToast()
    showToast('Auto hide')
    expect(toastState.value.visible).toBe(true)

    vi.advanceTimersByTime(2000)
    expect(toastState.value.visible).toBe(false)
  })

  it('should auto-hide toast after custom duration', () => {
    const { showToast, toastState } = useToast()
    showToast('Custom duration', 5000)
    expect(toastState.value.visible).toBe(true)

    vi.advanceTimersByTime(2000)
    expect(toastState.value.visible).toBe(true)

    vi.advanceTimersByTime(3000)
    expect(toastState.value.visible).toBe(false)
  })

  it('should reset the timer when showToast is called again before previous expires', () => {
    const { showToast, toastState } = useToast()
    showToast('First', 5000)
    vi.advanceTimersByTime(3000)

    showToast('Second', 5000)
    expect(toastState.value.message).toBe('Second')

    // Should not hide at the original 5000ms mark
    vi.advanceTimersByTime(2000)
    expect(toastState.value.visible).toBe(true)

    // Should hide at the new 5000ms mark
    vi.advanceTimersByTime(3000)
    expect(toastState.value.visible).toBe(false)
  })

  it('should share the same toastState across multiple calls', () => {
    const { showToast: show1, toastState: state1 } = useToast()
    const { showToast: show2, toastState: state2 } = useToast()

    expect(state1).toBe(state2)

    show1('Shared state')
    expect(state2.value.message).toBe('Shared state')
    expect(state2.value.visible).toBe(true)
  })
})
