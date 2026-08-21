<template>
  <div class="action-library">
    <div class="library-body">
      <!-- 左侧筛选 -->
      <aside class="filter-panel">
        <el-input v-model="searchText" placeholder="搜索" size="default" clearable>
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>

        <div class="filter-group">
          <div class="filter-group-title" @click="toggleGroup('bodyPart')">
            <el-icon class="arrow" :class="{ expanded: expanded.bodyPart }"><ArrowRight /></el-icon>
            身体部位
          </div>
          <div v-show="expanded.bodyPart" class="filter-options">
            <el-checkbox
              v-for="item in filterOptions.bodyPart"
              :key="item"
              :value="item"
              v-model="selectedBodyPart"
              size="small"
            >{{ item }}</el-checkbox>
          </div>
        </div>

        <div class="filter-group">
          <div class="filter-group-title" @click="toggleGroup('position')">
            <el-icon class="arrow" :class="{ expanded: expanded.position }"><ArrowRight /></el-icon>
            体位
          </div>
          <div v-show="expanded.position" class="filter-options">
            <el-checkbox
              v-for="item in filterOptions.position"
              :key="item"
              :value="item"
              v-model="selectedPosition"
              size="small"
            >{{ item }}</el-checkbox>
          </div>
        </div>

        <div class="filter-group">
          <div class="filter-group-title" @click="toggleGroup('equipment')">
            <el-icon class="arrow" :class="{ expanded: expanded.equipment }"><ArrowRight /></el-icon>
            辅助器械
          </div>
          <div v-show="expanded.equipment" class="filter-options">
            <el-checkbox
              v-for="item in filterOptions.equipment"
              :key="item"
              :value="item"
              v-model="selectedEquipment"
              size="small"
            >{{ item }}</el-checkbox>
          </div>
        </div>

        <div class="filter-group">
          <div class="filter-group-title">儿童特殊训练</div>
        </div>
      </aside>

      <!-- 右侧内容 -->
      <div class="library-content">
        <!-- 动作网格 -->
        <div class="action-grid">
          <div
            v-for="action in filteredActions"
            :key="action.id"
            class="action-item"
            :class="{ selected: isSelected(action.id) }"
            @click="toggleAction(action)"
          >
            <div class="action-img">
              <span class="action-emoji">🏃</span>
              <el-icon class="play-icon"><VideoPlay /></el-icon>
            </div>
            <div class="action-name">{{ action.name }}</div>
          </div>
        </div>

        <!-- 已选分类区 -->
        <div class="selected-section">
          <div class="selected-category">
            <div class="category-header">
              <span class="category-title">康复训练</span>
              <el-icon class="delete-icon" @click="clearCategory('康复训练')"><Delete /></el-icon>
            </div>
            <div class="selected-items">
              <div
                v-for="action in selectedRehab"
                :key="action.id"
                class="selected-item"
              >
                <div class="selected-img">
                  <span class="action-emoji">🏃</span>
                </div>
                <div class="selected-name">{{ action.name }}</div>
                <el-icon class="remove-btn" @click.stop="toggleAction(action)"><Close /></el-icon>
              </div>
              <el-empty v-if="selectedRehab.length === 0" description="暂无" :image-size="60" />
            </div>
          </div>

          <div class="selected-category">
            <div class="category-header">
              <span class="category-title">健身功法/健身操</span>
              <el-icon class="delete-icon" @click="clearCategory('健身功法/健身操')"><Delete /></el-icon>
            </div>
            <div class="selected-items">
              <div
                v-for="action in selectedFitness"
                :key="action.id"
                class="selected-item"
              >
                <div class="selected-img">
                  <span class="action-emoji">🏃</span>
                </div>
                <div class="selected-name">{{ action.name }}</div>
                <el-icon class="remove-btn" @click.stop="toggleAction(action)"><Close /></el-icon>
              </div>
              <el-empty v-if="selectedFitness.length === 0" description="暂无" :image-size="60" />
            </div>
          </div>
        </div>

        <!-- 底部操作 -->
        <div class="library-footer">
          <el-button type="primary" size="large" @click="goNext">下一步</el-button>
          <el-button size="large" @click="handleSave">保存</el-button>
          <el-button type="success" size="large" @click="handleImport">导入方案</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, ArrowRight, VideoPlay, Delete, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { actionLibrary, filterOptions } from '@/mock'
