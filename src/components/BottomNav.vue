<template>
  <nav class="bottom-nav" v-show="visible">
    <router-link
      v-for="item in items"
      :key="item.path"
      :to="item.path"
      class="nav-item"
      :class="{ active: isActive(item.path) }"
    >
      <Home v-if="item.icon === 'home'" />
      <BarChart v-else-if="item.icon === 'leads'" />
      <Users v-else-if="item.icon === 'contacts'" />
      <Settings v-else-if="item.icon === 'settings'" />
      <span>{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Home, BarChart, Users, Settings } from 'lucide-vue-next'

const route = useRoute()

const visible = computed(() => {
  return !['/event/create', '/submit'].some(r => route.path.startsWith(r))
    && !route.path.endsWith('/edit')
})

const items = [
  { path: '/', icon: 'home', label: '活动' },
  { path: '/leads/public', icon: 'leads', label: '线索' },
  { path: '/contacts', icon: 'contacts', label: '通讯录' },
  { path: '/settings', icon: 'settings', label: '我的' },
]

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<style scoped>
.bottom-nav {
  display: flex;
  justify-content: space-around;
  padding: 14px 0 16px;
  border-top: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.02);
  flex-shrink: 0;
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--text-muted);
  cursor: pointer;
  border: none;
  background: none;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
}
.nav-item:hover {
  color: var(--primary);
  transform: translateY(-1px);
}
.nav-item.active {
  color: var(--primary);
  font-weight: 600;
}
.nav-item svg {
  width: 20px;
  height: 20px;
  stroke-width: 2.2;
  transition: transform 0.2s ease;
}
.nav-item.active svg {
  transform: scale(1.05);
}
</style>
