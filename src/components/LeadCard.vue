<template>
  <div class="lead-card">
    <span v-if="showStatus" class="status-badge" :class="`status-${lead.status}`">
      {{ statusLabel }}
    </span>
    <div class="avatar">{{ lead.name?.charAt(0) || '?' }}</div>
    <div class="info">
      <div class="name">{{ lead.name }}</div>
      <div class="phone">{{ maskPhone(lead.phone) }}</div>
      <div v-if="lead.event_name" class="source">来源：{{ lead.event_name }}</div>
      <div v-if="showTime && lead.claimed_at" class="time">领用时间：{{ formatDate(lead.claimed_at) }}</div>
    </div>
    <slot name="action" :lead="lead"></slot>
  </div>
</template>

<script setup>
const props = defineProps({
  lead: { type: Object, required: true },
  showStatus: { type: Boolean, default: false },
  showTime: { type: Boolean, default: false },
})

const statusLabels = {
  pending: '待联系', contacted: '已联系', negotiating: '洽谈中',
  converted: '已转化', abandoned: '已放弃',
}

const statusLabel = statusLabels[props.lead.status] || props.lead.status

function maskPhone(phone) {
  if (!phone) return ''
  return phone.length >= 7
    ? phone.slice(0, 3) + '****' + phone.slice(-4)
    : phone
}
function formatDate(d) {
  if (!d) return ''
  return d.slice(0, 10)
}
</script>
