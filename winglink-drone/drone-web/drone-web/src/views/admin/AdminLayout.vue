<template>
  <el-container class="admin-layout">
    <!-- 左侧固定导航 -->
    <el-aside width="260px" class="admin-sidebar">
      <div class="sidebar-header">
        <span class="logo">WL</span>
        <div class="brand-info">
          <span class="brand">翼联智航</span>
          <span class="tag">管理系统</span>
        </div>
      </div>
      
      <el-menu
        :default-active="$route.path"
        router
        class="admin-menu"
        background-color="transparent"
        text-color="#b8c5d6"
        active-text-color="#fff"
      >
        <!-- 首页概览 -->
        <el-menu-item index="/admin/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <span>首页概览</span>
        </el-menu-item>
        
        <el-divider class="menu-divider" />
        
        <!-- 订单管理 -->
        <el-menu-item index="/admin/orders">
          <el-icon><Document /></el-icon>
          <span>订单管理</span>
        </el-menu-item>
        
        <!-- 无人机资源管理 -->
        <el-menu-item index="/admin/drones">
          <el-icon><CaretRight /></el-icon>
          <span>无人机资源</span>
        </el-menu-item>
        
        <!-- 航线与空域管理 -->
        <el-menu-item index="/admin/routes">
          <el-icon><MapLocation /></el-icon>
          <span>航线与空域</span>
        </el-menu-item>
        
        <!-- 数据统计与报表 -->
        <el-menu-item index="/admin/statistics">
          <el-icon><TrendCharts /></el-icon>
          <span>数据统计与报表</span>
        </el-menu-item>
        
        <!-- 系统配置与日志 -->
        <el-menu-item index="/admin/settings">
          <el-icon><Setting /></el-icon>
          <span>系统配置与日志</span>
        </el-menu-item>
      </el-menu>
      
      <div class="sidebar-footer">
        <div class="user-info-mini" @click="openProfile" style="cursor: pointer;">
          <el-avatar :size="36" :src="userStore.avatar">
            {{ userStore.username?.charAt(0)?.toUpperCase() }}
          </el-avatar>
          <div class="user-detail">
            <div class="username">{{ userStore.username }}</div>
            <div class="role">管理员</div>
          </div>
        </div>
        <div class="footer-actions">
          <el-button text @click="backToPortal">
            <el-icon><HomeFilled /></el-icon>
            返回首页
          </el-button>
          <el-button text type="danger" @click="logout">
            <el-icon><SwitchButton /></el-icon>
            退出登录
          </el-button>
        </div>
      </div>
    </el-aside>
    
    <el-container class="main-container">
      <!-- 顶部Header -->
      <el-header class="admin-header">
        <div class="header-left">
          <h2 class="page-title">{{ $route.meta.title || '翼联智航' }}</h2>
        </div>
        <div class="header-right">
          <!-- 消息通知下拉菜单 -->
          <el-dropdown trigger="click" class="message-dropdown" @visible-change="onMessageVisibleChange">
            <span class="message-badge" :class="{ 'has-new': unreadCount > 0 }">
              <el-icon :size="22"><Bell /></el-icon>
              <span class="badge-count" v-if="unreadCount > 0">{{ unreadCount }}</span>
            </span>
            <template #dropdown>
              <div class="message-dropdown-panel">
                <div class="message-header">
                  <span class="title">消息通知</span>
                  <el-button link type="primary" size="small" @click="markAllRead">
                    全部已读
                  </el-button>
                </div>
                <div class="message-list">
                  <div 
                    v-for="msg in messageList" 
                    :key="msg.id"
                    class="message-item"
                    :class="{ 'unread': !msg.read }"
                    @click="handleMessageClick(msg)"
                  >
                    <div class="message-icon" :class="msg.type">
                      <el-icon v-if="msg.type === 'order'"><Document /></el-icon>
                      <el-icon v-else-if="msg.type === 'drone'"><Helicopter /></el-icon>
                      <el-icon v-else-if="msg.type === 'alert'"><Warning /></el-icon>
                      <el-icon v-else><InfoFilled /></el-icon>
                    </div>
                    <div class="message-content">
                      <div class="message-title">{{ msg.title }}</div>
                      <div class="message-desc">{{ msg.content }}</div>
                      <div class="message-time">{{ msg.time }}</div>
                    </div>
                    <div class="message-status">
                      <span v-if="!msg.read" class="unread-dot"></span>
                    </div>
                  </div>
                </div>
                <div class="message-footer">
                  <el-button link type="primary" @click="$router.push('/admin/orders')">
                    查看全部订单
                  </el-button>
                </div>
              </div>
            </template>
          </el-dropdown>
          
          <el-dropdown>
            <span class="user-info">
              <el-avatar :size="36" :src="userStore.avatar">
                {{ userStore.username?.charAt(0)?.toUpperCase() }}
              </el-avatar>
              <span class="username">{{ userStore.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="openProfile">个人设置</el-dropdown-item>
                <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <!-- 主内容区 -->
      <el-main class="admin-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
    
    <!-- 个人设置弹窗 -->
    <el-dialog
      v-model="profileVisible"
      title="个人设置"
      width="500px"
      destroy-on-close
    >
      <div class="profile-content">
        <!-- 头像区域 -->
        <div class="avatar-section">
          <el-avatar 
            :size="80" 
            :src="profileForm.avatar"
            class="profile-avatar"
          >
            {{ profileForm.username?.charAt(0)?.toUpperCase() }}
          </el-avatar>
          <div class="avatar-actions">
            <el-upload
              class="avatar-uploader"
              action="#"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleAvatarChange"
              accept="image/*"
            >
              <el-button type="primary" text>
                <el-icon><Camera /></el-icon>
                更换头像
              </el-button>
            </el-upload>
            <el-button 
              v-if="profileForm.avatar" 
              type="danger" 
              text 
              @click="removeAvatar"
            >
              <el-icon><Delete /></el-icon>
              删除头像
            </el-button>
          </div>
        </div>
        
        <!-- 表单区域 -->
        <el-form :model="profileForm" label-width="80px" class="profile-form">
          <el-form-item label="用户名">
            <el-input v-model="profileForm.username" placeholder="请输入用户名" />
          </el-form-item>
          
          <el-form-item label="昵称">
            <el-input v-model="profileForm.nickname" placeholder="请输入昵称（选填）" />
          </el-form-item>
          
          <el-form-item label="邮箱">
            <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
          </el-form-item>
          
          <el-form-item label="手机号">
            <el-input v-model="profileForm.phone" placeholder="请输入手机号" />
          </el-form-item>
          
          <el-divider />
          
          <el-form-item label="旧密码">
            <el-input 
              v-model="profileForm.oldPassword" 
              type="password" 
              placeholder="如需修改密码请输入旧密码"
              show-password
            />
          </el-form-item>
          
          <el-form-item label="新密码">
            <el-input 
              v-model="profileForm.newPassword" 
              type="password" 
              placeholder="请输入新密码"
              show-password
            />
          </el-form-item>
          
          <el-form-item label="确认密码">
            <el-input 
              v-model="profileForm.confirmPassword" 
              type="password" 
              placeholder="请再次输入新密码"
              show-password
            />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <el-button @click="profileVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProfile" :loading="saving">
          保存
        </el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { useDashboardStore } from '@/store/dashboard'
import { useSettingsStore } from '@/store/settings'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { 
  HomeFilled, 
  Document, 
  MapLocation, 
  TrendCharts, 
  Setting,
  SwitchButton, 
  Bell, 
  ArrowDown,
  Warning,
  InfoFilled,
  CaretRight,
  Camera,
  Delete
} from '@element-plus/icons-vue'
import { reactive } from 'vue'

const router = useRouter()
const userStore = useUserStore()
const dashboardStore = useDashboardStore()
const settingsStore = useSettingsStore()

// 已通知过的订单ID集合（避免重复通知）
const notifiedOrderIds = ref(new Set())

// 监听已完成的订单
const completedOrders = computed(() => 
  dashboardStore.orderList.filter(o => o.status === 'DELIVERED' && !o.isHistory)
)

// 监听新完成的订单并发送通知
watch(completedOrders, (newCompleted) => {
  // 确保数据已加载
  if (!newCompleted || newCompleted.length === 0) return
  
  newCompleted.forEach(order => {
    if (!notifiedOrderIds.value.has(order.id)) {
      notifiedOrderIds.value.add(order.id)
      
      // 添加到消息列表
      const newMessage = {
        id: Date.now(),
        type: 'order',
        title: '订单已完成',
        content: `订单 ${order.orderNo} 已送达并完成签收`,
        time: '刚刚',
        read: false,
        orderId: order.id
      }
      messageList.value.unshift(newMessage)
      unreadCount.value++
      
      // 显示右上角通知（若未被屏蔽）
      if (settingsStore.shouldShowNotification('orderCompleted')) {
        ElNotification({
          title: '订单已完成',
          message: `订单 ${order.orderNo} 已送达并完成签收`,
          type: 'success',
          position: 'top-right',
          duration: 5000,
          icon: Document,
          onClick: () => {
            router.push('/admin/orders')
          }
        })
      }
    }
  })
}, { deep: true })

// 消息通知相关
const unreadCount = ref(3)
const messageList = ref([
  {
    id: 1,
    type: 'order',
    title: '订单已完成',
    content: '订单 DR20260411025 已送达并完成签收',
    time: '2分钟前',
    read: false
  },
  {
    id: 2,
    type: 'order',
    title: '新订单提醒',
    content: '收到新订单 DR20260411026，请尽快处理',
    time: '5分钟前',
    read: false
  },
  {
    id: 3,
    type: 'drone',
    title: '无人机返航',
    content: 'UAV-003 已完成任务并返航充电',
    time: '15分钟前',
    read: false
  },
  {
    id: 4,
    type: 'alert',
    title: '低电量告警',
    content: 'UAV-006 电量低于20%，请及时充电',
    time: '30分钟前',
    read: true
  },
  {
    id: 5,
    type: 'system',
    title: '系统通知',
    content: '系统将于今晚23:00进行例行维护',
    time: '1小时前',
    read: true
  }
])

const onMessageVisibleChange = (visible) => {
  // 下拉菜单显示/隐藏时的回调
}

const markAllRead = () => {
  messageList.value.forEach(msg => msg.read = true)
  unreadCount.value = 0
  ElMessage.success('已全部标记为已读')
}

// 组件挂载时初始化已通知的订单（避免刷新后重复通知）
onMounted(() => {
  completedOrders.value.forEach(order => {
    notifiedOrderIds.value.add(order.id)
  })
})

const handleMessageClick = (msg) => {
  msg.read = true
  unreadCount.value = Math.max(0, unreadCount.value - 1)
  
  // 根据消息类型跳转
  if (msg.type === 'order') {
    router.push('/admin/orders')
  } else if (msg.type === 'drone') {
    router.push('/admin/drones')
  }
}

const backToPortal = () => {
  router.push('/')
}

const logout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  }).catch(() => {})
}

