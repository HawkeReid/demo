<template>
  <div class="rehab-plan">
    <PatientSubTabs />

    <div class="plan-content">
      <div class="plan-header">
        <el-button type="primary">病历1</el-button>
        <div class="plan-tabs">
          <span class="plan-tab" :class="{ active: activeTab === 'home' }" @click="activeTab = 'home'">居家训练</span>
          <span class="plan-tab" :class="{ active: activeTab === 'offline' }" @click="activeTab = 'offline'">线下治疗</span>
        </div>
      </div>

      <!-- 疗程切换标签 -->
      <div class="course-tabs" v-if="activeTab === 'home' && plan.courses.length > 0">
        <span
          v-for="(course, idx) in plan.courses"
          :key="course.courseId"
          class="course-tab"
          :class="{ active: idx === plan.currentCourseIndex }"
          @click="switchCourse(idx)"
        >
          {{ course.courseName }}
          <el-tag :type="courseStatusType(course.status)" size="small" class="course-status-tag">
            {{ course.status }}
          </el-tag>
        </span>
        <el-button type="success" size="small" @click="handleAddCourse" class="add-course-btn">+ 添加新疗程</el-button>
      </div>

      <div v-if="activeTab === 'home'" class="plan-body">
        <!-- 当前疗程信息 -->
        <div class="current-course-info" v-if="currentCourse">
          <span class="course-date-range">{{ currentCourse.startDate }} 至 {{ currentCourse.endDate }}</span>
          <span class="course-days">共 {{ currentCourse.courseDays }} 天</span>
        </div>

        <!-- 参数行 -->
        <div class="param-row" v-if="currentCourse">
          <div class="param-item">
            <span class="param-label">每天训练次数</span>
            <el-input-number v-model="currentCourse.dailySessions" :min="1" :max="5" size="default" />
            <span class="param-unit">次</span>
          </div>
          <div class="param-item">
            <span class="param-label">疗程</span>
            <el-input-number v-model="currentCourse.courseDays" :min="1" :max="90" size="default" />
            <span class="param-unit">天</span>
          </div>
          <div class="param-item date-item">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              size="default"
            />
          </div>
          <div class="param-actions">
            <el-button type="primary" @click="handleSave">保存方案</el-button>
          </div>
        </div>

        <!-- 动作卡片列表 -->
        <div class="actions-list" v-if="currentCourse">
          <div v-for="(action, idx) in currentCourse.actions" :key="action.id" class="action-card card">
            <div class="action-side-tag" :class="action.side.toLowerCase()">{{ action.side }}</div>
            <div class="action-image">
              <div class="img-placeholder">
                <span class="img-icon">🏃</span>
              </div>
              <div class="action-name-overlay">{{ action.name }}</div>
            </div>
            <div class="action-rest">
              <span class="rest-label">休息时间</span>
              <div class="rest-options">
                <span
                  v-for="t in [60, 30, 15]"
                  :key="t"
                  class="rest-btn"
                  :class="{ active: action.restTime === t }"
                  @click="action.restTime = t"
                >{{ t }}秒</span>
              </div>
            </div>
            <div class="action-params">
              <div class="param-line">
                <span class="p-label">每组次数</span>
                <el-input-number v-model="action.repsPerSet" :min="1" :max="100" size="small" />
                <span class="p-unit">次</span>
              </div>
              <div class="param-line">
                <span class="p-label">组　数</span>
                <el-input-number v-model="action.sets" :min="1" :max="20" size="small" />
                <span class="p-unit">组</span>
              </div>
              <div class="param-line">
                <span class="p-label">组间休息</span>
                <el-input-number v-model="action.restBetweenSets" :min="0" :max="300" size="small" />
                <span class="p-unit">秒</span>
              </div>
            </div>
            <div class="action-remove" @click="removeAction(idx)">
              <el-icon><Close /></el-icon>
            </div>
          </div>
        </div>

        <div class="plan-footer" v-if="currentCourse">
          <el-button type="primary" @click="handleSave">保存方案</el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>

        <el-empty v-if="!currentCourse" description="暂无疗程数据，点击上方添加新疗程" />
      </div>

      <div v-else class="plan-body">
        <el-empty description="线下治疗模块 - 暂无数据" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Close } from '@element-plus/icons-vue'
import PatientSubTabs from '@/components/PatientSubTabs.vue'
import { usePatientStore } from '@/stores/patient'
import type { RehabPlan, Course } from '@/mock/types'

