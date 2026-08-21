<template>
  <div class="training-report">
    <PatientSubTabs />

    <div class="report-content">
      <!-- 顶部标签行 -->
      <div class="report-header">
        <div class="header-left">
          <el-button type="primary" size="default">病历1</el-button>
          <div class="report-tabs">
            <span
              class="report-tab"
              :class="{ active: activeReportTab === 'report1' }"
              @click="activeReportTab = 'report1'"
            >训练报告1</span>
            <span
              class="report-tab"
              :class="{ active: activeReportTab === 'report2' }"
              @click="activeReportTab = 'report2'"
            >训练报告2</span>
          </div>
        </div>
      </div>

      <!-- 疗程切换标签 -->
      <div class="course-tabs" v-if="activeReportTab === 'report1' && courses.length > 0">
        <span
          v-for="(course, idx) in courses"
          :key="course.courseId"
          class="course-tab"
          :class="{ active: idx === selectedCourseIndex }"
          @click="switchCourse(idx)"
        >
          <span class="course-name">{{ course.courseName }}</span>
          <span class="course-date">{{ course.startDate }} ~ {{ course.endDate }}</span>
          <el-tag :type="courseStatusType(course.status)" size="small" class="course-status-tag">
            {{ course.status }}
          </el-tag>
        </span>
      </div>

      <!-- 周切换导航 -->
      <div class="week-navbar" v-if="activeReportTab === 'report1' && filteredWeeks.length > 0">
        <el-button
          size="small"
          :disabled="!canGoPrevWeek"
          @click="prevWeek()"
        >〈 上一周</el-button>
        <span class="week-label">{{ currentWeekLabel || '暂无数据' }}</span>
        <span class="week-index">第 {{ localWeekIndex + 1 }} / {{ filteredWeeks.length }} 周</span>
        <el-button
          size="small"
          type="primary"
          :disabled="!canGoNextWeek"
          @click="nextWeek()"
        >下一周 〉</el-button>
      </div>

      <!-- 无数据提示（仅在有疗程但无周数据时显示小提示） -->
      <div v-if="activeReportTab === 'report1' && filteredWeeks.length === 0 && currentCourse?.status !== '未开始'" class="no-data-tip">
        <el-empty description="该疗程暂无训练数据" :image-size="80" />
      </div>

      <!-- 未开始疗程提示 -->
      <div v-if="activeReportTab === 'report1' && currentCourse?.status === '未开始'" class="course-not-started-tip">
        <el-tag type="warning" size="large">该疗程尚未开始，以下为数据面板框架</el-tag>
      </div>

      <!-- 训练报告1内容 -->
      <div v-if="activeReportTab === 'report1'" class="report-body">
        <div class="charts-row">
          <!-- 总体完成率 -->
          <div class="chart-card card">
            <div class="chart-title">总体完成率</div>
            <BaseChart :option="doughnutOption" height="280px" />
          </div>

          <!-- 每周完成度质量统计 -->
          <div class="chart-card card">
            <div class="chart-header">
              <span class="chart-title">每周完成度·质量统计</span>
            </div>
            <BaseChart :option="barOption" height="280px" />
          </div>
        </div>

        <div class="charts-row">
          <!-- 疼痛评分 -->
          <div class="chart-card card">
            <div class="chart-header">
              <span class="chart-title">疼痛评分与身体改善评分</span>
            </div>
            <BaseChart :option="painOption" height="240px" />
          </div>

          <!-- 患者反馈 -->
          <div class="chart-card card">
            <div class="chart-header">
              <span class="chart-title">患者反馈</span>
            </div>
            <div class="feedback-dates" v-if="filteredFeedback.length > 0">
              <span
                v-for="fb in filteredFeedback"
                :key="fb.date"
                class="feedback-date"
                :class="{ active: fb.date === selectedFeedbackDate }"
                @click="selectedFeedbackDate = fb.date"
              >{{ fb.date }}</span>
            </div>
            <div class="feedback-content" v-if="filteredFeedback.length > 0">
              <div class="feedback-item">
                <span class="feedback-num">1</span>
                <span class="feedback-label">训练动作难度</span>
              </div>
              <div class="difficulty-scale">
                <span
                  v-for="n in 11"
                  :key="n - 1"
                  class="scale-num"
                  :class="{ active: (n - 1) === currentDifficulty }"
                >{{ n - 1 }}</span>
              </div>
              <div class="difficulty-labels">
                <span>太简单</span>
                <span>简单</span>
                <span>适中</span>
                <span>有点难</span>
                <span>太难了</span>
              </div>
            </div>
            <el-empty v-else description="暂无反馈数据" />
          </div>
        </div>
      </div>

      <!-- 训练报告2内容 -->
      <div v-else class="report-body">
        <div class="report2-header">
          <div class="date-nav">
            <el-button text size="small">〈</el-button>
            <span
              v-for="d in dateList"
              :key="d"
              class="date-item"
              :class="{ active: d === dateList[3] }"
            >{{ d }}</span>
            <el-button text size="small">〉</el-button>
          </div>
        </div>
        <div class="training-detail">
          <div class="detail-tabs">
            <span class="detail-tab active">第1次</span>
            <span class="detail-tab">第2次</span>
            <span class="detail-tab">第3次</span>
          </div>
          <div class="detail-title">训练详细情况</div>
          <div class="detail-empty card">
            <el-empty description="暂无训练详细数据" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { EChartsOption } from 'echarts'
