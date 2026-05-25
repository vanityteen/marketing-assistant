<template>
  <div class="view-root">
    <!-- Header -->
    <div class="header home-header">
      <h1>市场活动助手</h1>
      <div class="search-box">
        <Search />
        <input type="text" v-model="search" placeholder="搜索活动..." @input="onSearch" />
      </div>
    </div>

    <div class="scroll-area">
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
      <div v-else style="display: flex; flex-direction: column; row-gap: 12px;" class="events-list">
        <EventCard v-for="event in events" :key="event.id" :event="event" :showQR="event.status === 'active'" @deleted="onEventDeleted" />
      </div>
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

<style scoped>
.home-header {
  background: var(--gradient);
  color: #fff;
  padding: 20px 16px;
  border-bottom: none;
  flex-shrink: 0;
}
.home-header h1 { font-size: 20px; color: #fff; }

.events-list {
  display: flex;
  flex-direction: column;
  row-gap: 12px;
}

.search-box {
  background: rgba(255,255,255,0.2);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  margin-top: 12px;
  display: flex;
  align-items: center;
}
.search-box svg { width: 18px; height: 18px; opacity: 0.7; color: #fff; }
.search-box input {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 14px;
  flex: 1;
  margin-left: 8px;
  outline: none;
}
.search-box input::placeholder { color: rgba(255,255,255,0.7); }

.filter-tabs {
  display: flex;
  padding: 16px;
  gap: 8px;
}
.filter-tabs button {
  padding: 10px 16px;
  border-radius: 20px;
  border: none;
  font-size: 13px;
  background: #f0f0f0;
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s;
}
.filter-tabs button.active {
  background: var(--primary);
  color: #fff;
}

.create-btn {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 56px; height: 56px;
  background: var(--gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(102,126,234,0.4);
  z-index: 100;
  cursor: pointer;
  border: none;
}
.create-btn svg { width: 24px; height: 24px; stroke: #fff; stroke-width: 2; fill: none; }
</style>
