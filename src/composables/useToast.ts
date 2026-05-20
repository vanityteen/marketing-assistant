import { ref, type Ref } from 'vue'

interface ToastState {
  visible: boolean
  message: string
  timer: ReturnType<typeof setTimeout> | null
}

const toastState: Ref<ToastState> = ref({
  visible: false,
  message: '',
  timer: null,
})

export function useToast() {
  const showToast = (message: string, duration = 2000) => {
    if (toastState.value.timer) clearTimeout(toastState.value.timer)
    toastState.value.message = message
    toastState.value.visible = true
    toastState.value.timer = setTimeout(() => {
      toastState.value.visible = false
    }, duration)
  }

  return { showToast, toastState }
}
