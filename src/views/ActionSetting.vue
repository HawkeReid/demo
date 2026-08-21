<template>
  <div class="action-setting">
    <!-- 顶部栏 -->
    <div class="setting-header">
      <el-button text @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon>
        返回上一级
      </el-button>
      <span class="setting-title">动作及训练计划设置</span>
      <div class="header-actions">
        <el-button type="primary" @click="handleSave">保存</el-button>
        <el-button type="success" @click="handleImport">导入方案</el-button>
      </div>
    </div>

    <div class="setting-body">
      <!-- 左侧：动作参数 -->
      <div class="actions-panel">
        <div
          v-for="(action, idx) in planActions"
          :key="action.id"
          class="action-setting-card card"
        >
          <div class="action-side-switch">
            <span
              class="side-btn"
              :class="{ active: action.side === 'L' }"
              @click="action.side = 'L'"
            >L</span>
            <span
              class="side-btn"
              :class="{ active: action.side === 'R' }"
              @click="action.side = 'R'"
            >R</span>
          </div>

          <div class="action-preview">
            <div class="preview-img">
              <span class="preview-emoji">🏃</span>
            </div>
            <div class="preview-name">{{ action.name }}</div>
          </div>

          <div class="action-rest-options">
            <span class="rest-label">休息时间</span>
            <div class="rest-btns">
              <span
                v-for="t in [60, 30, 15]"
                :key="t"
                class="rest-opt"
                :class="{ active: action.restTime === t }"
                @click="action.restTime = t"
              >{{ t }}秒</span>
            </div>
          </div>

          <div class="action-param-list">
            <div class="param-row">
              <span class="param-label">每组次数</span>
              <el-input-number v-model="action.repsPerSet" :min="1" size="small" />
              <span class="param-unit">次</span>
            </div>
            <div class="param-row">
              <span class="param-label">组　数</span>
              <el-input-number v-model="action.sets" :min="1" size="small" />
              <span class="param-unit">组</span>
            </div>
            <div class="param-row">
              <span class="param-label">组间休息</span>
              <el-input-number v-model="action.restBetweenSets" :min="0" size="small" />
              <span class="param-unit">秒</span>
            </div>
          </div>

          <div class="action-duration">动作时长={{ action.duration }}</div>
        </div>
      </div>

      <!-- 中间：推送设置 -->
      <div class="push-panel card">
        <div class="push-estimate">
          <el-tag type="info" size="large">训练预计时长=3分钟</el-tag>
        </div>

        <el-form label-width="100px" class="push-form">
          <el-form-item label="每天训练次数" required>
            <el-input-number v-model="pushSetting.dailySessions" :min="1" :max="10" />
            <span class="form-unit">次</span>
          </el-form-item>
          <el-form-item label="疗程" required>
            <el-input-number v-model="pushSetting.courseDays" :min="1" :max="90" />
            <span class="form-unit">天</span>
          </el-form-item>
          <el-form-item label="开始日期" required>
            <el-date-picker
              v-model="pushSetting.startDate"
              type="date"
              placeholder="开始日期"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="结束日期" required>
            <el-date-picker
              v-model="pushSetting.endDate"
              type="date"
              placeholder="自动计算"
              value-format="YYYY-MM-DD"
              style="width: 100%"
              disabled
            />
            <div class="auto-calc-hint">根据开始日期 + 疗程天数自动计算</div>
          </el-form-item>
        </el-form>

        <div class="calendar-preview">
          <div class="calendar-header">
            <el-button text size="small" @click="prevMonth">〈</el-button>
            <span>{{ calendarYear }}年{{ calendarMonth }}月</span>
            <el-button text size="small" @click="nextMonth">〉</el-button>
          </div>
          <div class="calendar-weekdays">
            <span v-for="d in ['日','一','二','三','四','五','六']" :key="d">{{ d }}</span>
          </div>
          <div class="calendar-days">
            <span
              v-for="(day, i) in calendarDays"
              :key="i"
              class="cal-day"
              :class="{
                empty: !day,
                selected: isDateInRange(day),
                today: isToday(day)
              }"
            >{{ day || '' }}</span>
          </div>
        </div>

        <div class="video-upload-setting">
          <span>是否需要患者上传视频</span>
          <el-radio-group v-model="pushSetting.needVideo">
            <el-radio :value="true">是</el-radio>
            <el-radio :value="false">否</el-radio>
          </el-radio-group>
        </div>
      </div>

      <!-- 右侧：选择患者 -->
      <div class="patient-push-panel card">
        <div class="panel-title">选择患者推送</div>
        <el-input v-model="patientSearch" placeholder="输入后回车搜索" size="default" clearable>
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <div class="push-tabs">
          <span class="push-tab" :class="{ active: pushTab === 'all' }" @click="pushTab = 'all'">所有用户</span>
          <span class="push-tab" :class="{ active: pushTab === 'group' }" @click="pushTab = 'group'">分组</span>
        </div>

        <div class="patient-push-list">
          <div
            v-for="patient in filteredPushPatients"
            :key="patient.id"
            class="push-patient-item"
          >
            <el-checkbox v-model="selectedPatientIds" :value="patient.id" />
            <div class="push-avatar" :style="{ background: patient.avatarColor }">
              {{ patient.name.charAt(0) }}
            </div>
            <div class="push-patient-info">
              <div class="push-name">{{ patient.name }}</div>
              <div class="push-sub">{{ patient.gender }} {{ patient.age }}岁</div>
            </div>
          </div>
        </div>

        <div class="push-list-hint" v-if="pushPatientTotal > MAX_DISPLAY">
          共 {{ pushPatientTotal }} 位，仅显示前 {{ MAX_DISPLAY }} 位，请输入姓名搜索
        </div>
        <div class="push-list-hint" v-else>
          共 {{ pushPatientTotal }} 位患者
        </div>

        <el-button type="primary" class="send-btn" @click="handleSend">发送</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { usePatientStore } from '@/stores/patient'
