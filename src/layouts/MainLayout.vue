<template>
  <div class="main-layout">
    <!-- 顶部导航 -->
    <header class="top-navbar">
      <div class="nav-left">
        <div class="logo">
          <span class="logo-icon">🏥</span>
          <span class="logo-text">对练·康复师管理端</span>
        </div>
      </div>
      <nav class="nav-menu">
        <router-link
          v-for="item in navItems"
          :key="item.key"
          :to="item.path"
          class="nav-item"
          :class="{ active: isNavActive(item.key) }"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
      <div class="nav-right">
        <!-- 消息通知 -->
        <div class="notification-wrapper">
          <el-badge :value="store.unreadNotificationCount" :hidden="store.unreadNotificationCount === 0" :max="99" class="notification-badge">
            <el-button class="notification-btn" circle @click="showNotificationPanel = !showNotificationPanel">
              <el-icon :size="18"><Bell /></el-icon>
            </el-button>
          </el-badge>
          <!-- 通知面板 -->
          <div v-if="showNotificationPanel" class="notification-panel" @click.stop>
            <div class="notification-header">
              <span class="notification-title">训练未完成提醒</span>
              <el-button type="primary" link size="small" @click="handleMarkAllRead">全部已读</el-button>
            </div>
            <div class="notification-list">
              <div
                v-for="item in store.incompleteTrainingPatients"
                :key="item.patient.id"
                class="notification-item"
                :class="{ unread: !isRead(item.patient.id) }"
                @click="handleNotificationClick(item)"
              >
                <div class="notification-avatar" :style="{ background: item.patient.avatarColor }">
                  {{ item.patient.name.charAt(0) }}
                </div>
                <div class="notification-content">
                  <div class="notification-name">
                    {{ item.patient.name }}
                    <el-tag v-if="!isRead(item.patient.id)" size="small" type="danger" effect="light">未完成</el-tag>
                    <el-tag v-else size="small" type="info" effect="plain">已读</el-tag>
                  </div>
                  <div class="notification-desc">{{ item.incompleteDate }}训练未完成</div>
                </div>
                <el-icon class="notification-arrow"><ArrowRight /></el-icon>
              </div>
              <div v-if="store.incompleteTrainingPatients.length === 0" class="notification-empty">
                <el-icon :size="40"><CircleCheck /></el-icon>
                <p>今日所有患者均已完成训练</p>
              </div>
            </div>
            <div class="notification-footer">
              共 {{ store.incompleteTrainingPatients.length }} 位患者未完成训练
            </div>
          </div>
        </div>
        <el-dropdown>
          <div class="user-info">
            <el-avatar :size="32" style="background: #fff; color: var(--primary-color)">刘</el-avatar>
            <span class="user-name">刘富玉</span>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleRegenerate">重新生成当前患者数据</el-dropdown-item>
              <el-dropdown-item @click="handleReset">重置全部测试数据</el-dropdown-item>
              <el-dropdown-item>个人设置</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <div class="layout-body">
      <!-- 左侧患者列表 -->
      <aside class="sidebar" v-if="showSidebar">
        <PatientSidebar />
      </aside>

      <!-- 主内容区 -->
      <main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Bell, ArrowRight, CircleCheck } from '@element-plus/icons-vue'
import PatientSidebar from '@/components/PatientSidebar.vue'
import { usePatientStore } from '@/stores/patient'

const route = useRoute()
const router = useRouter()
const store = usePatientStore()

const showNotificationPanel = ref(false)

const navItems = [
  { key: 'patient', label: '患者管理', icon: '👥', path: '/patient/report' },
  { key: 'action', label: '动作库', icon: '🏃', path: '/action-library' },
  { key: 'offline', label: '线下治疗', icon: '🏥', path: '/offline' },
  { key: 'plan', label: '方案库', icon: '📋', path: '/plan-library' }
]

const showSidebar = computed(() => route.meta.topNav === 'patient')

function isNavActive(key: string) {
  return route.meta.topNav === key
}

function isRead(patientId: string): boolean {
  return store.readNotificationIds?.has(patientId) || false
}

function handleNotificationClick(item: any) {
  store.selectPatient(item.patient.id)
  store.markNotificationRead(item.patient.id)
  showNotificationPanel.value = false
  router.push('/patient/report')
}

function handleMarkAllRead() {
  store.markAllNotificationsRead()
  ElMessage.success('已全部标记为已读')
}

// 点击外部关闭通知面板
function handleClickOutside(e: MouseEvent) {
  if (showNotificationPanel.value) {
    const target = e.target as HTMLElement
    if (!target.closest('.notification-wrapper')) {
      showNotificationPanel.value = false
    }
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function handleReset() {
  ElMessageBox.confirm('确定要重置所有测试数据吗？此操作不可恢复。', '提示', {
    confirmButtonText: '确定重置',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    store.resetData()
    ElMessage.success('数据已重置')
  }).catch(() => {})
}

function handleRegenerate() {
  ElMessageBox.confirm(`确定要为「${store.selectedPatient?.name}」重新生成随机数据吗？`, '提示', {
    confirmButtonText: '重新生成',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    store.regenerateCurrent()
    ElMessage.success('已重新生成随机数据')
  }).catch(() => {})
}
</script>

<style scoped lang="scss">
.main-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-navbar {
  height: var(--navbar-height);
  background: linear-gradient(90deg, var(--primary-color) 0%, var(--primary-light) 100%);
  display: flex;
  align-items: center;
  padding: 0 24px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 120, 200, 0.2);
}

.nav-left {
  display: flex;
  align-items: center;
  margin-right: 40px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
}

.logo-icon {
  font-size: 22px;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 15px;
  border-radius: 6px;
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
  }

  &.active {
    color: #fff;
    background: rgba(255, 255, 255, 0.2);
    font-weight: 600;
  }
}

.nav-icon {
  font-size: 16px;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 通知按钮 */
.notification-wrapper {
  position: relative;
}

.notification-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }
}

.notification-badge {
  :deep(.el-badge__content) {
    border: none;
  }
}

/* 通知面板 */
.notification-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 360px;
  max-height: 480px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
}

.notification-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.notification-list {
  flex: 1;
  overflow-y: auto;
  max-height: 360px;
}

.notification-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid #f5f5f5;

  &:hover {
    background: var(--bg-hover);
  }

  &.unread {
    background: #f0f7ff;

    &:hover {
      background: #e6f2ff;
    }
  }
}

.notification-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.notification-desc {
  font-size: 12px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-arrow {
  color: var(--text-placeholder);
  font-size: 14px;
  flex-shrink: 0;
}

.notification-empty {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-placeholder);

  p {
    margin-top: 10px;
    font-size: 13px;
  }
}

.notification-footer {
  padding: 10px 16px;
  border-top: 1px solid var(--border-color);
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.user-name {
  font-size: 14px;
}

.layout-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: var(--sidebar-width);
  flex-shrink: 0;
  border-right: 1px solid var(--border-color);
  background: #fff;
  overflow-y: auto;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  padding: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
