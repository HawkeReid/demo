<template>
  <div class="gait-analysis">
    <PatientSubTabs />

    <div class="gait-content">
      <!-- 子标签 -->
      <div class="gait-tabs">
        <span
          v-for="tab in gaitTabList"
          :key="tab.value"
          class="gait-tab"
          :class="{ active: activeGaitTab === tab.value }"
          @click="activeGaitTab = tab.value"
        >{{ tab.label }}</span>
      </div>

      <!-- 步态视频 -->
      <div v-if="activeGaitTab === 'video'" class="video-section">
        <div class="video-toolbar">
          <div class="toolbar-left">
            <el-button size="small" :icon="Plus">+左侧视频</el-button>
            <el-button size="small" :icon="Plus">+右侧视频</el-button>
            <el-button size="small" :icon="Plus">+正面视频</el-button>
            <el-radio-group v-model="shootMode" size="small">
              <el-radio-button value="fixed">定点拍摄</el-radio-button>
              <el-radio-button value="follow">跟随拍摄</el-radio-button>
            </el-radio-group>
            <el-button type="primary" size="small" @click="startRecognize">开始识别</el-button>
            <span class="recognize-progress">{{ recognizeProgress }}%</span>
          </div>
          <div class="toolbar-right">
            <el-tag type="primary" size="small">{{ testRecordId }}</el-tag>
            <el-button :icon="Delete" size="small" text />
          </div>
        </div>

        <div class="video-view-tabs">
          <el-radio-group v-model="videoView">
            <el-radio value="left">左侧视频</el-radio>
            <el-radio value="right">右侧视频</el-radio>
            <el-radio value="front">正面视频</el-radio>
          </el-radio-group>
          <el-switch v-model="showStickFigure" active-text="棍图" />
        </div>

        <!-- 视频播放区 -->
        <div class="video-player card">
          <video
            ref="videoRef"
            class="video-element"
            controls
            muted
            :src="videoUrl"
            @timeupdate="onTimeUpdate"
          >
            您的浏览器不支持视频播放
          </video>
          <div class="video-placeholder-tip" v-if="!videoLoaded">
            <el-icon><VideoCamera /></el-icon>
            <p>步态视频预览区（请将视频文件放入 public/videos/gait-demo.mp4）</p>
          </div>
        </div>

        <!-- 帧控制 -->
        <div class="frame-controls">
          <div class="frame-nav">
            <el-button :icon="ZoomOut" circle size="small" />
            <el-button :icon="RefreshLeft" circle size="small" />
            <el-button :icon="ArrowLeft" circle size="small" @click="prevFrame" />
            <span class="frame-label">第{{ currentFrame }}帧</span>
            <el-button :icon="ArrowRight" circle size="small" @click="nextFrame" />
            <el-button :icon="RefreshRight" circle size="small" />
          </div>
          <div class="key-frames">
            <span
              v-for="(kf, idx) in keyFrames"
              :key="idx"
              class="key-frame-tag"
              @click="editKeyFrame(idx)"
            >
              {{ kf.label }}
              <el-icon class="edit-icon"><Edit /></el-icon>
            </span>
            <span class="key-frame-value">{{ keyFrames.map(k => k.frame).join('   ') }}</span>
            <el-button :icon="Document" size="small" text />
            <el-button :icon="Refresh" size="small" text @click="resetKeyFrames" />
          </div>
          <div class="scale-setting">
            <span>线段实际长度</span>
            <el-input-number v-model="scaleLength" :min="10" :max="1000" size="small" />
            <span>cm</span>
            <el-button :icon="CopyDocument" size="small" text />
          </div>
        </div>

        <div class="playback-speed">
          <span>播放速度：</span>
          <el-radio-group v-model="playbackRate" size="small">
            <el-radio-button :value="1.0">1.0</el-radio-button>
            <el-radio-button :value="0.5">1/2</el-radio-button>
            <el-radio-button :value="0.25">1/4</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 分析报告 -->
      <div v-if="activeGaitTab === 'report'" class="report-section">
        <!-- 患者信息 -->
        <div class="patient-meta card">
          <div class="meta-row">
            <div class="meta-item">
              <span class="meta-label">姓名</span>
              <el-input v-model="gaitPatient.name" size="small" style="width: 120px" />
            </div>
            <div class="meta-item">
              <span class="meta-label">性别</span>
              <el-select v-model="gaitPatient.gender" size="small" style="width: 80px">
                <el-option label="男" value="男" />
                <el-option label="女" value="女" />
              </el-select>
            </div>
            <div class="meta-item">
              <span class="meta-label">年龄</span>
              <el-input-number v-model="gaitPatient.age" :min="0" size="small" style="width: 80px" />
              <span>岁</span>
              <el-input-number v-model="gaitPatient.ageMonth" :min="0" :max="11" size="small" style="width: 70px" />
              <span>月</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">身高</span>
              <el-input-number v-model="gaitPatient.height" :min="0" size="small" style="width: 90px" />
              <span>cm</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">体重</span>
              <el-input-number v-model="gaitPatient.weight" :min="0" size="small" style="width: 90px" />
              <span>KG</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">测试时间</span>
              <span class="meta-value">{{ store.currentGait.testTime }}</span>
            </div>
            <div class="meta-actions">
              <el-button :icon="Edit" size="small" text />
              <el-button :icon="Download" size="small" text />
            </div>
          </div>
          <div class="meta-row">
            <span class="meta-label">临床诊断</span>
            <el-input
              v-model="gaitPatient.diagnosis"
              type="textarea"
              :rows="2"
              placeholder="临床诊断"
              style="flex: 1; max-width: 300px"
            />
          </div>
        </div>

        <!-- 步态时空参数 -->
        <div class="param-section">
          <div class="section-header">
            <h3 class="page-title">步态时空参数</h3>
            <div class="section-actions">
              <el-button v-if="!editMode" type="primary" size="small" @click="enterEditMode">编辑参数</el-button>
              <template v-else>
                <el-button size="small" @click="cancelEdit">取消</el-button>
                <el-button type="success" size="small" @click="saveGaitParams">保存</el-button>
              </template>
            </div>
          </div>
          <div class="param-table-wrap card">
            <el-table :data="editMode ? editParams : store.currentGait.spatioTemporal" border stripe size="default" :header-cell-style="{ background: '#f5f7fa', fontWeight: 600 }">
              <el-table-column prop="param" label="参数" width="140" fixed />
              <el-table-column label="数值" min-width="200">
                <template #default="{ row }">
                  <div class="param-cell" v-if="!editMode">
                    <span v-if="row.left" class="param-left">L {{ row.left }}</span>
                    <span v-if="row.right" class="param-right">R {{ row.right }}</span>
                    <span v-if="row.symmetry" class="param-sym">{{ row.symmetry }}</span>
                  </div>
                  <div class="param-edit-cell" v-else>
                    <el-input v-if="row.left !== undefined" v-model="row.left" size="small" placeholder="左侧" style="margin-bottom: 4px" />
                    <el-input v-if="row.right !== undefined" v-model="row.right" size="small" placeholder="右侧" style="margin-bottom: 4px" />
                    <el-input v-if="row.symmetry !== undefined" v-model="row.symmetry" size="small" placeholder="对称值" />
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="ref3_5" label="参考范围(3-5岁)" min-width="140" />
              <el-table-column prop="ref6_12" label="参考范围(6-12岁)" min-width="140" />
              <el-table-column prop="ref13_18" label="参考范围(13-18岁)" min-width="140" />
            </el-table>
          </div>
        </div>

        <!-- 关节角度曲线 -->
        <div class="curve-section">
          <h3 class="page-title">关节角度曲线</h3>
          <div class="curves-grid">
            <div class="curve-card card">
              <div class="curve-label-col">
                <span>前屈</span>
                <span>髋关节</span>
                <span>后伸</span>
              </div>
              <BaseChart :option="hipCurveOption" height="220px" />
            </div>
            <div class="curve-card card">
              <div class="curve-label-col">
                <span>屈曲</span>
                <span>膝关节</span>
                <span>过伸</span>
              </div>
              <BaseChart :option="kneeCurveOption" height="220px" />
            </div>
            <div class="curve-card card curve-full">
              <div class="curve-label-col">
                <span>背屈</span>
                <span>踝关节</span>
                <span>跖屈</span>
              </div>
              <BaseChart :option="ankleCurveOption" height="220px" />
            </div>
          </div>
        </div>

        <!-- 关节角度范围 -->
        <div class="range-section">
          <h3 class="page-title">关节角度范围</h3>
          <div class="range-table-wrap card">
            <el-table :data="store.currentGait.jointRange" border stripe size="default" :header-cell-style="{ background: '#f5f7fa', fontWeight: 600 }">
              <el-table-column prop="joint" label="关节" width="120" />
              <el-table-column prop="direction" label="运动方向" width="120" />
              <el-table-column label="数值" min-width="200">
                <template #default="{ row }">
                  <span class="range-left">L {{ row.left }}</span>
                  <span class="range-right">R {{ row.right }}</span>
                </template>
              </el-table-column>
              <el-table-column label="参考范围(3-5岁)" min-width="140" />
              <el-table-column label="参考范围(6-12岁)" min-width="140" />
              <el-table-column label="参考范围(13-18岁)" min-width="140" />
            </el-table>
          </div>
        </div>
      </div>

      <!-- 步态对比 -->
      <div v-if="activeGaitTab === 'compare'" class="compare-section">
        <el-empty description="步态对比模块 - 开发中" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import type { EChartsOption } from 'echarts'
