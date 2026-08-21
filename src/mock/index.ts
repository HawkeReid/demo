import type { Patient, TrainingReport, RehabPlan, GaitAnalysis, Action, TrainingRecord, HealthForm } from './types'
import patientsData from '@/data/patients.json'

// ============ 患者列表（5000条，从 JSON 数据库加载） ============
export const patients: Patient[] = patientsData as Patient[]

// ============ 训练报告数据 ============
function genWeeklyStats(base: number): TrainingReport['weeklyStats'] {
  const dates = ['08/14', '08/15', '08/16', '08/17', '08/18', '08/19', '08/20']
  return dates.map((d, i) => ({
    date: d,
    rehabCompletion: i < 3 ? 100 : [100, 100, 100, 100][i - 3] || 100,
    rehabStandard: [64, 0, 0, 76, 82, 84, 83][i] + base,
    fitnessCompletion: 0,
    fitnessStandard: 0,
    totalMinutes: [28, 0, 0, 27, 26, 26, 26][i]
  }))
}

export const trainingReports: Record<string, TrainingReport> = {
  p9: {
    patientId: 'p9',
    overallCompletion: { done: 65, overdue: 15, pending: 20 },
    weeklyStats: genWeeklyStats(0),
    painScores: [
      { date: '08/14', pain: 0.8, improvement: 0.6 },
      { date: '08/17', pain: 0.6, improvement: 0.7 },
      { date: '08/20', pain: 0.4, improvement: 0.85 }
    ],
    feedback: [
      { date: '08/14', difficulty: 5 },
      { date: '08/15', difficulty: 4 },
      { date: '08/16', difficulty: 5 },
      { date: '08/17', difficulty: 6 },
      { date: '08/18', difficulty: 5 },
      { date: '08/19', difficulty: 4 },
      { date: '08/20', difficulty: 5 }
    ]
  }
}

// 默认报告生成器
export function getDefaultReport(patientId: string): TrainingReport {
  return {
    patientId,
    overallCompletion: { done: 60, overdue: 20, pending: 20 },
    weeklyStats: genWeeklyStats(0),
    painScores: [
      { date: '08/14', pain: 0.7, improvement: 0.5 },
      { date: '08/17', pain: 0.5, improvement: 0.65 },
      { date: '08/20', pain: 0.3, improvement: 0.8 }
    ],
    feedback: Array.from({ length: 7 }, (_, i) => ({
      date: `08/${14 + i}`,
      difficulty: 3 + Math.floor(Math.random() * 5)
    }))
  }
}

// ============ 康复计划数据 ============
export const rehabPlans: Record<string, RehabPlan> = {
  p9: {
    patientId: 'p9',
    dailySessions: 1,
    courseDays: 14,
    startDate: '2026-08-14',
    endDate: '2026-08-27',
    actions: [
      { id: 'a1', name: '靠墙微蹲30秒', image: '/images/action1.png', side: 'L', restTime: 15, repsPerSet: 4, sets: 3, restBetweenSets: 10, duration: '0\'50"' },
      { id: 'a2', name: '扶站踮脚', image: '/images/action2.png', side: 'L', restTime: 15, repsPerSet: 12, sets: 4, restBetweenSets: 10, duration: '1\'30"' },
      { id: 'a3', name: '原地踏步练习(两个8拍)', image: '/images/action3.png', side: 'L', restTime: 15, repsPerSet: 10, sets: 4, restBetweenSets: 10, duration: '1\'20"' },
      { id: 'a4', name: '扶手交替高抬腿', image: '/images/action4.png', side: 'LR', restTime: 15, repsPerSet: 15, sets: 4, restBetweenSets: 10, duration: '2\'00"' }
    ]
  }
}

export function getDefaultPlan(patientId: string): RehabPlan {
  return {
    patientId,
    dailySessions: 1,
    courseDays: 14,
    startDate: '2026-08-14',
    endDate: '2026-08-27',
    actions: rehabPlans.p9.actions
  }
}

// ============ 训练记录（基于当前日期动态生成最近14天） ============
export function genTrainingRecords(): TrainingRecord[] {
  const records: TrainingRecord[] = []
  const now = new Date()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    // 随机决定状态，约30%已完成
    const status: '已完成' | '待完成' = Math.random() > 0.7 ? '已完成' : '待完成'
    records.push({
      date: dateStr,
      type: '居家训练',
      status
    })
  }
  return records
}

