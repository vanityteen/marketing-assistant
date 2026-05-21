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