import {
  Plus, Delete, ZoomOut, RefreshLeft, RefreshRight, ArrowLeft, ArrowRight,
  Edit, Document, Refresh, CopyDocument, VideoCamera, Download
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PatientSubTabs from '@/components/PatientSubTabs.vue'
import BaseChart from '@/components/BaseChart.vue'
import { usePatientStore } from '@/stores/patient'

const store = usePatientStore()

const gaitTabList = [
  { label: '步态视频', value: 'video' },
  { label: '分析报告', value: 'report' },
  { label: '步态对比', value: 'compare' }
]
const activeGaitTab = ref('video')

// 视频相关
const videoRef = ref<HTMLVideoElement>()
const videoUrl = '/videos/gait-demo.mp4' // 将视频文件放入 public/videos/gait-demo.mp4 即可播放
const videoLoaded = ref(false)
const currentFrame = ref(0)
const playbackRate = ref(1.0)
const shootMode = ref('fixed')
const videoView = ref('left')
const showStickFigure = ref(false)
const recognizeProgress = ref(0)
const scaleLength = ref(200)

const keyFrames = ref([
  { label: 'L-触地', frame: 21 },
  { label: 'L-离地', frame: 70 },
  { label: 'L-触地', frame: 96 },
  { label: 'L-离地', frame: 137 },
  { label: 'L-触地', frame: 156 }
])

const gaitPatient = reactive({
  name: store.selectedPatient?.name || '艾承奕',
  gender: store.selectedPatient?.gender || '男',
  age: store.selectedPatient?.age || 7,
  ageMonth: 2,
  height: store.selectedPatient?.height || 120,
  weight: store.selectedPatient?.weight || 22,
  diagnosis: store.currentGait.clinicalDiagnosis
})

// 切换患者时同步更新患者信息
watch(() => store.selectedPatientId, () => {
  const p = store.selectedPatient
  if (p) {
    gaitPatient.name = p.name
    gaitPatient.gender = p.gender
    gaitPatient.age = p.age
    gaitPatient.height = p.height || 120
    gaitPatient.weight = p.weight || 22
    gaitPatient.diagnosis = store.currentGait.clinicalDiagnosis
  }
})

// 测试记录编号：从测试时间动态生成
const testRecordId = computed(() => {
  const time = store.currentGait.testTime || ''
  const match = time.match(/(\d{4})年(\d{2})月(\d{2})日/)
  if (match) {
    return `${match[1]}${match[2]}${match[3]}-1`
  }
  const now = new Date()
  return `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-1`
})

// 步态参数编辑模式
const editMode = ref(false)
const editParams = ref<any[]>([])

function enterEditMode() {
  editParams.value = JSON.parse(JSON.stringify(store.currentGait.spatioTemporal))
  editMode.value = true
}

function cancelEdit() {
  editMode.value = false
  editParams.value = []
}

function saveGaitParams() {
  const gait = JSON.parse(JSON.stringify(store.currentGait))
  gait.spatioTemporal = editParams.value
  store.updateGait(gait)
  editMode.value = false
  editParams.value = []
  ElMessage.success('步态参数已保存')
}

function onTimeUpdate() {
  if (videoRef.value) {
    currentFrame.value = Math.floor(videoRef.value.currentTime * 30)
  }
}

function prevFrame() {
  if (videoRef.value) {
    videoRef.value.currentTime = Math.max(0, videoRef.value.currentTime - 1 / 30)
  }
  currentFrame.value = Math.max(0, currentFrame.value - 1)
}

function nextFrame() {
  if (videoRef.value) {
    videoRef.value.currentTime += 1 / 30
  }
  currentFrame.value++
}

function startRecognize() {
  recognizeProgress.value = 0
  const timer = setInterval(() => {
    recognizeProgress.value += 10
    if (recognizeProgress.value >= 100) {
      clearInterval(timer)
      ElMessage.success('识别完成')
    }
  }, 200)
}

function editKeyFrame(idx: number) {
  ElMessageBox.prompt(`修改 "${keyFrames.value[idx].label}" 的帧号`, '编辑关键帧', {
    inputValue: String(keyFrames.value[idx].frame),
    inputPattern: /^\d+$/,
    inputErrorMessage: '请输入数字'
  }).then(({ value }) => {
    keyFrames.value[idx].frame = parseInt(value)
    ElMessage.success('已更新')
  }).catch(() => {})
}

function resetKeyFrames() {
  keyFrames.value = [
    { label: 'L-触地', frame: 21 },
    { label: 'L-离地', frame: 70 },
    { label: 'L-触地', frame: 96 },
    { label: 'L-离地', frame: 137 },
    { label: 'L-触地', frame: 156 }
  ]
  ElMessage.info('关键帧已重置')
}

// 关节曲线配置生成器
function buildCurveOption(leftData: number[], rightData: number[], title: string): EChartsOption {
  const xData = Array.from({ length: 101 }, (_, i) => `${i}%`)
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: [`Left ${title}`, `Right ${title}`], top: 0, textStyle: { fontSize: 11 } },
    grid: { left: '8%', right: '5%', bottom: '12%', top: '18%', containLabel: true },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: { fontSize: 10, interval: 20 },
      axisLine: { lineStyle: { color: '#ccc' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 10 },
      splitLine: { lineStyle: { color: '#eee' } }
    },
    series: [
      {
        name: `Left ${title}`,
        type: 'line',
        data: leftData,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#2563eb', width: 2 },
        itemStyle: { color: '#2563eb' }
      },
      {
        name: `Right ${title}`,
        type: 'line',
        data: rightData,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#22c55e', width: 2 },
        itemStyle: { color: '#22c55e' }
      }
    ]
  }
}

