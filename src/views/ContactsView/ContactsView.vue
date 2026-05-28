<template>
  <div class="view-root">
    <div class="header">
      <ChevronLeft class="back-icon" @click="$router.push('/')" />
      <h1>通讯录中心</h1>
      <div class="spacer"></div>
    </div>

    <div class="contact-search">
      <Search />
      <input type="text" v-model="search" placeholder="搜索线索/客户..." @input="onSearch" />
    </div>

    <div class="special-tab">
      <button @click="switchFilter('all')">
        <CircleCheckBig />
        全部线索 ({{ total }}条)
      </button>
    </div>

    <div class="tabs tabs-scroll">
      <button v-for="s in statusFilters" :key="s.value" :class="{ active: currentFilter === s.value }" @click="switchFilter(s.value)">{{ s.label }}</button>
    </div>
    
    <div class="scroll-area">
      <div v-if="loading" class="loading-text">加载中...</div>
      <div v-else-if="contacts.length === 0" class="empty-state">
        <Users />
        <div>暂无联系人</div>
      </div>
      <div v-else class="contact-list">
        <div v-for="contact in contacts" :key="contact.id" class="contact-item">
          <div class="avatar">{{ contact.name?.charAt(0) || '?' }}</div>
          <div class="info">
            <div class="name">{{ contact.name }}</div>
            <div class="phone">{{ maskPhone(contact.phone) }}</div>
          </div>
          <StatusBadge :status="contact.status" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '@/api'
import StatusBadge from '@/components/StatusBadge.vue'
import { ChevronLeft, Search, CircleCheckBig, Users } from 'lucide-vue-next'

const search = ref('')
const currentFilter = ref('all')
const contacts = ref([])
const total = ref(0)
const loading = ref(false)
let searchTimer = null

const statusFilters = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待联系' },
  { value: 'contacted', label: '已联系' },
  { value: 'negotiating', label: '洽谈中' },
  { value: 'converted', label: '客户' },
  { value: 'abandoned', label: '已放弃' },
]

async function load() {
  loading.value = true
  const params = {}
  if (currentFilter.value !== 'all') params.status = currentFilter.value
  if (search.value) params.search = search.value
  const res = await api.getContacts(params)
  contacts.value = res.contacts || []
  total.value = res.total || 0
  loading.value = false
}

function switchFilter(filter) {
  currentFilter.value = filter
  load()
}

function onSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(load, 300)
}

function maskPhone(phone) {
  if (!phone) return ''
  return phone.length >= 7 ? phone.slice(0, 3) + '****' + phone.slice(-4) : phone
}

onMounted(load)
</script>

<style scoped>
.contact-search {
  margin: 12px 16px;
  padding: 12px 14px;
    background: var(--bg-white);
  border-color: var(--primary);
  box-shadow: 0 0 0 1px var(--primary);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
}
.contact-search svg { width: 18px; height: 18px; opacity: 0.5; flex-shrink: 0; }
.contact-search input {
  flex: 1;
  background: transparent;
  border: none;
  margin-left: 10px;
  font-size: 14px;
  outline: none;
}

.special-tab { margin: 0 16px; }
.special-tab button:not(.inline) {
  width: 100%;
  padding: 14px;
  background: var(--gradient);
  color: #fff;
  border-radius: var(--radius);
  border: none;
  font-size: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}
.special-tab button svg { width: 18px; height: 18px; }

.contact-list { padding: 0 16px; }
.contact-item {
  display: flex;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid var(--border-light);
}
.contact-item .avatar { width: 40px; height: 40px; font-size: 15px; }
.contact-item .info { flex: 1; margin-left: 12px; min-width: 0; }
.contact-item .name { font-size: 14px; font-weight: 500; }
.contact-item .phone { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
</style>
