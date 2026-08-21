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
        <el-dropdown>
          <div class="user-info">
            <el-avatar :size="32" style="background: #fff; color: var(--primary-color)">郭</el-avatar>
            <span class="user-name">刘</span>
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
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import PatientSidebar from '@/components/PatientSidebar.vue'
import { usePatientStore } from '@/stores/patient'

const route = useRoute()
const store = usePatientStore()

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