const hipCurveOption = computed(() =>
  buildCurveOption(store.currentGait.jointCurves.hip.left, store.currentGait.jointCurves.hip.right, 'Hip Angle')
)
const kneeCurveOption = computed(() =>
  buildCurveOption(store.currentGait.jointCurves.knee.left, store.currentGait.jointCurves.knee.right, 'Knee Angle')
)
const ankleCurveOption = computed(() =>
  buildCurveOption(store.currentGait.jointCurves.ankle.left, store.currentGait.jointCurves.ankle.right, 'Ankle Angle')
)
</script>

<style scoped lang="scss">
.gait-analysis {
  min-height: 100%;
}

.gait-content {
  padding: 16px 24px;
}

.gait-tabs {
  display: flex;
  justify-content: center;
  gap: 0;
  margin-bottom: 20px;
}

.gait-tab {
  padding: 8px 24px;
  font-size: 14px;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;

  &:first-child {
    border-radius: 6px 0 0 6px;
  }
  &:last-child {
    border-radius: 0 6px 6px 0;
  }
  &:not(:last-child) {
    border-right: none;
  }

  &.active {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: #fff;
    font-weight: 600;
  }
}

/* 视频区 */
.video-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.recognize-progress {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-color);
}

.video-view-tabs {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.video-player {
  position: relative;
  width: 100%;
  max-width: 960px;
  margin: 0 auto 16px;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  padding: 0;
  aspect-ratio: 16 / 9;
}

.video-element {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
}

.video-placeholder-tip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;

  .el-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }
}