// 个人设置相关
const profileVisible = ref(false)
const saving = ref(false)

const profileForm = reactive({
  username: '',
  nickname: '',
  email: '',
  phone: '',
  avatar: '',
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 打开个人设置
const openProfile = () => {
  // 从store加载当前用户信息
  profileForm.username = userStore.username || ''
  profileForm.nickname = userStore.userInfo?.nickname || ''
  profileForm.email = userStore.userInfo?.email || ''
  profileForm.phone = userStore.userInfo?.phone || ''
  profileForm.avatar = userStore.avatar || ''
  profileForm.oldPassword = ''
  profileForm.newPassword = ''
  profileForm.confirmPassword = ''
  
  profileVisible.value = true
}

// 处理头像更换
const handleAvatarChange = (file) => {
  const isJPG = file.raw.type === 'image/jpeg'
  const isPNG = file.raw.type === 'image/png'
  const isLt2M = file.raw.size / 1024 / 1024 < 2

  if (!isJPG && !isPNG) {
    ElMessage.error('头像只能是 JPG 或 PNG 格式!')
    return
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB!')
    return
  }

  // 转换为base64预览
  const reader = new FileReader()
  reader.readAsDataURL(file.raw)
  reader.onload = () => {
    profileForm.avatar = reader.result
    ElMessage.success('头像预览已更新，保存后生效')
  }
}

// 删除头像
const removeAvatar = () => {
  profileForm.avatar = ''
  ElMessage.success('头像已删除，保存后生效')
}

// 保存个人设置
const saveProfile = async () => {
  // 验证密码
  if (profileForm.newPassword) {
    if (!profileForm.oldPassword) {
      ElMessage.error('请输入旧密码')
      return
    }
    if (profileForm.newPassword.length < 6) {
      ElMessage.error('新密码长度至少6位')
      return
    }
    if (profileForm.newPassword !== profileForm.confirmPassword) {
      ElMessage.error('两次输入的密码不一致')
      return
    }
  }

  saving.value = true
  
  // 模拟保存延迟
  await new Promise(resolve => setTimeout(resolve, 800))
  
  // 更新store中的用户信息
  userStore.setUserInfo({
    ...userStore.userInfo,
    username: profileForm.username,
    nickname: profileForm.nickname,
    email: profileForm.email,
    phone: profileForm.phone,
    avatar: profileForm.avatar
  })
  
  // 如果有新密码，更新token（模拟）
  if (profileForm.newPassword) {
    ElMessage.success('个人信息和密码已更新')
  } else {
    ElMessage.success('个人信息已更新')
  }
  
  profileVisible.value = false
  saving.value = false
}
</script>

<style scoped lang="scss">
.admin-layout {
  min-height: 100vh;
}

// 左侧固定侧边栏
.admin-sidebar {
  background: linear-gradient(180deg, #0a0a0f 0%, #14141c 50%, #0a0a0f 100%);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.3);
}

.sidebar-header {
  height: 70px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  
  .logo {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    position: relative;
    overflow: hidden;
    
    // 无人机图标
    &::before {
      content: '';
      width: 24px;
      height: 24px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 2L2 7l10 5 10-5-10-5z'/%3E%3Cpath d='M2 17l10 5 10-5'/%3E%3Cpath d='M2 12l10 5 10-5'/%3E%3Ccircle cx='12' cy='12' r='3' fill='white'/%3E%3C/svg%3E");
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }
    
    // 旋转光环效果
    &::after {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: conic-gradient(from 0deg, transparent, rgba(255,255,255,0.3), transparent);
      animation: rotate 3s linear infinite;
    }
    
    @keyframes rotate {
      100% { transform: rotate(360deg); }
    }
  }
  
  .brand-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .brand {
    color: #fff;
    font-size: 18px;
    font-weight: bold;
    letter-spacing: 1px;
  }
  
  .tag {
    font-size: 11px;
    color: #409EFF;
    background: rgba(64, 158, 255, 0.15);
    padding: 2px 8px;
    border-radius: 4px;
    width: fit-content;
  }
}

.admin-menu {
  flex: 1;
  border-right: none;
  padding: 16px 12px;
  
  :deep(.el-menu-item) {
    height: 52px;
    line-height: 52px;
    margin-bottom: 8px;
    border-radius: 10px;
    font-size: 15px;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.08) !important;
    }
    
    &.is-active {
      background: rgba(255, 255, 255, 0.15) !important;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      
      .el-icon {
        color: #fff;
      }
    }
    
    .el-icon {
      font-size: 20px;
      margin-right: 12px;
    }
  }
}

.menu-divider {
  margin: 16px 20px;
  border-color: rgba(255, 255, 255, 0.08);
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.25);
}