import type { Action } from '@/mock/types'

const router = useRouter()
const searchText = ref('')
const selectedBodyPart = ref<string[]>([])
const selectedPosition = ref<string[]>([])
const selectedEquipment = ref<string[]>([])
const selectedActions = ref<Action[]>([])

const expanded = reactive({ bodyPart: true, position: true, equipment: true })

function toggleGroup(key: 'bodyPart' | 'position' | 'equipment') {
  expanded[key] = !expanded[key]
}

const filteredActions = computed(() => {
  return actionLibrary.filter(a => {
    if (searchText.value && !a.name.includes(searchText.value)) return false
    if (selectedBodyPart.value.length && !a.bodyPart.some(b => selectedBodyPart.value.includes(b))) return false
    if (selectedPosition.value.length && !a.position.some(p => selectedPosition.value.includes(p))) return false
    if (selectedEquipment.value.length && !a.equipment.some(e => selectedEquipment.value.includes(e))) return false
    return true
  })
})

function isSelected(id: string) {
  return selectedActions.value.some(a => a.id === id)
}

function toggleAction(action: Action) {
  const idx = selectedActions.value.findIndex(a => a.id === action.id)
  if (idx >= 0) {
    selectedActions.value.splice(idx, 1)
  } else {
    selectedActions.value.push(action)
  }
}

const selectedRehab = computed(() => selectedActions.value.filter(a => a.category === '康复训练'))
const selectedFitness = computed(() => selectedActions.value.filter(a => a.category === '健身功法/健身操'))

function clearCategory(cat: string) {
  selectedActions.value = selectedActions.value.filter(a => a.category !== cat)
  ElMessage.info(`已清空${cat}`)
}

function goNext() {
  if (selectedActions.value.length === 0) {
    ElMessage.warning('请至少选择一个动作')
    return
  }
  // 传递选中动作ID和来源信息
  const actionIds = selectedActions.value.map(a => a.id).join(',')
  router.push({ path: '/action-setting', query: { actionIds, from: 'plan' } })
}

function handleSave() {
  ElMessage.success(`已保存 ${selectedActions.value.length} 个动作`)
}

function handleImport() {
  ElMessage.info('导入方案功能（测试）')
}
</script>

<style scoped lang="scss">
.action-library {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.library-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 筛选面板 */
.filter-panel {
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid var(--border-color);
  padding: 16px 12px;
  overflow-y: auto;
  background: #fff;
}

.filter-group {
  margin-top: 16px;
}

.filter-group-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}

.arrow {
  transition: transform 0.2s;
  font-size: 12px;

  &.expanded {
    transform: rotate(90deg);
  }
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-left: 8px;
}

/* 内容区 */
.library-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 16px 24px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.action-item {
  border: 2px solid transparent;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;

  &:hover {
    border-color: var(--primary-light);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.selected {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(0, 120, 200, 0.2);
  }
}

.action-img {
  width: 100%;
  height: 100px;
  background: linear-gradient(135deg, #e8f4fd 0%, #f0f7ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.action-emoji {
  font-size: 36px;
  opacity: 0.6;
}

.play-icon {
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 18px;
  color: rgba(0, 0, 0, 0.4);
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  padding: 2px;
}

.action-name {
  padding: 6px 8px;
  font-size: 12px;
  text-align: center;
  color: var(--text-primary);
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 已选区 */
.selected-section {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.selected-category {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  box-shadow: var(--shadow-card);
  padding: 16px;
  min-height: 180px;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.category-title {
  font-size: 15px;
  font-weight: 600;
}

.delete-icon {
  color: var(--text-placeholder);
  cursor: pointer;
  font-size: 16px;

  &:hover {
    color: var(--danger-color);
  }
}

.selected-items {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  min-height: 100px;
}

.selected-item {
  width: 100px;
  position: relative;
  border-radius: 6px;
  overflow: hidden;
}

.selected-img {
  width: 100%;
  height: 80px;
  background: linear-gradient(135deg, #e8f4fd 0%, #f0f7ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.selected-name {
  padding: 4px;
  font-size: 11px;
  text-align: center;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: pointer;

  &:hover {
    background: var(--danger-color);
  }
}

.library-footer {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 16px 0;
  border-top: 1px solid var(--border-color);
  margin-top: auto;
}
</style>
