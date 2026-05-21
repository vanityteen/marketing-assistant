<template>
  <div>
    <div class="header">
      <ChevronLeft class="back-icon" @click="$router.push('/')" />
      <h1>设置</h1>
      <div class="spacer"></div>
    </div>

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
      <div class="menu-item" @click="$router.push('/leads/personal')">
        <Users />
        <div class="text">
          <div class="title">我的线索</div>
          <div class="desc">查看我的线索和客户</div>
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
