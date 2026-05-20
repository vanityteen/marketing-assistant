<template>
  <div>
    <!-- Header -->
    <div class="header home-header">
      <h1>市场活动助手</h1>
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input type="text" v-model="search" placeholder="搜索活动..." @input="onSearch" />
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="filter-tabs">
      <button v-for="f in filters" :key="f.value" :class="{ active: currentFilter === f.value }" @click="setFilter(f.value)">
        {{ f.label }}
      </button>
    </div>

    <!-- Event List -->
    <div v-if="loading" class="loading-text">加载中...</div>
    <div v-else-if="events.length === 0" class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      <div>暂无活动</div>
    </div>
    <div v-else style="padding-bottom: 100px;">
      <EventCard v-for="event in events" :key="event.id" :event="event" :showQR="event.status === 'active'" />
    </div>

    <!-- FAB -->
    <button class="create-btn" @click="$router.push('/event/create')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useEventStore } from '@/stores/event'
import EventCard from '@/components/EventCard.vue'

const eventStore = useEventStore()

const search = ref('')
const currentFilter = ref('all')
let searchTimer = null

const filters = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '进行中' },
  { value: 'ended', label: '已结束' },
]

const events = ref([])
const loading = ref(false)

async function loadEvents() {
  loading.value = true
  const params = {}
  if (currentFilter.value !== 'all') params.status = currentFilter.value
  if (search.value) params.search = search.value
  const res = await eventStore.fetchEvents(params)
  events.value = res.events || []
  loading.value = false
}

function setFilter(filter) {
  currentFilter.value = filter
  loadEvents()
}

function onSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(loadEvents, 300)
}

onMounted(loadEvents)
</script>
