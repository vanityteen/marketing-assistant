<template>
  <div class="event-card-wrapper">
    <!-- Mobile: swipe-reveal actions (behind the card) -->
    <div class="swipe-delete-action" :class="{ visible: showSwipeDelete }">
      <button class="swipe-action-btn" @click.stop="handleEdit">
        <Edit3 :size="18" />
        <span>编辑</span>
      </button>
      <button class="swipe-action-btn swipe-action-btn-danger" @click.stop="handleDelete">
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
      <!-- PC: top-right dropdown menu (Edit / Delete) -->
      <div class="card-dropdown" @click.stop>
        <button class="dropdown-trigger" @click="showDropdown = !showDropdown" title="更多操作">
          <MoreHorizontal :size="16" />
        </button>
        <div v-if="showDropdown" class="dropdown-menu" @click="showDropdown = false">
          <div class="dropdown-item" @click="handleEdit">
            <Edit3 :size="14" />
            <span>编辑</span>
          </div>
          <div class="dropdown-item dropdown-item-danger" @click="handleDelete">
            <Trash2 :size="14" />
            <span>删除</span>
          </div>
        </div>
      </div>

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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import StatusBadge from './StatusBadge.vue'
import { Calendar, DollarSign, BarChart, Table, Trash2, MoreHorizontal, Edit3 } from 'lucide-vue-next'
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

// Dropdown state
const showDropdown = ref(false)
let skipNextClose = false

// Close dropdown on click outside, and listen for other cards' dropdowns
watch(showDropdown, (val) => {
  if (val) {
    // Notify other cards to close their dropdowns (but not ourselves)
    skipNextClose = true
    document.dispatchEvent(new CustomEvent('close-event-dropdown'))
    setTimeout(() => { skipNextClose = false }, 0)

    const handler = () => {
      showDropdown.value = false
      document.removeEventListener('click', handler)
    }
    // Wait for next tick so the current click event doesn't close it
    setTimeout(() => document.addEventListener('click', handler), 0)
  }
})

function onOtherDropdownOpen() {
  if (skipNextClose) return
  showDropdown.value = false
}

onMounted(() => {
  document.addEventListener('close-event-dropdown', onOtherDropdownOpen)
})

onUnmounted(() => {
  document.removeEventListener('close-event-dropdown', onOtherDropdownOpen)
})

function handleEdit() {
  router.push(`/event/${props.event.id}/edit`)
}

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

/* ─── Mobile swipe action area (behind the card) ─── */
.swipe-delete-action {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-radius: 0 var(--radius) var(--radius) 0;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.25s ease, visibility 0.25s ease;
  gap: 0;
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

.swipe-action-btn {
  flex: 1;
  background: none;
  border: none;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 12px;
  padding: 12px 0;
  transition: transform 0.15s, background 0.15s;
  line-height: 1;
  height: 100%;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}
.swipe-action-btn:active {
  transform: scale(0.92);
}
.swipe-action-btn-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
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
  -webkit-tap-highlight-color: transparent;
}
.event-card.dragging {
  transition: none;
}

/* ─── PC dropdown (inside card) ─── */
.card-dropdown {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
}

.dropdown-trigger {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: var(--bg-white);
  color: #999;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  transition: color 0.2s, background 0.2s, transform 0.2s;
}
.dropdown-trigger:hover {
  background: #f5f5f5;
  color: #666;
  transform: scale(1.1);
}
.dropdown-trigger:active {
  transform: scale(0.95);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  min-width: 120px;
  background: var(--bg-white);
  border-radius: var(--radius);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 10;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 14px;
  cursor: pointer;
  color: var(--text);
  transition: background 0.15s;
}
.dropdown-item:hover {
  background: #f5f5f5;
}
.dropdown-item-danger {
  color: #ef4444;
}
.dropdown-item-danger:hover {
  background: #fef2f2;
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
