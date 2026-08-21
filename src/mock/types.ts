// 类型定义
export interface Patient {
  id: string
  name: string
  gender: '男' | '女'
  age: number
  avatarColor: string
  department: string
  height?: number
  weight?: number
  phone?: string
  birthDate?: string
  diagnosis?: string
  hospital?: string
  doctor?: string
  channel?: string
  surgeryDate?: string
  joinDate?: string  // 加入时间
}

export interface WeeklyStat {
  date: string
  rehabCompletion: number
  rehabStandard: number
  fitnessCompletion: number
  fitnessStandard: number
  totalMinutes: number
}

export interface Feedback {
  date: string
  difficulty: number
}

// 单周数据
export interface WeekData {
  weekKey: string       // 如 "2026-W33"
  weekLabel: string     // 如 "08/14-08/20"
  startDate: string     // YYYY-MM-DD
  endDate: string       // YYYY-MM-DD
  overallCompletion: { done: number; overdue: number; pending: number }
  weeklyStats: WeeklyStat[]
  painScores: Array<{ date: string; pain: number; improvement: number }>
  feedback: Feedback[]
}

export interface TrainingReport {
  patientId: string
  joinDate: string      // 患者加入时间
  weeks: WeekData[]     // 多周数据
  currentWeekIndex: number  // 当前显示的周索引
}

export interface PlanAction {
  id: string
  name: string
  image: string
  side: 'L' | 'R' | 'LR'
  restTime: number
  repsPerSet: number
  sets: number
  restBetweenSets: number
  duration?: string
}

// 单个疗程
export interface Course {
  courseId: string
  courseName: string       // 疗程1、疗程2...
  dailySessions: number
  courseDays: number
  startDate: string
  endDate: string
  actions: PlanAction[]
  status: '进行中' | '已结束' | '未开始'
}

export interface RehabPlan {
  patientId: string
  courses: Course[]
  currentCourseIndex: number
}

export interface TrainingRecord {
  date: string
  type: string
  status: '已完成' | '待完成'
}

export interface GaitParam {
  param: string
  left?: string
  right?: string
  symmetry?: string
  ref3_5: string
  ref6_12: string
  ref13_18: string
}

export interface JointRange {
  joint: string
  direction: string
  left: string
  right: string
}

export interface GaitAnalysis {
  patientId: string
  testTime: string
  clinicalDiagnosis: string
  spatioTemporal: GaitParam[]
  jointCurves: {
    hip: { left: number[]; right: number[] }
    knee: { left: number[]; right: number[] }
    ankle: { left: number[]; right: number[] }
  }
  jointRange: JointRange[]
  videoUrl: string
}

export interface Action {
  id: string
  name: string
  image: string
  category: '康复训练' | '健身功法/健身操'
  bodyPart: string[]
  position: string[]
  equipment: string[]
}

export interface HealthForm {
  name: string
  gender: '男' | '女'
  birthDate: string
  height: number
  weight: number
  phone: string
  department: string
  surgeryDate: string
  diagnosis: string
  hospital: string
  doctor: string
  channel: string
  medication: string
  affectSleep: boolean
  feverSweat: boolean
  otherDiscomfort: boolean
  measures: string[]
  expectations: string[]
  contraindications: string[]
}
