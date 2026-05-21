<template>
  <div>
    <div v-if="loading" class="loading-text">加载中...</div>

    <div v-else-if="error" class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      <p>{{ error }}</p>
    </div>

    <!-- Success State -->
    <div v-else-if="submitted" class="success-section">
      <div class="success-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <h2 class="success-title">提交成功</h2>
      <p class="success-desc">感谢您的参与，信息已提交成功！</p>
    </div>

    <!-- Form -->
    <template v-else-if="event">
      <!-- Header Banner -->
      <div class="submit-header">
        <div class="submit-header-bg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="submit-header-icon"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          <h1>{{ event.name }}</h1>
          <p>请填写信息参与活动</p>
        </div>
      </div>

      <div class="form-section">
        <div v-for="field in event.form_fields" :key="field.name" class="form-item">
          <label>
            {{ field.name }}
            <span v-if="field.required" class="required-mark">*</span>
          </label>

          <input
            v-if="field.type === 'text'"
            v-model="formData[field.name]"
            type="text"
            :placeholder="'请输入' + field.name"
          />

          <textarea
            v-else-if="field.type === 'textarea'"
            v-model="formData[field.name]"
            :placeholder="'请输入' + field.name"
          ></textarea>

          <select v-else-if="field.type === 'select'" v-model="formData[field.name]">
            <option value="">请选择</option>
            <option v-for="opt in parseOptions(field.options)" :key="opt" :value="opt">{{ opt }}</option>
          </select>

          <div v-else-if="field.type === 'checkbox'" class="checkbox-group">
            <label v-for="opt in parseOptions(field.options)" :key="opt" class="checkbox-label">
              <input
                type="checkbox"
                :value="opt"
                :checked="isChecked(field.name, opt)"
                @change="toggleCheckbox(field.name, opt)"
              />
              <span>{{ opt }}</span>
            </label>
          </div>
        </div>

        <div v-if="formError" class="form-error-msg">{{ formError }}</div>

        <button class="action-btn" :disabled="submitting" @click="handleSubmit">
          {{ submitting ? '提交中...' : '提交信息' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/api'

const route = useRoute()

const loading = ref(true)
const error = ref('')
const event = ref(null)
const submitted = ref(false)
const submitting = ref(false)
const formError = ref('')
const formData = reactive({})

function parseOptions(options) {
  if (!options) return []
  return options.split(',').map(s => s.trim()).filter(Boolean)
}

function isChecked(fieldName, option) {
  const val = formData[fieldName]
  return Array.isArray(val) && val.includes(option)
}

function toggleCheckbox(fieldName, option) {
  const current = Array.isArray(formData[fieldName]) ? formData[fieldName] : []
  if (current.includes(option)) {
    formData[fieldName] = current.filter(v => v !== option)
  } else {
    formData[fieldName] = [...current, option]
  }
}

function validate() {
  const fields = event.value?.form_fields || []
  for (const field of fields) {
    if (!field.required) continue
    const val = formData[field.name]
    if (field.type === 'checkbox') {
      if (!Array.isArray(val) || val.length === 0) {
        formError.value = `请填写「${field.name}」`
        return false
      }
    } else if (!val || String(val).trim() === '') {
      formError.value = `请填写「${field.name}」`
      return false
    }
  }
  return true
}

async function handleSubmit() {
  formError.value = ''
  if (!validate()) return

  submitting.value = true
  try {
    const fields = event.value.form_fields
    const nameField = fields.find(f => f.name === '姓名')
    const phoneField = fields.find(f => f.name === '手机号码')

    const payload = {
      event_id: event.value.id,
      name: nameField ? (formData['姓名'] || '') : '',
      phone: phoneField ? (formData['手机号码'] || '') : '',
      custom_data: {},
    }

    for (const field of fields) {
      if (field.name === '姓名' || field.name === '手机号码') continue
      payload.custom_data[field.name] = formData[field.name] ?? ''
    }

    await api.submitLead(payload)
    submitted.value = true
  } catch (e) {
    formError.value = '提交失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const res = await api.getEvent(route.params.id)
    if (res.event) {
      event.value = res.event
      // Initialize form data
      for (const field of res.event.form_fields || []) {
        formData[field.name] = field.type === 'checkbox' ? [] : ''
      }
    } else {
      error.value = res.error || '活动不存在'
    }
  } catch {
    error.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.submit-header {
  background: var(--gradient);
  padding: 0;
  color: #fff;
}

.submit-header-bg {
  padding: 40px 24px 36px;
  text-align: center;
}

.submit-header-icon {
  width: 40px;
  height: 40px;
  margin-bottom: 12px;
  opacity: 0.6;
}

.submit-header h1 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #fff;
}

.submit-header p {
  font-size: 14px;
  opacity: 0.8;
}

.required-mark {
  color: #e53935;
  margin-left: 2px;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: 1px solid #e0e0e0;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 14px;
  color: var(--text-secondary);
  transition: all 0.2s;
  background: var(--bg-white);
}

.checkbox-label:has(input:checked) {
  border-color: var(--primary);
  color: var(--primary);
  background: #f5f7ff;
}

.checkbox-label input {
  width: auto;
  accent-color: var(--primary);
}

.form-error-msg {
  background: #fce4ec;
  color: #c62828;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  margin-bottom: 16px;
  text-align: center;
}

.success-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: 40px 24px;
  text-align: center;
}

.success-icon {
  width: 80px;
  height: 80px;
  background: #e8f5e9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.success-icon svg {
  width: 40px;
  height: 40px;
  color: #2e7d32;
}

.success-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 8px;
}

.success-desc {
  font-size: 15px;
  color: var(--text-secondary);
}
</style>
