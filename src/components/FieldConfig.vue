<template>
  <div class="field-section">
    <div class="section-title">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7.5 18H3v-3.5a2.121 2.121 0 0 1 3-3z"/>
      </svg>
      表单字段配置
    </div>

    <div v-for="(field, index) in modelValue" :key="field._key" class="field-card">
      <div class="field-header">
        <div>
          <div class="field-name">{{ field.label || '新字段' }}</div>
          <div class="field-type">{{ typeLabel(field.type) }}</div>
        </div>
        <div class="field-actions">
          <button :disabled="index === 0" @click="moveUp(index)" :style="{ opacity: index === 0 ? 0.3 : 1 }">↑</button>
          <button :disabled="index === modelValue.length - 1" @click="moveDown(index)" :style="{ opacity: index === modelValue.length - 1 ? 0.3 : 1 }">↓</button>
          <button @click="remove(index)">×</button>
        </div>
      </div>

      <div class="form-item">
        <label>字段名称</label>
        <input type="text" :value="field.label" @input="updateField(index, 'label', $event.target.value)" placeholder="请输入字段名称" />
      </div>

      <div v-if="field.type === 'select' || field.type === 'checkbox'" class="form-item">
        <label>选项内容（用逗号分隔）</label>
        <input type="text" :value="field.options" @input="updateField(index, 'options', $event.target.value)" placeholder="选项1,选项2,选项3" />
      </div>

      <div class="form-item">
        <label>是否必填</label>
        <select :value="field.required" @change="updateField(index, 'required', $event.target.value === 'true')">
          <option :value="false">否</option>
          <option :value="true">是</option>
        </select>
      </div>
    </div>

    <div class="add-field-btn" @click="showTypePicker = true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      添加字段
    </div>

    <!-- Field Type Picker Modal -->
    <div class="modal-overlay" :class="{ active: showTypePicker }" @click.self="showTypePicker = false">
      <div class="modal" style="max-width: 320px;">
        <div class="modal-top-header">
          <h2>选择字段类型</h2>
          <button class="modal-close-btn" @click="showTypePicker = false">×</button>
        </div>
        <div class="modal-body">
          <div class="field-type-list" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
            <div v-for="t in fieldTypes" :key="t.type" class="field-type-item" @click="addField(t.type)" style="padding: 16px; background: #f8f9fa; border-radius: 12px; text-align: center; cursor: pointer;">
              <svg v-if="t.type === 'text'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 32px; height: 32px; margin-bottom: 8px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
              <svg v-if="t.type === 'textarea'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 32px; height: 32px; margin-bottom: 8px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              <svg v-if="t.type === 'select'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 32px; height: 32px; margin-bottom: 8px;"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <svg v-if="t.type === 'checkbox'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 32px; height: 32px; margin-bottom: 8px;"><polyline points="20 6 9 17 4 12"/></svg>
              <div class="label" style="font-size: 14px; font-weight: 500;">{{ t.label }}</div>
              <div class="desc" style="font-size: 12px; color: var(--text-muted);">{{ t.desc }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])

const showTypePicker = ref(false)

const fieldTypes = [
  { type: 'text', label: '文本字段', desc: '单行文本输入' },
  { type: 'textarea', label: '多行文本', desc: '多行文本输入' },
  { type: 'select', label: '下拉选择', desc: '单选选项' },
  { type: 'checkbox', label: '多选框', desc: '多选选项' },
]

let keyCounter = Date.now()
function newKey() { return ++keyCounter }

function typeLabel(type) {
  const t = fieldTypes.find(f => f.type === type)
  return t ? t.label : type
}

function addField(type) {
  const newField = {
    _key: newKey(),
    label: '新字段',
    type,
    required: false,
    options: type === 'select' || type === 'checkbox' ? '' : undefined,
  }
  emit('update:modelValue', [...props.modelValue, newField])
  showTypePicker.value = false
}

function remove(index) {
  const next = [...props.modelValue]
  next.splice(index, 1)
  emit('update:modelValue', next)
}

function moveUp(index) {
  if (index === 0) return
  const next = [...props.modelValue]
  ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
  emit('update:modelValue', next)
}

function moveDown(index) {
  if (index === props.modelValue.length - 1) return
  const next = [...props.modelValue]
  ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
  emit('update:modelValue', next)
}

function updateField(index, key, value) {
  const next = [...props.modelValue]
  next[index] = { ...next[index], [key]: value }
  emit('update:modelValue', next)
}
</script>
