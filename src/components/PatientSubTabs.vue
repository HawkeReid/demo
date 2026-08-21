<template>
  <div class="sub-tabs">
    <router-link
      v-for="tab in tabs"
      :key="tab.path"
      :to="tab.path"
      class="sub-tab"
      :class="{ active: $route.path === tab.path }"
    >
      {{ tab.label }}
    </router-link>
  </div>
</template>

<script setup lang="ts">
const tabs = [
  { label: '训练报告', path: '/patient/report' },
  { label: '康复计划', path: '/patient/plan' },
  { label: '健康档案', path: '/patient/health' },
  { label: '步态分析', path: '/patient/gait' }
]
</script>

<style scoped lang="scss">
.sub-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border-color);
  padding: 0 24px;
  background: #fff;
}

.sub-tab {
  padding: 14px 20px;
  font-size: 15px;
  color: var(--text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  text-decoration: none;

  &:hover {
    color: var(--primary-color);
  }

  &.active {
    color: var(--primary-color);
    border-bottom-color: var(--primary-color);
    font-weight: 600;
  }
}
</style>
