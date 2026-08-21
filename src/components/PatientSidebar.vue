<template>
  <div class="patient-sidebar">
    <div class="department-name">{{ store.selectedPatient?.department || '儿童康复一科' }}</div>

    <div class="search-bar">
      <el-input
        v-model="searchText"
        :placeholder="searchPlaceholder"
        size="default"
        clearable
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button :icon="Refresh" circle size="small" class="icon-btn" @click="handleRefresh" />
    </div>

    <div class="tab-bar">
      <span
        v-for="tab in tabs"
        :key="tab"
        class="tab-item"
        :class="{ active: activeTab === tab }"
        @click="activeTab = tab"
      >{{ tab }}</span>
    </div>

    <!-- 分组列表（收缩展开） -->
    <div
      v-if="activeTab === '分组'"
      class="filter-list group-tree"
      @contextmenu.prevent="openGroupContextMenu($event)"
    >
      <div
        v-for="group in filteredGroups"
        :key="group"
        class="group-item"
      >
        <div
          class="group-header"
          :class="{ expanded: expandedGroups.includes(group), 'drag-over': dragOverGroup === group }"
          @click="toggleGroup(group)"
          @contextmenu.prevent.stop="openGroupItemContextMenu($event, group)"
          @dragover="handleDragOver($event, group)"
          @dragleave="handleDragLeave(group)"
          @drop="handleDrop($event, group)"
        >
          <el-icon class="expand-icon"><ArrowRight /></el-icon>
          <el-icon><FolderOpened /></el-icon>
          <span class="group-name">{{ group }}</span>
          <span class="filter-count">{{ getGroupCount(group) }}</span>
          <el-icon class="delete-group" @click.stop="handleDeleteGroup(group)"><Close /></el-icon>
        </div>
        <div v-if="expandedGroups.includes(group)" class="group-patients">
          <div
            v-for="patient in (patientsByGroup[group] || [])"
            :key="patient.id"
            class="group-patient-item"
            :class="{ selected: patient.id === store.selectedPatientId, dragging: patient.id === draggingPatientId }"
            draggable="true"
            @click.stop="store.selectPatient(patient.id)"
            @contextmenu.prevent.stop="openContextMenu($event, patient)"
            @dragstart="handleDragStart($event, patient)"
            @dragend="handleDragEnd"
          >
            <div class="patient-avatar small" :style="{ background: patient.avatarColor }">
              {{ patient.name.charAt(0) }}
            </div>
            <span class="patient-name">{{ patient.name }}</span>
            <span class="patient-age">{{ patient.age }}岁</span>
          </div>
          <div v-if="(patientsByGroup[group] || []).length === 0" class="empty-tip">
            该分组暂无患者
          </div>
        </div>
      </div>
      <div class="filter-item" v-if="filteredGroups.length === 0 && searchText" style="justify-content: center; color: var(--text-placeholder); font-size: 11px;">
        未找到匹配的分组
      </div>
      <div class="filter-item" v-else-if="store.groups.length === 0" style="justify-content: center; color: var(--text-placeholder); font-size: 11px;">
        暂无分组，右键空白处新建分组
      </div>
    </div>

    <!-- 医生列表（收缩展开 + 无限滚动） -->
    <div
      v-if="activeTab === '医生'"
      class="filter-list doctor-tree"
      @contextmenu.prevent="openDoctorContextMenu($event)"
      @scroll="handleDoctorScroll"
    >
      <div
        v-for="doctor in visibleDoctors"
        :key="doctor"
        class="doctor-group"
      >
        <div
          class="doctor-header"
          :class="{ expanded: expandedDoctors.includes(doctor) }"
          @click="toggleDoctor(doctor)"
          @contextmenu.prevent.stop="openDoctorItemContextMenu($event, doctor)"
        >
          <el-icon class="expand-icon"><ArrowRight /></el-icon>
          <el-icon><User /></el-icon>
          <span class="doctor-name">{{ doctor }}</span>
          <span class="filter-count">{{ getDoctorCount(doctor) }}</span>
        </div>
        <div v-if="expandedDoctors.includes(doctor)" class="doctor-patients">
          <div
            v-for="patient in (patientsByDoctor[doctor] || [])"
            :key="patient.id"
            class="doctor-patient-item"
            :class="{ selected: patient.id === store.selectedPatientId }"
            @click.stop="store.selectPatient(patient.id)"
            @contextmenu.prevent.stop="openPatientTransferMenu($event, patient, doctor)"
          >
            <div class="patient-avatar small" :style="{ background: patient.avatarColor }">
              {{ patient.name.charAt(0) }}
            </div>
            <span class="patient-name">{{ patient.name }}</span>
            <span class="patient-age">{{ patient.age }}岁</span>
          </div>
        </div>
      </div>
      <div class="filter-item" v-if="filteredDoctors.length > doctorVisibleCount" style="justify-content: center; color: var(--text-placeholder); font-size: 11px;">
        下拉加载更多（{{ doctorVisibleCount }}/{{ filteredDoctors.length }}）
      </div>
      <div class="filter-item" v-else-if="filteredDoctors.length > 0" style="justify-content: center; color: var(--text-placeholder); font-size: 11px;">
        已加载全部 {{ filteredDoctors.length }} 位医生
      </div>
      <div class="filter-item" v-else style="justify-content: center; color: var(--text-placeholder); font-size: 11px;">
        未找到匹配的医生，右键空白处新建医生
      </div>
    </div>

    <div class="list-stats" v-if="activeTab === '所有用户' && searchText">
      搜索到 {{ filteredPatients.length }} 位患者
    </div>

    <!-- 患者列表（无限滚动） - 仅所有用户标签下显示 -->
    <div
      v-if="activeTab === '所有用户'"
      ref="listContainer"
      class="patient-list"
      @scroll="handleScroll"
      @contextmenu.prevent="closeContextMenu"
    >
      <div
        v-for="patient in visiblePatients"
        :key="patient.id"
        class="patient-card"
        :class="{ selected: patient.id === store.selectedPatientId }"
        @click="store.selectPatient(patient.id)"
        @contextmenu.prevent.stop="openContextMenu($event, patient)"
      >
        <div class="patient-avatar" :style="{ background: patient.avatarColor }">
          {{ patient.name.charAt(0) }}
        </div>
        <div class="patient-info">
          <div class="patient-name">{{ patient.name }}</div>
          <div class="patient-meta">
            <span class="gender-tag" :class="patient.gender">{{ patient.gender }}</span>
            <span class="patient-age">{{ patient.age }}岁</span>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div class="list-loading" v-if="loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
      <div class="list-end" v-else-if="visiblePatients.length >= filteredPatients.length && filteredPatients.length > 0">
        — 已加载全部 {{ filteredPatients.length }} 位 —
      </div>
      <div class="list-empty" v-else-if="filteredPatients.length === 0">
        未找到匹配的患者
      </div>
    </div>

    <div class="list-footer" v-if="activeTab === '所有用户'">
      已显示 {{ visiblePatients.length }} / {{ filteredPatients.length }} 位
    </div>

    <!-- 普通患者右键菜单（所有用户/分组标签） -->
    <div
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
      @click.stop
    >
      <div class="context-menu-title">{{ contextMenu.patient?.name }}</div>
      <div class="context-menu-item" @click="showGroupDialog = true">
        <el-icon><Folder /></el-icon>
        <span>加入分组</span>
      </div>
      <div class="context-menu-item" @click="showDoctorDialog = true">
        <el-icon><UserFilled /></el-icon>
        <span>分配医生</span>
      </div>
    </div>

    <!-- 医生栏右键菜单 -->
    <div
      v-if="doctorContextMenu.visible"
      class="context-menu"
      :style="{ top: doctorContextMenu.y + 'px', left: doctorContextMenu.x + 'px' }"
      @click.stop
    >
      <div class="context-menu-item" @click="showNewDoctorDialog = true">
        <el-icon><Plus /></el-icon>
        <span>新建医生</span>
      </div>
    </div>

    <!-- 分组栏右键菜单 -->
    <div
      v-if="groupContextMenu.visible"
      class="context-menu"
      :style="{ top: groupContextMenu.y + 'px', left: groupContextMenu.x + 'px' }"
      @click.stop
    >
      <div class="context-menu-item" @click="handleAddGroup">
        <el-icon><Plus /></el-icon>
        <span>新建分组</span>
      </div>
    </div>

    <!-- 分组项右键菜单 -->
    <div
      v-if="groupItemContextMenu.visible"
      class="context-menu"
      :style="{ top: groupItemContextMenu.y + 'px', left: groupItemContextMenu.x + 'px' }"
      @click.stop
    >
      <div class="context-menu-item" @click="openRename('group', groupItemContextMenu.group)">
        <el-icon><Edit /></el-icon>
        <span>重命名</span>
      </div>
      <div class="context-menu-item danger" @click="handleDeleteGroupItem">
        <el-icon><Delete /></el-icon>
        <span>删除分组</span>
      </div>
    </div>

    <!-- 医生项右键菜单 -->
    <div
      v-if="doctorItemContextMenu.visible"
      class="context-menu"
      :style="{ top: doctorItemContextMenu.y + 'px', left: doctorItemContextMenu.x + 'px' }"
      @click.stop
    >
      <div class="context-menu-item" @click="openRename('doctor', doctorItemContextMenu.doctor)">
        <el-icon><Edit /></el-icon>
        <span>重命名</span>
      </div>
      <div class="context-menu-item danger" @click="handleDeleteDoctorItem">
        <el-icon><Delete /></el-icon>
        <span>删除医生</span>
      </div>
    </div>

    <!-- 重命名对话框 -->
    <el-dialog v-model="showRenameDialog" :title="renameType === 'group' ? '重命名分组' : '重命名医生'" width="400px">
      <el-input v-model="renameValue" :placeholder="renameType === 'group' ? '请输入新分组名称' : '请输入新医生姓名'" />
      <template #footer>
        <el-button @click="showRenameDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmRename">确定</el-button>
      </template>
    </el-dialog>

    <!-- 患者转入右键菜单（医生标签下） -->
    <div
      v-if="transferMenu.visible"
      class="context-menu"
      :style="{ top: transferMenu.y + 'px', left: transferMenu.x + 'px' }"
      @click.stop
    >
      <div class="context-menu-title">{{ transferMenu.patient?.name }}</div>
      <div class="context-menu-item" @click="showTransferDialog = true">
        <el-icon><Switch /></el-icon>
        <span>转入其他医生</span>
      </div>
      <div class="context-menu-item" @click="showGroupDialog = true">
        <el-icon><Folder /></el-icon>
        <span>加入分组</span>
      </div>
    </div>

    <!-- 新建医生对话框 -->
    <el-dialog v-model="showNewDoctorDialog" title="新建医生" width="400px">
      <el-input
        v-model="newDoctorName"
        placeholder="请输入医生姓名"
        size="default"
        @keyup.enter="confirmNewDoctor"
      />
      <template #footer>
        <el-button @click="showNewDoctorDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmNewDoctor">确定</el-button>
      </template>
    </el-dialog>

    <!-- 转入医生对话框 -->
    <el-dialog v-model="showTransferDialog" title="转入其他医生" width="400px">
      <div class="transfer-info">
        当前医生：<el-tag size="small">{{ transferMenu.fromDoctor }}</el-tag>
      </div>
      <el-input
        v-model="transferDoctorSearch"
        placeholder="搜索目标医生"
        size="small"
        style="margin: 12px 0"
        clearable
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <div class="dialog-doctor-list">
        <div
          v-for="d in filteredTransferDoctors"
          :key="d"
          class="dialog-doctor-item"
          :class="{ active: targetDoctor === d }"
          @click="targetDoctor = d"
        >{{ d }}</div>
      </div>
      <template #footer>
        <el-button @click="showTransferDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmTransfer">确定转入</el-button>
      </template>
    </el-dialog>

    <!-- 分组选择对话框 -->
    <el-dialog v-model="showGroupDialog" title="选择分组" width="400px">
      <div class="dialog-group-list">
        <div
          class="dialog-group-item"
          :class="{ active: tempGroup === '' }"
          @click="tempGroup = ''"
        >取消分组</div>
        <div
          v-for="g in store.groups"
          :key="g"
          class="dialog-group-item"
          :class="{ active: tempGroup === g }"
          @click="tempGroup = g"
        >{{ g }}</div>
      </div>
      <el-input
        v-model="newGroupName"
        placeholder="或输入新分组名称"
        size="small"
        style="margin-top: 12px"
        clearable
      />
      <template #footer>
        <el-button @click="showGroupDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAssignGroup">确定</el-button>
      </template>
    </el-dialog>

    <!-- 医生选择对话框 -->
    <el-dialog v-model="showDoctorDialog" title="分配医生" width="400px">
      <el-input
        v-model="doctorSearch"
        placeholder="搜索医生"
        size="small"
        style="margin-bottom: 12px"
        clearable
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <div class="dialog-doctor-list">
        <div
          v-for="d in filteredDialogDoctors"
          :key="d"
          class="dialog-doctor-item"
          :class="{ active: tempDoctor === d }"
          @click="tempDoctor = d"
        >{{ d }}</div>
      </div>
      <template #footer>
        <el-button @click="showDoctorDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAssignDoctor">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, reactive, onMounted, onUnmounted, watch } from 'vue'
