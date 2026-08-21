// 生成5000条患者测试数据
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const surnames = [
  '赵','钱','孙','李','周','吴','郑','王','冯','陈','褚','卫','蒋','沈','韩','杨',
  '朱','秦','尤','许','何','吕','施','张','孔','曹','严','华','金','魏','陶','姜',
  '戚','谢','邹','喻','柏','水','窦','章','云','苏','潘','葛','奚','范','彭','郎',
  '鲁','韦','昌','马','苗','凤','花','方','俞','任','袁','柳','酆','鲍','史','唐',
  '费','廉','岑','薛','雷','贺','倪','汤','滕','殷','罗','毕','郝','邬','安','常',
  '乐','于','时','傅','皮','卞','齐','康','伍','余','元','卜','顾','孟','平','黄',
  '和','穆','萧','尹','姚','邵','湛','汪','祁','毛','禹','狄','米','贝','明','臧',
  '计','伏','成','戴','谈','宋','茅','庞','熊','纪','舒','屈','项','祝','董','梁',
  '杜','阮','蓝','闵','席','季','麻','强','贾','路','娄','危','江','童','颜','郭',
  '梅','盛','林','刁','钟','徐','邱','骆','高','夏','蔡','田','樊','胡','凌','霍',
  '虞','万','支','柯','昝','管','卢','莫','经','房','裘','缪','干','解','应','宗',
  '丁','宣','贲','邓','郁','单','杭','洪','包','诸','左','石','崔','吉','钮','龚',
  '程','嵇','邢','滑','裴','陆','荣','翁','荀','羊','於','惠','甄','曲','家','封',
  '芮','羿','储','靳','汲','邴','糜','松','井','段','富','巫','乌','焦','巴','弓',
  '牧','隗','山','谷','车','侯','宓','蓬','全','郗','班','仰','秋','仲','伊','宫',
  '宁','仇','栾','暴','甘','钭','厉','戎','祖','武','符','刘','景','詹','束','龙',
  '叶','幸','司','韶','郜','黎','蓟','薄','印','宿','白','怀','蒲','邰','从','鄂',
  '索','咸','籍','赖','卓','蔺','屠','蒙','池','乔','阴','鬱','胥','能','苍','双',
  '闻','昕','党','翟','谭','贡','劳','逄','姬','申','扶','堵','冉','宰','郦','雍',
  '却','璩','桑','桂','濮','牛','寿','通','边','扈','燕','冀','郏','浦','尚','农',
  '温','别','庄','晏','柴','瞿','阎','充','慕','连','茹','习','宦','艾','鱼','容',
  '向','古','易','慎','戈','廖','庾','终','暨','居','衡','步','都','耿','满','弘',
  '匡','国','文','寇','广','禄','阙','东','欧','殳','沃','利','蔚','越','夔','隆',
  '师','巩','厍','聂','晁','勾','敖','融','冷','訾','辛','阚','那','简','饶','空',
  '曾','毋','沙','乜','养','鞠','须','丰','巢','关','蒯','相','查','后','荆','红',
  '游','竺','权','逯','盖','益','桓','公'
]

const nameChars = [
  '伟','芳','娜','敏','静','丽','强','磊','军','洋','勇','艳','杰','娟','涛','明',
  '超','秀','霞','平','刚','桂','英','华','健','世','广','志','义','兴','良','海',
  '山','仁','波','宁','贵','福','生','龙','元','全','国','胜','学','祥','才','发',
  '武','新','利','清','飞','彬','富','顺','信','子','杰','涛','昌','成','康','星',
  '光','天','达','安','岩','中','茂','进','林','有','坚','和','彪','博','诚','先',
  '敬','震','振','壮','会','思','群','豪','心','邦','承','乐','绍','功','松','善',
  '厚','庆','磊','民','友','裕','河','哲','江','超','浩','亮','政','谦','亨','奇',
  '固','之','轮','翰','朗','伯','宏','言','若','鸣','朋','斌','梁','栋','维','启',
  '克','伦','翔','旭','鹏','泽','晨','辰','士','以','建','家','致','树','炎','德',
  '行','泰','时','盛','雄','琛','钧','冠','策','腾','楠','榕','风','航','弘','秀',
  '娟','英','华','慧','巧','美','娜','静','淑','惠','珠','翠','雅','芝','玉','萍',
  '红','娥','玲','芬','芳','燕','彩','春','菊','兰','凤','洁','梅','琳','素','云',
  '莲','真','环','雪','荣','爱','妹','霞','香','月','莺','媛','艳','瑞','凡','佳',
  '嘉','琼','勤','珍','贞','莉','桂','娣','叶','璧','璐','娅','琦','晶','妍','茜',
  '秋','珊','莎','锦','黛','青','倩','婷','姣','婉','娴','瑾','颖','露','瑶','怡',
  '婵','雁','蓓','纨','仪','荷','丹','蓉','眉','君','琴','蕊','薇','菁','梦','岚',
  '苑','婕','馨','瑗','琰','韵','融','园','艺','咏','卿','聪','澜','纯','毓','悦',
  '昭','冰','爽','琬','茗','羽','希','欣','飘','育','滢','馥','筠','柔','竹','霭',
  '凝','晓','欢','霄','枫','芸','菲','寒','锦','霖','悠','晨','辰','士','以','建'
]

