<template>
  <div class="settings-page">
    <!-- 页面标题区 -->
    <div class="page-header">
      <div class="header-left">
        <h2>系统配置与日志</h2>
        <p class="header-desc">管理系统参数、查看操作日志、监控系统运行状态</p>
      </div>
      <div class="header-right">
        <el-button 
          type="primary" 
          @click="saveSettings"
          :loading="isSaving"
        >
          <el-icon v-if="!isSaving"><Check /></el-icon>
          {{ isSaving ? '保存中...' : '保存配置' }}
        </el-button>
        <el-button 
          @click="refreshSystem"
          :loading="isRefreshing"
        >
          <el-icon :class="{ 'rotating': isRefreshing }"><Refresh /></el-icon>
          {{ isRefreshing ? '刷新中...' : '刷新缓存' }}
        </el-button>
      </div>
    </div>
    
    <el-row :gutter="20">
      <!-- 左侧：系统配置 -->
      <el-col :span="16">
        <el-tabs v-model="activeTab" class="settings-tabs" type="border-card">
          <!-- 通知配置 -->
          <el-tab-pane label="通知配置" name="notification">
            <el-form :model="notifySuppressForm" label-width="160px" class="settings-form">
              <h4 class="form-section-title">弹窗与通知屏蔽</h4>
              <p class="form-desc">勾选后，对应类型的弹窗/通知将不再显示</p>
              
              <el-form-item label="订单相关通知">
                <el-checkbox-group v-model="notifySuppressForm.order">
                  <el-checkbox label="newOrder">新订单提醒（右上角通知）</el-checkbox>
                  <el-checkbox label="orderAssigned">订单分配成功提示</el-checkbox>
                  <el-checkbox label="orderCompleted">订单完成提示</el-checkbox>
                  <el-checkbox label="orderCancelled">订单取消提示</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              
              <el-form-item label="异常与系统通知">
                <el-checkbox-group v-model="notifySuppressForm.system">
                  <el-checkbox label="lowBattery">低电量告警</el-checkbox>
                  <el-checkbox label="system">系统通用消息</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
            </el-form>
          </el-tab-pane>
          
          <!-- 系统维护 -->
          <el-tab-pane label="系统维护" name="maintenance">
            <el-form :model="maintainForm" label-width="140px" class="settings-form">
              <h4 class="form-section-title">日志管理</h4>
              <el-form-item label="日志级别">
                <el-select v-model="maintainForm.logLevel" style="width: 100%">
                  <el-option label="DEBUG" value="debug" />
                  <el-option label="INFO" value="info" />
                  <el-option label="WARN" value="warn" />
                  <el-option label="ERROR" value="error" />
                </el-select>
              </el-form-item>
              <el-form-item label="日志保留时间">
                <el-input-number v-model="maintainForm.logRetention" :min="7" :max="90" style="width: 100%" />
                <span class="unit">天</span>
              </el-form-item>
              <el-form-item>
                <el-button @click="clearLogs">
                  <el-icon><Delete /></el-icon>
                  清理历史日志
                </el-button>
                <el-button @click="exportLogs">
                  <el-icon><Document /></el-icon>
                  导出日志
                </el-button>
              </el-form-item>
              
              <el-divider />
              
              <h4 class="form-section-title">系统更新</h4>
              <el-form-item label="自动检查更新">
                <el-switch v-model="maintainForm.autoCheckUpdate" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" plain @click="checkUpdate">
                  <el-icon><Refresh /></el-icon>
                  检查更新
                </el-button>
                <span class="form-tip" style="margin-left: 12px;">当前版本：v2.1.0</span>
              </el-form-item>
              
              <el-divider />
              
              <h4 class="form-section-title">数据管理</h4>
              <el-form-item label="数据持久化">
                <el-switch v-model="maintainForm.dataPersistence" @change="toggleDataPersistence" />
                <span class="form-tip" style="margin-left: 12px;">自动保存系统状态到浏览器本地</span>
              </el-form-item>
              <el-form-item label="上次保存">
                <el-input :value="lastSavedTimeText" disabled style="width: 200px" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="saveData" :loading="isSavingData">
                  <el-icon v-if="!isSavingData"><Download /></el-icon>
                  立即保存
                </el-button>
                <el-button @click="loadData" :loading="isLoadingData">
                  <el-icon :class="{ 'rotating': isLoadingData }"><Refresh /></el-icon>
                  重新加载
                </el-button>
                <el-button type="danger" plain @click="resetData" :loading="isResettingData">
                  <el-icon v-if="!isResettingData"><Delete /></el-icon>
                  重置数据
                </el-button>
              </el-form-item>
              <el-alert
                v-if="dataManageMessage"
                :title="dataManageMessage"
                :type="dataMessageType"
                show-icon
                :closable="false"
                style="margin-top: 10px"
              />
            </el-form>
          </el-tab-pane>
        </el-tabs>
        
        <!-- 导出日志预览弹窗 -->
        <el-dialog v-model="logExportVisible" title="日志导出预览" width="700px" top="5vh">
          <div class="log-export-preview">
            <p style="margin-bottom: 10px; color: #666;">共 {{ logs.length }} 条日志记录</p>
            <el-table :data="logs" stripe border size="small" height="50vh">
              <el-table-column prop="time" label="时间" width="90" />
              <el-table-column prop="level" label="级别" width="70" align="center">
                <template #default="{ row }">
                  <el-tag :type="logLevelType(row.level)" size="small">{{ row.level }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="type" label="类型" width="70" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.type === 'operation' ? 'primary' : 'info'" size="small">
                    {{ row.type === 'operation' ? '操作' : '系统' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="message" label="内容" show-overflow-tooltip />
            </el-table>
          </div>
          <template #footer>
            <el-button @click="logExportVisible = false">关闭</el-button>
            <el-button type="primary" @click="downloadLogs">
              <el-icon><Download /></el-icon>
              下载日志
            </el-button>
          </template>
        </el-dialog>
      </el-col>
      
      <!-- 右侧：系统日志 -->
      <el-col :span="8">
        <el-card shadow="never" class="log-card">
          <template #header>
            <div class="card-header">
              <span>系统日志</span>
              <el-radio-group v-model="logType" size="small">
                <el-radio-button label="all">全部</el-radio-button>
                <el-radio-button label="operation">操作</el-radio-button>
                <el-radio-button label="system">系统</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          
          <!-- 日志筛选 -->
          <div class="log-filter">
            <el-select v-model="logLevel" placeholder="日志级别" clearable size="small" style="width: 100px">
              <el-option label="INFO" value="info" />
              <el-option label="WARN" value="warn" />
              <el-option label="ERROR" value="error" />
            </el-select>
            <el-input v-model="logKeyword" placeholder="搜索日志" size="small" clearable style="width: 140px" />
          </div>
          
          <!-- 日志列表 -->
          <div class="log-list" v-loading="logLoading">
            <div v-if="filteredLogs.length === 0" class="empty-logs">
              <el-icon :size="32"><InfoFilled /></el-icon>
              <p>暂无符合条件的日志</p>
            </div>
            <div 
              v-for="(log, index) in filteredLogs" 
              :key="index"
              class="log-item"
              :class="[log.level, log.type]"
              v-else
            >
              <div class="log-time">{{ log.time }}</div>
              <div class="log-content">
                <el-tag :type="logLevelType(log.level)" size="small" effect="plain">
                  {{ log.level }}
                </el-tag>
                <el-tag 
                  :type="log.type === 'operation' ? 'primary' : 'info'" 
                  size="small" 
                  effect="plain"
                  style="margin-left: 4px;"
                >
                  {{ log.type === 'operation' ? '操作' : '系统' }}
                </el-tag>
                <span class="log-message">{{ log.message }}</span>
              </div>
              <div class="log-user" v-if="log.user">
                <el-icon><User /></el-icon>
                {{ log.user }}
              </div>
            </div>
          </div>
          
          <!-- 日志分页 -->
          <div class="log-pagination">
            <el-pagination
              v-model:current-page="logPage.page"
              v-model:page-size="logPage.size"
              :total="logPage.total"
              layout="prev, pager, next"
              small
            />
          </div>
        </el-card>
        
        <!-- 系统状态 -->
        <el-card shadow="never" class="status-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span>系统状态</span>
              <el-tag type="success" size="small" effect="dark">运行正常</el-tag>
            </div>
          </template>
          
          <div class="status-list">
            <div class="status-item">
              <span class="label">系统运行时间</span>
              <span class="value">{{ systemStatus.uptime }}</span>
            </div>
            <div class="status-item">
              <span class="label">数据库连接</span>
              <span class="value">
                <el-tag type="success" size="small">正常</el-tag>
              </span>
            </div>
            <div class="status-item">
              <span class="label">消息队列</span>
              <span class="value">
                <el-tag type="success" size="small">正常</el-tag>
              </span>
            </div>
            <div class="status-item">
              <span class="label">在线无人机</span>
              <span class="value">{{ systemStatus.onlineDrones }}/{{ systemStatus.totalDrones }}</span>
            </div>
            <div class="status-item">
              <span class="label">内存使用</span>
              <span class="value">
                <el-progress :percentage="systemStatus.memoryUsage" :color="memoryColor" :stroke-width="8" />
              </span>
            </div>
            <div class="status-item">
              <span class="label">磁盘使用</span>
              <span class="value">
                <el-progress :percentage="systemStatus.diskUsage" :color="diskColor" :stroke-width="8" />
              </span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Check, Refresh, Download, Delete, Document, User, InfoFilled } from '@element-plus/icons-vue'
import { useDashboardStore } from '@/store/dashboard'
import { useSettingsStore } from '@/store/settings'

const dashboardStore = useDashboardStore()
const settingsStore = useSettingsStore()

// 加载状态
const isSaving = ref(false)
const isRefreshing = ref(false)
const logLoading = ref(false)

const activeTab = ref('notification')
const logType = ref('all')
const logLevel = ref('')
const logKeyword = ref('')
const logExportVisible = ref(false)

// 通知屏蔽配置表单（true 表示勾选屏蔽）
const notifySuppressForm = reactive({
  order: [],
  system: []
})

// 维护配置表单
const maintainForm = reactive({
  logLevel: 'info',
  logRetention: 30,
  autoCheckUpdate: true,
  dataPersistence: true
})

// 数据管理
const dataManageMessage = ref('')
const dataMessageType = ref('info')
const isSavingData = ref(false)
const isLoadingData = ref(false)
const isResettingData = ref(false)

// 计算上次保存时间的显示文本
const lastSavedTimeText = computed(() => {
  if (dashboardStore.lastSavedTime) {
    const date = new Date(dashboardStore.lastSavedTime)
    return date.toLocaleString()
  }
  return '未保存'
})

// 保存数据
const saveData = async () => {
  isSavingData.value = true
  await new Promise(resolve => setTimeout(resolve, 600))
  dashboardStore.saveState()
  isSavingData.value = false
  dataManageMessage.value = '数据已保存到本地'
  dataMessageType.value = 'success'
  addSystemLog('数据已手动保存到本地存储', 'info', 'operation')
  setTimeout(() => { dataManageMessage.value = '' }, 3000)
}

// 加载数据
const loadData = async () => {
  isLoadingData.value = true
  await new Promise(resolve => setTimeout(resolve, 800))
  const loaded = dashboardStore.loadState()
  isLoadingData.value = false
  if (loaded) {
    dataManageMessage.value = '数据已从本地加载'
    dataMessageType.value = 'success'
    addSystemLog('数据已从本地存储重新加载', 'info', 'operation')
  } else {
    dataManageMessage.value = '没有找到保存的数据'
    dataMessageType.value = 'warning'
  }
  setTimeout(() => { dataManageMessage.value = '' }, 3000)
}

// 重置数据
const resetData = () => {
  ElMessageBox.confirm(
    '确定要重置所有数据吗？这将清除所有订单和无人机状态，恢复到初始状态。此操作不可恢复！',
    '重置确认',
    {
      confirmButtonText: '确定重置',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    isResettingData.value = true
    await new Promise(resolve => setTimeout(resolve, 800))
    dashboardStore.resetState()
    logs.value = []
    isResettingData.value = false
    dataManageMessage.value = '数据已重置为初始状态'
    dataMessageType.value = 'success'
    addSystemLog('系统数据已重置为初始状态', 'warn', 'operation')
    setTimeout(() => { dataManageMessage.value = '' }, 3000)
    ElMessage.success('数据已重置')
  }).catch(() => {
    // 取消重置
  })
}

// 切换数据持久化
const toggleDataPersistence = (val) => {
  if (val) {
    dashboardStore.startAutoSave()
    dataManageMessage.value = '自动保存已开启'
    dataMessageType.value = 'success'
  } else {
    dashboardStore.stopAutoSave()
    dataManageMessage.value = '自动保存已关闭'
    dataMessageType.value = 'warning'
  }
  setTimeout(() => { dataManageMessage.value = '' }, 3000)
}

// 从本地存储加载系统配置
const loadSettings = () => {
  const savedSettings = localStorage.getItem('systemSettings')
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings)
      // 加载通知屏蔽配置
      if (settings.notifySuppress) {
        notifySuppressForm.order = []
        notifySuppressForm.system = []
        Object.keys(settings.notifySuppress).forEach(key => {
          if (settings.notifySuppress[key]) {
            if (['newOrder', 'orderAssigned', 'orderCompleted', 'orderCancelled'].includes(key)) {
              notifySuppressForm.order.push(key)
            } else {
              notifySuppressForm.system.push(key)
            }
          }
        })
      }
      // 加载维护配置
      if (settings.maintain) {
        Object.assign(maintainForm, settings.maintain)
      }
      return true
    } catch (e) {
      console.error('加载配置失败:', e)
      return false
    }
  }
  return false
}