import { Search, Refresh, Loading, Folder, FolderOpened, Plus, Close, User, UserFilled, ArrowRight, Switch, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePatientStore } from '@/stores/patient'
import type { Patient } from '@/mock/types'

const store = usePatientStore()
const searchText = ref('')
const activeTab = ref('所有用户')
const tabs = ['所有用户', '分组', '医生']
const selectedGroup = ref('')
const selectedDoctor = ref('')

// 搜索框提示
const searchPlaceholder = computed(() => {
  if (activeTab.value === '医生') return '搜索医生姓名'
  if (activeTab.value === '分组') return '搜索分组名称'
  return '输入姓名搜索（共5000条）'
})

// 根据搜索过滤分组
const filteredGroups = computed(() => {
  if (!searchText.value.trim() || activeTab.value !== '分组') return store.groups
  const kw = searchText.value.trim().toLowerCase()
  return store.groups.filter(g => g.toLowerCase().includes(kw))
})
const expandedDoctors = ref<string[]>([])
const expandedGroups = ref<string[]>([])

function toggleDoctor(doctor: string) {
  const idx = expandedDoctors.value.indexOf(doctor)
  if (idx > -1) {
    expandedDoctors.value.splice(idx, 1)
  } else {
    expandedDoctors.value.push(doctor)
  }
}