import PatientSubTabs from '@/components/PatientSubTabs.vue'
import BaseChart from '@/components/BaseChart.vue'
import { usePatientStore } from '@/stores/patient'
import type { Course, WeekData } from '@/mock/types'

const store = usePatientStore()
const activeReportTab = ref('report1')

// 疗程列表
const courses = computed<Course[]>(() => {
  return store.currentPlan?.courses || []
})

// 当前选中的疗程索引
const selectedCourseIndex = ref(0)

// 切换患者时重置疗程索引
watch(() => store.selectedPatientId, () => {
  selectedCourseIndex.value = store.currentPlan?.currentCourseIndex ?? 0
}, { immediate: true })

function switchCourse(idx: number) {
  selectedCourseIndex.value = idx
}

function courseStatusType(status: string) {
  if (status === '进行中') return 'success'
  if (status === '已结束') return 'info'
  return 'warning'
}

// 当前选中的疗程
const currentCourse = computed(() => {
  return courses.value[selectedCourseIndex.value] || null
})

// 筛选当前疗程日期范围内的周数据（包含与疗程有重叠的周，上下周在此范围内切换）
const filteredWeeks = computed<WeekData[]>(() => {
  const report = store.currentReport
  if (!report || !report.weeks || !currentCourse.value) return []
  // 未开始的疗程不显示任何训练数据
  if (currentCourse.value.status === '未开始') return []
  const { startDate, endDate } = currentCourse.value
  return report.weeks.filter(week => {
    // 包含与疗程有重叠的周：周的结束日期 >= 疗程开始 且 周的开始日期 <= 疗程结束
    return week.endDate >= startDate && week.startDate <= endDate
  })
})

// 当前周（在筛选后的周数据中切换）
const localWeekIndex = ref(0)

// 调整后的周标签（确保不超过疗程范围）
const currentWeekLabel = computed(() => {
  if (!currentWeek.value || !currentCourse.value) return ''
  let { startDate, endDate } = currentWeek.value
  const courseStart = currentCourse.value.startDate
  const courseEnd = currentCourse.value.endDate
  if (startDate < courseStart) startDate = courseStart
  if (endDate > courseEnd) endDate = courseEnd
  const s = startDate.slice(5).replace('-', '/')
  const e = endDate.slice(5).replace('-', '/')
  return `${s}-${e}`
})

// 判断 MM/DD 格式的日期是否在疗程范围内
function isDateInCourse(dateMMDD: string): boolean {
  if (!currentWeek.value || !currentCourse.value) return false
  // 从当前周的开始日期获取年份
  const year = currentWeek.value.startDate.slice(0, 4)
  const fullDate = `${year}-${dateMMDD.replace('/', '-')}`
  return fullDate >= currentCourse.value.startDate && fullDate <= currentCourse.value.endDate
}

// 当前周内疗程范围内的每天统计
const filteredDailyStats = computed(() => {
  if (!currentWeek.value) return []
  return currentWeek.value.weeklyStats.filter(s => isDateInCourse(s.date))
})

// 当前周内疗程范围内的疼痛评分
const filteredPainScores = computed(() => {
  if (!currentWeek.value) return []
  return currentWeek.value.painScores.filter(p => isDateInCourse(p.date))
})

// 当前周内疗程范围内的反馈
const filteredFeedback = computed(() => {
  if (!currentWeek.value) return []
  return currentWeek.value.feedback.filter(f => isDateInCourse(f.date))
})

