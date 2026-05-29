<template>
  <div class="view-root">
    <!-- Header -->
    <div class="header home-header">
      <h1>市场活动助手</h1>
    </div>

    <!-- Search -->
    <div class="search-box">
      <Search />
      <input type="text" v-model="search" placeholder="搜索活动..." @input="onSearch" />
    </div>

    <!-- Filter Tabs -->
    <div class="filter-tabs">
      <button v-for="f in filters" :key="f.value" :class="{ active: currentFilter === f.value }" @click="setFilter(f.value)">
        {{ f.label }}
      </button>
    </div>

    <!-- Scrollable Event List -->
    <div class="scroll-area">
      <div v-if="loading" class="loading-text">加载中...</div>
      <div v-else-if="events.length === 0" class="empty-state">
        <Calendar />
        <div>暂无活动</div>
      </div>
      <div v-else style="display: flex; flex-direction: column; row-gap: 12px;" class="events-list">
        <EventCard v-for="event in events" :key="event.id" :event="event" :showQR="event.status === 'active'" @deleted="loadEvents"/>
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
.view-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.home-header {
  background: var(--canvas);
  color: var(--ink);
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--hairline);
  flex-shrink: 0;
}
.home-header h1 {
  font-size: 22px;
  font-weight: 500;
  letter-spacing: 0;
  color: var(--ink);
  text-align: left;
}

.search-box {
  background: var(--canvas);
  border: 1px solid var(--hairline);
  border-radius: var(--radius);
  padding: 10px 14px;
  margin: 16px 24px 8px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  transition: border-color 0.2s ease;
}
.search-box:focus-within {
  border-color: var(--primary);
}
.search-box svg { width: 18px; height: 18px; opacity: 0.4; color: var(--muted); }
.search-box input {
  background: transparent;
  border: none;
  color: var(--ink);
  font-size: 14px;
  flex: 1;
  margin-left: 8px;
  outline: none;
}
.search-box input::placeholder { color: var(--muted-soft); }

.events-list {
  display: flex;
  flex-direction: column;
  row-gap: 12px;
}

.filter-tabs {
  display: flex;
  padding: 8px 24px 16px;
  gap: 8px;
  flex-shrink: 0;
}
.filter-tabs button {
  padding: 8px 14px;
  border-radius: var(--radius);
  border: none;
  font-size: 14px;
  font-weight: 500;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s ease;
}
.filter-tabs button:hover {
  background: var(--surface-card);
  color: var(--ink);
}
.filter-tabs button.active {
  background: var(--surface-card);
  color: var(--ink);
}

.scroll-area {
  background-color: var(--canvas);
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 24px;
}

@media (max-width: 768px) {
  .scroll-area {
    scrollbar-width: none;
  }
  .scroll-area::-webkit-scrollbar {
    display: none;
  }
}

.create-btn {
  position: fixed;
  bottom: 96px;
  right: 24px;
  width: 56px; height: 56px;
  background: var(--primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  cursor: pointer;
  border: none;
  transition: background 0.2s ease;
}
.create-btn:hover {
  background: var(--primary-active);
}
.create-btn:active {
  background: var(--primary-active);
}
.create-btn svg { width: 24px; height: 24px; stroke: var(--on-primary); stroke-width: 2; fill: none; }
</style>
