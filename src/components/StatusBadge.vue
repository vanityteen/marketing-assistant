<template>
  <span class="status-badge" :class="`status-${status}`">{{ label }}</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, default: 'pending' },
})

const labels = {
  not_started: '未开启',
  active: '进行中',
  ended: '已结束',
  pending: '待联系',
  contacted: '已联系',
  negotiating: '洽谈中',
  converted: '已转化',
  abandoned: '已放弃',
}

const label = computed(() => labels[props.status] || props.status)
</script>
