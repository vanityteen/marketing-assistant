<template>
  <div class="event-card-wrapper">
    <!-- Mobile: swipe-reveal actions (behind the card) -->
    <div class="swipe-delete-action" :class="{ visible: showSwipeDelete || swipeOffset > 0 }">
      <button class="swipe-action-btn swipe-action-btn-edit" @click.stop="handleEdit" title="编辑">
        <Edit3 :size="18" />
      </button>
      <button class="swipe-action-btn swipe-action-btn-danger" @click.stop="handleDelete" title="删除">
        <Trash2 :size="18" />
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

// Swipe state
const touchStartX = ref(0)
const touchStartY = ref(0)
const swipeOffset = ref(0)
const showSwipeDelete = ref(false)
const isHorizontalSwipe = ref(false)
const isDragging = ref(false)
const SWIPE_THRESHOLD = 50
const MAX_SWIPE = 130

watch(showSwipeDelete, (val) => {
  if (val) {
    document.dispatchEvent(new CustomEvent('close-event-swipe', {
      detail: { eventId: props.event.id }
    }))
  }
})

function onOtherSwipeOpen(e) {
  if (e.detail?.eventId === props.event.id) return
  showSwipeDelete.value = false
  swipeOffset.value = 0
}

onMounted(() => {
  document.addEventListener('close-event-dropdown', onOtherDropdownOpen)
  document.addEventListener('close-event-swipe', onOtherSwipeOpen)
})

onUnmounted(() => {
  document.removeEventListener('close-event-dropdown', onOtherDropdownOpen)
  document.removeEventListener('close-event-swipe', onOtherSwipeOpen)
})

function handleEdit() {
  router.push(`/event/${props.event.id}/edit`)
}

function onTouchStart(e) {
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
  isHorizontalSwipe.value = false
  isDragging.value = false

  // Close other swipe states immediately when touching a new card
  document.dispatchEvent(new CustomEvent('close-event-swipe', {
    detail: { eventId: props.event.id }
  }))
}

function onTouchMove(e) {
  const currentX = e.touches[0].clientX
  const currentY = e.touches[0].clientY

  if (showSwipeDelete.value) {
    // Card revealed (on the right) — allow right-swipe to close
    const deltaX = currentX - touchStartX.value
    if (deltaX > 5) {
      isDragging.value = true
      e.preventDefault()
      swipeOffset.value = Math.max(0, MAX_SWIPE - deltaX)
    }
    return
  }

  // Normal left-swipe to reveal actions on the right
  const diffX = touchStartX.value - currentX
  const diffY = currentY - touchStartY.value

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
  border-radius: var(--radius-card);
}

/* ─── Mobile swipe action area (behind the card) ─── */
.swipe-delete-action {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 130px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 12px;
  background: transparent;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.25s ease, visibility 0.25s ease;
  gap: 10px;
  z-index: 0;
}
.swipe-delete-action.visible {
  opacity: 1;
  visibility: visible;
}

@media (min-width: 768px) {
  .swipe-delete-action {
    display: none;
  }
  .event-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
}

@media (max-width: 767px) {
  .card-dropdown {
    display: none;
  }
}

.swipe-action-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.15s, background 0.15s;
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;
}
.swipe-action-btn:active {
  transform: scale(0.9);
}
.swipe-action-btn-edit {
  background: #007aff; /* Apple Blue */
}
.swipe-action-btn-danger {
  background: #ff3b30; /* Apple Red */
}

/* ─── Swipeable card ─── */
.event-card {
  position: relative;
  z-index: 1;
  background: var(--bg-white);
  border-radius: var(--radius-card);
  padding: 20px;
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: pan-y;
}
.event-card.dragging {
  transition: none;
}


/* ─── PC dropdown (inside card) ─── */
.card-dropdown {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 3;
}

.dropdown-trigger {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: var(--bg-white);
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  transition: color 0.2s, background 0.2s, transform 0.2s;
}
.dropdown-trigger:hover {
  background: #f5f5f5;
  color: var(--text);
  transform: scale(1.05);
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
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border);
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
  color: var(--accent);
}
.dropdown-item-danger:hover {
  background: rgba(232, 33, 39, 0.05);
}

.event-card .status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: var(--radius);
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 12px;
}
.event-card h3 { font-size: 17px; font-weight: 700; color: var(--text); margin-bottom: 8px; letter-spacing: -0.4px; }
.event-card .info { display: flex; flex-wrap: wrap; gap: 16px; font-size: 13px; color: var(--text-secondary); margin-bottom: 4px; }
.event-card .info span { display: flex; align-items: center; gap: 6px; }
.event-card .info svg { width: 14px; height: 14px; stroke-width: 2; color: var(--text-muted); }
.event-card .roi { font-size: 13px; font-weight: 600; color: var(--status-active); margin-top: 8px; text-transform: uppercase; letter-spacing: 0.5px; }

.qr-entry {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-top: 12px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s ease;
}
.qr-entry:hover {
  background: var(--primary);
  color: #fff;
}
.qr-entry svg { width: 14px; height: 14px; }
</style>