// 添加系统日志
const addSystemLog = (message, level = 'INFO', type = 'system', user = 'system') => {
  const now = new Date()
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
  logs.value.unshift({ time: timeStr, level, type, message, user })
  // 限制日志数量，防止无限增长
  if (logs.value.length > 200) {
    logs.value = logs.value.slice(0, 200)
  }
}

// 根据当前订单/无人机状态生成初始日志
const generateInitialLogs = () => {
  const newLogs = []
  // 已完成订单
  dashboardStore.orderList.filter(o => o.status === 'DELIVERED').slice(0, 5).forEach(o => {
    newLogs.push({ time: o.completeTime ? o.completeTime.split(' ')[1] : '--:--:--', level: 'INFO', type: 'system', message: `订单 ${o.orderNo} 配送完成`, user: 'system' })
  })
  // 已分配/配送中订单
  dashboardStore.orderList.filter(o => o.status === 'DELIVERING' && o.droneNo).slice(0, 5).forEach(o => {
    newLogs.push({ time: o.createTime.split(' ')[1], level: 'INFO', type: 'system', message: `订单 ${o.orderNo} 已分配无人机 ${o.droneNo}`, user: 'system' })
  })
  // 低电量无人机
  dashboardStore.droneList.filter(d => d.battery <= 25 && d.status !== 'OFFLINE').slice(0, 3).forEach(d => {
    newLogs.push({ time: '--:--:--', level: 'WARN', type: 'system', message: `无人机 ${d.droneNo} 电量低于25%`, user: 'system' })
  })
  // 按时间简单排序后插入（这里只做初始填充，放在数组末尾）
  logs.value = [...newLogs.reverse(), ...logs.value]
}

