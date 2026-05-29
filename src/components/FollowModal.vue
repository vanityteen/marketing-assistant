<template>
  <div class="modal-overlay" :class="{ active: visible }" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-top-header">
        <h2>跟进线索</h2>
        <p>{{ lead?.name }} - {{ lead?.phone ? maskPhone(lead.phone) : '' }}</p>
      </div>
      <div class="modal-body">
        <div style="margin-bottom: 12px; font-size: 14px; font-weight: 500;">选择状态</div>
        <div class="status-grid">
          <button
            v-for="s in statuses" :key="s.value"
            class="status-btn"
            :class="{ active: selectedStatus === s.value }"
            @click="selectedStatus = s.value"
          >{{ s.label }}</button>
        </div>

        <div style="margin-bottom: 12px; font-size: 14px; font-weight: 500;">线索评分</div>
        <div class="stars">
          <div
            v-for="i in 5" :key="i"
            class="star" :class="{ active: i <= rating }"
            @click="rating = i"
          >
            <Star :fill="i <= rating ? '#ffc107' : 'none'" :stroke-width="1" />
          </div>
        </div>

        <div class="note-section">
          <textarea v-model="note" placeholder="请输入跟进内容..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="$emit('close')">取消</button>
        <button class="confirm-btn" @click="handleSave">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Star } from 'lucide-vue-next'

const props = defineProps({
  visible: { type: Boolean, default: false },
  lead: { type: Object, default: null },
})

const emit = defineEmits(['close', 'save'])

const statuses = [
  { value: 'pending', label: '待联系' },
  { value: 'contacted', label: '已联系' },
  { value: 'negotiating', label: '洽谈中' },
  { value: 'converted', label: '已转化' },
  { value: 'abandoned', label: '已放弃' },
]

const selectedStatus = ref('contacted')
const rating = ref(3)
const note = ref('')

watch(() => props.visible, (v) => {
  if (v) {
    selectedStatus.value = props.lead?.status === 'pending' ? 'contacted' : (props.lead?.status || 'contacted')
    rating.value = props.lead?.rating || 3
    note.value = ''
  }
})

function maskPhone(phone) {
  if (!phone) return ''
  return phone.length >= 7 ? phone.slice(0, 3) + '****' + phone.slice(-4) : phone
}

function handleSave() {
  emit('save', {
    status: selectedStatus.value,
    rating: rating.value,
    note: note.value,
  })
}
</script>

<style scoped>
.status-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
.status-btn {
  padding: 10px;
  border-radius: var(--radius);
  border: 1px solid var(--hairline);
  font-size: 13px;
  background: var(--canvas);
  cursor: pointer;
  color: var(--body);
  transition: all 0.2s ease;
}
.status-btn.active {
  border-color: var(--primary);
  background: rgba(204, 120, 92, 0.08);
  color: var(--primary);
}

.stars { display: flex; gap: 12px; margin-bottom: 20px; }
.star {
  width: 40px; height: 40px;
  border-radius: 50%;
  border: 1px solid var(--hairline);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--muted-soft);
}
.star svg { width: 20px; height: 20px; }
.star.active { border-color: var(--accent-amber); background: rgba(232, 165, 90, 0.08); color: var(--accent-amber); }

.note-section textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--hairline);
  border-radius: var(--radius);
  font-size: 14px;
  min-height: 100px;
  resize: none;
  outline: none;
  font-family: inherit;
  color: var(--ink);
  background: var(--canvas);
}
.note-section textarea:focus { border-color: var(--primary); }

.modal-footer { display: flex; border-top: 1px solid var(--hairline); }
.modal-footer button {
  flex: 1;
  padding: 16px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.modal-footer .cancel-btn { background: var(--surface-soft); color: var(--body); }
.modal-footer .confirm-btn { background: var(--primary); color: var(--on-primary); }
</style>