// 疗程变化时同步重置周索引到最后一周
watch(filteredWeeks, (weeks) => {
  if (weeks.length > 0) {
    localWeekIndex.value = weeks.length - 1
  } else {
    localWeekIndex.value = 0
  }
}, { immediate: true, flush: 'sync' })

const currentWeek = computed(() => {
  return filteredWeeks.value[localWeekIndex.value] || null
})

const canGoPrevWeek = computed(() => localWeekIndex.value > 0)
const canGoNextWeek = computed(() => localWeekIndex.value < filteredWeeks.value.length - 1)

function prevWeek() {
  if (canGoPrevWeek.value) localWeekIndex.value--
}

function nextWeek() {
  if (canGoNextWeek.value) localWeekIndex.value++
}

// 反馈默认选中当前周疗程范围内第一天
const selectedFeedbackDate = ref('')
watch(filteredFeedback, (fbs) => {
  if (fbs && fbs.length > 0) {
    selectedFeedbackDate.value = fbs[0].date
  }
}, { immediate: true })

const currentDifficulty = computed(() => {
  if (filteredFeedback.value.length === 0) return 5
  const fb = filteredFeedback.value.find(f => f.date === selectedFeedbackDate.value)
  return fb?.difficulty ?? 5
})

// 训练报告2日期列表：未来7天
const dateList = computed(() => {
  const result: string[] = []
  const now = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
    result.push(`${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`)
  }
  return result
})

// 环形图（当前周完成率）
const doughnutOption = computed<EChartsOption>(() => {
  if (!currentWeek.value) {
    // 空数据：显示灰色圆环
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        itemWidth: 14,
        itemHeight: 14,
        textStyle: { fontSize: 13 }
      },
      series: [{
        type: 'pie',
        radius: ['55%', '75%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        label: { show: false },
        data: [
          { value: 100, name: '暂无数据', itemStyle: { color: '#f0f0f0' } }
        ]
      }]
    }
  }
  const { done, overdue, pending } = currentWeek.value.overallCompletion
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      itemWidth: 14,
      itemHeight: 14,
      textStyle: { fontSize: 13 }
    },
    series: [{
      type: 'pie',
      radius: ['55%', '75%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      label: { show: false },
      data: [
        { value: done, name: '已完成', itemStyle: { color: '#25b7c9' } },
        { value: overdue, name: '未按时完成', itemStyle: { color: '#faad14' } },
        { value: pending, name: '待完成', itemStyle: { color: '#e0f0ff' } }
      ]
    }]
  }
})

// 柱状图（当前周疗程范围内每天统计）
const barOption = computed<EChartsOption>(() => {
  const emptyDates = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  if (filteredDailyStats.value.length === 0) {
    // 空数据：显示坐标轴但无柱子
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: {
        bottom: 0,
        itemWidth: 14,
        itemHeight: 10,
        textStyle: { fontSize: 11 }
      },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: emptyDates,
        axisLine: { lineStyle: { color: '#ddd' } },
        axisLabel: { color: '#666', fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLabel: { formatter: '{value} %', color: '#666', fontSize: 11 },
        splitLine: { lineStyle: { color: '#eee' } }
      },
      series: [
        { name: '康复完成度', type: 'bar', data: [], itemStyle: { color: '#0078c8' }, barWidth: 12 },
        { name: '康复达标率', type: 'bar', data: [], itemStyle: { color: '#36cfc9' }, barWidth: 12 },
        { name: '健身操完成度', type: 'bar', data: [], itemStyle: { color: '#faad14' }, barWidth: 12 },
        { name: '健身操达标率', type: 'bar', data: [], itemStyle: { color: '#f56c6c' }, barWidth: 12 },
        { name: '总训练时间', type: 'bar', data: [], itemStyle: { color: '#9254de' }, barWidth: 12 }
      ]
    }
  }
  const stats = filteredDailyStats.value
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      bottom: 0,
      itemWidth: 14,
      itemHeight: 10,
      textStyle: { fontSize: 11 }
    },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: stats.map(s => s.date),
      axisLine: { lineStyle: { color: '#ddd' } },
      axisLabel: { color: '#666', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value} %', color: '#666', fontSize: 11 },
      splitLine: { lineStyle: { color: '#eee' } }
    },
    series: [
      { name: '康复完成度', type: 'bar', data: stats.map(s => s.rehabCompletion), itemStyle: { color: '#0078c8' }, barWidth: 12 },
      { name: '康复达标率', type: 'bar', data: stats.map(s => s.rehabStandard), itemStyle: { color: '#36cfc9' }, barWidth: 12 },
      { name: '健身操完成度', type: 'bar', data: stats.map(s => s.fitnessCompletion), itemStyle: { color: '#faad14' }, barWidth: 12 },
      { name: '健身操达标率', type: 'bar', data: stats.map(s => s.fitnessStandard), itemStyle: { color: '#f56c6c' }, barWidth: 12 },
      {
        name: '总训练时间',
        type: 'bar',
        data: stats.map(s => s.totalMinutes),
        itemStyle: { color: '#9254de' },
        barWidth: 12,
        label: { show: true, position: 'top', fontSize: 10, color: '#666' }
      }
    ]
  }
})

