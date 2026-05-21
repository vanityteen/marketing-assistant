<template>
  <div>
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

    <!-- Lead List -->
    <div v-if="loading" class="loading-text">加载中...</div>
    <div v-else-if="leads.length === 0" class="empty-state">
      <Users />
      <div>暂无可用线索</div>
    </div>
    <div v-else class="lead-list">
      <div v-for="lead in leads" :key="lead.id" class="lead-card">
        <div class="avatar">{{ lead.name?.charAt(0) || '?' }}</div>
        <div class="info">
          <div class="name">{{ lead.name }}</div>
          <div class="phone">{{ maskPhone(lead.phone) }}</div>
          <div v-if="lead.event_name" class="source">来源：{{ lead.event_name }}</div>
        </div>
        <button class="claim-btn" :disabled="claimingId === lead.id" @click="claim(lead)">
          {{ claimingId === lead.id ? '领用中...' : '领用' }}
        </button>
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
  const res = await leadStore.fetchPublicLeads()
  leads.value = res.leads || []
  if (res.stats) {
    stats.available = res.stats.available
    stats.today = res.stats.today
    stats.recovery = res.stats.recovery
  }
  loading.value = false
}

async function claim(lead) {
  claimingId.value = lead.id
  try {
    const res = await leadStore.claimLead(lead.id)
    if (res.lead) {
      showToast('线索领用成功')
      // Remove from public list
      leads.value = leads.value.filter(l => l.id !== lead.id)
      stats.available--
      setTimeout(() => router.push('/leads/personal'), 1000)
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