let logCheckInterval = null
let prevOrderStatuses = {}
let prevDroneStatuses = {}

onMounted(() => {
  // 强制初始显示"系统维护"标签页
  activeTab.value = 'maintenance'
  
  // 页面加载时加载保存的配置
  const loaded = loadSettings()
  if (loaded) {
    dataManageMessage.value = '已加载上次保存的系统配置'
    dataMessageType.value = 'success'
    setTimeout(() => { dataManageMessage.value = '' }, 3000)
  } else if (dashboardStore.lastSavedTime) {
    dataManageMessage.value = `已加载上次保存的数据 (${lastSavedTimeText.value})`
    dataMessageType.value = 'info'
    setTimeout(() => { dataManageMessage.value = '' }, 5000)
  }
  
  // 生成初始系统日志
  generateInitialLogs()
  
  // 初始化状态快照
  dashboardStore.orderList.forEach(o => { prevOrderStatuses[o.id] = o.status })
  dashboardStore.droneList.forEach(d => { prevDroneStatuses[d.id] = { status: d.status, battery: d.battery } })
  
  // 定时检测订单和无人机状态变化，生成系统日志
  logCheckInterval = setInterval(() => {
    // 检测订单状态变化
    dashboardStore.orderList.forEach(o => {
      const prev = prevOrderStatuses[o.id]
      if (prev && prev !== o.status) {
        if (prev === 'PENDING' && o.status === 'DELIVERING') {
          addSystemLog(`订单 ${o.orderNo} 已分配无人机 ${o.droneNo || ''} 并开始配送`, 'INFO', 'system')
        } else if (prev === 'DELIVERING' && o.status === 'DELIVERED') {
          addSystemLog(`订单 ${o.orderNo} 配送完成`, 'INFO', 'system')
        } else if (o.status === 'CANCELLED') {
          addSystemLog(`订单 ${o.orderNo} 已取消`, 'WARN', 'system')
        }
      }
      prevOrderStatuses[o.id] = o.status
    })
    
    // 检测无人机状态/电量变化
    dashboardStore.droneList.forEach(d => {
      const prev = prevDroneStatuses[d.id]
      if (prev) {
        if (prev.status !== d.status) {
          if (d.status === 'CHARGING') {
            addSystemLog(`无人机 ${d.droneNo} 开始充电`, 'INFO', 'system')
          } else if (d.status === 'DELIVERING') {
            addSystemLog(`无人机 ${d.droneNo} 开始执行配送任务`, 'INFO', 'system')
          } else if (d.status === 'IDLE') {
            addSystemLog(`无人机 ${d.droneNo} 进入待命中状态`, 'INFO', 'system')
          } else if (d.status === 'MAINTENANCE') {
            addSystemLog(`无人机 ${d.droneNo} 进入维护状态`, 'WARN', 'system')
          } else if (d.status === 'OFFLINE') {
            addSystemLog(`无人机 ${d.droneNo} 离线`, 'ERROR', 'system')
          }
        }
        if (prev.battery > 25 && d.battery <= 25) {
          addSystemLog(`无人机 ${d.droneNo} 电量低于25%`, 'WARN', 'system')
        }
      }
      prevDroneStatuses[d.id] = { status: d.status, battery: d.battery }
    })
  }, 3000)
})

