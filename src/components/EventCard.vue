<template>
  <div class="event-card" @click="$router.push(`/event/${event.id}`)">
    <StatusBadge :status="event.status" />
    <h3>{{ event.name }}</h3>
    <div class="info">
      <span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        {{ formatDate(event.start_date) }} 至 {{ formatShortDate(event.end_date) }}
      </span>
      <span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        ¥{{ formatNumber(event.budget) }}
      </span>
      <span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-6"/></svg>
        {{ event.lead_count || 0 }}条线索
      </span>
    </div>
    <div class="roi">💰 ROI: {{ event.roi || 0 }}%</div>
    <div v-if="showQR" class="qr-entry" @click.stop="$router.push(`/event/${event.id}`)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="3"/><line x1="15" y1="5" x2="21" y2="5"/><line x1="15" y1="19" x2="21" y2="19"/><line x1="5" y1="15" x2="5" y2="21"/></svg>
      查看活动二维码
    </div>
  </div>
</template>

<script setup>
import StatusBadge from './StatusBadge.vue'

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
