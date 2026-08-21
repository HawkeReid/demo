<template>
  <div class="placeholder-page">
    <el-empty :description="title + ' - 开发中'">
      <template #image>
        <div class="placeholder-icon">🚧</div>
      </template>
      <p class="placeholder-text">该模块截图未覆盖，预留空页面</p>
      <el-button type="primary" @click="$router.push('/patient/report')">返回患者管理</el-button>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const title = computed(() => (route.meta.title as string) || '页面')
</script>

<style scoped lang="scss">
.placeholder-page {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.placeholder-text {
  color: var(--text-secondary);
  margin-bottom: 20px;
}
</style>