const store = usePatientStore()
const router = useRouter()
const activeTab = ref('home')

// 直接引用 store 的 plan（响应式）
const plan = computed(() => store.currentPlan)
const currentCourse = computed(() => store.currentCourse)

// 日期范围
const dateRange = computed({
  get: () => {
    if (!currentCourse.value) return []
    return [currentCourse.value.startDate, currentCourse.value.endDate]
  },
  set: (val: [string, string] | null) => {
    if (val && val.length === 2 && currentCourse.value) {
      currentCourse.value.startDate = val[0]
      currentCourse.value.endDate = val[1]
    }
  }
})

function courseStatusType(status: string) {
  if (status === '进行中') return 'success'
  if (status === '已结束') return 'info'
  return 'warning'
}

function switchCourse(idx: number) {
  store.selectCourse(idx)
}

function removeAction(idx: number) {
  if (!currentCourse.value) return
  ElMessageBox.confirm('确定删除该动作？', '提示', { type: 'warning' }).then(() => {
    currentCourse.value!.actions.splice(idx, 1)
    ElMessage.success('已删除')
  }).catch(() => {})
}

function handleAddCourse() {
  router.push({ path: '/action-library', query: { from: 'plan', patientId: store.selectedPatientId } })
}

function handleSave() {
  if (!currentCourse.value) return
  store.updateCurrentCourse(JSON.parse(JSON.stringify(currentCourse.value)))
  ElMessage.success('方案已保存到本地')
}

function handleReset() {
  ElMessageBox.confirm('确定重置当前疗程？将恢复为初始随机数据', '提示', { type: 'warning' }).then(() => {
    store.regenerateCurrent()
    ElMessage.success('已重置')
  }).catch(() => {})
}
</script>

<style scoped lang="scss">
.rehab-plan {
  min-height: 100%;
}

.plan-content {
  padding: 16px 24px;
}

.plan-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.plan-tabs {
  display: flex;
  gap: 0;
}

.plan-tab {
  padding: 8px 16px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;

  &.active {
    color: var(--primary-color);
    border-bottom-color: var(--primary-color);
    font-weight: 600;
  }
}

/* 疗程切换标签 */
.course-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-card);
  flex-wrap: wrap;
}

.course-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 14px;
  color: var(--text-secondary);
  background: #f5f7fa;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--bg-hover);
  }

  &.active {
    background: var(--primary-color);
    color: #fff;
    font-weight: 600;
  }
}

.course-status-tag {
  margin-left: 4px;
}

.add-course-btn {
  margin-left: auto;
}

.current-course-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  padding: 8px 16px;
  background: #f0f7ff;
  border-radius: 6px;
}

.course-date-range {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-color);
}

.course-days {
  font-size: 13px;
  color: var(--text-secondary);
}

.plan-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.param-row {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: var(--shadow-card);
  flex-wrap: wrap;
}

.param-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.param-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.param-unit {
  font-size: 14px;
  color: var(--text-secondary);
}

.date-item {
  flex: 1;
  min-width: 280px;
}

.param-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.actions-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.action-card {
  padding: 16px;
  position: relative;
}

.action-side-tag {
  position: absolute;
  top: 12px;
  left: 12px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  border-radius: 50%;
  z-index: 2;

  &.l { background: #409eff; }
  &.r { background: #67c23a; }
  &.lr { background: #e6a23c; }
}

.action-image {
  margin-bottom: 12px;
}

.img-placeholder {
  width: 100%;
  height: 120px;
  background: linear-gradient(135deg, #e8f4fd 0%, #f0f7ff 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.img-icon {
  font-size: 48px;
  opacity: 0.5;
}

.action-name-overlay {
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  margin-top: 8px;
}

.action-rest {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.rest-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.rest-options {
  display: flex;
  gap: 4px;
}

.rest-btn {
  padding: 2px 8px;
  font-size: 11px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;

  &.active {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: #fff;
  }
}

.action-params {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.param-line {
  display: flex;
  align-items: center;
  gap: 6px;
}

.p-label {
  width: 56px;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: right;
}

.p-unit {
  font-size: 12px;
  color: var(--text-secondary);
}

.action-remove {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-placeholder);
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s;

  &:hover {
    background: #fef0f0;
    color: #f56c6c;
  }
}

.plan-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 16px 0;
}
</style>
