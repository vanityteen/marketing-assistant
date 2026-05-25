<template>
  <div class="app">
    <div class="page-view">
      <router-view />
    </div>
    <BottomNav />
    <div class="toast-container">
      <transition name="toast">
        <div v-if="toastState.visible" class="toast-message">{{ toastState.message }}</div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import BottomNav from './components/BottomNav.vue'
import { useToast } from './composables/useToast'

const { toastState } = useToast()
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}
.page-view {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.toast-enter-active { animation: toastIn 0.3s ease; }
.toast-leave-active { animation: toastOut 0.3s ease; }
@keyframes toastIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes toastOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(10px); } }
</style>
