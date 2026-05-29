<template>
  <div class="view-root">
    <!-- Header -->
    <div class="header">
      <ChevronLeft class="back-icon" @click="$router.push('/')" />
      <h1>个人线索库</h1>
      <div class="spacer"></div>
    </div>

    <!-- Status Tabs -->
    <div class="tabs tabs-scroll">
      <button v-for="t in tabs" :key="t.value" :class="{ active: currentTab === t.value }"
        @click="switchTab(t.value)">{{ t.label }}</button>
    </div>

    <!-- Stats -->
    <div class="stats-row">
      <div v-for="s in tabStats" :key="s.key" class="stat-item">
        <div class="num">{{ stats[s.key] || 0 }}</div>
        <div class="label">{{ s.label }}</div>
      </div>
    </div>
    
    <div class="scroll-area">
      <!-- Lead List -->
      <div v-if="loading" class="loading-text">加载中...</div>
      <div v-else-if="leads.length === 0" class="empty-state">
        <Users />
        <div>暂无线索</div>
      </div>
      <div v-else class="lead-list">
        <div v-for="lead in leads" :key="lead.id" class="lead-card">
          <div class="avatar">{{ lead.name?.charAt(0) || '?' }}</div>
          <div class="info">
            <div class="name-wrapper">
              <span class="name">{{ lead.name }}</span>
              <StatusBadge :status="lead.status" class="lead-status" />
            </div>
            <div class="phone">{{ maskPhone(lead.phone) }}</div>
            <div v-if="lead.event_name" class="source">来源：{{ lead.event_name }}</div>
            <div v-if="lead.claimed_at" class="time">领用时间：{{ formatDate(lead.claimed_at) }}</div>
          </div>
          <div class="actions">
            <button class="follow-btn" @click="openFollow(lead)">跟进</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Follow Modal -->
    <FollowModal :visible="showFollowModal" :lead="selectedLead" @close="showFollowModal = false"
      @save="handleFollowSave" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useLeadStore } from '@/stores/lead'
import StatusBadge from '@/components/StatusBadge.vue'
import FollowModal from '@/components/FollowModal.vue'
import { useToast } from '@/composables/useToast'
import { ChevronLeft, Users } from 'lucide-vue-next'

const leadStore = useLeadStore()
const { showToast } = useToast()

const currentTab = ref('all')
const loading = ref(false)
const leads = ref([])
const stats = reactive({
  pending: 0, contacted: 0, negotiating: 0, converted: 0, abandoned: 0,
})

const showFollowModal = ref(false)
const selectedLead = ref(null)

const tabs = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待联系' },
  { value: 'contacted', label: '已联系' },
  { value: 'negotiating', label: '洽谈中' },
  { value: 'converted', label: '已转化' },
  { value: 'abandoned', label: '已放弃' },
]

const tabStats = computed(() => [
  { key: 'pending', label: '待联系' },
  { key: 'contacted', label: '已联系' },
  { key: 'negotiating', label: '洽谈中' },
  { key: 'converted', label: '已转化' },
  { key: 'abandoned', label: '已放弃' },
])

async function load() {
  loading.value = true
  const params = {}
  if (currentTab.value !== 'all') params.status = currentTab.value
  const res = await leadStore.fetchPersonalLeads(params)
  leads.value = res.leads || []
  if (res.stats) {
    Object.assign(stats, res.stats)
  }
  loading.value = false
}

function switchTab(tab) {
  currentTab.value = tab
  load()
}

function openFollow(lead) {
  selectedLead.value = lead
  showFollowModal.value = true
}

async function handleFollowSave(data) {
  if (!selectedLead.value) return
  await leadStore.followUp(selectedLead.value.id, {
    status: data.status,
    rating: data.rating,
    note: data.note,
  })
  showFollowModal.value = false
  showToast('跟进记录已保存')
  load()
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
}

.lead-list {
  display: flex;
  flex-direction: column;
}

.name-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

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