function toggleGroup(group: string) {
  const idx = expandedGroups.value.indexOf(group)
  if (idx > -1) {
    expandedGroups.value.splice(idx, 1)
  } else {
    expandedGroups.value.push(group)
  }
}

// 预计算每个分组的患者列表
const patientsByGroup = computed(() => {
  const map: Record<string, Patient[]> = {}
  store.patients.forEach(p => {
    const g = store.getPatientGroup(p.id)
    if (g) {
      if (!map[g]) map[g] = []
      if (map[g].length < 50) map[g].push(p)
    }
  })
  return map
})

// 拖拽状态
const draggingPatientId = ref('')
const dragOverGroup = ref('')

function handleDragStart(e: DragEvent, patient: Patient) {
  draggingPatientId.value = patient.id
  e.dataTransfer?.setData('text/plain', patient.id)
  e.dataTransfer!.effectAllowed = 'move'
}

function handleDragOver(e: DragEvent, group: string) {
  e.preventDefault()
  e.dataTransfer!.dropEffect = 'move'
  dragOverGroup.value = group
}

function handleDragLeave(group: string) {
  if (dragOverGroup.value === group) {
    dragOverGroup.value = ''
  }
}

function handleDrop(e: DragEvent, group: string) {
  e.preventDefault()
  const patientId = e.dataTransfer?.getData('text/plain') || draggingPatientId.value
  if (patientId) {
    store.assignGroup(patientId, group)
    ElMessage.success(`已移入分组「${group}」`)
  }
  draggingPatientId.value = ''
  dragOverGroup.value = ''
}