onUnmounted(() => {
  if (logCheckInterval) {
    clearInterval(logCheckInterval)
    logCheckInterval = null
  }
})

// 日志分页
const logPage = reactive({
  page: 1,
  size: 20,
  total: computed(() => filteredLogs.value.length)
})

// 监听日志类型变化，显示加载动画
watch(logType, () => {
  logLoading.value = true
  setTimeout(() => {
    logLoading.value = false
  }, 200)
})

// 监听日志筛选条件变化，重置到第一页
watch([logLevel, logKeyword], () => {
  logPage.page = 1
})

// 系统状态
const systemStatus = reactive({
  uptime: '15天 8小时 32分钟',
  onlineDrones: 32,
  totalDrones: 36,
  memoryUsage: 45,
  diskUsage: 62
})

// 日志数据 - 添加 type 字段区分操作日志和系统日志
const logs = ref([
  { time: '14:32:15', level: 'INFO', type: 'operation', message: '管理员 admin 登录系统', user: 'admin' },
  { time: '14:30:08', level: 'INFO', type: 'system', message: '订单 DR20260411001 已分配无人机 UAV-001', user: 'system' },
  { time: '14:28:33', level: 'WARN', type: 'system', message: '无人机 UAV-002 电量低于25%', user: 'system' },
  { time: '14:25:20', level: 'INFO', type: 'operation', message: '新订单 DR20260411005 创建成功', user: 'admin' },
  { time: '14:20:45', level: 'INFO', type: 'system', message: '订单 DR20260411003 配送完成', user: 'system' },
  { time: '14:15:12', level: 'ERROR', type: 'system', message: '数据库连接超时，已自动重连', user: 'system' },
  { time: '14:10:30', level: 'INFO', type: 'system', message: '系统定时备份完成', user: 'system' },
  { time: '14:05:18', level: 'INFO', type: 'operation', message: '管理员保存了系统配置', user: 'admin' },
  { time: '14:00:00', level: 'INFO', type: 'system', message: '每日数据统计任务开始执行', user: 'system' },
  { time: '13:55:42', level: 'WARN', type: 'system', message: '航线 科技园-医院航线 风速过高，建议暂停使用', user: 'system' },
  { time: '13:50:15', level: 'INFO', type: 'operation', message: '管理员导出订单报表', user: 'admin' },
  { time: '13:45:30', level: 'INFO', type: 'system', message: '无人机 UAV-005 开始充电', user: 'system' },
  { time: '13:40:22', level: 'ERROR', type: 'system', message: '无人机 UAV-008 通信异常', user: 'system' },
  { time: '13:35:10', level: 'INFO', type: 'operation', message: '管理员删除订单 DR20260410089', user: 'admin' },
  { time: '13:30:00', level: 'INFO', type: 'system', message: '系统自动清理过期数据', user: 'system' }
])

