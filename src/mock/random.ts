import type {
  Patient, TrainingReport, RehabPlan, GaitAnalysis,
  HealthForm, PlanAction, WeeklyStat, GaitParam, JointRange
} from './types'
import { actionLibrary } from './index'

// ============ 工具函数 ============
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randFloat(min: number, max: number, decimals = 1): number {
  const val = Math.random() * (max - min) + min
  return parseFloat(val.toFixed(decimals))
}

function randChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randDate(daysAgoMin: number, daysAgoMax: number): string {
  const now = new Date()
  const days = randInt(daysAgoMin, daysAgoMax)
  const d = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 生成最近N天的日期数组（MM/DD格式），从 daysAgo 天前到今天
function recentDates(daysAgo: number): string[] {
  const result: string[] = []
  const now = new Date()
  for (let i = daysAgo; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    result.push(`${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`)
  }
  return result
}

// 生成最近N天的完整日期数组（YYYY-MM-DD格式）
function recentFullDates(daysAgo: number): string[] {
  const result: string[] = []
  const now = new Date()
  for (let i = daysAgo; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }
  return result
}

// 用患者ID做种子，保证同一位患者每次生成的数据一致
function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
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

// 获取某日期未完成训练的患者ID列表（固定10人，每天不同但当天稳定）
export function getIncompletePatientIds(patients: Patient[], dateStr: string): string[] {
  // 筛选有进行中疗程的患者
  const ongoingPatients = patients.filter(p => {
    // 简化判断：患者加入时间在30天内的视为有进行中疗程
    return true
  })
  // 基于日期哈希，从患者中选择10个
  const seed = simpleHash(dateStr)
  const result: string[] = []
  const used = new Set<number>()
  let count = 0
  let offset = 0
  while (count < 10 && count < ongoingPatients.length) {
    const idx = (seed + offset * 7) % ongoingPatients.length
    if (!used.has(idx)) {
      used.add(idx)
      result.push(ongoingPatients[idx].id)
      count++
    }
    offset++
  }
  return result
}

// 判断某患者在某日期是否未完成训练
export function isPatientIncomplete(patientId: string, dateStr: string, incompleteIds: string[]): boolean {
  return incompleteIds.includes(patientId)
}

// ============ 训练报告随机生成 ============
// ============ 周数据工具函数 ============
function getWeekDates(baseDate: Date): { start: Date; end: Date; dates: string[]; weekKey: string; weekLabel: string } {
  const day = baseDate.getDay() || 7 // 周日为7
  const monday = new Date(baseDate)
  monday.setDate(baseDate.getDate() - (day - 1))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(`${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`)
  }

  const year = monday.getFullYear()
  const weekNum = getWeekNumber(monday)
  const startStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
  const endStr = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`
  const weekLabel = `${dates[0]}-${dates[6]}`

  return { start: monday, end: sunday, dates, weekKey: `${year}-W${weekNum}`, weekLabel }
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

function generateSingleWeek(
  rng: () => number,
  baseDate: Date,
  patientId: string = '',
  incompleteDate: string = '',
  incompletePatientIds: string[] = []
): import('./types').WeekData {
  const { dates, weekKey, weekLabel, start, end } = getWeekDates(baseDate)
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // 判断患者是否在未完成列表中
  const isIncomplete = incompletePatientIds.includes(patientId)

  const done = Math.floor(rng() * 50) + 30
  const overdue = Math.floor(rng() * 20) + 5
  const pending = Math.max(0, 100 - done - overdue)

  const weeklyStats: WeeklyStat[] = dates.map((dateStr, i) => {
    // 计算这一天的完整日期
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const fullDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    // 未来日期不生成数据
    if (fullDate > todayStr) {
      return {
        date: dateStr,
        rehabCompletion: 0,
        rehabStandard: 0,
        fitnessCompletion: 0,
        fitnessStandard: 0,
        totalMinutes: 0
      }
    }

    // 未完成患者在未完成日期数据为空
    if (isIncomplete && fullDate === incompleteDate) {
      return {
        date: dateStr,
        rehabCompletion: 0,
        rehabStandard: 0,
        fitnessCompletion: 0,
        fitnessStandard: 0,
        totalMinutes: 0
      }
    }

    return {
      date: dateStr,
      rehabCompletion: rng() > 0.3 ? 100 : randInt(60, 99),
      rehabStandard: Math.floor(rng() * 50) + 40,
      fitnessCompletion: rng() > 0.5 ? 100 : 0,
      fitnessStandard: rng() > 0.5 ? Math.floor(rng() * 40) + 50 : 0,
      totalMinutes: randInt(15, 45)
    }
  })

  const painScores = dates.map((dateStr, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const fullDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    // 未来日期或未完成日期不生成疼痛评分
    if (fullDate > todayStr || (isIncomplete && fullDate === incompleteDate)) {
      return { date: dateStr, pain: null as any, improvement: null as any }
    }
    return {
      date: dateStr,
      pain: parseFloat((rng() * 0.8 + 0.1).toFixed(2)),
      improvement: parseFloat((rng() * 0.6 + 0.3).toFixed(2))
    }
  })

  const feedback = dates.map((dateStr, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const fullDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    // 未来日期或未完成日期不生成反馈
    if (fullDate > todayStr || (isIncomplete && fullDate === incompleteDate)) {
      return { date: dateStr, difficulty: null as any }
    }
    return {
      date: dateStr,
      difficulty: Math.floor(rng() * 8) + 2
    }
  })

  const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
  const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`

  return {
    weekKey,
    weekLabel,
    startDate: startStr,
    endDate: endStr,
    overallCompletion: { done, overdue, pending },
    weeklyStats,
    painScores,
    feedback
  }
}

