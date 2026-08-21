import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Patient, TrainingReport, RehabPlan, GaitAnalysis, HealthForm, WeekData } from '@/mock/types'
import { patients as mockPatients } from '@/mock'
import {
  generateRandomReport,
  generateRandomPlan,
  generateRandomGait,
  generateRandomHealthForm,
  getIncompletePatientIds
} from '@/mock/random'

const STORAGE_KEY = 'rehab-admin-data-v11'  // 升级版本，修复未完成患者逻辑

interface PatientMeta {
  group?: string
  doctor?: string
}

interface PersistedState {
  selectedPatientId: string
  reports: Record<string, TrainingReport>
  plans: Record<string, RehabPlan>
  gaits: Record<string, GaitAnalysis>
  healthForms: Record<string, HealthForm>
  groups: string[]              // 自定义分组列表
  customDoctors: string[]       // 用户创建的医生
  patientMeta: Record<string, PatientMeta>  // 患者分组和医生分配
  lastRefreshDate?: string      // 上次数据刷新日期
}

function loadState(): PersistedState {
  const defaults: PersistedState = {
    selectedPatientId: 'p9',
    reports: {},
    plans: {},
    gaits: {},
    healthForms: {},
    groups: [],
    customDoctors: [],
    patientMeta: {},
    lastRefreshDate: ''
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // 合并默认值，确保所有字段都存在
      return {
        ...defaults,
        ...parsed,
        groups: parsed.groups || [],
        customDoctors: parsed.customDoctors || [],
        patientMeta: parsed.patientMeta || {}
      }
    }
  } catch (e) {
    console.warn('Failed to load persisted state', e)
  }
  return defaults
}

