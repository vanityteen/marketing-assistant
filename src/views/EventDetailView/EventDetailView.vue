<template>
  <div class="view-root">
    <!-- Header -->
    <div class="header">
      <ChevronLeft class="back-icon" @click="$router.push('/')" />
      <h1>活动详情</h1>
      <div class="spacer"></div>
    </div>

    <div class="scroll-area">
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

<style scoped>
.qr-section {
  padding: 30px 16px;
  text-align: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}
.qr-section p { font-size: 12px; color: var(--text-muted); margin-top: 12px; }
.qr-code {
  width: 180px; height: 180px;
  background: #fff;
  border-radius: 16px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}
.qr-code img { width: 100%; height: 100%; object-fit: contain; }
.qr-code .placeholder {
  width: 140px; height: 140px;
  background: #f0f0f0;
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.qr-code .placeholder svg { width: 40px; height: 40px; opacity: 0.4; }
.qr-code .placeholder span { font-size: 12px; color: var(--text-muted); }

.info-section { padding: 16px; }
.info-card {
  background: #f8f9fa;
  border-radius: var(--radius-card);
  padding: 16px;
  margin-bottom: 12px;
}
.info-card .row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}
.info-card .row:last-child { border-bottom: none; }
.info-card .label { font-size: 14px; color: var(--text-muted); }
.info-card .value { font-size: 14px; font-weight: 500; color: var(--text); }
.info-card .value.budget { color: var(--primary); }
.info-card .value.expense { color: #f44336; }
.info-card .value.roi { color: #4caf50; }

.desc-section { padding: 0 16px; }
.desc-section h3 { font-size: 15px; font-weight: 600; margin-bottom: 10px; }
.desc-section p { font-size: 14px; color: var(--text-secondary); line-height: 1.6; }

.leads-section { padding: 16px; margin-top: 16px; }
.leads-section .header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.leads-section h3 { font-size: 15px; font-weight: 600; }
.leads-section a { font-size: 13px; color: var(--primary); cursor: pointer; }

.lead-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-light);
}
.lead-item .avatar { width: 40px; height: 40px; font-size: 16px; }
.lead-item .info { flex: 1; margin-left: 12px; }
.lead-item .name { font-size: 14px; font-weight: 500; }
.lead-item .phone { font-size: 12px; color: var(--text-muted); }
</style>