.frame-controls {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.frame-nav {
  display: flex;
  align-items: center;
  gap: 6px;
}

.frame-label {
  font-size: 16px;
  font-weight: 600;
  min-width: 80px;
  text-align: center;
}

.key-frames {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.key-frame-tag {
  padding: 4px 10px;
  font-size: 12px;
  background: #f5f7fa;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
  }
}

.edit-icon {
  font-size: 11px;
}

.key-frame-value {
  font-size: 13px;
  color: var(--text-secondary);
  letter-spacing: 2px;
}

.scale-setting {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.playback-speed {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 20px;
}

/* 分析报告 */
.patient-meta {
  margin-bottom: 24px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;

  &:last-child {
    margin-bottom: 0;
  }
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-label {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.meta-value {
  font-size: 13px;
  color: var(--text-primary);
}

.meta-actions {
  margin-left: auto;
  display: flex;
  gap: 4px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.param-table-wrap,
.range-table-wrap {
  margin-bottom: 24px;
  padding: 0;
  overflow: hidden;
}

.param-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.param-edit-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header .page-title {
  margin-bottom: 0;
}

.section-actions {
  display: flex;
  gap: 8px;
}

.param-left, .range-left {
  color: #2563eb;
  font-size: 13px;
}

.param-right, .range-right {
  color: #22c55e;
  font-size: 13px;
}

.param-sym {
  color: var(--text-primary);
  font-size: 13px;
}

/* 曲线图 */
.curves-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.curve-card {
  display: flex;
  align-items: stretch;
  padding: 12px;
}

.curve-full {
  grid-column: span 2;
}

.curve-label-col {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 8px 4px;
  font-size: 12px;
  color: var(--text-secondary);
  writing-mode: vertical-rl;
  text-orientation: mixed;
  min-width: 24px;
}

.curve-card :deep(.chart-container) {
  flex: 1;
}
</style>