const diagnoses = [
  '术后康复','运动发育迟缓','脑瘫康复','步态异常','脊柱侧弯',
  '骨折术后','关节置换术后','神经系统损伤','肌肉疾病','先天性畸形',
  '平衡功能障碍','协调功能障碍','肌力低下','关节活动受限','疼痛综合征'
]

const hospitals = [
  '市儿童医院','省康复中心','市第一人民医院','市中医院','大学附属医院',
  '妇幼保健院','中心医院','人民医院','康复专科医院','儿童医学中心'
]

const channels = ['门诊','转诊','网络咨询','社区推荐','其他医院转入']

// 医生名单
const doctors = [
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
  '袁文杰', '柳雪峰', '鲍志华', '史玉芳', '唐建国', '费明远',
  '廉秀娟', '岑志伟', '薛建华', '雷春燕', '贺文斌', '倪志远',
  '汤玉梅', '滕晓峰', '殷丽萍', '罗建华', '毕明远', '郝志华',
  '邬玉芳', '安建国', '常晓燕', '乐文杰', '于雪峰', '时志超',
  '傅丽华', '皮建华', '卞玉梅', '齐志强', '康明远', '伍晓峰',
  '余丽萍', '元建华', '卜志华', '顾玉芳', '孟建国', '平晓燕',
  '黄文杰', '和雪峰', '穆志超', '萧丽华', '尹建华'
]

const avatarColors = [
  '#a8e6cf','#ffd3b6','#ffaaa5','#c5e8a8','#b5ead7',
  '#ffdac1','#e2f0cb','#c7ceea','#ffb7b2','#ff9aa2',
  '#b5ead7','#cddafd','#dcedc1','#ffd3b6','#ffaaa5'
]

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateName() {
  const surname = randomChoice(surnames)
  const nameLen = Math.random() > 0.3 ? 2 : 1
  let givenName = ''
  for (let i = 0; i < nameLen; i++) {
    givenName += randomChoice(nameChars)
  }
  return surname + givenName
}

function generatePhone() {
  const prefixes = ['138','139','137','136','135','158','159','157','150','151',
                    '188','189','187','186','177','178','199','198','157','156']
  const prefix = randomChoice(prefixes)
  let suffix = ''
  for (let i = 0; i < 8; i++) {
    suffix += randomInt(0, 9)
  }
  return prefix + suffix
}

function calcHeight(age) {
  if (age <= 1) return randomInt(70, 80)
  if (age <= 3) return randomInt(80, 100)
  if (age <= 6) return randomInt(100, 120)
  if (age <= 9) return randomInt(120, 135)
  if (age <= 12) return randomInt(135, 155)
  if (age <= 15) return randomInt(150, 165)
  return randomInt(155, 175)
}

function calcWeight(age, height) {
  const bmi = randomInt(14, 20)
  return Math.round((height / 100) * (height / 100) * bmi)
}

function generateBirthDate(age) {
  const now = new Date()
  const year = now.getFullYear() - age - randomInt(0, 1)
  const month = randomInt(1, 12)
  const day = randomInt(1, 28)
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
}