// ============ 步态分析数据 ============
function genJointCurve(base: number, amp: number, phase = 0): number[] {
  return Array.from({ length: 101 }, (_, i) => {
    const t = (i / 100) * Math.PI * 2 + phase
    return base + amp * Math.sin(t) + amp * 0.3 * Math.sin(t * 2 + 0.5)
  })
}

export const gaitAnalyses: Record<string, GaitAnalysis> = {
  p9: {
    patientId: 'p9',
    testTime: '2026年08月13日 16:40',
    clinicalDiagnosis: '术后康复',
    videoUrl: '/videos/gait-demo.mp4',
    spatioTemporal: [
      { param: '步幅', left: '107cm | 50cm', right: '105cm | 97cm', ref3_5: '60-80cm', ref6_12: '80-120cm', ref13_18: '120-160cm' },
      { param: '步幅对称性', symmetry: '77.7%', ref3_5: '>95%', ref6_12: '', ref13_18: '' },
      { param: '步幅身高比', left: '46.2%', right: '59.5%', ref3_5: '', ref6_12: '', ref13_18: '' },
      { param: '步宽', left: '--', ref3_5: '5-8cm', ref6_12: '4-6cm', ref13_18: '' },
      { param: '步频', symmetry: '98步/分', ref3_5: '140-160步/分', ref6_12: '120-140步/分', ref13_18: '100-120步/分' },
      { param: '步速', symmetry: '0.80m/s(47.92m/min)', ref3_5: '0.8-1.0 m/s', ref6_12: '1.0-1.2 m/s', ref13_18: '1.2-1.4 m/s' },
      { param: '步态周期', left: '1.25秒 | 0.80秒', right: '1.58秒 | 1.45秒', ref3_5: '0.6-0.8 秒', ref6_12: '0.8-1.0 秒', ref13_18: '0.9-1.1 秒' },
      { param: '步态周期对称性', symmetry: '67.6%', ref3_5: '>90%', ref6_12: '>90%', ref13_18: '>90%' },
      { param: '支撑相', left: '0.82秒 | 0.68秒', right: '1.12秒 | 1.03秒', ref3_5: '', ref6_12: '', ref13_18: '' },
      { param: '支撑相占比', left: '65.33% | 85.42%', right: '70.53% | 71.26%', ref3_5: '65-70%', ref6_12: '60-65%', ref13_18: '' },
      { param: '支撑相对称性', symmetry: '94.1%', ref3_5: '>90%', ref6_12: '', ref13_18: '' }
    ],
    jointCurves: {
      hip: { left: genJointCurve(5, 25, 0), right: genJointCurve(5, 22, 0.3) },
      knee: { left: genJointCurve(30, 35, 0.5), right: genJointCurve(25, 30, 0.8) },
      ankle: { left: genJointCurve(0, 15, 0.2), right: genJointCurve(2, 12, 0.6) }
    },
    jointRange: [
      { joint: '髋关节', direction: '前屈', left: '31° | 35°', right: '29° | 30°' },
      { joint: '髋关节', direction: '后伸', left: '20° | 25°', right: '11° | 6°' },
      { joint: '膝关节', direction: '屈曲', left: '76° | 76°', right: '60° | 78°' },
      { joint: '膝关节', direction: '过伸', left: '-- | --', right: '-- | --' },
      { joint: '踝关节', direction: '背屈', left: '19° | 19°', right: '17° | 24°' },
      { joint: '踝关节', direction: '跖屈', left: '6° | 11°', right: '1° | 6°' }
    ]
  }
}

export function getDefaultGait(patientId: string): GaitAnalysis {
  return gaitAnalyses.p9
}