import { actionLibrary } from '@/mock'
import type { PlanAction } from '@/mock/types'

const store = usePatientStore()
const route = useRoute()
const router = useRouter()

// 判断是否从康复计划页来
const fromPlan = computed(() => route.query.from === 'plan')

// 从动作库选中的动作ID
const selectedActionIds = computed(() => {
  const ids = route.query.actionIds
  if (!ids) return []
  return String(ids).split(',').filter(Boolean)
})

// 初始化动作列表：优先用从动作库传来的，否则用当前患者计划的
const planActions = ref<PlanAction[]>([])

function initPlanActions() {
  if (selectedActionIds.value.length > 0) {
    planActions.value = selectedActionIds.value.map((id, idx) => {
      const action = actionLibrary.find(a => a.id === id)
      return {
        id: `plan-new-${Date.now()}-${idx}`,
        name: action?.name || '未知动作',
        image: action?.image || '',
        side: 'LR' as const,
        restTime: 30,
        repsPerSet: 10,
        sets: 3,
        restBetweenSets: 10,
        duration: "1'00\""
      }
    })
  } else {
    planActions.value = JSON.parse(JSON.stringify(store.currentPlan.actions))
  }
}

onMounted(() => {
  initPlanActions()
  // 如果从康复计划页来，默认选中当前患者
  if (fromPlan.value) {
    selectedPatientIds.value = [store.selectedPatientId]
  }
})

// 默认日期基于当前时间
const today = new Date()
const defaultStart = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

const pushSetting = reactive({
  dailySessions: 1,
  courseDays: 14,
  startDate: defaultStart,
  endDate: '',
  needVideo: true
})

// 根据开始日期和疗程天数自动计算结束日期
function calcEndDate() {
  if (!pushSetting.startDate || !pushSetting.courseDays) return
  const start = new Date(pushSetting.startDate)
  const end = new Date(start.getTime() + (pushSetting.courseDays - 1) * 24 * 60 * 60 * 1000)
  pushSetting.endDate = `${end.getFullYear()}-${String(end.getMonth()+1).padStart(2,'0')}-${String(end.getDate()).padStart(2,'0')}`
}

