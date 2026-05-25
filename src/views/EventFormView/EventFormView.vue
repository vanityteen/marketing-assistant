<template>
  <div>
    <!-- Header -->
    <div class="header">
      <ChevronLeft class="back-icon" @click="$router.push('/')" />
      <h1>{{ isEdit ? '编辑活动' : '创建活动' }}</h1>
      <span class="btn" @click="submit">{{ isEdit ? '保存' : '保存' }}</span>
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

    <button class="action-btn" @click="submit">{{ isEdit ? '保存修改' : '创建活动并生成二维码' }}</button>
  </div>
</template>

<script setup>
import { reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEventStore } from '@/stores/event'
import { useToast } from '@/composables/useToast'
import FieldConfig from '@/components/FieldConfig.vue'
import { ChevronLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const eventStore = useEventStore()
const { showToast } = useToast()

const isEdit = computed(() => !!route.params.id)

const form = reactive({
  name: '',
  start_date: '',
  end_date: '',
  budget: 0,
  description: '',
  form_fields: [],
})

onMounted(async () => {
  if (isEdit.value) {
    const res = await eventStore.fetchEvent(route.params.id)
    if (res.event) {
      const e = res.event
      form.name = e.name || ''
      form.start_date = e.start_date ? e.start_date.slice(0, 10) : ''
      form.end_date = e.end_date ? e.end_date.slice(0, 10) : ''
      form.budget = e.budget || 0
      form.description = e.description || ''
      form.form_fields = (e.form_fields || []).map(f => ({
        _key: Date.now() + Math.random(),
        label: f.name || '',
        type: f.type || 'text',
        required: f.required || false,
        options: f.options || '',
      }))
    }
  }
})

async function submit() {
  if (!form.name || !form.start_date || !form.end_date) {
    showToast('请填写必要字段')
    return
  }

  const payload = {
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
  }

  let res
  if (isEdit.value) {
    res = await eventStore.updateEvent(route.params.id, payload)
  } else {
    res = await eventStore.createEvent(payload)
  }

  if (res.event) {
    showToast(isEdit.value ? '活动已更新' : '活动创建成功')
    setTimeout(() => router.push('/'), 1500)
  } else if (res.error) {
    showToast(res.error)
  }
}
</script>