// ============ 训练报告随机生成（多周，实时生成当前周） ============
export function generateRandomReport(patient: Patient, allPatients?: Patient[], incompleteIds: string[] = []): TrainingReport {
  const joinDate = patient.joinDate || randDate(30, 180)
  const join = new Date(joinDate)
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  // 计算昨天的日期（未完成日期）
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`

  // 如果未传入未完成列表，且传入了所有患者，则计算
  const ids = incompleteIds.length > 0 ? incompleteIds : (allPatients ? getIncompletePatientIds(allPatients, yesterdayStr) : [])

  // 生成从加入时间所在周到当前周的所有周数据
  const weeks: import('./types').WeekData[] = []
  let cursor = new Date(join)
  // 找到加入时间所在周的周一
  const day = cursor.getDay() || 7
  cursor.setDate(cursor.getDate() - (day - 1))

  while (cursor <= now) {
    const weekEnd = new Date(cursor)
    weekEnd.setDate(cursor.getDate() + 6)

    // 判断是否是当前周（包含今天）
    const isCurrentWeek = cursor <= now && weekEnd >= now

    if (isCurrentWeek) {
      // 当前周：使用患者ID + 周开始日期 + 今天日期作为种子，每天数据会更新
      const rng = seededRandom(patient.id + '-report-' + cursor.toISOString().slice(0, 10) + '-' + todayStr)
      weeks.push(generateSingleWeek(rng, cursor, patient.id, yesterdayStr, ids))
    } else {
      // 历史周：使用患者ID + 周开始日期作为种子，数据固定
      const rng = seededRandom(patient.id + '-report-' + cursor.toISOString().slice(0, 10))
      weeks.push(generateSingleWeek(rng, cursor, patient.id, yesterdayStr, ids))
    }

    cursor.setDate(cursor.getDate() + 7)
  }

  // 至少保证有数据
  if (weeks.length === 0) {
    const rng = seededRandom(patient.id + '-report-' + todayStr)
    weeks.push(generateSingleWeek(rng, now, patient.id, yesterdayStr, ids))
  }

  return {
    patientId: patient.id,
    joinDate,
    weeks,
    currentWeekIndex: weeks.length - 1  // 默认显示最新一周
  }
}

// ============ 康复计划随机生成（多疗程） ============
const restOptions = [15, 30, 60]

function generateActions(rng: () => number, patientId: string, courseIdx: number): PlanAction[] {
  const actionCount = Math.floor(rng() * 4) + 3 // 3-6个动作
  const shuffled = [...actionLibrary].sort(() => rng() - 0.5)
  const selected = shuffled.slice(0, actionCount)
  return selected.map((a, idx) => ({
    id: `plan-${patientId}-c${courseIdx}-${idx}`,
    name: a.name,
    image: a.image,
    side: rng() > 0.5 ? 'L' : (rng() > 0.5 ? 'R' : 'LR'),
    restTime: randChoice(restOptions),
    repsPerSet: Math.floor(rng() * 15) + 5,
    sets: Math.floor(rng() * 4) + 2,
    restBetweenSets: Math.floor(rng() * 20) + 5,
    duration: `${Math.floor(rng() * 2)}'${String(Math.floor(rng() * 60)).padStart(2, '0')}"`
  }))
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function generateRandomPlan(patient: Patient): RehabPlan {
  const rng = seededRandom(patient.id + '-plan')
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  // 加入时间
  const joinDate = patient.joinDate ? new Date(patient.joinDate) : new Date(randDate(30, 180))
  joinDate.setHours(0, 0, 0, 0)

  // 生成 1-4 个疗程
  const courseCount = Math.floor(rng() * 4) + 1
  const courses: import('./types').Course[] = []
  let cursor = new Date(joinDate)

  for (let i = 0; i < courseCount; i++) {
    const courseDays = Math.floor(rng() * 17) + 14 // 14-30天
    const startDate = new Date(cursor)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + courseDays - 1)

    // 判断疗程状态
    let status: '进行中' | '已结束' | '未开始'
    if (endDate < now) {
      status = '已结束'
    } else if (startDate > now) {
      status = '未开始'
    } else {
      status = '进行中'
    }

    courses.push({
      courseId: `course-${patient.id}-${i + 1}`,
      courseName: `疗程${i + 1}`,
      dailySessions: Math.floor(rng() * 3) + 1,
      courseDays,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      actions: generateActions(rng, patient.id, i),
      status
    })

    // 下一个疗程：间隔 3-7 天
    cursor = new Date(endDate)
    cursor.setDate(cursor.getDate() + Math.floor(rng() * 5) + 3)

    // 如果下一个疗程开始时间超过未来60天，停止生成
    if (cursor > new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)) break
  }

  // 当前疗程：优先进行中，否则最后一个已结束的
  let currentCourseIndex = courses.findIndex(c => c.status === '进行中')
  if (currentCourseIndex === -1) {
    const endedIdx = courses.filter(c => c.status === '已结束').length - 1
    currentCourseIndex = endedIdx >= 0 ? endedIdx : 0
  }

  return {
    patientId: patient.id,
    courses,
    currentCourseIndex
  }
}