function handleDragEnd() {
  draggingPatientId.value = ''
  dragOverGroup.value = ''
}

// 分组栏右键菜单
const groupContextMenu = reactive({
  visible: false,
  x: 0,
  y: 0
})

// 分组项右键菜单
const groupItemContextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  group: ''
})

// 医生项右键菜单
const doctorItemContextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  doctor: ''
})

// 重命名对话框
const showRenameDialog = ref(false)
const renameType = ref<'group' | 'doctor'>('group')
const renameTarget = ref('')
const renameValue = ref('')

function openGroupContextMenu(e: MouseEvent) {
  groupContextMenu.visible = true
  groupContextMenu.x = e.clientX
  groupContextMenu.y = e.clientY
}

function openGroupItemContextMenu(e: MouseEvent, group: string) {
  e.stopPropagation()
  groupItemContextMenu.visible = true
  groupItemContextMenu.x = e.clientX
  groupItemContextMenu.y = e.clientY
  groupItemContextMenu.group = group
}

function openDoctorItemContextMenu(e: MouseEvent, doctor: string) {
  e.stopPropagation()
  doctorItemContextMenu.visible = true
  doctorItemContextMenu.x = e.clientX
  doctorItemContextMenu.y = e.clientY
  doctorItemContextMenu.doctor = doctor
}

