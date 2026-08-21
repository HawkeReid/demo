// 只更新 patients.json 中的 doctor 字段为随机医生
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 医生名单（姓氏 + 名字，康复科常见医生名）
const doctorNames = [
  '郭学亮', '王建国', '李明华', '张伟强', '刘晓燕', '陈志远',
  '赵雪梅', '孙丽娟', '周文斌', '吴海涛', '郑秀芳', '冯志刚',
  '陈美玲', '褚红英', '卫建平', '蒋淑芬', '沈志强', '韩秋萍',
  '杨春晖', '朱晓峰', '秦玉梅', '尤嘉伟', '许文博', '何静怡',
  '吕明辉', '施婉婷', '张宏宇', '孔德昌', '曹丽萍', '严雪峰',
  '华玉清', '金永康', '魏建华', '陶春燕', '姜明远', '戚晓东',
  '谢慧敏', '邹建平', '喻文才', '柏松年', '窦志华', '章建国',
  '云丽娟', '苏明哲', '潘玉婷', '葛宏伟', '奚美芳', '范志毅',
  '彭晓燕', '郎建平', '鲁文军', '韦春红', '昌明远', '马志超',
  '苗秀丽', '凤建华', '花玉梅', '方志强', '俞晓峰', '任丽萍',
  '袁文杰', '柳雪峰', '酆建明', '鲍志华', '史玉芳', '唐建国',
  '费明远', '廉秀娟', '岑志伟', '薛建华', '雷春燕', '贺文斌',
  '倪志远', '汤玉梅', '滕晓峰', '殷丽萍', '罗建华', '毕明远',
  '郝志华', '邬玉芳', '安建国', '常晓燕', '乐文杰', '于雪峰',
  '时志超', '傅丽华', '皮建华', '卞玉梅', '齐志强', '康明远',
  '伍晓峰', '余丽萍', '元建华', '卜志华', '顾玉芳', '孟建国',
  '平晓燕', '黄文杰', '和雪峰', '穆志超', '萧丽华', '尹建华'
]

const patientsPath = path.resolve(__dirname, '../src/data/patients.json')
const patients = JSON.parse(fs.readFileSync(patientsPath, 'utf-8'))

let count = 0
patients.forEach(p => {
  // 前9条预设患者保持郭学亮，其余随机
  if (p.id !== 'p1' && p.id !== 'p2' && p.id !== 'p3' && p.id !== 'p4' &&
      p.id !== 'p5' && p.id !== 'p6' && p.id !== 'p7' && p.id !== 'p8' && p.id !== 'p9') {
    p.doctor = doctorNames[Math.floor(Math.random() * doctorNames.length)]
    count++
  }
})

fs.writeFileSync(patientsPath, JSON.stringify(patients), 'utf-8')

// 统计医生分布
const dist = {}
patients.forEach(p => {
  dist[p.doctor] = (dist[p.doctor] || 0) + 1
})

console.log(`✅ 已更新 ${count} 位患者的主治医师`)
console.log(`📊 共涉及 ${Object.keys(dist).length} 位医生`)
console.log(`👨‍⚕️ 医生分布（前10）:`)
Object.entries(dist).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([name, num]) => {
  console.log(`   ${name}: ${num}人`)
})