.user-info-mini {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  
  .user-detail {
    .username {
      color: #fff;
      font-size: 14px;
      font-weight: 500;
    }
    
    .role {
      color: #909399;
      font-size: 12px;
      margin-top: 2px;
    }
  }
}

.footer-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  .el-button {
    color: #b8c5d6;
    justify-content: flex-start;
    padding: 10px 12px;
    border-radius: 8px;
    
    &:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.1);
    }
    
    .el-icon {
      margin-right: 8px;
    }
  }
}

// 主容器
.main-container {
  margin-left: 260px;
  background: #f5f7fa;
  min-height: 100vh;
}

// 个人设置弹窗样式
.profile-content {
  padding: 10px 0;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
  
  .profile-avatar {
    margin-bottom: 16px;
    border: 3px solid #e4e7ed;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    font-size: 32px;
    font-weight: bold;
  }
  
  .avatar-actions {
    display: flex;
    gap: 16px;
    
    .el-button {
      .el-icon {
        margin-right: 4px;
      }
    }
  }
}

.profile-form {
  .el-divider {
    margin: 24px 0;
  }
}

.admin-header {
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  height: 70px;
  position: sticky;
  top: 0;
  z-index: 99;
}

.page-title {
  font-size: 22px;
  color: #1a1a2e;
  margin: 0;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

// 消息通知样式
.message-dropdown {
  .message-badge {
    position: relative;
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    transition: background 0.3s;
    color: #606266;
    display: flex;
    align-items: center;
    
    &:hover, &.has-new {
      background: #f5f7fa;
      color: #409EFF;
    }
    
    .badge-count {
      position: absolute;
      top: 2px;
      right: 2px;
      background: #f56c6c;
      color: #fff;
      font-size: 11px;
      padding: 0 5px;
      height: 16px;
      line-height: 16px;
      border-radius: 8px;
      min-width: 16px;
      text-align: center;
    }
  }
}

// 消息下拉面板
.message-dropdown-panel {
  width: 360px;
  
  .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #ebeef5;
    
    .title {
      font-weight: 600;
      color: #1a1a2e;
      font-size: 16px;
    }
  }
  
  .message-list {
    max-height: 360px;
    overflow-y: auto;
    
    .message-item {
      display: flex;
      gap: 12px;
      padding: 14px 16px;
      cursor: pointer;
      transition: background 0.2s;
      border-bottom: 1px solid #f0f0f0;
      
      &:hover {
        background: #f5f7fa;
      }
      
      &.unread {
        background: #ecf5ff;
        
        &:hover {
          background: #d9ecff;
        }
      }
      
      .message-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        
        &.order {
          background: #ecf5ff;
          color: #409EFF;
        }
        
        &.drone {
          background: #e1f3d8;
          color: #67C23A;
        }
        
        &.alert {
          background: #fef0f0;
          color: #F56C6C;
        }
        
        &.system {
          background: #f4f4f5;
          color: #909399;
        }
      }
      
      .message-content {
        flex: 1;
        min-width: 0;
        
        .message-title {
          font-weight: 500;
          color: #1a1a2e;
          font-size: 14px;
          margin-bottom: 4px;
        }
        
        .message-desc {
          color: #606266;
          font-size: 13px;
          line-height: 1.4;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .message-time {
          color: #909399;
          font-size: 12px;
        }
      }
      
      .message-status {
        display: flex;
        align-items: center;
        padding-left: 4px;
        
        .unread-dot {
          width: 8px;
          height: 8px;
          background: #409EFF;
          border-radius: 50%;
        }
      }
    }
  }
  
  .message-footer {
    padding: 12px 16px;
    text-align: center;
    border-top: 1px solid #ebeef5;
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 24px;
  transition: background 0.3s;
  
  &:hover {
    background: #f5f7fa;
  }
  
  .username {
    font-size: 14px;
    color: #1a1a2e;
    font-weight: 500;
  }
}

.admin-main {
  padding: 24px 30px;
}

// 页面切换动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// 滚动条样式
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
