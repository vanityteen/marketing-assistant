<template>
  <div class="view-root">
    <div class="header">
      <ChevronLeft class="back-icon" @click="$router.push('/')" />
      <h1>通讯录中心</h1>
      <div class="spacer"></div>
    </div>

    <!-- Search -->
    <div class="contact-search">
      <Search />
      <input type="text" v-model="search" placeholder="搜索线索/客户..." @input="onSearch" />
    </div>

    <!-- Stats -->
    <div class="stats-row">
      <div v-for="s in tabStats" :key="s.key" class="stat-item">
        <div class="num">{{ stats[s.key] || 0 }}</div>
        <div class="label">{{ s.label }}</div>
      </div>
    </div>

    <!-- Status Tabs -->
    <div class="tabs tabs-scroll">
      <button v-for="t in tabs" :key="t.value" :class="{ active: currentTab === t.value }"
        @click="switchTab(t.value)">{{ t.label }}</button>
    </div>

    <div class="scroll-area">
      <div v-if="loading" class="loading-text">加载中...</div>
      <div v-else-if="contacts.length === 0" class="empty-state">
        <Users />
        <div>暂无联系人</div>
      </div>
      <div v-else class="contact-list">
        <div v-for="contact in contacts" :key="contact.id" class="contact-card" @click="viewDetail(contact)">
          <div class="avatar">{{ contact.name?.charAt(0) || '?' }}</div>
          <div class="info">
            <div class="name-wrapper">
              <span class="name">{{ contact.name }}</span>
              <StatusBadge :status="contact.status" class="lead-status" />
            </div>
            <div class="phone">{{ maskPhone(contact.phone) }}</div>
            <div v-if="contact.event_name" class="source">来源：{{ contact.event_name }}</div>
            <div v-if="contact.claimed_at" class="time">领用时间：{{ formatDate(contact.claimed_at) }}</div>
          </div>
          <div class="actions">
            <button class="follow-btn" @click.stop="openFollow(contact)">跟进</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Follow Modal -->
    <FollowModal :visible="showFollowModal" :lead="selectedContact" @close="showFollowModal = false"
      @save="handleFollowSave" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLeadStore } from '@/stores/lead'
import StatusBadge from '@/components/StatusBadge.vue'
import FollowModal from '@/components/FollowModal.vue'
import { useToast } from '@/composables/useToast'
import { ChevronLeft, Search, Users } from 'lucide-vue-next'

const router = useRouter()
const leadStore = useLeadStore()
const { showToast } = useToast()

const search = ref('')
const currentTab = ref('all')
const contacts = ref([])
const loading = ref(false)
let searchTimer = null

const stats = reactive({
  pending: 0, contacted: 0, negotiating: 0, converted: 0, abandoned: 0,
})

const showFollowModal = ref(false)
const selectedContact = ref(null)

const tabs = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待联系' },
  { value: 'contacted', label: '已联系' },
  { value: 'negotiating', label: '洽谈中' },
  { value: 'converted', label: '已转化' },
  { value: 'abandoned', label: '已放弃' },
]

const tabStats = [
  { key: 'pending', label: '待联系' },
  { key: 'contacted', label: '已联系' },
  { key: 'negotiating', label: '洽谈中' },
  { key: 'converted', label: '已转化' },
  { key: 'abandoned', label: '已放弃' },
]

async function load() {
  loading.value = true
  const params = {}
  if (currentTab.value !== 'all') params.status = currentTab.value
  if (search.value) params.search = search.value
  const res = await leadStore.fetchPersonalLeads(params)
  contacts.value = res.leads || []
  if (res.stats) {
    Object.assign(stats, res.stats)
  }
  loading.value = false
}

function switchTab(tab) {
  currentTab.value = tab
  load()
}

function onSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(load, 300)
}

function openFollow(contact) {
  selectedContact.value = contact
  showFollowModal.value = true
}

async function handleFollowSave(data) {
  if (!selectedContact.value) return
  const isAbandoned = data.status === 'abandoned'
  await leadStore.followUp(selectedContact.value.id, {
    status: data.status,
    rating: data.rating,
    note: data.note,
  })
  showFollowModal.value = false
  showToast(isAbandoned ? '线索已放弃，已返回公共线索池' : '跟进记录已保存')
  load()
}

function viewDetail(contact) {
  router.push(`/lead/${contact.id}`)
}

function maskPhone(phone) {
  if (!phone) return ''
  return phone.length >= 7 ? phone.slice(0, 3) + '****' + phone.slice(-4) : phone
}

function formatDate(d) {
  if (!d) return ''
  return d.slice(0, 10)
}

onMounted(load)
</script>

<style scoped>
.contact-search {
  margin: 12px 16px;
  padding: 10px 14px;
  background: var(--canvas);
  border: 1px solid var(--hairline);
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  transition: border-color 0.2s ease;
}
.contact-search:focus-within {
  border-color: var(--primary);
}
.contact-search svg { width: 18px; height: 18px; opacity: 0.5; flex-shrink: 0; color: var(--muted); }
.contact-search input {
  flex: 1;
  background: transparent;
  border: none;
  margin-left: 10px;
  font-size: 14px;
  outline: none;
  color: var(--ink);
}

.stats-row {
  display: flex;
  justify-content: space-around;
  padding: 20px 16px;
  background: var(--surface-dark);
  color: var(--on-dark);
  flex-shrink: 0;
}

.stats-row .stat-item {
  text-align: center;
}

.stats-row .stat-item .num {
  font-size: 24px;
  font-weight: 500;
  color: var(--on-dark);
}

.stats-row .stat-item .label {
  font-size: 13px;
  opacity: 0.7;
  margin-top: 4px;
}

.scroll-area {
  padding: 20px 16px;
  background: var(--canvas);
  flex: 1;
  overflow-y: auto;
}

.contact-list {
  display: flex;
  flex-direction: column;
}

.contact-card {
  display: flex;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid var(--hairline-soft);
  cursor: pointer;
  transition: opacity 0.15s ease;
}
.contact-card:hover {
  opacity: 0.75;
}
.contact-card:active {
  opacity: 0.6;
}

.contact-card .avatar { width: 40px; height: 40px; font-size: 15px; flex-shrink: 0; }

.contact-card .info {
  flex: 1;
  margin-left: 12px;
  min-width: 0;
}
.contact-card .name-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}
.contact-card .name { font-size: 14px; font-weight: 500; }
.contact-card .phone { font-size: 13px; color: var(--muted); margin-top: 2px; }
.contact-card .source { font-size: 12px; color: var(--muted-soft); margin-top: 2px; }
.contact-card .time { font-size: 12px; color: var(--muted-soft); margin-top: 2px; }

.actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  margin-left: 16px;
  flex-shrink: 0;
}

.follow-btn {
  padding: 10px 20px;
  background: var(--primary);
  color: var(--on-primary);
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 0.2s;
}

.follow-btn:hover {
  background: var(--primary-active);
}

.follow-btn:active {
  background: var(--primary-active);
}
</style>
