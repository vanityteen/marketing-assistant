<template>
  <div class="field-section">
    <div class="section-title">
      <Settings />
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
      <Plus />
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
              <FileText v-if="t.type === 'text' || t.type === 'textarea'" style="width: 32px; height: 32px; margin-bottom: 8px;" />
              <Search v-if="t.type === 'select'" style="width: 32px; height: 32px; margin-bottom: 8px;" />
              <Check v-if="t.type === 'checkbox'" style="width: 32px; height: 32px; margin-bottom: 8px;" />
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
import { Settings, Plus, FileText, Search, Check } from 'lucide-vue-next'

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

<style scoped>
.field-section { margin-top: 24px; }
.field-section .section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 16px;
}
.section-title svg { width: 18px; height: 18px; color: var(--primary); }

.field-card {
  background: #f8f9fa;
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 12px;
}
.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.field-name { font-size: 14px; font-weight: 500; }
.field-type { font-size: 12px; color: var(--text-muted); }
.field-actions { display: flex; gap: 8px; }
.field-actions button {
  width: 28px; height: 28px;
  border: none;
  border-radius: 6px;
  background: var(--bg-white);
  font-size: 14px;
  cursor: pointer;
  color: var(--text-secondary);
}
.field-card .form-item { margin-bottom: 12px; }
.field-card .form-item:last-child { margin-bottom: 0; }

.add-field-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  border: 2px dashed #ddd;
  border-radius: var(--radius);
  margin-top: 12px;
  cursor: pointer;
  color: var(--text-muted);
}
.add-field-btn svg { width: 20px; height: 20px; }
</style>
