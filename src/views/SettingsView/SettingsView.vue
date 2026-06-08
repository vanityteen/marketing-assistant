<template>
  <div class="view-root">
    <div class="header">
      <ChevronLeft class="back-icon" @click="$router.push('/')" />
      <h1>设置</h1>
      <div class="spacer"></div>
    </div>

    <div class="scroll-area">
      <!-- User Section -->
      <div v-if="userStore.user" class="user-section">
        <div class="user-avatar large">{{ userStore.user.name?.charAt(0) || '?' }}</div>
        <div class="user-info">
          <div class="user-name">{{ userStore.user.name }}</div>
          <div class="user-role">{{ roleLabel }}</div>
        </div>
      </div>

      <!-- Menu -->
      <div class="menu-section">
        <div class="menu-item" @click="$router.push('/')">
          <ShoppingBag />
          <div class="text">
            <div class="title">我的活动</div>
            <div class="desc">查看和管理我的活动</div>
          </div>
          <ChevronRight class="arrow" />
        </div>
        <div class="menu-item" @click="$router.push('/contacts')">
          <Users />
          <div class="text">
            <div class="title">通讯录</div>
            <div class="desc">查看和管理我的线索与客户</div>
          </div>
          <ChevronRight class="arrow" />
        </div>
        <div class="menu-item" @click="showToast('通知设置即将上线')">
          <Clock />
          <div class="text">
            <div class="title">通知设置</div>
            <div class="desc">管理通知和提醒</div>
          </div>
          <ChevronRight class="arrow" />
        </div>
      </div>

      <!-- Recovery Days -->
      <div class="setting-card">
        <div class="card-title">线索自动回收设置</div>
        <div class="recovery-setting">
          <span class="label">回收天数</span>
          <div class="options">
            <button v-for="d in [3, 7, 14]" :key="d" class="option" :class="{ active: selectedRecovery === d }" @click="setRecovery(d)">{{ d }}天</button>
          </div>
        </div>
      </div>

      <!-- Role Switch -->
      <div class="role-section">
        <div class="section-title">角色切换</div>
        <div class="role-options">
          <button :class="{ active: currentRole === 'marketer' }" @click="switchRole('marketer')">市场人员</button>
          <button :class="{ active: currentRole === 'salesperson' }" @click="switchRole('salesperson')">销售人员</button>
        </div>
      </div>

      <!-- Logout -->
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'
import { ChevronLeft, ShoppingBag, Users, Clock, ChevronRight } from 'lucide-vue-next'

const router = useRouter()
const userStore = useUserStore()
const { showToast } = useToast()

const selectedRecovery = ref(7)
const currentRole = ref('marketer')

const roleLabel = computed(() => currentRole.value === 'marketer' ? '市场人员' : '销售人员')

async function load() {
  await userStore.fetchUser()
  await userStore.fetchSettings()
  if (userStore.user) {
    currentRole.value = userStore.user.role || 'marketer'
  }
  if (userStore.settings) {
    selectedRecovery.value = userStore.settings.recovery_days || 7
  }
}

async function setRecovery(days) {
  selectedRecovery.value = days
  await userStore.updateRecovery(days)
  showToast(`线索将在 ${days} 天后自动回收`)
}

async function switchRole(role) {
  if (role === currentRole.value) return
  currentRole.value = role
  await userStore.updateRole(role)
  showToast(`已切换为${roleLabel.value}`)
}

async function handleLogout() {
  await userStore.logout()
  showToast('已退出登录')
}

onMounted(load)
</script>

<style scoped>
.user-section {
  display: flex;
  align-items: center;
  padding: 24px 16px;
  background: var(--surface-dark);
  color: var(--on-dark);
}
.user-avatar.large {
  width: 60px; height: 60px;
  background: rgba(255,255,255,0.12);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 500;
}
.user-info { margin-left: 16px; }
.user-info .user-name { font-size: 18px; font-weight: 500; color: var(--on-dark); }
.user-info .user-role { font-size: 14px; opacity: 0.7; color: var(--on-dark); }

.menu-section { padding: 16px; }
.menu-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: var(--canvas);
  border-radius: var(--radius-card);
  margin-bottom: 12px;
  border: 1px solid var(--hairline);
  cursor: pointer;
  transition: background 0.2s ease;
}
.menu-item:hover {
  background: var(--surface-soft);
}
.menu-item svg:first-child { width: 22px; height: 22px; color: var(--primary); flex-shrink: 0; }
.menu-item .text { flex: 1; margin-left: 14px; }
.menu-item .title { font-size: 15px; font-weight: 500; }
.menu-item .desc { font-size: 13px; color: var(--muted); margin-top: 2px; }
.menu-item .arrow { width: 16px; height: 16px; opacity: 0.4; color: var(--muted); }

.setting-card {
  padding: 16px;
  background: var(--canvas);
  border-radius: var(--radius-card);
  margin: 0 16px 12px;
  border: 1px solid var(--hairline);
}
.setting-card .card-title { font-size: 15px; font-weight: 500; margin-bottom: 16px; }

.recovery-setting {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}
.recovery-setting .label { font-size: 14px; color: var(--body); }
.recovery-setting .options { display: flex; gap: 8px; }
.recovery-setting .option {
  padding: 8px 16px;
  border-radius: var(--radius);
  font-size: 14px;
  background: var(--surface-card);
  color: var(--body);
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}
.recovery-setting .option.active {
  background: var(--primary);
  color: var(--on-primary);
}

.role-section { padding: 16px; }
.role-section .section-title { font-size: 15px; font-weight: 500; margin-bottom: 12px; }
.role-options { display: flex; gap: 12px; }
.role-options button {
  flex: 1;
  padding: 14px;
  border-radius: var(--radius);
  border: 1px solid var(--hairline);
  font-size: 14px;
  cursor: pointer;
  background: var(--canvas);
  color: var(--body);
  transition: all 0.2s ease;
}
.role-options button.active {
  border-color: var(--primary);
  background: rgba(204, 120, 92, 0.08);
  color: var(--primary);
}

.logout-btn {
  margin: 20px 16px;
  padding: 14px;
  background: var(--surface-soft);
  color: var(--body);
  border-radius: var(--radius);
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  display: block;
  width: calc(100% - 32px);
  transition: background 0.2s ease;
}
.logout-btn:hover {
  background: var(--surface-card);
}
</style>