function openRename(type: 'group' | 'doctor', target: string) {
  renameType.value = type
  renameTarget.value = target
  renameValue.value = target
  showRenameDialog.value = true
  closeContextMenu()
}

function confirmRename() {
  if (!renameValue.value.trim()) {
    ElMessage.warning('请输入名称')
    return
  }
  if (renameType.value === 'group') {
    store.renameGroup(renameTarget.value, renameValue.value.trim())
    ElMessage.success('分组已重命名')
  } else {
    store.renameDoctor(renameTarget.value, renameValue.value.trim())
    ElMessage.success('医生已重命名')
  }
  showRenameDialog.value = false
}

function handleDeleteGroupItem() {
  const group = groupItemContextMenu.group
  store.removeGroup(group)
  ElMessage.success(`已删除分组「${group}」`)
  closeContextMenu()
}

function handleDeleteDoctorItem() {
  const doctor = doctorItemContextMenu.doctor
  // 只能删除用户自定义的医生
  if (!store.customDoctors.includes(doctor)) {
    ElMessage.warning('只能删除自定义医生')
    closeContextMenu()
    return
  }
  store.removeDoctor(doctor)
  ElMessage.success(`已删除医生「${doctor}」`)
  closeContextMenu()
}

// 预计算每个医生的患者列表（避免模板中频繁遍历5000条）
const patientsByDoctor = computed(() => {
  const map: Record<string, Patient[]> = {}
  store.patients.forEach(p => {
    const d = store.getPatientDoctor(p.id)
    if (!map[d]) map[d] = []
    if (map[d].length < 50) {
      map[d].push(p)
    }
  })
  return map
})

function getPatientsByDoctor(doctor: string): Patient[] {
  return patientsByDoctor.value[doctor] || []
}

const listContainer = ref<HTMLElement>()
const PAGE_SIZE = 20
const visibleCount = ref(PAGE_SIZE)
const loading = ref(false)

// 右键菜单状态
const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  patient: null as Patient | null
})

// 医生栏右键菜单
const doctorContextMenu = reactive({
  visible: false,
  x: 0,
  y: 0
})

// 患者转入右键菜单
const transferMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  patient: null as Patient | null,
  fromDoctor: ''
})

// 新建医生对话框
const showNewDoctorDialog = ref(false)
const newDoctorName = ref('')

// 转入医生对话框
const showTransferDialog = ref(false)
const transferDoctorSearch = ref('')
const targetDoctor = ref('')

const filteredTransferDoctors = computed(() => {
  if (!transferDoctorSearch.value.trim()) return store.doctors.slice(0, 50)
  const kw = transferDoctorSearch.value.trim().toLowerCase()
  return store.doctors.filter(d => d.toLowerCase().includes(kw)).slice(0, 50)
})

// 分组/医生选择对话框
const showGroupDialog = ref(false)
const showDoctorDialog = ref(false)
const tempGroup = ref('')
const tempDoctor = ref('')
const newGroupName = ref('')
const doctorSearch = ref('')

const filteredDialogDoctors = computed(() => {
  if (!doctorSearch.value.trim()) return store.doctors.slice(0, 50)
  const kw = doctorSearch.value.trim().toLowerCase()
  return store.doctors.filter(d => d.toLowerCase().includes(kw)).slice(0, 50)
})