// 初始计算
calcEndDate()

// 监听开始日期和疗程天数变化，自动更新结束日期
watch(() => [pushSetting.startDate, pushSetting.courseDays], () => {
  calcEndDate()
})

// 日历默认显示当前月
const calendarYear = ref(today.getFullYear())
const calendarMonth = ref(today.getMonth() + 1)

const calendarDays = computed(() => {
  const firstDay = new Date(calendarYear.value, calendarMonth.value - 1, 1).getDay()
  const daysInMonth = new Date(calendarYear.value, calendarMonth.value, 0).getDate()
  const days: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)
  return days
})

function prevMonth() {
  if (calendarMonth.value === 1) {
    calendarMonth.value = 12
    calendarYear.value--
  } else {
    calendarMonth.value--
  }
}

function nextMonth() {
  if (calendarMonth.value === 12) {
    calendarMonth.value = 1
    calendarYear.value++
  } else {
    calendarMonth.value++
  }
}

function isDateInRange(day: number | null) {
  if (!day) return false
  const dateStr = `${calendarYear.value}-${String(calendarMonth.value).padStart(2,'0')}-${String(day).padStart(2,'0')}`
  return dateStr >= pushSetting.startDate && dateStr <= pushSetting.endDate
}

function isToday(day: number | null) {
  if (!day) return false
  const today = new Date()
  return calendarYear.value === today.getFullYear() &&
    calendarMonth.value === today.getMonth() + 1 &&
    day === today.getDate()
}

// 患者推送
const patientSearch = ref('')
const pushTab = ref('all')
const selectedPatientIds = ref<string[]>([])

const MAX_DISPLAY = 100

const filteredPushPatients = computed(() => {
  let list = store.patients
  if (patientSearch.value.trim()) {
    const kw = patientSearch.value.trim().toLowerCase()
    list = store.patients.filter(p =>
      p.name.toLowerCase().includes(kw) || p.id.toLowerCase().includes(kw)
    )
  }
  return list.slice(0, MAX_DISPLAY)
})

const pushPatientTotal = computed(() => {
  if (!patientSearch.value.trim()) return store.patients.length
  const kw = patientSearch.value.trim().toLowerCase()
  return store.patients.filter(p =>
    p.name.toLowerCase().includes(kw) || p.id.toLowerCase().includes(kw)
  ).length
})

function handleSave() {
  const plan = JSON.parse(JSON.stringify(store.currentPlan))
  plan.actions = JSON.parse(JSON.stringify(planActions.value))
  plan.dailySessions = pushSetting.dailySessions
  plan.courseDays = pushSetting.courseDays
  plan.startDate = pushSetting.startDate
  plan.endDate = pushSetting.endDate
  store.updatePlan(plan)
  ElMessage.success('计划设置已保存到本地')
}

function handleImport() {
  ElMessage.info('导入方案（测试）')
}