function generateSurgeryDate() {
  if (Math.random() > 0.6) return ''
  const now = new Date()
  const daysAgo = randomInt(7, 365)
  const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

const COUNT = 5000
const patients = []

console.log(`开始生成 ${COUNT} 条患者数据...`)

for (let i = 0; i < COUNT; i++) {
  const gender = Math.random() > 0.5 ? '男' : '女'
  const age = randomInt(1, 18)
  const height = calcHeight(age)
  const weight = calcWeight(age, height)
  const birthDate = generateBirthDate(age)

  patients.push({
    id: `p${i + 1}`,
    name: generateName(),
    gender,
    age,
    avatarColor: randomChoice(avatarColors),
    department: '儿童康复一科',
    height,
    weight,
    phone: generatePhone(),
    birthDate,
    diagnosis: randomChoice(diagnoses),
    hospital: randomChoice(hospitals),
    doctor: randomChoice(doctors),
    channel: randomChoice(channels),
    surgeryDate: generateSurgeryDate(),
    joinDate: randDate(14, 180)
  })
}

// 前9条保持预设示例数据
const presetPatients = [
  { id: 'p1', name: '兰文著', gender: '男', age: 11, avatarColor: '#a8e6cf', department: '儿童康复一科', height: 138, weight: 32, phone: '13800000001', birthDate: '2015-03-12', diagnosis: '术后康复', hospital: '市儿童医院', doctor: '郭学亮', channel: '门诊', surgeryDate: '2026-01-15' },
  { id: 'p2', name: '马若惜', gender: '女', age: 12, avatarColor: '#ffd3b6', department: '儿童康复一科', height: 145, weight: 36, phone: '13800000002', birthDate: '2014-07-22', diagnosis: '运动发育迟缓', hospital: '市儿童医院', doctor: '郭学亮', channel: '转诊', surgeryDate: '' },
  { id: 'p3', name: '李慕杨', gender: '男', age: 8, avatarColor: '#ffaaa5', department: '儿童康复一科', height: 128, weight: 26, phone: '13800000003', birthDate: '2018-01-05', diagnosis: '脑瘫康复', hospital: '省康复中心', doctor: '郭学亮', channel: '门诊', surgeryDate: '2025-11-20' },
  { id: 'p4', name: '何树烨', gender: '男', age: 8, avatarColor: '#a8e6cf', department: '儿童康复一科', height: 125, weight: 24, phone: '13800000004', birthDate: '2018-05-18', diagnosis: '术后康复', hospital: '市儿童医院', doctor: '郭学亮', channel: '门诊', surgeryDate: '2026-02-10' },
  { id: 'p5', name: '张蔷瑜', gender: '女', age: 6, avatarColor: '#ffd3b6', department: '儿童康复一科', height: 115, weight: 20, phone: '13800000005', birthDate: '2020-09-30', diagnosis: '步态异常', hospital: '市儿童医院', doctor: '郭学亮', channel: '门诊', surgeryDate: '' },
  { id: 'p6', name: '莫靖萱', gender: '女', age: 12, avatarColor: '#ffaaa5', department: '儿童康复一科', height: 148, weight: 38, phone: '13800000006', birthDate: '2014-02-14', diagnosis: '脊柱侧弯', hospital: '省康复中心', doctor: '郭学亮', channel: '转诊', surgeryDate: '2025-12-01' },
  { id: 'p7', name: '肖煜辰', gender: '男', age: 10, avatarColor: '#a8e6cf', department: '儿童康复一科', height: 135, weight: 30, phone: '13800000007', birthDate: '2016-06-08', diagnosis: '术后康复', hospital: '市儿童医院', doctor: '郭学亮', channel: '门诊', surgeryDate: '2026-01-28' },
  { id: 'p8', name: '夏屹松', gender: '男', age: 4, avatarColor: '#ffd3b6', department: '儿童康复一科', height: 102, weight: 16, phone: '13800000008', birthDate: '2022-04-20', diagnosis: '运动发育迟缓', hospital: '市儿童医院', doctor: '郭学亮', channel: '门诊', surgeryDate: '' },
  { id: 'p9', name: '艾承奕', gender: '男', age: 7, avatarColor: '#c5e8a8', department: '儿童康复一科', height: 120, weight: 22, phone: '15718072230', birthDate: '2019-06-15', diagnosis: '术后/伤后', hospital: '市儿童医院', doctor: '郭学亮', channel: '门诊', surgeryDate: '2026-03-01' }
]

for (let i = 0; i < presetPatients.length; i++) {
  patients[i] = presetPatients[i]
}

const outputDir = path.resolve(__dirname, '../src/data')
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

const outputPath = path.join(outputDir, 'patients.json')
fs.writeFileSync(outputPath, JSON.stringify(patients), 'utf-8')

console.log(`✅ 已生成 ${patients.length} 条患者数据`)
console.log(`📁 保存到: ${outputPath}`)
console.log(`📊 文件大小: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`)

const genderCount = { 男: 0, 女: 0 }
patients.forEach(p => { genderCount[p.gender]++ })
console.log(`👤 性别分布: 男 ${genderCount.男}, 女 ${genderCount.女}`)
