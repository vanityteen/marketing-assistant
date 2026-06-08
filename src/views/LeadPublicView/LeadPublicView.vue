<template>
  <div class="view-root">
    <!-- Header -->
    <div class="header">
      <ChevronLeft class="back-icon" @click="$router.push('/')" />
      <h1>公共线索池</h1>
      <div class="spacer"></div>
    </div>

    <!-- Stats -->
    <div class="stats-bar">
      <div class="stat-item">
        <div class="num">{{ stats.available }}</div>
        <div class="label">可用线索</div>
      </div>
      <div class="stat-item">
        <div class="num">{{ stats.today }}</div>
        <div class="label">今日新增</div>
      </div>
      <div class="stat-item">
        <div class="num">{{ stats.recovery }}</div>
        <div class="label">待回收</div>
      </div>
    </div>

    <div class="scroll-area">
      <!-- Lead List -->
      <div v-if="loading" class="loading-text">加载中...</div>
      <div v-else-if="leads.length === 0" class="empty-state">
        <Users />
        <div>暂无可用线索</div>
      </div>
      <div v-else class="lead-list">
        <div v-for="lead in leads" :key="lead.id" class="lead-card">
          <div class="lead-main">
            <div class="avatar">{{ lead.name?.charAt(0) || '?' }}</div>
            <div class="info">
              <div class="name">{{ lead.name }}</div>
              <div class="phone">{{ maskPhone(lead.phone) }}</div>
              <div v-if="lead.event_name" class="source">来源：{{ lead.event_name }}</div>
            </div>
          </div>
          <button class="claim-btn" :disabled="claimingId === lead.id" @click="claim(lead)">
            {{ claimingId === lead.id ? '领用中...' : '领用' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLeadStore } from '@/stores/lead'
import { useToast } from '@/composables/useToast'
import { ChevronLeft, Users } from 'lucide-vue-next'

const router = useRouter()
const leadStore = useLeadStore()
const { showToast } = useToast()

const leads = ref([])
const stats = reactive({ available: 0, today: 0, recovery: 0 })
const loading = ref(true)
const claimingId = ref(null)

async function load() {
  loading.value = true
  const [publicRes, personalRes] = await Promise.all([
    leadStore.fetchPublicLeads(),
    leadStore.fetchPersonalLeads().catch(() => ({ leads: [] })),
  ])
  const allPublic = publicRes.leads || []
  const personalLeads = personalRes.leads || []

  // 当前用户正在活跃持有的线索 ID（排除已放弃的，后端已自动包含已放弃线索到公共池）
  const activeClaimedIds = new Set(
    personalLeads.filter(l => l.status !== 'abandoned').map(l => l.id)
  )

  // 从公共池中过滤掉活跃持有的线索
  leads.value = allPublic.filter(l => !activeClaimedIds.has(l.id))
  if (publicRes.stats) {
    stats.available = publicRes.stats.available
    stats.today = publicRes.stats.today
    stats.recovery = publicRes.stats.recovery
  }
  loading.value = false
}

async function claim(lead) {
  claimingId.value = lead.id
  try {
    const res = await leadStore.claimLead(lead.id)
    if (res.lead) {
      showToast('线索已领用并添加到通讯录')
      // 不影响公共池中的数据，不从此列表中移除
      setTimeout(() => router.push('/contacts'), 1000)
    } else if (res.error) {
      showToast(res.error)
    }
  } catch (e) {
    showToast('领用失败')
  }
  claimingId.value = null
}

function maskPhone(phone) {
  if (!phone) return ''
  return phone.length >= 7 ? phone.slice(0, 3) + '****' + phone.slice(-4) : phone
}

onMounted(load)
</script>

<style scoped>
.stats-bar {
  display: flex;
  justify-content: space-around;
  padding: 20px 16px;
  background: var(--surface-dark);
  color: var(--on-dark);
}

.stat-item {
  text-align: center;
}

.stat-item .num {
  font-size: 24px;
  font-weight: 500;
}

.stat-item .label {
  font-size: 13px;
  opacity: 0.7;
  margin-top: 4px;
}

.claim-btn {
  padding: 10px 20px;
  background: var(--primary);
  color: var(--on-primary);
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  white-space: nowrap;
  transition: background 0.2s ease;
}
.claim-btn:hover {
  background: var(--primary-active);
}
.claim-btn:disabled {
  background: var(--primary-disabled);
  color: var(--muted);
}

.scroll-area {
  background-color: var(--canvas);
  overflow-y: auto;
  padding: 24px;
}

/* Lead Cards */
.lead-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background: var(--canvas);
  border-radius: var(--radius-card);
  margin-bottom: 12px;
  border: 1px solid var(--hairline);
  position: relative;
}

.lead-main {
  display: flex;
  align-items: center;
  flex: 1;
  cursor: pointer;
  min-width: 0;
  transition: opacity 0.15s ease;
}

.lead-main:hover {
  opacity: 0.75;
}

.lead-main:active {
  opacity: 0.6;
}
</style>