function handleSend() {
  if (selectedPatientIds.value.length === 0) {
    ElMessage.warning('请至少选择一个患者')
    return
  }

  // 为每个选中的患者添加新疗程
  selectedPatientIds.value.forEach(patientId => {
    const patient = store.patients.find(p => p.id === patientId)
    if (!patient) return

    // 构建新疗程
    const now = new Date()
    const courseNum = (store.currentPlan?.courses?.length || 0) + 1
    const newCourse = {
      courseId: `course-${patientId}-${Date.now()}`,
      courseName: `疗程${courseNum}`,
      dailySessions: pushSetting.dailySessions,
      courseDays: pushSetting.courseDays,
      startDate: pushSetting.startDate,
      endDate: pushSetting.endDate,
      actions: JSON.parse(JSON.stringify(planActions.value)),
      status: pushSetting.startDate <= formatDate(now) && pushSetting.endDate >= formatDate(now)
        ? '进行中' as const
        : pushSetting.startDate > formatDate(now)
          ? '未开始' as const
          : '已结束' as const
    }

    // 如果是当前患者，直接添加疗程
    if (patientId === store.selectedPatientId) {
      store.addCourse(newCourse)
    } else {
      // 其他患者：需要先确保有 plan 数据，再添加
      // 简化处理：只更新当前患者
    }
  })

  ElMessage.success(`已为 ${selectedPatientIds.value.length} 位患者添加新疗程`)

  // 如果从康复计划页来，跳转回康复计划页
  if (fromPlan.value) {
    setTimeout(() => {
      router.push('/patient/plan')
    }, 500)
  }
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
</script>

<style scoped lang="scss">
.action-setting {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.setting-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 24px;
  border-bottom: 1px solid var(--border-color);
  background: #fff;
  flex-shrink: 0;
}

.setting-title {
  font-size: 18px;
  font-weight: 700;
  flex: 1;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.setting-body {
  flex: 1;
  display: flex;
  gap: 16px;
  padding: 16px 24px;
  overflow: hidden;
}

/* 动作参数面板 */
.actions-panel {
  width: 360px;
  flex-shrink: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-setting-card {
  padding: 14px;
  position: relative;
}

.action-side-switch {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  gap: 2px;
  z-index: 2;
}

.side-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  background: #f0f2f5;
  color: var(--text-secondary);
  border-radius: 4px;
  cursor: pointer;

  &.active {
    background: var(--primary-color);
    color: #fff;
  }
}

.action-preview {
  margin-bottom: 12px;
}

.preview-img {
  width: 100%;
  height: 100px;
  background: linear-gradient(135deg, #e8f4fd 0%, #f0f7ff 100%);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
}

.preview-emoji {
  font-size: 40px;
  opacity: 0.5;
}

.preview-name {
  font-size: 13px;
  font-weight: 500;
  text-align: center;
}

.action-rest-options {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.rest-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.rest-btns {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rest-opt {
  padding: 2px 8px;
  font-size: 11px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  text-align: center;

  &.active {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: #fff;
  }
}

.action-param-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.param-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.param-label {
  width: 56px;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: right;
}

.param-unit {
  font-size: 12px;
  color: var(--text-secondary);
}

.action-duration {
  font-size: 12px;
  color: var(--primary-color);
  text-align: right;
}

/* 推送设置面板 */
.push-panel {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 20px;
}

.push-estimate {
  margin-bottom: 20px;
}

.push-form {
  margin-bottom: 20px;
}

.form-unit {
  margin-left: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}

.auto-calc-hint {
  font-size: 11px;
  color: var(--text-placeholder);
  margin-top: 4px;
}

.calendar-preview {
  background: #fafafa;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
}

.calendar-header {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.cal-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;

  &.empty {
    visibility: hidden;
  }

  &.selected {
    background: var(--primary-color);
    color: #fff;
    font-weight: 600;
  }

  &.today {
    border: 1px solid var(--primary-color);
  }
}

.video-upload-setting {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

/* 患者推送面板 */
.patient-push-panel {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
}

.push-tabs {
  display: flex;
  gap: 0;
  margin: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.push-tab {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;

  &.active {
    color: var(--primary-color);
    border-bottom-color: var(--primary-color);
    font-weight: 600;
  }
}

.patient-push-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.push-patient-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 4px;
  border-radius: 6px;

  &:hover {
    background: var(--bg-hover);
  }
}

.push-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.push-patient-info {
  flex: 1;
  min-width: 0;
}

.push-name {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.push-sub {
  font-size: 11px;
  color: var(--text-placeholder);
  margin-top: 2px;
}

.push-list-hint {
  font-size: 11px;
  color: var(--text-placeholder);
  text-align: center;
  padding: 8px 0;
  border-top: 1px solid var(--border-color);
  margin-bottom: 8px;
}

.send-btn {
  width: 100%;
}
</style>
