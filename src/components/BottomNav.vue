<template>
  <nav class="bottom-nav">
    <router-link
      v-for="item in items"
      :key="item.path"
      :to="item.path"
      class="nav-item"
      :class="{ active: isActive(item.path) }"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path v-if="item.icon === 'home'" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline v-if="item.icon === 'home'" points="9 22 9 12 15 12 15 22" />
        <template v-if="item.icon === 'leads'">
          <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-6" />
        </template>
        <template v-if="item.icon === 'contacts'">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </template>
        <template v-if="item.icon === 'settings'">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7.5 18H3v-3.5a2.121 2.121 0 0 1 3-3z" />
        </template>
      </svg>
      <span>{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'

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
