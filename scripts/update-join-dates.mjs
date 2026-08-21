// 给所有患者添加随机加入时间
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const patientsPath = path.resolve(__dirname, '../src/data/patients.json')
const patients = JSON.parse(fs.readFileSync(patientsPath, 'utf-8'))

function randDate(daysAgoMin, daysAgoMax) {
  const now = new Date()
  const days = Math.floor(Math.random() * (daysAgoMax - daysAgoMin + 1)) + daysAgoMin
  const d = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

let count = 0
patients.forEach(p => {
  if (!p.joinDate) {
    // 加入时间：14-180天前随机
    p.joinDate = randDate(14, 180)
    count++
  }
})

fs.writeFileSync(patientsPath, JSON.stringify(patients), 'utf-8')

// 统计加入时间分布
const dist = {}
patients.forEach(p => {
  const month = p.joinDate?.slice(0, 7) || 'unknown'
  dist[month] = (dist[month] || 0) + 1
})

console.log(`✅ 已为 ${count} 位患者添加加入时间`)
console.log(`📅 加入时间分布（按月）:`)
Object.entries(dist).sort().forEach(([month, num]) => {
  console.log(`   ${month}: ${num}人`)
})