function openContextMenu(e: MouseEvent, patient: Patient) {
  contextMenu.visible = true
  contextMenu.x = e.clientX
  contextMenu.y = e.clientY
  contextMenu.patient = patient
  tempGroup.value = store.getPatientGroup(patient.id) || ''
  tempDoctor.value = store.getPatientDoctor(patient.id)
  newGroupName.value = ''
  doctorSearch.value = ''
}

function openDoctorContextMenu(e: MouseEvent) {
  doctorContextMenu.visible = true
  doctorContextMenu.x = e.clientX
  doctorContextMenu.y = e.clientY
}

function openPatientTransferMenu(e: MouseEvent, patient: Patient, fromDoctor: string) {
  transferMenu.visible = true
  transferMenu.x = e.clientX
  transferMenu.y = e.clientY
  transferMenu.patient = patient
  transferMenu.fromDoctor = fromDoctor
  targetDoctor.value = ''
  transferDoctorSearch.value = ''
}

function closeContextMenu() {
  contextMenu.visible = false
  doctorContextMenu.visible = false
  transferMenu.visible = false
  groupContextMenu.visible = false
  groupItemContextMenu.visible = false
  doctorItemContextMenu.visible = false
}

// 点击页面其他地方关闭右键菜单
function handleClickOutside(e: MouseEvent) {
  if (contextMenu.visible || doctorContextMenu.visible || transferMenu.visible || groupContextMenu.visible || groupItemContextMenu.visible || doctorItemContextMenu.visible) {
    const target = e.target as HTMLElement
    if (!target.closest('.context-menu')) {
      closeContextMenu()
    }
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 分组操作
function confirmAssignGroup() {
  if (!contextMenu.patient) return
  let group = tempGroup.value
  if (newGroupName.value.trim()) {
    group = newGroupName.value.trim()
    store.addGroup(group)
  }
  store.assignGroup(contextMenu.patient.id, group || null)
  ElMessage.success(group ? `已加入分组「${group}」` : '已取消分组')
  showGroupDialog.value = false
  closeContextMenu()
}

function confirmAssignDoctor() {
  if (!contextMenu.patient) return
  if (!tempDoctor.value) {
    ElMessage.warning('请选择医生')
    return
  }
  store.assignDoctor(contextMenu.patient.id, tempDoctor.value)
  ElMessage.success(`已分配医生「${tempDoctor.value}」`)
  showDoctorDialog.value = false
  closeContextMenu()
}

function confirmNewDoctor() {
  if (!newDoctorName.value.trim()) {
    ElMessage.warning('请输入医生姓名')
    return
  }
  store.addDoctor(newDoctorName.value.trim())
  ElMessage.success(`已创建医生「${newDoctorName.value.trim()}」`)
  showNewDoctorDialog.value = false
  newDoctorName.value = ''
  closeContextMenu()
}

function confirmTransfer() {
  if (!transferMenu.patient) return
  if (!targetDoctor.value) {
    ElMessage.warning('请选择目标医生')
    return
  }
  store.assignDoctor(transferMenu.patient.id, targetDoctor.value)
  ElMessage.success(`已将「${transferMenu.patient.name}」转入「${targetDoctor.value}」`)
  showTransferDialog.value = false
  closeContextMenu()
}

function handleAddGroup() {
  ElMessageBox.prompt('请输入新分组名称', '新建分组', {
    inputPattern: /.+/,
    inputErrorMessage: '分组名称不能为空'
  }).then(({ value }) => {
    store.addGroup(value)
    ElMessage.success(`已创建分组「${value}」`)
  }).catch(() => {})
}

function handleDeleteGroup(name: string) {
  ElMessageBox.confirm(`确定删除分组「${name}」？该分组下患者将取消分组。`, '提示', {
    type: 'warning'
  }).then(() => {
    store.removeGroup(name)
    if (selectedGroup.value === name) selectedGroup.value = ''
    ElMessage.success('已删除分组')
  }).catch(() => {})
}

// 预计算各分组和医生的患者数（避免模板中频繁调用遍历5000条）
const groupCounts = computed(() => {
  const counts: Record<string, number> = {}
  store.patients.forEach(p => {
    const g = store.getPatientGroup(p.id)
    if (g) counts[g] = (counts[g] || 0) + 1
  })
  return counts
})

const doctorCounts = computed(() => {
  const counts: Record<string, number> = {}
  store.patients.forEach(p => {
    const d = store.getPatientDoctor(p.id)
    if (d) counts[d] = (counts[d] || 0) + 1
  })
  return counts
})

// 只显示前N位医生（无限滚动）
const doctorVisibleCount = ref(20)

// 根据搜索过滤医生
const filteredDoctors = computed(() => {
  if (!searchText.value.trim() || activeTab.value !== '医生') return store.doctors
  const kw = searchText.value.trim().toLowerCase()
  return store.doctors.filter(d => d.toLowerCase().includes(kw))
})

// 当前可见的医生
const visibleDoctors = computed(() => filteredDoctors.value.slice(0, doctorVisibleCount.value))

// 医生列表滚动加载更多
function handleDoctorScroll(e: Event) {
  const el = e.target as HTMLElement
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 60) {
    if (doctorVisibleCount.value < filteredDoctors.value.length) {
      doctorVisibleCount.value += 20
    }
  }
}

function getGroupCount(group: string): number {
  return groupCounts.value[group] || 0
}

function getDoctorCount(doctor: string): number {
  return doctorCounts.value[doctor] || 0
}

// 过滤后的全部患者
const filteredPatients = computed(() => {
  let list = store.patients
  // 搜索过滤
  if (searchText.value.trim()) {
    const keyword = searchText.value.trim().toLowerCase()
    list = list.filter(p =>
      p.name.toLowerCase().includes(keyword) ||
      p.id.toLowerCase().includes(keyword)
    )
  }
  // 分组过滤
  if (selectedGroup.value) {
    list = list.filter(p => store.getPatientGroup(p.id) === selectedGroup.value)
  }
  return list
})

// 当前可见的患者（前 N 条）
const visiblePatients = computed(() =>
  filteredPatients.value.slice(0, visibleCount.value)
)

// 滚动加载更多
function handleScroll(e: Event) {
  const el = e.target as HTMLElement
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 60) {
    loadMore()
  }
}

