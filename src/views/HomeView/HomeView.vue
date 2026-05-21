<template>
  <div>
    <!-- Header -->
    <div class="header home-header">
      <h1>市场活动助手</h1>
      <div class="search-box">
        <Search />
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
      <Calendar />
      <div>暂无活动</div>
    </div>
    <div v-else style="padding-bottom: 100px;">
      <EventCard v-for="event in events" :key="event.id" :event="event" :showQR="event.status === 'active'" />
    </div>

    <!-- FAB -->
    <button class="create-btn" @click="$router.push('/event/create')">
      <Plus />
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useEventStore } from '@/stores/event'
import EventCard from '@/components/EventCard.vue'
import { Search, Calendar, Plus } from 'lucide-vue-next'

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