// ============ 步态分析随机生成 ============
function genJointCurve(rng: () => number, base: number, amp: number): number[] {
  const phase = rng() * Math.PI * 2
  const phase2 = rng() * Math.PI * 2
  return Array.from({ length: 101 }, (_, i) => {
    const t = (i / 100) * Math.PI * 2
    return base + amp * Math.sin(t + phase) + amp * 0.3 * Math.sin(t * 2 + phase2)
  })
}

export function generateRandomGait(patient: Patient): GaitAnalysis {
  const rng = seededRandom(patient.id + '-gait')

  const age = patient.age
  const heightFactor = patient.height / 120 // 以120cm为基准

  const strideLenL = Math.floor(rng() * 60 + 40 * heightFactor)
  const strideLenR = Math.floor(rng() * 60 + 40 * heightFactor)

  const spatioTemporal: GaitParam[] = [
    {
      param: '步幅',
      left: `${strideLenL}cm | ${Math.floor(strideLenL * 0.5)}cm`,
      right: `${strideLenR}cm | ${Math.floor(strideLenR * 0.9)}cm`,
      ref3_5: '60-80cm', ref6_12: '80-120cm', ref13_18: '120-160cm'
    },
    {
      param: '步幅对称性',
      symmetry: `${(rng() * 30 + 65).toFixed(1)}%`,
      ref3_5: '>95%', ref6_12: '', ref13_18: ''
    },
    {
      param: '步幅身高比',
      left: `${(rng() * 30 + 35).toFixed(1)}%`,
      right: `${(rng() * 30 + 35).toFixed(1)}%`,
      ref3_5: '', ref6_12: '', ref13_18: ''
    },
    {
      param: '步宽',
      left: rng() > 0.3 ? `${randFloat(3, 8).toFixed(1)}cm` : '--',
      ref3_5: '5-8cm', ref6_12: '4-6cm', ref13_18: ''
    },
    {
      param: '步频',
      symmetry: `${randInt(80, 160)}步/分`,
      ref3_5: '140-160步/分', ref6_12: '120-140步/分', ref13_18: '100-120步/分'
    },
    {
      param: '步速',
      symmetry: `${randFloat(0.5, 1.5).toFixed(2)}m/s(${randFloat(30, 80).toFixed(2)}m/min)`,
      ref3_5: '0.8-1.0 m/s', ref6_12: '1.0-1.2 m/s', ref13_18: '1.2-1.4 m/s'
    },
    {
      param: '步态周期',
      left: `${randFloat(0.6, 1.6).toFixed(2)}秒 | ${randFloat(0.5, 1.2).toFixed(2)}秒`,
      right: `${randFloat(0.6, 1.6).toFixed(2)}秒 | ${randFloat(0.5, 1.2).toFixed(2)}秒`,
      ref3_5: '0.6-0.8 秒', ref6_12: '0.8-1.0 秒', ref13_18: '0.9-1.1 秒'
    },
    {
      param: '步态周期对称性',
      symmetry: `${(rng() * 30 + 60).toFixed(1)}%`,
      ref3_5: '>90%', ref6_12: '>90%', ref13_18: '>90%'
    },
    {
      param: '支撑相',
      left: `${randFloat(0.5, 1.2).toFixed(2)}秒 | ${randFloat(0.4, 1.0).toFixed(2)}秒`,
      right: `${randFloat(0.5, 1.2).toFixed(2)}秒 | ${randFloat(0.4, 1.0).toFixed(2)}秒`,
      ref3_5: '', ref6_12: '', ref13_18: ''
    },
    {
      param: '支撑相占比',
      left: `${(rng() * 30 + 55).toFixed(2)}% | ${(rng() * 30 + 55).toFixed(2)}%`,
      right: `${(rng() * 30 + 55).toFixed(2)}% | ${(rng() * 30 + 55).toFixed(2)}%`,
      ref3_5: '65-70%', ref6_12: '60-65%', ref13_18: ''
    },
    {
      param: '支撑相对称性',
      symmetry: `${(rng() * 20 + 75).toFixed(1)}%`,
      ref3_5: '>90%', ref6_12: '', ref13_18: ''
    }
  ]

  const jointCurves = {
    hip: {
      left: genJointCurve(rng, randFloat(-5, 10), randFloat(15, 30)),
      right: genJointCurve(rng, randFloat(-5, 10), randFloat(15, 30))
    },
    knee: {
      left: genJointCurve(rng, randFloat(10, 35), randFloat(20, 40)),
      right: genJointCurve(rng, randFloat(10, 35), randFloat(20, 40))
    },
    ankle: {
      left: genJointCurve(rng, randFloat(-5, 5), randFloat(8, 18)),
      right: genJointCurve(rng, randFloat(-5, 5), randFloat(8, 18))
    }
  }

  const jointRange: JointRange[] = [
    { joint: '髋关节', direction: '前屈', left: `${randInt(20, 40)}° | ${randInt(25, 45)}°`, right: `${randInt(20, 40)}° | ${randInt(25, 45)}°` },
    { joint: '髋关节', direction: '后伸', left: `${randInt(5, 25)}° | ${randInt(5, 30)}°`, right: `${randInt(5, 25)}° | ${randInt(5, 30)}°` },
    { joint: '膝关节', direction: '屈曲', left: `${randInt(50, 90)}° | ${randInt(60, 95)}°`, right: `${randInt(50, 90)}° | ${randInt(60, 95)}°` },
    { joint: '膝关节', direction: '过伸', left: rng() > 0.5 ? `${randInt(0, 10)}° | ${randInt(0, 10)}°` : '-- | --', right: rng() > 0.5 ? `${randInt(0, 10)}° | ${randInt(0, 10)}°` : '-- | --' },
    { joint: '踝关节', direction: '背屈', left: `${randInt(10, 25)}° | ${randInt(10, 25)}°`, right: `${randInt(10, 25)}° | ${randInt(10, 25)}°` },
    { joint: '踝关节', direction: '跖屈', left: `${randInt(0, 15)}° | ${randInt(0, 15)}°`, right: `${randInt(0, 15)}° | ${randInt(0, 15)}°` }
  ]

  const testDate = new Date()
  testDate.setDate(testDate.getDate() - randInt(1, 30))

  return {
    patientId: patient.id,
    testTime: `${testDate.getFullYear()}年${String(testDate.getMonth() + 1).padStart(2, '0')}月${String(testDate.getDate()).padStart(2, '0')}日 ${String(randInt(8, 18)).padStart(2, '0')}:${String(randInt(0, 59)).padStart(2, '0')}`,
    clinicalDiagnosis: patient.diagnosis || '康复评估',
    videoUrl: '/videos/gait-demo.mp4',
    spatioTemporal,
    jointCurves,
    jointRange
  }
}