function loadMore() {
  if (loading.value) return
  if (visibleCount.value >= filteredPatients.value.length) return

  loading.value = true
  setTimeout(() => {
    visibleCount.value += PAGE_SIZE
    loading.value = false
  }, 150)
}

function handleSearch() {
  visibleCount.value = PAGE_SIZE
  doctorVisibleCount.value = 20
  nextTick(() => {
    if (listContainer.value) {
      listContainer.value.scrollTop = 0
    }
  })
}

// 切换标签时重置医生可见数量
watch(activeTab, () => {
  doctorVisibleCount.value = 20
})

function handleRefresh() {
  searchText.value = ''
  selectedGroup.value = ''
  activeTab.value = '所有用户'
  visibleCount.value = PAGE_SIZE
  ElMessage.success('列表已刷新')
}
</script>

<style scoped lang="scss">
.patient-sidebar {
  padding: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.department-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 12px;
  padding-left: 4px;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;

  :deep(.el-input) {
    flex: 1;
  }
}

.icon-btn {
  flex-shrink: 0;
}

.tab-bar {
  display: flex;
  gap: 0;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;

  &.active {
    color: var(--primary-color);
    border-bottom-color: var(--primary-color);
    font-weight: 600;
  }
}

/* 分组/医生筛选列表 */
.filter-list {
  max-height: 180px;
  overflow-y: auto;
  margin-bottom: 8px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 4px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;

  &:hover {
    background: var(--bg-hover);
  }

  &.active {
    background: var(--primary-color);
    color: #fff;

    .filter-count {
      background: rgba(255,255,255,0.3);
      color: #fff;
    }
  }
}

.filter-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-count {
  font-size: 11px;
  background: #f0f2f5;
  padding: 1px 6px;
  border-radius: 10px;
  color: var(--text-secondary);
}

.delete-group {
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s;

  &:hover {
    color: #f56c6c;
  }
}

.filter-item:hover .delete-group {
  opacity: 1;
}

