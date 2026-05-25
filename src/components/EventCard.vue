<template>
  <div class="event-card-wrapper">
    <!-- Mobile: swipe-reveal delete action (behind the card) -->
    <div class="swipe-delete-action" :class="{ visible: showSwipeDelete }">
      <button class="swipe-delete-btn" @click.stop="handleDelete">
        <Trash2 :size="18" />
        <span>删除</span>
      </button>
    </div>

    <div
      class="event-card"
      :class="{ dragging: isDragging }"
      :style="cardStyle"
      @click="handleCardClick"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <!-- PC: top-right delete button (inside card, so clipped by card border-radius) -->
      <button class="card-delete-btn" @click.stop="handleDelete" title="删除活动">
        <Trash2 :size="14" />
      </button>

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
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import StatusBadge from './StatusBadge.vue'
import { Calendar, DollarSign, BarChart, Table, Trash2 } from 'lucide-vue-next'
import { useEventStore } from '@/stores/event'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  event: { type: Object, required: true },
  showQR: { type: Boolean, default: false },
})

const emit = defineEmits(['deleted'])

const router = useRouter()
const eventStore = useEventStore()
const toast = useToast()

// Swipe state
const touchStartX = ref(0)
const touchStartY = ref(0)
const swipeOffset = ref(0)
const showSwipeDelete = ref(false)
const isHorizontalSwipe = ref(false)
const isDragging = ref(false)
const SWIPE_THRESHOLD = 70
const MAX_SWIPE = 100

function onTouchStart(e) {
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
  isHorizontalSwipe.value = false
  isDragging.value = false
}

function onTouchMove(e) {
  const currentX = e.touches[0].clientX
  const currentY = e.touches[0].clientY

  if (showSwipeDelete.value) {
    // Card revealed — allow right-swipe to close
    const deltaX = currentX - touchStartX.value
    if (deltaX > 5) {
      isDragging.value = true
      e.preventDefault()
      swipeOffset.value = Math.max(0, MAX_SWIPE - deltaX)
    }
    return
  }

  // Normal left-swipe to reveal delete
  const diffX = touchStartX.value - currentX
  const diffY = touchStartY.value - currentY

  if (!isHorizontalSwipe.value) {
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10 && diffX > 0) {
      isHorizontalSwipe.value = true
    } else if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 10) {
      return
    }
  }

  if (isHorizontalSwipe.value) {
    isDragging.value = true
    e.preventDefault()
    swipeOffset.value = Math.min(diffX, MAX_SWIPE)
  }
}

function onTouchEnd() {
  if (showSwipeDelete.value) {
    if (swipeOffset.value < SWIPE_THRESHOLD) {
      showSwipeDelete.value = false
      swipeOffset.value = 0
    } else {
      swipeOffset.value = MAX_SWIPE
    }
  } else if (swipeOffset.value >= SWIPE_THRESHOLD) {
    showSwipeDelete.value = true
    swipeOffset.value = MAX_SWIPE
  } else {
    swipeOffset.value = 0
  }
  isHorizontalSwipe.value = false
  isDragging.value = false
}

const cardStyle = computed(() => {
  if (showSwipeDelete.value || swipeOffset.value > 0) {
    return { transform: `translateX(-${swipeOffset.value}px)` }
  }
  return {}
})

function handleCardClick() {
  if (showSwipeDelete.value) {
    showSwipeDelete.value = false
    swipeOffset.value = 0
    return
  }
  router.push(`/event/${props.event.id}`)
}

async function handleDelete() {
  showSwipeDelete.value = false
  swipeOffset.value = 0

  if (!confirm(`确定要删除活动"${props.event.name}"吗？此操作不可恢复。`)) return
  try {
    await eventStore.deleteEvent(props.event.id)
    toast.showToast('活动已删除')
    emit('deleted', props.event.id)
  } catch {
    toast.showToast('删除失败，请重试')
  }
}

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

<style scoped>
.event-card-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius);
}

/* ─── Mobile swipe delete area (behind the card) ─── */
.swipe-delete-action {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  border-radius: 0 var(--radius) var(--radius) 0;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.25s ease, visibility 0.25s ease;
}
.swipe-delete-action.visible {
  opacity: 1;
  visibility: visible;
}

@media (min-width: 768px) {
  .swipe-delete-action {
    display: none;
  }
}

.swipe-delete-btn {
  background: none;
  border: none;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 12px;
  padding: 12px;
  transition: transform 0.15s;
  line-height: 1;
}
.swipe-delete-btn:active {
  transform: scale(0.92);
}

/* ─── Swipeable card ─── */
.event-card {
  position: relative;
  z-index: 1;
  background: var(--bg-white);
  border-radius: var(--radius);
  padding: 16px;
  margin: 0 16px;
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  -webkit-user-select: none;
}
.event-card.dragging {
  transition: none;
}

/* ─── PC delete button (inside card) ─── */
.card-delete-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: var(--bg-white);
  color: #999;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  transition: opacity 0.2s, color 0.2s, background 0.2s, transform 0.2s;
}
.event-card:hover .card-delete-btn {
  opacity: 1;
}
.card-delete-btn:hover {
  background: #fee2e2;
  color: #ef4444;
  transform: scale(1.1);
}
.card-delete-btn:active {
  transform: scale(0.95);
}

.event-card .status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  margin-bottom: 8px;
}
.event-card h3 { font-size: 16px; font-weight: 600; color: var(--text); margin-bottom: 8px; }
.event-card .info { display: flex; flex-wrap: wrap; gap: 12px; font-size: 13px; color: var(--text-secondary); }
.event-card .info span { display: flex; align-items: center; gap: 4px; }
.event-card .info svg { width: 14px; height: 14px; }
.event-card .roi { font-size: 14px; font-weight: 600; color: #4caf50; margin-top: 8px; }

.qr-entry {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--primary);
  margin-top: 8px;
  cursor: pointer;
}
.qr-entry svg { width: 14px; height: 14px; }
</style>
