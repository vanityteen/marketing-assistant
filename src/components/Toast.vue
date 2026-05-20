<template>
  <div class="toast-container">
    <transition name="toast">
      <div v-if="visible" class="toast-message">{{ message }}</div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(false)
const message = ref('')
let timer = null

function show(msg, duration = 2000) {
  if (timer) clearTimeout(timer)
  message.value = msg
  visible.value = true
  timer = setTimeout(() => {
    visible.value = false
  }, duration)
}

defineExpose({ show })
</script>

<style scoped>
.toast-enter-active { animation: toastIn 0.3s ease; }
.toast-leave-active { animation: toastOut 0.3s ease; }
@keyframes toastIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes toastOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(10px); } }
</style>