// ============ 健康档案随机生成 ============
const allMeasures = ['X光计算断层扫描', '核磁共振成像', '指针', '按摩理疗/训练', '其它']
const allExpectations = ['缓解疼痛', '日常生活', '恢复放松', '专业运动', '其它']
const allContraindications = ['过敏', '糖尿病', '高血压/低血压', '心脏病', '皮肤破损', '皮肤病', '传染病', '先天性疾病', '骨质疏松', '骨折', '血栓', '肺部感染']

function pickRandom<T>(arr: T[], rng: () => number, min = 0, max?: number): T[] {
  const count = Math.floor(rng() * (max ?? arr.length - min) + min)
  const shuffled = [...arr].sort(() => rng() - 0.5)
  return shuffled.slice(0, count)
}

export function generateRandomHealthForm(patient: Patient): HealthForm {
  const rng = seededRandom(patient.id + '-health')

  return {
    name: patient.name,
    gender: patient.gender,
    birthDate: patient.birthDate || randDate(365 * 18, 365 * 1),
    height: patient.height,
    weight: patient.weight,
    phone: patient.phone || `1${randInt(30, 99)}${String(randInt(10000000, 99999999))}`,
    department: patient.department,
    surgeryDate: patient.surgeryDate || (rng() > 0.5 ? randDate(30, 365) : ''),
    diagnosis: patient.diagnosis || '',
    hospital: patient.hospital || '',
    doctor: patient.doctor || '郭学亮',
    channel: patient.channel || '门诊',
    medication: rng() > 0.7 ? '是' : (rng() > 0.5 ? '否' : '其他'),
    affectSleep: rng() > 0.7,
    feverSweat: rng() > 0.8,
    otherDiscomfort: rng() > 0.6,
    measures: pickRandom(allMeasures, rng, 1, 3),
    expectations: pickRandom(allExpectations, rng, 1, 3),
    contraindications: pickRandom(allContraindications, rng, 0, 3)
  }
}