.add-item {
  color: var(--primary-color);
  border-top: 1px dashed var(--border-color);
  margin-top: 4px;
  padding-top: 8px;
}

/* 医生树状结构 */
.doctor-tree,
.group-tree {
  max-height: none;
  flex: 1;
  overflow-y: auto;
}

.doctor-group,
.group-item {
  margin-bottom: 2px;
}

.doctor-header,
.group-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
  font-weight: 500;

  &:hover {
    background: var(--bg-hover);
  }

  &.expanded .expand-icon {
    transform: rotate(90deg);
  }
}

.group-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.doctor-patients,
.group-patients {
  padding-left: 24px;
  border-left: 2px solid var(--border-color);
  margin-left: 10px;
}

.doctor-patient-item,
.group-patient-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: var(--bg-hover);
  }

  &.selected {
    background: var(--primary-color);
    color: #fff;

    .patient-age {
      color: rgba(255,255,255,0.8);
    }
  }

  &.dragging {
    opacity: 0.4;
  }
}

.group-header.drag-over {
  background: var(--primary-color) !important;
  color: #fff;
  border: 2px dashed var(--primary-color);
}

.empty-tip {
  padding: 8px;
  font-size: 11px;
  color: var(--text-placeholder);
  text-align: center;
}

.patient-avatar.small {
  width: 28px;
  height: 28px;
  font-size: 12px;
}

.doctor-patient-item .patient-name {
  flex: 1;
  font-size: 13px;
}

.doctor-patient-item .patient-age {
  font-size: 11px;
  color: var(--text-placeholder);
}

.list-stats {
  font-size: 12px;
  color: var(--primary-color);
  margin-bottom: 8px;
  padding-left: 4px;
}

/* 列表容器 */
.patient-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  padding-right: 4px;
}

.patient-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  border: 2px solid transparent;
  margin-bottom: 2px;

  &:hover {
    background: var(--bg-hover);
  }

  &.selected {
    border-color: var(--primary-color);
    background: var(--bg-hover);
  }
}

.patient-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  flex-shrink: 0;
}

.patient-info {
  flex: 1;
  min-width: 0;
}

.patient-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.patient-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
  flex-wrap: wrap;
}

.gender-tag {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;

  &.男 {
    background: #e0f0ff;
    color: #1890ff;
  }
  &.女 {
    background: #ffe0f0;
    color: #eb2f96;
  }
}

.patient-age {
  font-size: 12px;
  color: var(--text-secondary);
}

.patient-id {
  font-size: 10px;
  color: var(--text-placeholder);
}

.patient-tags {
  display: flex;
  gap: 4px;
  margin-top: 4px;
  flex-wrap: wrap;

  :deep(.el-tag) {
    font-size: 10px;
    padding: 0 4px;
    height: 18px;
    line-height: 16px;
  }
}

/* 加载/结束提示 */
.list-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px 0;
  font-size: 13px;
  color: var(--text-secondary);

  .el-icon {
    font-size: 16px;
  }
}

.list-end {
  text-align: center;
  padding: 16px 0;
  font-size: 12px;
  color: var(--text-placeholder);
}

.list-empty {
  text-align: center;
  padding: 40px 0;
  font-size: 13px;
  color: var(--text-placeholder);
}

.list-footer {
  font-size: 11px;
  color: var(--text-placeholder);
  text-align: center;
  padding: 8px 0 4px;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
}

/* 右键菜单 */
.context-menu {
  position: fixed;
  z-index: 9999;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  padding: 6px;
  min-width: 160px;
}

.context-menu-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  padding: 6px 10px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 4px;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;

  &:hover {
    background: var(--bg-hover);
  }

  &.danger {
    color: #f56c6c;

    &:hover {
      background: #fef0f0;
    }
  }
}

.menu-arrow {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-placeholder);
}

/* 对话框列表样式 */
.dialog-group-list,
.dialog-doctor-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 4px;
}

.dialog-group-item,
.dialog-doctor-item {
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;

  &:hover {
    background: var(--bg-hover);
  }

  &.active {
    background: var(--primary-color);
    color: #fff;
  }
}

.dialog-doctor-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.dialog-doctor-item {
  text-align: center;
  font-size: 12px;
  padding: 6px 8px;
}

.transfer-info {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
</style>