// 疼痛评分折线图（当前周疗程范围内每天）
const painOption = computed<EChartsOption>(() => {
  const emptyDates = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  if (filteredPainScores.value.length === 0) {
    // 空数据：显示坐标轴但无数据线
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['疼痛评分', '身体改善评分'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: emptyDates },
      yAxis: { type: 'value', min: 0, max: 1 },
      series: [
        { name: '疼痛评分', type: 'line', data: [], smooth: true, itemStyle: { color: '#f56c6c' } },
        { name: '身体改善评分', type: 'line', data: [], smooth: true, itemStyle: { color: '#36cfc9' } }
      ]
    }
  }
  const data = filteredPainScores.value
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['疼痛评分', '身体改善评分'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: data.map(d => d.date) },
    yAxis: { type: 'value', min: 0, max: 1 },
    series: [
      { name: '疼痛评分', type: 'line', data: data.map(d => d.pain), smooth: true, itemStyle: { color: '#f56c6c' }, areaStyle: { opacity: 0.1 } },
      { name: '身体改善评分', type: 'line', data: data.map(d => d.improvement), smooth: true, itemStyle: { color: '#36cfc9' }, areaStyle: { opacity: 0.1 } }
    ]
  }
})
</script>

<style scoped lang="scss">
.training-report {
  min-height: 100%;
}

.report-content {
  padding: 16px 24px;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.report-tabs {
  display: flex;
  gap: 0;
}

.report-tab {
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

.header-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 疗程切换标签 */
.course-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 12px;
  box-shadow: var(--shadow-card);
  flex-wrap: wrap;
}

.course-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  font-size: 13px;
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

.course-name {
  font-weight: 600;
}

.course-date {
  font-size: 11px;
  opacity: 0.8;
}

.course-status-tag {
  margin-left: 2px;
}

.no-data-tip {
  padding: 40px 0;
}

.course-not-started-tip {
  padding: 12px 0;
  text-align: center;
}

/* 周导航栏 */
.week-navbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-card);
}

.week-label {
  font-size: 16px;
  font-weight: 600;
  color: var(--primary-color);
}

.week-index {
  font-size: 12px;
  color: var(--text-placeholder);
  margin-right: auto;
}

.report-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.charts-row {
  display: flex;
  gap: 16px;
}

.chart-card {
  flex: 1;
  min-width: 0;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.chart-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.chart-header .chart-title {
  margin-bottom: 0;
}

.week-nav {
  display: flex;
  gap: 4px;
}

/* 患者反馈 */
.feedback-dates {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.feedback-date {
  padding: 6px 12px;
  font-size: 13px;
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
  }
}

.feedback-content {
  padding: 12px 0;
}

.feedback-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.feedback-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--primary-color);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
}

.feedback-label {
  font-size: 14px;
  color: var(--text-primary);
}

.difficulty-scale {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 0 4px;
}

.scale-num {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--text-secondary);
  border-radius: 4px;
  background: #f0f2f5;

  &.active {
    background: var(--primary-color);
    color: #fff;
    font-weight: 600;
  }
}

.difficulty-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-placeholder);
  padding: 0 4px;
}

/* 报告2 */
.report2-header {
  margin-bottom: 16px;
}

.date-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}

.date-item {
  padding: 6px 12px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;

  &.active {
    background: var(--primary-color);
    color: #fff;
  }
}

.training-detail {
  display: flex;
  gap: 16px;
}

.detail-tabs {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

.detail-tab {
  padding: 8px 16px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 6px;

  &.active {
    background: var(--primary-color);
    color: #fff;
  }
}

.detail-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.detail-empty {
  flex: 1;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