// ============ 动作库 ============
export const actionLibrary: Action[] = [
  { id: 'act1', name: '哑铃侧平举', image: '/images/act1.png', category: '康复训练', bodyPart: ['肩'], position: ['站位'], equipment: ['哑铃'] },
  { id: 'act2', name: '弹力带肩外展', image: '/images/act2.png', category: '康复训练', bodyPart: ['肩'], position: ['站位'], equipment: ['弹力带'] },
  { id: 'act3', name: '弹力带肩前平举', image: '/images/act3.png', category: '康复训练', bodyPart: ['肩'], position: ['站位'], equipment: ['弹力带'] },
  { id: 'act4', name: '肩外展抗阻外旋', image: '/images/act4.png', category: '康复训练', bodyPart: ['肩'], position: ['站位'], equipment: ['徒手'] },
  { id: 'act5', name: '60°下蹲', image: '/images/act5.png', category: '康复训练', bodyPart: ['膝', '腰腹核心'], position: ['站位'], equipment: ['徒手'] },
  { id: 'act6', name: '90°下蹲', image: '/images/act6.png', category: '康复训练', bodyPart: ['膝', '腰腹核心'], position: ['站位'], equipment: ['徒手'] },
  { id: 'act7', name: '弹力带坐位伸膝', image: '/images/act7.png', category: '康复训练', bodyPart: ['膝'], position: ['坐位'], equipment: ['弹力带'] },
  { id: 'act8', name: '坐位伸膝', image: '/images/act8.png', category: '康复训练', bodyPart: ['膝'], position: ['坐位'], equipment: ['徒手'] },
  { id: 'act9', name: '单侧俯身四足伸展', image: '/images/act9.png', category: '康复训练', bodyPart: ['腰腹核心'], position: ['跪姿'], equipment: ['徒手'] },
  { id: 'act10', name: '弹力带侧卧举腿30°', image: '/images/act10.png', category: '康复训练', bodyPart: ['髋'], position: ['卧位'], equipment: ['弹力带'] },
  { id: 'act11', name: '弹力带侧卧举腿40°', image: '/images/act11.png', category: '康复训练', bodyPart: ['髋'], position: ['卧位'], equipment: ['弹力带'] },
  { id: 'act12', name: '侧卧举腿', image: '/images/act12.png', category: '康复训练', bodyPart: ['髋'], position: ['卧位'], equipment: ['徒手'] },
  { id: 'act13', name: '脚跟滑动60°', image: '/images/act13.png', category: '康复训练', bodyPart: ['膝'], position: ['卧位'], equipment: ['徒手'] },
  { id: 'act14', name: '脚跟滑动90°', image: '/images/act14.png', category: '康复训练', bodyPart: ['膝'], position: ['卧位'], equipment: ['徒手'] },
  { id: 'act15', name: '脚跟滑动120°', image: '/images/act15.png', category: '康复训练', bodyPart: ['膝'], position: ['卧位'], equipment: ['徒手'] },
  { id: 'act16', name: '坐位股后肌拉伸', image: '/images/act16.png', category: '康复训练', bodyPart: ['膝'], position: ['坐位'], equipment: ['靠背椅'] },
  { id: 'act17', name: '仰卧举腿', image: '/images/act17.png', category: '康复训练', bodyPart: ['髋', '腰腹核心'], position: ['卧位'], equipment: ['徒手'] },
  { id: 'act18', name: '站位屈膝', image: '/images/act18.png', category: '康复训练', bodyPart: ['膝'], position: ['站位'], equipment: ['靠背椅'] },
  { id: 'act19', name: '站位抗阻屈膝', image: '/images/act19.png', category: '康复训练', bodyPart: ['膝'], position: ['站位'], equipment: ['弹力带', '靠背椅'] },
  { id: 'act20', name: '保加利亚蹲90°', image: '/images/act20.png', category: '健身功法/健身操', bodyPart: ['膝', '腰腹核心'], position: ['站位'], equipment: ['靠背椅'] }
]

// ============ 健康档案表单默认值 ============
export function getDefaultHealthForm(patient: Patient): HealthForm {
  return {
    name: patient.name,
    gender: patient.gender,
    birthDate: patient.birthDate || '',
    height: patient.height || 0,
    weight: patient.weight || 0,
    phone: patient.phone || '',
    department: patient.department,
    surgeryDate: patient.surgeryDate || '',
    diagnosis: patient.diagnosis || '',
    hospital: patient.hospital || '',
    doctor: patient.doctor || '',
    channel: patient.channel || '',
    medication: '否',
    affectSleep: false,
    feverSweat: false,
    otherDiscomfort: false,
    measures: [],
    expectations: [],
    contraindications: []
  }
}

// ============ 筛选选项 ============
export const filterOptions = {
  bodyPart: ['头颈', '胸椎', '腰腹核心', '肩', '肘', '髋', '膝', '足踝', '全身'],
  position: ['站位', '坐位', '卧位', '跪姿'],
  equipment: ['徒手', '瑜伽垫', '弹力带', '哑铃', '瑞士球', '靠背椅', '泡沫轴', '沙袋', '迷你弹力带']
}
