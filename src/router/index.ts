import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    redirect: '/patient/report',
    children: [
      {
        path: 'patient/report',
        name: 'TrainingReport',
        component: () => import('@/views/patient/TrainingReport.vue'),
        meta: { title: '训练报告', topNav: 'patient' }
      },
      {
        path: 'patient/plan',
        name: 'RehabPlan',
        component: () => import('@/views/patient/RehabPlan.vue'),
        meta: { title: '康复计划', topNav: 'patient' }
      },
      {
        path: 'patient/health',
        name: 'HealthRecord',
        component: () => import('@/views/patient/HealthRecord.vue'),
        meta: { title: '健康档案', topNav: 'patient' }
      },
      {
        path: 'patient/gait',
        name: 'GaitAnalysis',
        component: () => import('@/views/patient/GaitAnalysis.vue'),
        meta: { title: '步态分析', topNav: 'patient' }
      },
      {
        path: 'action-library',
        name: 'ActionLibrary',
        component: () => import('@/views/ActionLibrary.vue'),
        meta: { title: '动作库', topNav: 'action' }
      },
      {
        path: 'action-setting',
        name: 'ActionSetting',
        component: () => import('@/views/ActionSetting.vue'),
        meta: { title: '动作及训练计划设置', topNav: 'action' }
      },
      {
        path: 'offline',
        name: 'Offline',
        component: () => import('@/views/Placeholder.vue'),
        meta: { title: '线下治疗', topNav: 'offline' }
      },
      {
        path: 'plan-library',
        name: 'PlanLibrary',
        component: () => import('@/views/Placeholder.vue'),
        meta: { title: '方案库', topNav: 'plan' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
