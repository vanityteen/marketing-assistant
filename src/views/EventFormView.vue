<template>
  <div>
    <!-- Header -->
    <div class="header">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="back-icon" @click="$router.push('/')">
        <path d="M15 19l-7-7 7-7"/>
      </svg>
      <h1>创建活动</h1>
      <span class="btn" @click="submit">保存</span>
    </div>

    <div class="form-section">
      <div class="form-item">
        <label>活动名称 *</label>
        <input type="text" v-model="form.name" placeholder="请输入活动名称" />
      </div>

      <div class="date-row">
        <div class="form-item">
          <label>开始时间 *</label>
          <input type="date" v-model="form.start_date" />
        </div>
        <div class="form-item">
          <label>结束时间 *</label>
          <input type="date" v-model="form.end_date" />
        </div>
      </div>

      <div class="form-item">
        <label>预算金额 *</label>
        <input type="number" v-model.number="form.budget" placeholder="请输入预算金额" />
      </div>

      <div class="form-item">
        <label>活动描述</label>
        <textarea v-model="form.description" placeholder="请输入活动描述"></textarea>
      </div>

      <!-- Field Configuration -->
      <FieldConfig v-model="form.form_fields" />
    </div>

    <button class="action-btn" @click="submit">创建活动并生成二维码</button>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useEventStore } from '@/stores/event'
import { useToast } from '@/composables/useToast'
import FieldConfig from '@/components/FieldConfig.vue'

const router = useRouter()
const eventStore = useEventStore()
const { showToast } = useToast()

const form = reactive({
  name: '',
  start_date: '',
  end_date: '',
  budget: 0,
  description: '',
  form_fields: [],
})

async function submit() {
  if (!form.name || !form.start_date || !form.end_date) {
    showToast('请填写必要字段')
    return
  }

  const res = await eventStore.createEvent({
    name: form.name,
    start_date: form.start_date,
    end_date: form.end_date,
    budget: form.budget,
    description: form.description,
    form_fields: form.form_fields.map(f => ({
      name: f.label,
      type: f.type,
      required: f.required,
      options: f.options,
    })),
  })

  if (res.event) {
    showToast('活动创建成功')
    setTimeout(() => router.push('/'), 1500)
  } else if (res.error) {
    showToast(res.error)
  }
}
</script>
