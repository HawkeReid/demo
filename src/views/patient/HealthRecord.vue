<template>
  <div class="health-record">
    <PatientSubTabs />

    <div class="health-content">
      <!-- 患者信息卡 -->
      <div class="patient-info-card card">
        <div class="info-main">
          <div class="info-name">{{ store.selectedPatient?.name }}</div>
          <div class="info-gender">{{ store.selectedPatient?.gender }}</div>
          <div class="info-detail">
            {{ store.selectedPatient?.height }}cm / {{ store.selectedPatient?.weight }}kg | 术后/伤后
          </div>
        </div>
        <el-button type="primary" plain>查看详情 〉</el-button>
        <el-button type="success" style="margin-left: auto">+ 添加检查/评估报告</el-button>
      </div>

      <!-- 时间筛选 -->
      <div class="filter-row">
        <div class="filter-tabs">
          <span
            v-for="tab in timeTabs"
            :key="tab.value"
            class="filter-tab"
            :class="{ active: activeTimeTab === tab.value }"
            @click="activeTimeTab = tab.value"
          >{{ tab.label }}</span>
          <el-date-picker
            v-model="customRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            size="default"
            style="width: 240px"
          />
        </div>
        <div class="filter-right">
          <span class="filter-label">筛选</span>
          <el-select v-model="filterType" placeholder="请选择" size="default" style="width: 140px">
            <el-option label="全部" value="" />
            <el-option label="已完成" value="已完成" />
            <el-option label="待完成" value="待完成" />
          </el-select>
        </div>
      </div>

      <!-- 训练记录网格 -->
      <div class="records-grid">
        <div v-for="record in filteredRecords" :key="record.date" class="record-card card">
          <div class="record-date">{{ formatDate(record.date) }}</div>
          <div class="record-type">{{ record.type }}</div>
          <el-tag
            :type="record.status === '已完成' ? 'success' : 'info'"
            size="small"
            class="record-status"
          >{{ record.status }}</el-tag>
          <div class="record-detail">查看详情 〉</div>
        </div>
      </div>

      <!-- 健康信息表单 -->
      <div class="form-section card">
        <div class="section-title">个人健康信息表</div>
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="100px"
          label-position="right"
          class="health-form"
        >
          <div class="form-columns">
            <!-- 左栏 -->
            <div class="form-col">
              <el-form-item label="姓名" prop="name">
                <el-input v-model="form.name" placeholder="请输入姓名" />
              </el-form-item>
              <el-form-item label="性别" prop="gender">
                <el-radio-group v-model="form.gender">
                  <el-radio value="男">男</el-radio>
                  <el-radio value="女">女</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="出生年月">
                <el-date-picker
                  v-model="form.birthDate"
                  type="month"
                  placeholder="请选择出生年月"
                  value-format="YYYY-MM"
                  style="width: 100%"
                />
              </el-form-item>
              <el-form-item label="身高">
                <el-input v-model="form.height" type="number">
                  <template #append>cm</template>
                </el-input>
              </el-form-item>
              <el-form-item label="体重">
                <el-input v-model="form.weight" type="number">
                  <template #append>kg</template>
                </el-input>
              </el-form-item>
              <el-form-item label="手机号码" prop="phone">
                <el-input v-model="form.phone" placeholder="请输入手机号码" />
              </el-form-item>
              <el-form-item label="所在门店">
                <el-input v-model="form.department" />
              </el-form-item>
              <el-form-item label="手术/受伤日期">
                <el-date-picker
                  v-model="form.surgeryDate"
                  type="date"
                  placeholder="请选择手术/受伤日期"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
              <el-form-item label="诊断">
                <el-input v-model="form.diagnosis" type="textarea" :rows="2" placeholder="请输入诊断" />
              </el-form-item>
              <el-form-item label="诊治医院">
                <el-input v-model="form.hospital" />
              </el-form-item>
              <el-form-item label="主治医生">
                <el-input v-model="form.doctor" />
              </el-form-item>
              <el-form-item label="渠道">
                <el-input v-model="form.channel" />
              </el-form-item>
            </div>

            <!-- 右栏 -->
            <div class="form-col">
              <el-form-item label="用药情况">
                <el-radio-group v-model="form.medication">
                  <el-radio value="是">是</el-radio>
                  <el-radio value="否">否</el-radio>
                  <el-radio value="其他">其他</el-radio>
                </el-radio-group>
                <el-input v-if="form.medication === '其他'" placeholder="请输入" style="margin-top: 8px" />
                <div class="form-hint">（可的松、血液稀释剂、β阻滞剂等）</div>
              </el-form-item>
              <el-form-item label="影响睡眠">
                <el-radio-group v-model="form.affectSleep">
                  <el-radio :value="true">是</el-radio>
                  <el-radio :value="false">否</el-radio>
                </el-radio-group>
                <div class="form-hint">是否影响睡眠或正常生活？</div>
              </el-form-item>
              <el-form-item label="发烧盗汗">
                <el-radio-group v-model="form.feverSweat">
                  <el-radio :value="true">是</el-radio>
                  <el-radio :value="false">否</el-radio>
                </el-radio-group>
                <div class="form-hint">您最近4周有过发烧、夜间盗汗或者出汗过多吗？</div>
              </el-form-item>
              <el-form-item label="其他不适">
                <el-radio-group v-model="form.otherDiscomfort">
                  <el-radio :value="true">是</el-radio>
                  <el-radio :value="false">否</el-radio>
                </el-radio-group>
                <div class="form-hint">视力、说话、听力问题，大小便失禁，便秘，晨僵等</div>
              </el-form-item>
              <el-form-item label="已采取措施">
                <el-checkbox-group v-model="form.measures">
                  <el-checkbox value="X光计算断层扫描">X光计算断层扫描</el-checkbox>
                  <el-checkbox value="核磁共振成像">核磁共振成像</el-checkbox>
                  <el-checkbox value="指针">指针</el-checkbox>
                  <el-checkbox value="按摩理疗/训练">按摩理疗/训练</el-checkbox>
                  <el-checkbox value="其它">其它</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              <el-form-item label="治疗期望">
                <el-checkbox-group v-model="form.expectations">
                  <el-checkbox value="缓解疼痛">缓解疼痛</el-checkbox>
                  <el-checkbox value="日常生活">日常生活</el-checkbox>
                  <el-checkbox value="恢复放松">恢复放松</el-checkbox>
                  <el-checkbox value="专业运动">专业运动</el-checkbox>
                  <el-checkbox value="其它">其它</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              <el-form-item label="禁忌">
                <el-checkbox-group v-model="form.contraindications">
                  <el-checkbox value="过敏">过敏</el-checkbox>
                  <el-checkbox value="糖尿病">糖尿病</el-checkbox>
                  <el-checkbox value="高血压/低血压">高血压/低血压</el-checkbox>
                  <el-checkbox value="心脏病">心脏病</el-checkbox>
                  <el-checkbox value="皮肤破损">皮肤破损</el-checkbox>
                  <el-checkbox value="皮肤病">皮肤病</el-checkbox>
                  <el-checkbox value="传染病">传染病</el-checkbox>
                  <el-checkbox value="先天性疾病">先天性疾病</el-checkbox>
                  <el-checkbox value="骨质疏松">骨质疏松</el-checkbox>
                  <el-checkbox value="骨折">骨折</el-checkbox>
                  <el-checkbox value="血栓">血栓</el-checkbox>
                  <el-checkbox value="肺部感染">肺部感染</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
            </div>
          </div>

          <div class="form-actions">
            <el-button @click="handleCancel">取消</el-button>
            <el-button type="success" @click="handleSave">保存</el-button>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import PatientSubTabs from '@/components/PatientSubTabs.vue'