// 筛选后的日志 - 支持按类型、级别、关键词筛选
const filteredLogs = computed(() => {
  let result = logs.value
  
  // 按日志类型筛选 (all/operation/system)
  if (logType.value !== 'all') {
    result = result.filter(log => log.type === logType.value)
  }
  
  // 按日志级别筛选
  if (logLevel.value) {
    result = result.filter(log => log.level.toLowerCase() === logLevel.value)
  }
  
  // 按关键词筛选
  if (logKeyword.value) {
    const keyword = logKeyword.value.toLowerCase()
    result = result.filter(log => 
      log.message.toLowerCase().includes(keyword) ||
      (log.user && log.user.toLowerCase().includes(keyword))
    )
  }
  
  return result
})

const memoryColor = [
  { color: '#67c23a', percentage: 60 },
  { color: '#e6a23c', percentage: 80 },
  { color: '#f56c6c', percentage: 100 }
]

const diskColor = [
  { color: '#67c23a', percentage: 70 },
  { color: '#e6a23c', percentage: 85 },
  { color: '#f56c6c', percentage: 100 }
]

const logLevelType = (level) => {
  const types = { INFO: 'info', WARN: 'warning', ERROR: 'danger' }
  return types[level] || 'info'
}

// 保存系统配置
const saveSettings = async () => {
  isSaving.value = true
  
  // 模拟保存延迟
  await new Promise(resolve => setTimeout(resolve, 600))
  
  // 将 checkbox 数组转换为 map
  const notifySuppressMap = {
    newOrder: notifySuppressForm.order.includes('newOrder'),
    orderAssigned: notifySuppressForm.order.includes('orderAssigned'),
    orderCompleted: notifySuppressForm.order.includes('orderCompleted'),
    orderCancelled: notifySuppressForm.order.includes('orderCancelled'),
    lowBattery: notifySuppressForm.system.includes('lowBattery'),
    system: notifySuppressForm.system.includes('system')
  }
  
  const settings = {
    notifySuppress: notifySuppressMap,
    maintain: { ...maintainForm }
  }
  
  // 保存到 settings store（会同步到 localStorage）
  const success = settingsStore.saveSettings(settings)
  
  if (success) {
    // 同时保存到旧的 localStorage 保持兼容性
    localStorage.setItem('systemSettings', JSON.stringify(settings))
    
    ElMessage.success('配置保存成功，已同步到所有模块')
    addSystemLog('管理员保存了系统配置', 'INFO', 'operation', 'admin')
  } else {
    ElMessage.error('配置保存失败')
  }
  
  isSaving.value = false
}

