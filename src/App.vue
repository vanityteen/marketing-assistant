<template>
  <div class="app">
    <router-view />
    <BottomNav v-if="showNav" />
    <div class="toast-container">
      <transition name="toast">
        <div v-if="toastState.visible" class="toast-message">{{ toastState.message }}</div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BottomNav from './components/BottomNav.vue'
import { useToast } from './composables/useToast'

const route = useRoute()
const { toastState } = useToast()

const showNav = computed(() => {
  return !['/event/create', '/submit'].some(r => route.path.startsWith(r))
    && !route.path.endsWith('/edit')
})
</script>

<style scoped>
.toast-enter-active { animation: toastIn 0.3s ease; }
.toast-leave-active { animation: toastOut 0.3s ease; }
@keyframes toastIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes toastOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(10px); } }
</style>
