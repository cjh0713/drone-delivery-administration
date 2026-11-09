import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const routes = [
  // 首页 - 门户页
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/portal/Home.vue')
  },
  
  // 登录页
  { 
    path: '/login', 
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { guestOnly: true }
  },
  
  // 后台管理系统路由
  {
    path: '/admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { 
        path: 'dashboard', 
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: { title: '首页概览' }
      },
      { 
        path: 'orders', 
        name: 'OrderManage',
        component: () => import('@/views/admin/OrderManage.vue'),
        meta: { title: '订单管理' }
      },
      { 
        path: 'drones', 
        name: 'DroneManage',
        component: () => import('@/views/admin/DroneManage.vue'),
        meta: { title: '无人机资源' }
      },
      { 
        path: 'routes', 
        name: 'RouteManage',
        component: () => import('@/views/admin/RouteManage.vue'),
        meta: { title: '航线与空域' }
      },
      { 
        path: 'statistics', 
        name: 'Statistics',
        component: () => import('@/views/admin/Statistics.vue'),
        meta: { title: '数据统计与报表' }
      },
      { 
        path: 'settings', 
        name: 'Settings',
        component: () => import('@/views/admin/Settings.vue'),
        meta: { title: '系统配置与日志' }
      }
    ]
  },
  
  // 404
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  // 需要登录的页面
  if (to.meta.requiresAuth && !userStore.token) {
    next('/login')
    return
  }
  
  // 已登录用户不能访问的页面（如登录页）
  if (to.meta.guestOnly && userStore.token) {
    next('/admin')
    return
  }
  
  next()
})

export default router