// 刷新系统缓存
const refreshSystem = async () => {
  isRefreshing.value = true
  
  // 模拟刷新操作
  await new Promise(resolve => setTimeout(resolve, 800))
  
  // 重新加载配置
  settingsStore.loadSettings()
  
  // 重新加载 dashboard 数据
  dashboardStore.loadState()
  
  // 刷新系统状态数据
  systemStatus.memoryUsage = Math.floor(Math.random() * 30) + 40
  systemStatus.diskUsage = Math.floor(Math.random() * 20) + 55
  
  ElMessage.success('系统缓存已刷新，配置已同步')
  
  // 记录系统日志
  const now = new Date()
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
  logs.value.unshift({
    time: timeStr,
    level: 'INFO',
    type: 'system',
    message: '系统缓存已刷新',
    user: 'system'
  })
  
  isRefreshing.value = false
}

const clearLogs = () => {
  ElMessageBox.confirm('确定要清理所有系统日志吗？清理后右侧日志列表将被清空。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    logs.value = []
    ElMessage.success('系统日志已清空')
    addSystemLog('管理员清空了系统日志', 'INFO', 'operation', 'admin')
  })
}

const exportLogs = () => {
  logExportVisible.value = true
}

const downloadLogs = () => {
  const headers = ['时间', '级别', '类型', '内容', '用户']
  const BOM = '\uFEFF'
  const rows = logs.value.map(log => [log.time, log.level, log.type === 'operation' ? '操作' : '系统', log.message, log.user || ''])
  const csvContent = BOM + [headers, ...rows].map(row => row.map(field => {
    const str = String(field || '')
    if (str.includes(',') || str.includes('\n') || str.includes('"')) return `"${str.replace(/"/g, '""')}"`
    return str
  }).join(',')).join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  link.download = `系统日志_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  ElMessage.success('日志导出成功')
  addSystemLog('管理员导出了系统日志', 'INFO', 'operation', 'admin')
}

const checkUpdate = () => {
  ElMessage.info('正在检查更新...')
  setTimeout(() => {
    ElMessage.success('当前已是最新版本')
  }, 1500)
}
</script>

<style scoped lang="scss">
.settings-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    
    .header-left {
      h2 {
        margin: 0 0 8px 0;
        font-size: 24px;
        color: #1a1a2e;
      }
      
      .header-desc {
        margin: 0;
        color: #909399;
        font-size: 14px;
      }
    }
    
    .header-right {
      display: flex;
      gap: 12px;
    }
  }
}

.settings-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }
  
  :deep(.el-tabs__content) {
    padding: 24px;
    background: #fff;
    border: 1px solid #dcdfe6;
    border-top: none;
    border-radius: 0 0 4px 4px;
  }
}

.settings-form {
  .form-section-title {
    margin: 0 0 20px 0;
    font-size: 16px;
    color: #1a1a2e;
    font-weight: 600;
    padding-left: 12px;
    border-left: 4px solid #409EFF;
  }
  
  .unit {
    margin-left: 8px;
    color: #909399;
  }
  
  .form-tip {
    margin-left: 12px;
    color: #909399;
    font-size: 13px;
  }
  
  .slider-value {
    margin-left: 12px;
    color: #409EFF;
    font-weight: 600;
  }
}

.logo-uploader {
  :deep(.el-upload) {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: border-color 0.3s;
    
    &:hover {
      border-color: #409EFF;
    }
  }
  
  .logo-preview {
    width: 200px;
    height: 60px;
    display: block;
    object-fit: contain;
  }
  
  .logo-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 200px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.log-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .log-filter {
    display: flex;
    gap: 10px;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #ebeef5;
  }
  
  .log-list {
    max-height: 500px;
    overflow-y: auto;
    
    .log-item {
      padding: 12px;
      border-bottom: 1px solid #f0f0f0;
      font-size: 13px;
      
      &:last-child {
        border-bottom: none;
      }
      
      &.error {
        background: #fef0f0;
      }
      
      &.warn {
        background: #fdf6ec;
      }
      
      .log-time {
        color: #909399;
        font-size: 12px;
        margin-bottom: 6px;
      }
      
      .log-content {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
        
        .log-message {
          color: #1a1a2e;
          flex: 1;
        }
      }
      
      .log-user {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #909399;
        font-size: 12px;
        
        .el-icon {
          font-size: 12px;
        }
      }
    }
  }
  
  .log-pagination {
    margin-top: 16px;
    display: flex;
    justify-content: center;
  }
}

.status-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .status-list {
    .status-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 0;
      border-bottom: 1px solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .label {
        color: #606266;
        font-size: 14px;
      }
      
      .value {
        color: #1a1a2e;
        font-weight: 500;
        font-size: 14px;
        
        .el-progress {
          width: 120px;
        }
      }
    }
  }
}

// 滚动条样式
::-webkit-scrollbar {
  width: 6px;
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

// 刷新按钮旋转动画
.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 空日志提示
.empty-logs {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #909399;
  
  .el-icon {
    margin-bottom: 12px;
  }
  
  p {
    margin: 0;
    font-size: 14px;
  }
}
</style>