import { usePatientStore } from '@/stores/patient'
import { genTrainingRecords, getDefaultHealthForm } from '@/mock'
import type { HealthForm } from '@/mock/types'

const store = usePatientStore()
const formRef = ref<FormInstance>()

const timeTabs = [
  { label: '全部', value: 'all' },
  { label: '最近2周', value: '2w' },
  { label: '最近1个月', value: '1m' },
  { label: '最近3个月', value: '3m' }
]
const activeTimeTab = ref('all')
const customRange = ref<[string, string] | null>(null)
const filterType = ref('')

const allRecords = ref(genTrainingRecords())

const filteredRecords = computed(() => {
  let list = allRecords.value
  if (filterType.value) {
    list = list.filter(r => r.status === filterType.value)
  }
  return list
})

const form = reactive<HealthForm>(JSON.parse(JSON.stringify(store.currentHealthForm)))

watch(() => store.selectedPatientId, () => {
  Object.assign(form, JSON.parse(JSON.stringify(store.currentHealthForm)))
  allRecords.value = genTrainingRecords()
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ]
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}\n${d.getFullYear()}`
}

function handleSave() {
  formRef.value?.validate((valid) => {
    if (valid) {
      store.updateHealthForm(store.selectedPatientId, JSON.parse(JSON.stringify(form)))
      ElMessage.success('健康档案已保存到本地')
    } else {
      ElMessage.error('请检查表单填写')
    }
  })
}

function handleCancel() {
  Object.assign(form, JSON.parse(JSON.stringify(store.currentHealthForm)))
  ElMessage.info('已取消修改')
}
</script>

<style scoped lang="scss">
.health-record {
  min-height: 100%;
}

.health-content {
  padding: 16px 24px;
}

.patient-info-card {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
  color: #fff;
  border: none;

  :deep(.el-button) {
    border-color: rgba(255, 255, 255, 0.5);
    color: #fff;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}

.info-main {
  flex: 1;
}

.info-name {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
}

.info-gender {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 2px;
}

.info-detail {
  font-size: 13px;
  opacity: 0.8;
}

.filter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-tab {
  padding: 6px 14px;
  font-size: 13px;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
  }

  &.active {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: #fff;
  }
}

.filter-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.records-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.record-card {
  padding: 14px;
  position: relative;
  background: #f0faf0;
  border: 1px solid #d4f0d4;
}

.record-date {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: pre-line;
  margin-bottom: 8px;
  line-height: 1.4;
}

.record-type {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.record-status {
  margin-bottom: 8px;
}

.record-detail {
  font-size: 12px;
  color: var(--primary-color);
  cursor: pointer;
  text-align: right;

  &:hover {
    text-decoration: underline;
  }
}

/* 表单 */
.form-section {
  margin-top: 8px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
  color: var(--text-primary);
}

.health-form {
  .form-columns {
    display: flex;
    gap: 40px;
  }

  .form-col {
    flex: 1;
    min-width: 0;
  }

  .form-hint {
    font-size: 12px;
    color: var(--text-placeholder);
    margin-top: 4px;
  }
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}
</style>
