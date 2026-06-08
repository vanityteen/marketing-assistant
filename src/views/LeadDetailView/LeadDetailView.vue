<template>
  <div class="view-root">
    <!-- Header -->
    <div class="header">
      <ChevronLeft class="back-icon" @click="goBack" />
      <h1>线索详情</h1>
      <div class="spacer"></div>
    </div>

    <div class="scroll-area">
      <div v-if="loading" class="loading-text">加载中...</div>

      <div v-else-if="error" class="empty-state">
        <CircleX />
        <p>{{ error }}</p>
      </div>

      <template v-else-if="lead">
        <!-- Lead Basic Info Card -->
        <div class="info-card">
          <div class="avatar-row">
            <div class="avatar">{{ lead.name?.charAt(0) || '?' }}</div>
            <div class="basic-info">
              <div class="name">{{ lead.name }}</div>
              <div v-if="lead.phone" class="phone">{{ lead.phone }}</div>
            </div>
          </div>
          <div v-if="lead.event_name" class="source-row">
            <Calendar class="meta-icon" />
            <span>来源活动：{{ lead.event_name }}</span>
          </div>
          <div v-if="lead.created_at" class="source-row">
            <Clock class="meta-icon" />
            <span>提交时间：{{ formatDate(lead.created_at) }}</span>
          </div>
          <div v-if="lead.status" class="source-row">
            <span class="status-dot" :class="`status-${lead.status}`"></span>
            <span>状态：{{ statusLabel }}</span>
          </div>
        </div>

        <!-- Form Fields Card -->
        <div class="info-card" v-if="Object.keys(customFields).length > 0">
          <h3 class="card-title">表单信息</h3>
          <div class="divider"></div>
          <div v-for="(value, key) in customFields" :key="key" class="field-row">
            <span class="field-label">{{ key }}</span>
            <span class="field-value">{{ value || '未填写' }}</span>
          </div>
        </div>

        <!-- Follow-ups Card -->
        <div v-if="lead.status && lead.status !== 'pending'" class="info-card">
          <h3 class="card-title">跟进记录</h3>
          <div class="divider"></div>
          <div v-if="followUps.length === 0" class="empty-hint">暂无跟进记录</div>
          <div v-for="fu in followUps" :key="fu.id" class="follow-item">
            <div class="follow-note">{{ fu.note }}</div>
            <div class="follow-meta">
              <span class="follow-status" :class="`status-${fu.status}`">{{ statusLabels[fu.status] || fu.status }}</span>
              <span class="follow-time">{{ formatDate(fu.created_at || fu.date) }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLeadStore } from '@/stores/lead'
import { api } from '@/api'
import { ChevronLeft, CircleX, Calendar, Clock } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const leadStore = useLeadStore()

const lead = ref(null)
const followUps = ref([])
const loading = ref(true)
const error = ref('')

const statusLabels = {
  pending: '待联系', contacted: '已联系', negotiating: '洽谈中',
  converted: '已转化', abandoned: '已放弃',
}

const statusLabel = computed(() => statusLabels[lead.value?.status] || lead.value?.status || '')

const customFields = computed(() => {
  if (!lead.value?.custom_data) return {}
  const data = lead.value.custom_data
  // Filter out empty internal fields
  const fields = {}
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined && val !== null && val !== '') {
      fields[key] = Array.isArray(val) ? val.join('、') : String(val)
    }
  }
  return fields
})

function formatDate(d) {
  if (!d) return ''
  // Handle both full datetime and date-only strings
  return d.length >= 10 ? d.slice(0, 10) + ' ' + d.slice(11, 16) : d
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/leads/public')
  }
}

onMounted(async () => {
  const id = route.params.id
  if (!id) {
    error.value = '缺少线索ID'
    loading.value = false
    return
  }
  try {
    const [res, personalRes, contactsRes] = await Promise.all([
      leadStore.fetchLead(id),
      leadStore.fetchPersonalLeads().catch(() => ({ leads: [] })),
      api.getContacts().catch(() => ({ contacts: [] })),
    ])
    if (res.lead) {
      // 验证当前用户是否已领用该线索（个人线索库或通讯录）
      const claimedIds = new Set([
        ...(personalRes.leads || []).map(l => String(l.id)),
        ...(contactsRes.contacts || []).map(c => String(c.id)),
      ])
      if (!claimedIds.has(String(id))) {
        error.value = '请先领用线索后再查看详情'
        loading.value = false
        return
      }
      lead.value = res.lead
    } else if (res.error) {
      error.value = res.error
    } else {
      error.value = '线索不存在'
    }

    // Load follow-ups if lead has a status beyond pending
    if (lead.value?.status && lead.value.status !== 'pending') {
      try {
        const fuRes = await leadStore.fetchFollowUps(id)
        if (fuRes.followUps) followUps.value = fuRes.followUps
      } catch {
        // Follow-ups load is optional
      }
    }
  } catch {
    error.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.scroll-area {
  padding: 20px 16px;
  background: var(--canvas);
  flex: 1;
  overflow-y: auto;
}

.info-card {
  background: var(--surface-card);
  border-radius: var(--radius-card);
  padding: 20px;
  margin-bottom: 12px;
}

.avatar-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--primary);
  color: var(--on-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 500;
  flex-shrink: 0;
}

.basic-info .name {
  font-size: 18px;
  font-weight: 500;
  color: var(--ink);
  margin-bottom: 4px;
}

.basic-info .phone {
  font-size: 14px;
  color: var(--body);
}

.source-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 14px;
  color: var(--muted);
  border-top: 1px solid var(--hairline-soft);
}

.source-row:first-of-type {
  border-top: 1px solid var(--hairline);
  padding-top: 12px;
}

.meta-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.status-pending { background: #f0ad4e; }
.status-dot.status-contacted { background: #5bc0de; }
.status-dot.status-negotiating { background: #5bc0de; }
.status-dot.status-converted { background: #5db872; }
.status-dot.status-abandoned { background: #c64545; }

.card-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--ink);
  margin-bottom: 4px;
}

.divider {
  height: 1px;
  background: var(--hairline);
  margin: 12px 0;
}

.field-row {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid var(--hairline-soft);
}

.field-row:last-child {
  border-bottom: none;
}

.field-label {
  width: 100px;
  flex-shrink: 0;
  font-size: 14px;
  color: var(--muted);
}

.field-value {
  flex: 1;
  font-size: 14px;
  color: var(--ink);
  word-break: break-word;
}

.empty-hint {
  font-size: 14px;
  color: var(--muted);
  text-align: center;
  padding: 16px 0;
}

.follow-item {
  padding: 12px 0;
  border-bottom: 1px solid var(--hairline-soft);
}

.follow-item:last-child {
  border-bottom: none;
}

.follow-note {
  font-size: 14px;
  color: var(--ink);
  margin-bottom: 6px;
  line-height: 1.4;
}

.follow-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--muted);
}

.follow-status {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.follow-status.status-pending { background: rgba(240, 173, 78, 0.1); color: #f0ad4e; }
.follow-status.status-contacted { background: rgba(91, 192, 222, 0.1); color: #5bc0de; }
.follow-status.status-negotiating { background: rgba(91, 192, 222, 0.1); color: #5bc0de; }
.follow-status.status-converted { background: rgba(93, 184, 114, 0.1); color: #5db872; }
.follow-status.status-abandoned { background: rgba(198, 69, 69, 0.1); color: #c64545; }
</style>
