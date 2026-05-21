<template>
  <div>
    <!-- Header -->
    <div class="header">
      <ChevronLeft class="back-icon" @click="$router.push('/')" />
      <h1>活动详情</h1>
      <div class="spacer"></div>
    </div>

    <div v-if="loading" class="loading-text">加载中...</div>
    <template v-else-if="event">
      <!-- QR Code -->
      <div class="qr-section">
        <div class="qr-code">
          <img v-if="qrCode" :src="qrCode" alt="活动二维码" />
          <div v-else class="placeholder">
            <Table />
            <span>活动二维码</span>
          </div>
        </div>
        <p v-if="!qrCode">正在生成二维码...</p>
        <p v-else>用户扫码即可录入线索</p>
      </div>

      <!-- Info -->
      <div class="info-section">
        <div class="info-card">
          <div class="row"><span class="label">活动名称</span><span class="value">{{ event.name }}</span></div>
          <div class="row"><span class="label">活动时间</span><span class="value">{{ event.start_date }} 至 {{ event.end_date }}</span></div>
          <div class="row"><span class="label">预算金额</span><span class="value budget">¥{{ formatNumber(event.budget) }}</span></div>
          <div class="row"><span class="label">实际花销</span><span class="value expense">¥{{ formatNumber(event.expense) }}</span></div>
          <div class="row"><span class="label">活动ROI</span><span class="value roi">{{ event.roi || 0 }}%</span></div>
        </div>
      </div>

      <!-- Description -->
      <div v-if="event.description" class="desc-section">
        <h3>活动描述</h3>
        <p>{{ event.description }}</p>
      </div>

      <!-- Leads -->
      <div class="leads-section">
        <div class="header-row">
          <h3>关联线索</h3>
          <a @click="$router.push('/leads/public')">查看全部 →</a>
        </div>
        <div v-if="!leads || leads.length === 0" class="empty-state" style="padding: 20px 0;">
          <div>暂无关联线索</div>
        </div>
        <div v-for="lead in leads" :key="lead.id" class="lead-item">
          <div class="avatar">{{ lead.name?.charAt(0) || '?' }}</div>
          <div class="info">
            <div class="name">{{ lead.name }}</div>
            <div class="phone">{{ maskPhone(lead.phone) }}</div>
          </div>
          <StatusBadge :status="lead.status" />
        </div>
      </div>

      <!-- Share Button -->
      <button v-if="qrCode" class="action-btn" @click="shareQR">分享活动二维码</button>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useEventStore } from '@/stores/event'
import StatusBadge from '@/components/StatusBadge.vue'
import { ChevronLeft, Table } from 'lucide-vue-next'

const route = useRoute()
const eventStore = useEventStore()

const event = ref(null)
const leads = ref([])
const qrCode = ref(null)
const loading = ref(true)

async function load() {
  loading.value = true
  const res = await eventStore.fetchEvent(route.params.id)
  if (res.event) {
    event.value = res.event
    leads.value = res.leads || []
  }
  loading.value = false

  // Load QR code
  try {
    const qrRes = await eventStore.getEventQR(route.params.id)
    if (qrRes.qrcode) qrCode.value = qrRes.qrcode
  } catch (e) {
    // QR generation failed silently
  }
}

function formatNumber(n) {
  return Number(n || 0).toLocaleString()
}

function maskPhone(phone) {
  if (!phone) return ''
  return phone.length >= 7 ? phone.slice(0, 3) + '****' + phone.slice(-4) : phone
}

function shareQR() {
  // Use Web Share API if available
  if (navigator.share) {
    navigator.share({
      title: event.value?.name,
      text: `扫码参与活动：${event.value?.name}`,
    }).catch(() => {})
  }
}

onMounted(load)
</script>
