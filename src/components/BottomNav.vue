<template>
  <nav class="bottom-nav">
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
import { useRoute } from 'vue-router'
import { Home, BarChart, Users, Settings } from 'lucide-vue-next'

const route = useRoute()

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