export const usePatientStore = defineStore('patient', () => {
  const state = ref<PersistedState>(loadState())
  const patients = ref<Patient[]>(mockPatients)

  const selectedPatient = computed(() =>
    patients.value.find(p => p.id === state.value.selectedPatientId) || patients.value[0]
  )

  // 确保某患者的plan数据已生成（只生成plan，用于快速筛选）
  function ensurePatientPlan(patientId: string) {
    const patient = patients.value.find(p => p.id === patientId)
    if (!patient) return
    if (!state.value.plans[patientId]) {
      state.value.plans[patientId] = generateRandomPlan(patient)
    }
  }

  // 确保某患者的所有数据都已生成（懒加载）
  function ensurePatientData(patientId: string) {
    const patient = patients.value.find(p => p.id === patientId)
    if (!patient) return

    // 检查是否需要每日刷新（日期变化后重新生成当前周数据）
    const todayStr = new Date().toISOString().slice(0, 10)
    const needRefresh = state.value.lastRefreshDate !== todayStr

    if (!state.value.reports[patientId] || needRefresh) {
      state.value.reports[patientId] = generateRandomReport(patient, patients.value, incompletePatientIds.value)
    }
    if (!state.value.plans[patientId]) {
      state.value.plans[patientId] = generateRandomPlan(patient)
    }
    if (!state.value.gaits[patientId]) {
      state.value.gaits[patientId] = generateRandomGait(patient)
    }
    if (!state.value.healthForms[patientId]) {
      state.value.healthForms[patientId] = generateRandomHealthForm(patient)
    }

    if (needRefresh) {
      state.value.lastRefreshDate = todayStr
      // 日期变化时重新计算未完成训练列表
      calcIncompleteTraining()
      // 重置已读状态
      readNotificationIds.value.clear()
    }
  }

  // 初始化时确保当前选中患者有数据（移到通知相关定义之后调用）

  const currentReport = computed(() => {
    const id = state.value.selectedPatientId
    ensurePatientData(id)
    return state.value.reports[id]
  })

  const currentPlan = computed(() => {
    const id = state.value.selectedPatientId
    ensurePatientData(id)
    return state.value.plans[id]
  })

  const currentGait = computed(() => {
    const id = state.value.selectedPatientId
    ensurePatientData(id)
    return state.value.gaits[id]
  })

  const currentHealthForm = computed(() => {
    const id = state.value.selectedPatientId
    ensurePatientData(id)
    return state.value.healthForms[id]
  })

  function selectPatient(id: string) {
    state.value.selectedPatientId = id
    ensurePatientData(id)
  }

  function updateReport(report: TrainingReport) {
    state.value.reports[report.patientId] = report
  }

  // ============ 周数据切换 ============
  const currentWeek = computed<WeekData | null>(() => {
    const report = currentReport.value
    if (!report || !report.weeks || report.weeks.length === 0) return null
    const idx = report.currentWeekIndex ?? report.weeks.length - 1
    return report.weeks[Math.max(0, Math.min(idx, report.weeks.length - 1))]
  })

  const canGoPrevWeek = computed(() => {
    const report = currentReport.value
    return report && (report.currentWeekIndex ?? 0) > 0
  })

  const canGoNextWeek = computed(() => {
    const report = currentReport.value
    return report && (report.currentWeekIndex ?? 0) < (report.weeks?.length ?? 0) - 1
  })

  function prevWeek() {
    const report = state.value.reports[state.value.selectedPatientId]
    if (report && report.currentWeekIndex > 0) {
      report.currentWeekIndex--
    }
  }

  function nextWeek() {
    const report = state.value.reports[state.value.selectedPatientId]
    if (report && report.currentWeekIndex < report.weeks.length - 1) {
      report.currentWeekIndex++
    }
  }

  // 添加未来一周数据
  function addNextWeek() {
    const report = state.value.reports[state.value.selectedPatientId]
    if (!report) return
    const lastWeek = report.weeks[report.weeks.length - 1]
    if (!lastWeek) return

    // 基于最后一周的结束日期，生成下一周
    const nextStart = new Date(lastWeek.endDate)
    nextStart.setDate(nextStart.getDate() + 1)
    const nextEnd = new Date(nextStart)
    nextEnd.setDate(nextStart.getDate() + 6)

    const dates: string[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(nextStart)
      d.setDate(nextStart.getDate() + i)
      dates.push(`${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`)
    }

    const year = nextStart.getFullYear()
    const weekNum = getWeekNumber(nextStart)
    const newWeek: WeekData = {
      weekKey: `${year}-W${weekNum}`,
      weekLabel: `${dates[0]}-${dates[6]}`,
      startDate: `${nextStart.getFullYear()}-${String(nextStart.getMonth() + 1).padStart(2, '0')}-${String(nextStart.getDate()).padStart(2, '0')}`,
      endDate: `${nextEnd.getFullYear()}-${String(nextEnd.getMonth() + 1).padStart(2, '0')}-${String(nextEnd.getDate()).padStart(2, '0')}`,
      overallCompletion: { done: 0, overdue: 0, pending: 100 },
      weeklyStats: dates.map(d => ({
        date: d,
        rehabCompletion: 0,
        rehabStandard: 0,
        fitnessCompletion: 0,
        fitnessStandard: 0,
        totalMinutes: 0
      })),
      painScores: [],
      feedback: dates.map(d => ({ date: d, difficulty: 5 }))
    }

    report.weeks.push(newWeek)
    report.currentWeekIndex = report.weeks.length - 1
  }

  // 更新当前周数据
  function updateCurrentWeek(weekData: WeekData) {
    const report = state.value.reports[state.value.selectedPatientId]
    if (!report) return
    report.weeks[report.currentWeekIndex] = weekData
  }

  function getWeekNumber(d: Date): number {
    const target = new Date(d.valueOf())
    const dayNr = (d.getDay() + 6) % 7
    target.setDate(target.getDate() - dayNr + 3)
    const firstThursday = target.valueOf()
    target.setMonth(0, 1)
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
    }
    return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000)
  }

  function updatePlan(plan: RehabPlan) {
    state.value.plans[plan.patientId] = plan
  }

  // ============ 多疗程操作 ============
  const currentCourse = computed(() => {
    const plan = currentPlan.value
    if (!plan || !plan.courses || plan.courses.length === 0) return null
    const idx = plan.currentCourseIndex ?? 0
    return plan.courses[Math.max(0, Math.min(idx, plan.courses.length - 1))]
  })

  function selectCourse(index: number) {
    const plan = state.value.plans[state.value.selectedPatientId]
    if (plan && plan.courses && index >= 0 && index < plan.courses.length) {
      plan.currentCourseIndex = index
    }
  }

  function addCourse(course: import('@/mock/types').Course) {
    const plan = state.value.plans[state.value.selectedPatientId]
    if (!plan) return
    if (!plan.courses) plan.courses = []
    plan.courses.push(course)
    plan.currentCourseIndex = plan.courses.length - 1
  }

  function updateCurrentCourse(course: import('@/mock/types').Course) {
    const plan = state.value.plans[state.value.selectedPatientId]
    if (!plan || !plan.courses) return
    plan.courses[plan.currentCourseIndex] = course
  }

  function updateGait(gait: GaitAnalysis) {
    state.value.gaits[gait.patientId] = gait
  }

  function updateHealthForm(patientId: string, form: HealthForm) {
    state.value.healthForms[patientId] = form
  }

  // 重新生成当前患者的随机数据
  function regenerateCurrent() {
    const id = state.value.selectedPatientId
    const patient = patients.value.find(p => p.id === id)
    if (!patient) return
    state.value.reports[id] = generateRandomReport(patient)
    state.value.plans[id] = generateRandomPlan(patient)
    state.value.gaits[id] = generateRandomGait(patient)
    state.value.healthForms[id] = generateRandomHealthForm(patient)
  }

  // ============ 分组和医生管理 ============
  const groups = computed(() => state.value.groups || [])

  // 所有医生列表（用户自定义医生放最前面，然后是从患者数据中提取的）
  const doctors = computed(() => {
    const set = new Set<string>()
    // 先添加用户自定义医生（保持创建顺序，放最前面）
    ;(state.value.customDoctors || []).forEach(d => set.add(d))
    // 再添加从患者数据中提取的医生
    patients.value.forEach(p => {
      if (p.doctor) set.add(p.doctor)
      const meta = state.value.patientMeta[p.id]
      if (meta?.doctor) set.add(meta.doctor)
    })
    return Array.from(set)
  })

  function addDoctor(name: string) {
    if (!name.trim()) return
    if (!state.value.customDoctors) state.value.customDoctors = []
    if (!state.value.customDoctors.includes(name.trim())) {
      state.value.customDoctors.push(name.trim())
    }
  }

  function addGroup(name: string) {
    if (!name.trim()) return
    if (!state.value.groups) state.value.groups = []
    if (!state.value.groups.includes(name.trim())) {
      state.value.groups.push(name.trim())
    }
  }

  function removeGroup(name: string) {
    const idx = state.value.groups.indexOf(name)
    if (idx > -1) {
      state.value.groups.splice(idx, 1)
      // 清除该分组下所有患者的分组
      Object.values(state.value.patientMeta).forEach(meta => {
        if (meta.group === name) meta.group = undefined
      })
    }
  }

  function renameGroup(oldName: string, newName: string) {
    if (!newName.trim() || oldName === newName.trim()) return
    const idx = state.value.groups.indexOf(oldName)
    if (idx > -1 && !state.value.groups.includes(newName.trim())) {
      state.value.groups[idx] = newName.trim()
      // 更新该分组下所有患者的分组
      Object.values(state.value.patientMeta).forEach(meta => {
        if (meta.group === oldName) meta.group = newName.trim()
      })
    }
  }

  function removeDoctor(name: string) {
    const idx = state.value.customDoctors.indexOf(name)
    if (idx > -1) {
      state.value.customDoctors.splice(idx, 1)
    }
    // 清除该医生下所有患者的医生分配
    Object.values(state.value.patientMeta).forEach(meta => {
      if (meta.doctor === name) meta.doctor = undefined
    })
  }

  function renameDoctor(oldName: string, newName: string) {
    if (!newName.trim() || oldName === newName.trim()) return
    const idx = state.value.customDoctors.indexOf(oldName)
    if (idx > -1) {
      state.value.customDoctors[idx] = newName.trim()
    }
    // 更新该医生下所有患者的医生分配
    Object.values(state.value.patientMeta).forEach(meta => {
      if (meta.doctor === oldName) meta.doctor = newName.trim()
    })
  }

  function assignGroup(patientId: string, group: string | null) {
    if (!state.value.patientMeta[patientId]) {
      state.value.patientMeta[patientId] = {}
    }
    state.value.patientMeta[patientId].group = group || undefined
  }

  function assignDoctor(patientId: string, doctor: string) {
    if (!state.value.patientMeta[patientId]) {
      state.value.patientMeta[patientId] = {}
    }
    state.value.patientMeta[patientId].doctor = doctor
  }

  function getPatientGroup(patientId: string): string | undefined {
    return state.value.patientMeta[patientId]?.group
  }

  // 预建患者ID到医生的映射表（O(1)查找，避免遍历5000条）
  const patientDoctorMap = computed(() => {
    const map: Record<string, string> = {}
    patients.value.forEach(p => {
      map[p.id] = p.doctor || '未分配'
    })
    // 覆盖用户分配的医生
    Object.entries(state.value.patientMeta).forEach(([pid, meta]) => {
      if (meta.doctor) map[pid] = meta.doctor
    })
    return map
  })

  function getPatientDoctor(patientId: string): string {
    return patientDoctorMap.value[patientId] || '未分配'
  }

  // 简单哈希函数
  function simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  // 简单哈希函数，基于字符串生成0-1的随机数（同一天内一致）
  function hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash) / 2147483647
  }

  // 获取今天的日期字符串
  function getTodayStr(): string {
    const now = new Date()
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
  }

  // 未完成训练的患者ID列表（每天更新，只包含有进行中疗程的患者）
  const incompletePatientIds = ref<string[]>([])

  // 未完成训练的患者列表（每天只计算一次，避免闪烁）
  const incompleteTrainingPatients = ref<Array<{
    patient: Patient
    courseName: string
    courseIndex: number
    incompleteDate: string
  }>>([])

  // 已读通知的患者ID集合（必须在 ensurePatientData 调用之前定义）
  const readNotificationIds = ref<Set<string>>(new Set())

  // 计算未完成训练列表（固定10人，只从有进行中疗程的患者中选择）
  function calcIncompleteTraining() {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
    const incompleteDate = `${yesterday.getMonth() + 1}月${yesterday.getDate()}日`

    // 第一步：筛选有进行中疗程的患者
    const ongoingPatients: Patient[] = []
    patients.value.forEach(patient => {
      ensurePatientPlan(patient.id)
      const plan = state.value.plans[patient.id]
      if (plan && plan.courses && plan.courses.some((c: any) => c.status === '进行中')) {
        ongoingPatients.push(patient)
      }
    })

    // 第二步：基于日期哈希，从有进行中疗程的患者中选择10个
    const seed = simpleHash(yesterdayStr)
    const selectedIds: string[] = []
    const used = new Set<number>()
    let count = 0
    let offset = 0
    while (count < 10 && count < ongoingPatients.length) {
      const idx = (seed + offset * 7) % ongoingPatients.length
      if (!used.has(idx)) {
        used.add(idx)
        selectedIds.push(ongoingPatients[idx].id)
        count++
      }
      offset++
    }

    // 存储未完成患者ID列表（供生成report时使用）
    incompletePatientIds.value = selectedIds

    // 第三步：生成通知列表
    const result: Array<{
      patient: Patient
      courseName: string
      courseIndex: number
      incompleteDate: string
    }> = []

    selectedIds.forEach(pid => {
      const patient = patients.value.find(p => p.id === pid)
      if (!patient) return

      const plan = state.value.plans[pid]
      if (!plan || !plan.courses || plan.courses.length === 0) return

      const ongoingCourse = plan.courses.find((c: any) => c.status === '进行中')
      const course = ongoingCourse || plan.courses[0]
      const courseIndex = plan.courses.indexOf(course)

      result.push({
        patient,
        courseName: course.name || `疗程${courseIndex + 1}`,
        courseIndex,
        incompleteDate
      })
    })

    incompleteTrainingPatients.value = result
  }

  // 初始化时计算一次
  calcIncompleteTraining()

  // 初始化时确保当前选中患者有数据
  ensurePatientData(state.value.selectedPatientId)

  function markNotificationRead(patientId: string) {
    readNotificationIds.value.add(patientId)
  }

  function markAllNotificationsRead() {
    incompleteTrainingPatients.value.forEach(item => {
      readNotificationIds.value.add(item.patient.id)
    })
  }

  const unreadNotificationCount = computed(() => {
    return incompleteTrainingPatients.value.filter(
      item => !readNotificationIds.value.has(item.patient.id)
    ).length
  })

  function resetData() {
    localStorage.removeItem(STORAGE_KEY)
    state.value = {
      selectedPatientId: 'p9',
      reports: {},
      plans: {},
      gaits: {},
      healthForms: {},
      groups: [],
      customDoctors: [],
      patientMeta: {}
    }
    ensurePatientData('p9')
  }

  // 持久化（只保存元数据，避免大对象序列化导致卡顿）
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  watch(
    state,
    () => {
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = setTimeout(() => {
        try {
          // 只持久化元数据，不持久化报告/计划/步态等大对象
          const metaOnly = {
            selectedPatientId: state.value.selectedPatientId,
            groups: state.value.groups || [],
            customDoctors: state.value.customDoctors || [],
            patientMeta: state.value.patientMeta || {},
            lastRefreshDate: state.value.lastRefreshDate || '',
            reports: {},
            plans: {},
            gaits: {},
            healthForms: {}
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(metaOnly))
        } catch (e) {
          console.warn('Failed to persist state', e)
        }
      }, 100)
    },
    { deep: true }
  )

  return {
    patients,
    selectedPatient,
    selectedPatientId: computed(() => state.value.selectedPatientId),
    currentReport,
    currentWeek,
    currentCourse,
    canGoPrevWeek,
    canGoNextWeek,
    currentPlan,
    currentGait,
    currentHealthForm,
    selectPatient,
    updateReport,
    updatePlan,
    selectCourse,
    addCourse,
    updateCurrentCourse,
    updateGait,
    updateHealthForm,
    groups,
    doctors,
    customDoctors: computed(() => state.value.customDoctors || []),
    addGroup,
    removeGroup,
    renameGroup,
    addDoctor,
    removeDoctor,
    renameDoctor,
    assignGroup,
    assignDoctor,
    getPatientGroup,
    getPatientDoctor,
    incompleteTrainingPatients,
    unreadNotificationCount,
    readNotificationIds,
    markNotificationRead,
    markAllNotificationsRead,
    prevWeek,
    nextWeek,
    addNextWeek,
    updateCurrentWeek,
    regenerateCurrent,
    resetData
  }
})
