<template>
  <div class="event-card" @click="$router.push(`/event/${event.id}`)">
    <StatusBadge :status="event.status" />
    <h3>{{ event.name }}</h3>
    <div class="info">
      <span>
        <Calendar />
        {{ formatDate(event.start_date) }} 至 {{ formatShortDate(event.end_date) }}
      </span>
      <span>
        <DollarSign />
        ¥{{ formatNumber(event.budget) }}
      </span>
      <span>
        <BarChart />
        {{ event.lead_count || 0 }}条线索
      </span>
    </div>
    <div class="roi">💰 ROI: {{ event.roi || 0 }}%</div>
    <div v-if="showQR" class="qr-entry" @click.stop="$router.push(`/event/${event.id}`)">
      <Table />
      查看活动二维码
    </div>
  </div>
</template>

<script setup>
import StatusBadge from './StatusBadge.vue'
import { Calendar, DollarSign, BarChart, Table } from 'lucide-vue-next'

const props = defineProps({
  event: { type: Object, required: true },
  showQR: { type: Boolean, default: false },
})

function formatDate(d) {
  if (!d) return ''
  return d.slice(0, 10)
}
function formatShortDate(d) {
  if (!d) return ''
  return d.slice(5, 10)
}
function formatNumber(n) {
  return Number(n || 0).toLocaleString()
}
</script>
