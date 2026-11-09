<template>
  <div class="drone-manage">
    <!-- 页面标题区 -->
    <div class="page-header">
      <div class="header-left">
        <h2>无人机资源管理</h2>
        <p class="header-desc">管理无人机机队，监控电量、状态、位置，进行调度维护</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          新增无人机
        </el-button>
        <el-button 
          @click="refreshData" 
          :loading="isRefreshing"
          :class="{ 'refreshing': isRefreshing }"
        >
          <el-icon :class="{ 'rotating': isRefreshing }"><Refresh /></el-icon>
          {{ isRefreshing ? '刷新中...' : '刷新' }}
        </el-button>
      </div>
    </div>
    
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :span="4" v-for="(stat, index) in droneStats" :key="index">
        <el-card class="stat-card" shadow="hover" :class="stat.class">
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: stat.color + '15', color: stat.color }">
              <el-icon :size="24">
                <component :is="stat.icon" />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 搜索筛选 -->
    <el-card class="filter-card" shadow="never">
      <div class="search-bar">
        <el-input 
          v-model="searchForm.keyword" 
          placeholder="搜索编号/型号" 
          style="width: 250px" 
          clearable 
          :prefix-icon="Search"
        />
        <el-select v-model="searchForm.status" placeholder="状态筛选" clearable style="width: 140px">
          <el-option label="待命中" value="IDLE">
            <el-tag size="small" type="success">待命中</el-tag>
          </el-option>
          <el-option label="配送中" value="DELIVERING">
            <el-tag size="small" type="primary">配送中</el-tag>
          </el-option>
          <el-option label="充电中" value="CHARGING">
            <el-tag size="small" type="warning">充电中</el-tag>
          </el-option>
          <el-option label="维护中" value="MAINTENANCE">
            <el-tag size="small" type="info">维护中</el-tag>
          </el-option>
          <el-option label="离线" value="OFFLINE">
            <el-tag size="small" type="danger">离线</el-tag>
          </el-option>
        </el-select>
        <el-select v-model="searchForm.model" placeholder="型号筛选" clearable style="width: 160px">
          <el-option label="DJI Matrice 300" value="DJI Matrice 300" />
          <el-option label="DJI Mavic 3" value="DJI Mavic 3" />
          <el-option label="DJI Matrice 30" value="DJI Matrice 30" />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="resetSearch">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
      </div>
    </el-card>
    
    <!-- 无人机列表 -->
    <el-row :gutter="20" class="drone-grid" v-loading="loading" element-loading-text="数据加载中...">
      <el-col :span="8" v-for="drone in paginatedDroneList" :key="drone.id">
        <el-card class="drone-card" shadow="hover">
          <div class="drone-header">
            <div class="drone-info">
              <h4 class="drone-no">{{ drone.droneNo }}</h4>
              <span class="drone-model">{{ drone.model }}</span>
            </div>
            <el-tag :type="statusType(drone.status)" effect="dark" size="small">
              {{ statusText(drone.status) }}
            </el-tag>
          </div>
          
          <div class="drone-body">
            <!-- 电量显示 -->
            <div class="battery-section">
              <div class="battery-header">
                <span>电池电量</span>
                <span :class="{ 'warning': drone.battery < 30, 'danger': drone.battery < 15 }">
                  {{ drone.battery.toFixed(2) }}%
                </span>
              </div>
              <el-progress 
                :percentage="parseFloat(drone.battery.toFixed(2))" 
                :status="drone.battery < 20 ? 'exception' : ''"
                :color="batteryColor"
              />
            </div>
            
            <!-- 基本信息 -->
            <div class="info-grid">
              <div class="info-item">
                <label>最大载重</label>
                <span>{{ drone.maxLoad }}kg</span>
              </div>
              <div class="info-item">
                <label>飞行时长</label>
                <span>{{ drone.flightTime }}h</span>
              </div>
              <div class="info-item">
                <label>当前任务</label>
                <span>{{ drone.currentOrder || '无' }}</span>
              </div>
              <div class="info-item">
                <label>今日飞行</label>
                <span>{{ drone.todayFlights }}次</span>
              </div>
            </div>
            
            <!-- 位置信息 -->
            <div class="location-section">
              <el-icon><Location /></el-icon>
              <span>{{ drone.currentLocation }}</span>
            </div>
          </div>
          
          <div class="drone-footer">
            <el-button text type="primary" @click="handleDetail(drone)">
              <el-icon><View /></el-icon>
              详情
            </el-button>
            <el-button text type="primary" @click="handleLocate(drone)">
              <el-icon><MapLocation /></el-icon>
              定位
            </el-button>
            <el-button text type="primary" @click="handleControl(drone)">
              <el-icon><SetUp /></el-icon>
              控制
            </el-button>
            <el-button text type="warning" @click="handleMaintenance(drone)">
              <el-icon><Tools /></el-icon>
              维护
            </el-button>
            <el-button text type="danger" @click="handleDelete(drone)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="pageInfo.page"
        v-model:page-size="pageInfo.size"
        :total="filteredDroneList.length"
        :page-sizes="[9, 18, 36]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
    
    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogType === 'add' ? '新增无人机' : '编辑无人机'" width="550px">
      <el-form :model="form" label-width="100px" :rules="formRules" ref="formRef">
        <el-form-item label="编号" prop="droneNo">
          <el-input v-model="form.droneNo" placeholder="如：UAV-001" />
        </el-form-item>
        <el-form-item label="型号" prop="model">
          <el-select v-model="form.model" placeholder="请选择型号" style="width: 100%">
            <el-option label="DJI Matrice 300" value="DJI Matrice 300" />
            <el-option label="DJI Mavic 3" value="DJI Mavic 3" />
            <el-option label="DJI Matrice 30" value="DJI Matrice 30" />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="电池容量">
              <el-input-number v-model="form.batteryCapacity" :min="1000" :max="20000" step="100" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最大载重">
              <el-input-number v-model="form.maxLoad" :min="0.5" :max="10" step="0.5" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="序列号">
          <el-input v-model="form.serialNo" placeholder="请输入设备序列号" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 无人机详情弹窗 -->
    <el-dialog v-model="detailVisible" title="无人机详情" width="700px">
      <el-descriptions :column="2" border v-if="currentDrone.id">
        <el-descriptions-item label="编号" :span="2">{{ currentDrone.droneNo }}</el-descriptions-item>
        <el-descriptions-item label="型号">{{ currentDrone.model }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusType(currentDrone.status)">{{ statusText(currentDrone.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="电池电量">
          <el-progress :percentage="parseFloat(currentDrone.battery?.toFixed(2) || 0)" style="width: 150px" />
        </el-descriptions-item>
        <el-descriptions-item label="最大载重">{{ currentDrone.maxLoad }}kg</el-descriptions-item>
        <el-descriptions-item label="当前位置">{{ currentDrone.currentLocation }}</el-descriptions-item>
        <el-descriptions-item label="序列号">{{ currentDrone.serialNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="购买日期">{{ currentDrone.purchaseDate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="总飞行时长">{{ currentDrone.totalFlightTime || '0' }}小时</el-descriptions-item>
        <el-descriptions-item label="总飞行次数">{{ currentDrone.totalFlights || '0' }}次</el-descriptions-item>
        <el-descriptions-item v-if="currentDrone.status === 'DELIVERING' && currentDrone.currentOrder" label="当前任务" :span="2">
          <el-tag type="primary" size="small">{{ currentDrone.currentOrder }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="currentDrone.status === 'DELIVERING'" label="配送进度" :span="2">
          <el-progress :percentage="locateProgress" style="width: 200px" />
        </el-descriptions-item>
      </el-descriptions>
      
      <!-- 飞行记录 -->
      <div class="flight-records" v-if="currentDrone.records">
        <h4>最近飞行记录</h4>
        <el-timeline>
          <el-timeline-item
            v-for="(record, index) in currentDrone.records"
            :key="index"
            :type="record.type"
            :timestamp="record.time"
          >
            {{ record.content }}
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-dialog>
    
    <!-- 无人机定位弹窗 -->
    <el-dialog v-model="locateVisible" title="实时追踪" width="800px" :before-close="closeLocateDialog">
      <div class="track-container" v-if="currentDrone.id">
        <div class="track-map">
          <DronePositionMap
            :show-route="currentDrone.status === 'DELIVERING' && !!currentDrone.currentOrder"
            :progress="locateProgress"
            :position="locatePosition"
            :location-name="currentDrone.currentLocation"
            :drone-label="currentDrone.droneNo"
          />
        </div>
        <div class="track-info">
          <h4>配送进度</h4>
          <el-progress :percentage="locateProgress" :color="progressColors" />
          <div class="info-list">
            <div class="info-item">
              <label>当前位置：</label>
              <span>{{ locateCurrentPosition }}</span>
            </div>
            <div class="info-item">
              <label>剩余距离：</label>
              <span>{{ locateRemainingDistance }}km</span>
            </div>
            <div class="info-item">
              <label>预计到达：</label>
              <span>{{ locateEstimateArrival }}</span>
            </div>
            <div class="info-item">
              <label>无人机电量：</label>
              <span :class="{ 'warning': locateBattery < 30 }">{{ locateBattery.toFixed(2) }}%</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="closeLocateDialog">关闭</el-button>
        <el-button type="primary" @click="showDroneOnMap">
          <el-icon><MapLocation /></el-icon>
          在地图上显示
        </el-button>
      </template>
    </el-dialog>
    
    <!-- 远程控制弹窗 -->
    <el-dialog v-model="controlVisible" title="远程控制" width="500px" :close-on-click-modal="false">
      <div class="control-panel">
        <div class="drone-status-bar">
          <span>当前状态：<el-tag :type="statusType(currentDrone.status)">{{ statusText(currentDrone.status) }}</el-tag></span>
          <span>电量：<strong :class="{ 'warning': currentDrone.battery < 30 }">{{ currentDrone.battery?.toFixed(2) }}%</strong></span>
        </div>
        
        <div class="control-buttons">
          <el-button 
            type="primary" 
            size="large" 
            :disabled="currentDrone.status === 'DELIVERING' || currentDrone.status === 'CHARGING' || currentDrone.status === 'MAINTENANCE' || currentDrone.status === 'OFFLINE'"
            :loading="controlLoading === 'takeoff'"
            @click="handleControlAction('takeoff')"
          >
            <el-icon><CaretRight /></el-icon>
            起飞
          </el-button>
          <el-button 
            type="danger" 
            size="large" 
            :disabled="currentDrone.status !== 'DELIVERING'"
            :loading="controlLoading === 'land'"
            @click="handleControlAction('land')"
          >
            <el-icon><VideoPause /></el-icon>
            {{ controlLoading === 'land' ? '寻找降落点...' : '降落' }}
          </el-button>
          <el-button 
            type="warning" 
            size="large"
            :disabled="currentDrone.status === 'CHARGING' || currentDrone.status === 'IDLE'"
            :loading="controlLoading === 'return'"
            @click="handleControlAction('return')"
          >
            <el-icon><Position /></el-icon>
            返航
          </el-button>
          <el-button 
            size="large" 
            type="info"
            :disabled="currentDrone.status !== 'DELIVERING'"
            :loading="controlLoading === 'hover'"
            @click="handleControlAction('hover')"
          >
            <el-icon><CircleCloseFilled /></el-icon>
            悬停
          </el-button>
        </div>
        
        <div class="emergency-section">
          <el-button 
            type="danger" 
            plain 
            size="large" 
            class="emergency-btn"
            :loading="controlLoading === 'emergency'"
            @click="handleControlAction('emergency')"
          >
            <el-icon><WarningFilled /></el-icon>
            紧急停止
          </el-button>
        </div>
        
        <!-- 控制日志 -->
        <div v-if="controlLogs.length > 0" class="control-logs">
          <div class="logs-title">控制记录</div>
          <div class="logs-list">
            <div v-for="(log, index) in controlLogs.slice(0, 5)" :key="index" class="log-item">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-action">{{ log.action }}</span>
              <el-tag :type="log.status === '成功' ? 'success' : 'info'" size="small">{{ log.status }}</el-tag>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { useDashboardStore, STATIONS } from '@/store/dashboard'
import DronePositionMap from '@/components/DronePositionMap/index.vue'
import { 
  Plus, Refresh, Search, Location, View, SetUp, Tools, Delete,
  Coordinate, Warning, SuccessFilled, CaretRight, 
  VideoPause, Position, WarningFilled, CircleCloseFilled,
  MapLocation
} from '@element-plus/icons-vue'

const dashboardStore = useDashboardStore()
const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const detailVisible = ref(false)
const controlVisible = ref(false)
const locateVisible = ref(false)
const dialogType = ref('add')
const formRef = ref(null)
const currentDrone = ref({})

// 刷新动画状态
const isRefreshing = ref(false)

// 从store获取无人机列表
const droneList = computed(() => dashboardStore.droneList)

// 统计数据（从store计算）
const droneStats = computed(() => {
  const stats = dashboardStore.droneStatusStats
  return [
    { icon: 'Coordinate', value: stats.total.toString(), label: '无人机总数', color: '#409EFF', class: 'total' },
    { icon: 'SuccessFilled', value: stats.idle.toString(), label: '待命中', color: '#67C23A', class: 'idle' },
    { icon: 'Position', value: stats.delivering.toString(), label: '配送中', color: '#409EFF', class: 'delivering' },
    { icon: 'Warning', value: stats.charging.toString(), label: '充电中', color: '#E6A23C', class: 'charging' },
    { icon: 'Tools', value: stats.maintenance.toString(), label: '维护中', color: '#909399', class: 'maintenance' },
    { icon: 'Warning', value: stats.offline.toString(), label: '离线', color: '#F56C6C', class: 'offline' }
  ]
})

// 过滤后的无人机列表
const filteredDroneList = computed(() => {
  let result = droneList.value
  
  // 关键词搜索（编号/型号）
  if (searchForm.keyword) {
    const keyword = searchForm.keyword.toLowerCase()
    result = result.filter(drone => 
      drone.droneNo.toLowerCase().includes(keyword) || 
      drone.model.toLowerCase().includes(keyword)
    )
  }
  
  // 状态筛选
  if (searchForm.status) {
    result = result.filter(drone => drone.status === searchForm.status)
  }
  
  // 型号筛选
  if (searchForm.model) {
    result = result.filter(drone => drone.model === searchForm.model)
  }
  
  return result
})

// 分页后的无人机列表
const paginatedDroneList = computed(() => {
  const start = (pageInfo.page - 1) * pageInfo.size
  const end = start + pageInfo.size
  return filteredDroneList.value.slice(start, end)
})

// 分页大小变化
const handleSizeChange = (size) => {
  pageInfo.size = size
  pageInfo.page = 1
  ElMessage.success(`每页显示 ${size} 架无人机`)
}

// 页码变化
const handlePageChange = (page) => {
  pageInfo.page = page
}

const searchForm = reactive({
  keyword: '',
  status: '',
  model: ''
})

const pageInfo = reactive({
  page: 1,
  size: 9
})

const form = reactive({
  droneNo: '',
  model: '',
  batteryCapacity: 5000,
  maxLoad: 2.5,
  serialNo: '',
  remark: ''
})

const formRules = {
  droneNo: [{ required: true, message: '请输入编号', trigger: 'blur' }],
  model: [{ required: true, message: '请选择型号', trigger: 'change' }]
}

// 电池颜色
const batteryColor = [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#67c23a', percentage: 100 }
]

const statusType = (status) => {
  const types = { IDLE: 'success', DELIVERING: 'primary', CHARGING: 'warning', MAINTENANCE: 'info', OFFLINE: 'danger' }
  return types[status] || 'info'
}

const statusText = (status) => {
  const texts = { IDLE: '待命中', DELIVERING: '配送中', CHARGING: '充电中', MAINTENANCE: '维护中', OFFLINE: '离线' }
  return texts[status] || status
}

const handleSearch = () => {
  pageInfo.page = 1 // 搜索时重置到第一页
  ElMessage.success(`搜索完成，共找到 ${filteredDroneList.value.length} 架无人机`)
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.model = ''
  pageInfo.page = 1 // 重置时回到第一页
  ElMessage.success('搜索条件已重置')
}

const refreshData = () => {
  isRefreshing.value = true
  loading.value = true
  
  // 模拟数据刷新
  setTimeout(() => {
    // 随机更新一些无人机的电量和状态，模拟实时数据变化
    dashboardStore.droneList.forEach(drone => {
      // 随机微调电量（-5% 到 +3%）
      const batteryChange = (Math.random() * 8 - 5)
      drone.battery = Math.max(5, Math.min(100, drone.battery + batteryChange))
      
      // 配送中的无人机电量持续下降
      if (drone.status === 'DELIVERING') {
        drone.battery = Math.max(5, drone.battery - Math.random() * 3)
      }
      // 充电中的无人机电量上升
      if (drone.status === 'CHARGING') {
        drone.battery = Math.min(100, drone.battery + Math.random() * 5)
      }
    })
    
    loading.value = false
    isRefreshing.value = false
    ElMessage.success('数据已刷新')
  }, 800)
}

const showAddDialog = () => {
  dialogType.value = 'add'
  Object.assign(form, {
    droneNo: '',
    model: '',
    batteryCapacity: 5000,
    maxLoad: 2.5,
    serialNo: '',
    remark: ''
  })
  dialogVisible.value = true
}

const handleDetail = (row) => {
  currentDrone.value = row
  detailVisible.value = true
}

const locateBattery = ref(0)
const locateCurrentPosition = ref('')
const locateRemainingDistance = ref('0.0')
const locateEstimateArrival = ref('--:--')
let locateTimer = null

const progressColors = [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#5cb87a', percentage: 60 },
  { color: '#1989fa', percentage: 80 },
  { color: '#6f7ad3', percentage: 100 }
]

const handleLocate = (row) => {
  currentDrone.value = row
  locateBattery.value = row.battery || 0
  updateLocateInfo()
  locateVisible.value = true
  startLocateAnimation()
}

const updateLocateInfo = () => {
  if (currentDrone.value.status === 'DELIVERING') {
    locateCurrentPosition.value = currentDrone.value.currentLocation || '配送途中'
    locateRemainingDistance.value = ((100 - locateProgress.value) / 100 * 3.5).toFixed(1)
    const remainingMinutes = Math.ceil((100 - locateProgress.value) / 20)
    const now = new Date()
    const arrivalTime = new Date(now.getTime() + remainingMinutes * 60000)
    locateEstimateArrival.value = `${String(arrivalTime.getHours()).padStart(2, '0')}:${String(arrivalTime.getMinutes()).padStart(2, '0')}`
  } else {
    locateCurrentPosition.value = currentDrone.value.currentLocation || '未知位置'
    locateRemainingDistance.value = '0.0'
    locateEstimateArrival.value = '--:--'
  }
}

const startLocateAnimation = () => {
  if (locateTimer) clearInterval(locateTimer)
  
  locateTimer = setInterval(() => {
    if (!locateVisible.value) {
      clearInterval(locateTimer)
      return
    }
    
    updateLocateInfo()
    
    if (locateBattery.value > 20) {
      locateBattery.value = Math.max(15, locateBattery.value - Math.random() * 2)
    }
    
    if (locateProgress.value >= 100) {
      clearInterval(locateTimer)
      ElMessage.success('配送即将完成！')
    }
  }, 2000)
}

const closeLocateDialog = () => {
  locateVisible.value = false
  if (locateTimer) {
    clearInterval(locateTimer)
    locateTimer = null
  }
}

const showDroneOnMap = () => {
  // 优先定位到所属站点
  const station = STATIONS.find(s => s.name === currentDrone.value?.station)
  if (station) {
    locateVisible.value = false
    closeLocateDialog()
    router.push({ path: '/admin/routes', query: { focusStationId: station.id } })
    return
  }
  // 回退：如有配送任务则追踪订单
  const orderNo = currentDrone.value?.currentOrder
  if (orderNo) {
    const order = dashboardStore.orderList.find(o => o.orderNo === orderNo)
    if (order) {
      locateVisible.value = false
      closeLocateDialog()
      router.push({ path: '/admin/routes', query: { trackOrderId: order.id } })
      return
    }
  }
  ElMessage.info('该无人机当前没有执行中的配送任务')
}

const handleControl = (row) => {
  currentDrone.value = row
  controlLogs.value = [] // 清空之前的日志
  controlVisible.value = true
}

// 控制操作加载状态
const controlLoading = ref('')

// 控制日志
const controlLogs = ref([])

// 执行控制操作
// 取消与该无人机关联的配送中订单
const cancelAssociatedOrder = (droneNo) => {
  const order = dashboardStore.orderList.find(o => o.droneNo === droneNo && o.status === 'DELIVERING')
  if (order) {
    dashboardStore.cancelOrder(order.id)
  }
}

const handleControlAction = async (action) => {
  const drone = currentDrone.value
  if (!drone || !drone.id) return
  
  // 查找无人机在列表中的索引
  const droneIndex = dashboardStore.droneList.findIndex(d => d.id === drone.id)
  if (droneIndex === -1) {
    ElMessage.error('无人机不存在')
    controlLoading.value = ''
    return
  }
  
  // 降落操作特殊处理 - 需要4-5秒寻找降落点
  if (action === 'land') {
    controlLoading.value = 'land'
    const stationNames = STATIONS.map(s => s.name)
    const randomStation = stationNames[Math.floor(Math.random() * stationNames.length)]
    
    ElMessage.info(`正在寻找最近的降落点...`)
    
    // 4-5秒后完成降落
    await new Promise(resolve => setTimeout(resolve, 4500))
    
    if (dashboardStore.droneList[droneIndex].status === 'DELIVERING') {
      cancelAssociatedOrder(drone.droneNo)
      dashboardStore.droneList[droneIndex].status = 'IDLE'
      dashboardStore.droneList[droneIndex].currentOrder = null
      dashboardStore.droneList[droneIndex].currentLocation = randomStation
      dashboardStore.droneList[droneIndex].station = randomStation
      dashboardStore.droneList[droneIndex].todayFlights += 1
      
      ElMessage.success(`无人机 ${drone.droneNo} 已在 ${randomStation} 安全降落，进入待命中状态`)
      
      // 更新当前显示的无人机信息
      currentDrone.value = { ...dashboardStore.droneList[droneIndex] }
      
      // 添加日志
      const logEntry = { 
        time: new Date().toLocaleTimeString('zh-CN'), 
        action: `降落 (${randomLocation})`, 
        status: '成功' 
      }
      controlLogs.value.unshift(logEntry)
    } else {
      ElMessage.warning('无人机不在飞行状态，无法降落')
    }
    
    controlLoading.value = ''
    return
  }
  
  // 其他操作的正常处理
  controlLoading.value = action
  const actionNames = {
    takeoff: '起飞',
    return: '返航',
    hover: '悬停',
    emergency: '紧急停止'
  }
  
  // 模拟控制延迟
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  const now = new Date().toLocaleTimeString('zh-CN')
  let logEntry = { time: now, action: actionNames[action], status: '成功' }
  
  switch (action) {
    case 'takeoff':
      // 起飞：从待命中变为配送中，并创建一个临时订单保证一致性
      if (droneList.value[droneIndex].status === 'IDLE') {
        const now = new Date()
        const orderNo = `DR${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(drone.id).padStart(3, '0')}`
        droneList.value[droneIndex].status = 'DELIVERING'
        droneList.value[droneIndex].currentOrder = orderNo
        
        dashboardStore.addOrder({
          id: Date.now(),
          orderNo,
          senderName: '系统调度',
          senderPhone: '未提供',
          senderAddress: '总部基地',
          receiverName: '现场配送',
          receiverPhone: '未提供',
          receiverAddress: '科技园A座',
          district: '西湖区',
          cargoType: '文件资料',
          cargoWeight: 1,
          price: 30,
          status: 'DELIVERING',
          droneNo: drone.droneNo,
          progress: 0,
          distance: 3.5,
          deliveryTime: null,
          estimatedTime: 20,
          isOnTime: null,
          createTime: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`,
          remark: '手动起飞任务',
          timeline: [{ time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`, content: '手动起飞', type: 'primary' }]
        })
        
        ElMessage.success(`无人机 ${drone.droneNo} 已起飞，开始执行配送任务`)
      } else {
        logEntry.status = '失败'
        ElMessage.warning('当前状态不允许起飞')
      }
      break
      
    case 'return':
      // 返航：变为充电中
      if (droneList.value[droneIndex].status === 'DELIVERING') {
        cancelAssociatedOrder(drone.droneNo)
        droneList.value[droneIndex].status = 'CHARGING'
        droneList.value[droneIndex].currentLocation = drone.id % 2 === 0 ? '充电站1号' : '充电站2号'
        droneList.value[droneIndex].station = '西湖总部'
        droneList.value[droneIndex].currentOrder = null
        ElMessage.success(`无人机 ${drone.droneNo} 正在返航充电`)
      } else {
        logEntry.status = '失败'
        ElMessage.warning('只有配送中的无人机可以返航')
      }
      break
      
    case 'hover':
      // 悬停：保持当前状态，只是提示
      if (droneList.value[droneIndex].status === 'DELIVERING') {
        ElMessage.success(`无人机 ${drone.droneNo} 已悬停，等待下一步指令`)
      } else {
        logEntry.status = '失败'
        ElMessage.warning('悬停指令只对飞行中的无人机有效')
      }
      break
      
    case 'emergency':
      // 紧急停止：强制降落，变为待命中
      cancelAssociatedOrder(drone.droneNo)
      droneList.value[droneIndex].status = 'IDLE'
      droneList.value[droneIndex].currentOrder = null
      const emergencyStation = STATIONS[Math.floor(Math.random() * STATIONS.length)]
      droneList.value[droneIndex].currentLocation = emergencyStation.name
      droneList.value[droneIndex].station = emergencyStation.name
      ElMessage.warning(`无人机 ${drone.droneNo} 已执行紧急停止，请检查设备状态`)
      break
  }
  
  // 更新当前显示的无人机信息
  currentDrone.value = { ...droneList.value[droneIndex] }
  
  // 添加日志
  controlLogs.value.unshift(logEntry)
  controlLoading.value = ''
}

const handleMaintenance = (row) => {
  // 检查当前状态
  if (row.status === 'MAINTENANCE') {
    ElMessageBox.confirm(
      `无人机 ${row.droneNo} 当前已在维护中，是否结束维护并恢复为待命中状态？`,
      '结束维护',
      {
        confirmButtonText: '结束维护',
        cancelButtonText: '取消',
        type: 'success'
      }
    ).then(() => {
      const droneIndex = droneList.value.findIndex(d => d.id === row.id)
      if (droneIndex !== -1) {
        droneList.value[droneIndex].status = 'IDLE'
        const station = STATIONS[droneIndex % STATIONS.length]
        droneList.value[droneIndex].currentLocation = station.name
        droneList.value[droneIndex].station = station.name
        ElMessage.success(`无人机 ${row.droneNo} 已结束维护，恢复待命中状态`)
      }
    })
  } else if (row.status === 'DELIVERING') {
    ElMessageBox.confirm(
      `无人机 ${row.droneNo} 正在配送中，强制维护将中断当前任务。是否继续？`,
      '警告',
      {
        confirmButtonText: '强制维护',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      const droneIndex = droneList.value.findIndex(d => d.id === row.id)
      if (droneIndex !== -1) {
        droneList.value[droneIndex].status = 'MAINTENANCE'
        droneList.value[droneIndex].currentLocation = '维修中心'
        droneList.value[droneIndex].station = '西湖总部'
        droneList.value[droneIndex].currentOrder = null
        ElMessage.success(`无人机 ${row.droneNo} 已设置为维护状态`)
      }
    })
  } else {
    ElMessageBox.confirm(
      `确定将无人机 ${row.droneNo} 设为维护状态吗？`,
      '设置维护状态',
      {
        confirmButtonText: '确认维护',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      const droneIndex = droneList.value.findIndex(d => d.id === row.id)
      if (droneIndex !== -1) {
        droneList.value[droneIndex].status = 'MAINTENANCE'
        droneList.value[droneIndex].currentLocation = '维修中心'
        droneList.value[droneIndex].station = '西湖总部'
        droneList.value[droneIndex].currentOrder = null
        ElMessage.success(`无人机 ${row.droneNo} 已设置为维护状态`)
      }
    })
  }
}

// 根据位置名称获取地图坐标（使用 store 中统一的 canvas 坐标系）
const getLocationPosition = (locationName) => {
  if (!locationName) return { left: '50%', top: '50%' }
  
  const coords = dashboardStore.locationCoords
  let coord = null
  
  // 直接匹配
  if (coords[locationName]) {
    coord = coords[locationName]
  } else {
    // 关键字模糊匹配
    for (const [key, c] of Object.entries(coords)) {
      if (locationName.includes(key) || key.includes(locationName)) {
        coord = c
        break
      }
    }
  }
  
  if (coord) {
    // canvas 坐标系为 1200x800，转换为百分比
    return {
      left: `${(coord[0] / 1200 * 100).toFixed(1)}%`,
      top: `${(coord[1] / 800 * 100).toFixed(1)}%`
    }
  }
  
  return { left: '50%', top: '50%' }
}

// 定位弹窗中的无人机进度（配送中 drones 从 store 关联订单获取）
const locateProgress = computed(() => {
  if (!currentDrone.value || currentDrone.value.status !== 'DELIVERING') return 0
  const order = dashboardStore.orderList.find(o => o.droneNo === currentDrone.value.droneNo)
  return order ? (order.progress || 0) : 0
})

// 定位弹窗中的无人机固定位置（优先显示所属站点）
const locatePosition = computed(() => {
  if (!currentDrone.value) return { left: '50%', top: '50%' }
  return getLocationPosition(currentDrone.value.station || currentDrone.value.currentLocation)
})

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  
  submitting.value = true
  setTimeout(() => {
    if (dialogType.value === 'add') {
      // 新增无人机到列表
      const newId = dashboardStore.droneList.length > 0 
        ? Math.max(...dashboardStore.droneList.map(d => d.id)) + 1 
        : 1
      const newDrone = {
        id: newId,
        droneNo: form.droneNo,
        model: form.model,
        battery: 100,
        maxLoad: form.maxLoad,
        status: 'IDLE',
        currentLocation: '西湖总部',
        station: '西湖总部',
        flightTime: 0,
        currentOrder: null,
        todayFlights: 0,
        serialNo: form.serialNo,
        purchaseDate: new Date().toISOString().split('T')[0],
        totalFlightTime: 0,
        totalFlights: 0
      }
      dashboardStore.droneList.unshift(newDrone)
      
      // 显示成功通知
      ElNotification({
        title: '添加成功',
        message: `无人机 ${form.droneNo} 已成功添加到机队，当前电量100%，处于待命中状态`,
        type: 'success',
        duration: 5000,
        position: 'top-right'
      })
    } else {
      ElMessage.success('修改成功')
    }
    dialogVisible.value = false
    submitting.value = false
  }, 800)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除无人机 ${row.droneNo} 吗？删除后不可恢复！`, '警告', {
    type: 'danger'
  }).then(() => {
    const index = dashboardStore.droneList.findIndex(d => d.id === row.id)
    if (index > -1) {
      dashboardStore.droneList.splice(index, 1)
      ElMessage.success('删除成功')
    }
  })
}

// 动态更新无人机数据 - 不同状态不同频率
let deliveringTimer = null
let idleTimer = null
let chargingTimer = null

const startDynamicUpdate = () => {
  // 配送中：每3秒减少0.13%或0.12%
  deliveringTimer = setInterval(() => {
    dashboardStore.droneList.forEach(drone => {
      if (drone.status === 'DELIVERING') {
        const decrease = Math.random() > 0.5 ? 0.13 : 0.12
        drone.battery = parseFloat(Math.max(0, drone.battery - decrease).toFixed(2))
        // 电量低于15%自动返航充电
        if (drone.battery <= 15) {
          cancelAssociatedOrder(drone.droneNo)
          drone.status = 'CHARGING'
          drone.currentLocation = drone.id % 2 === 0 ? '充电站1号' : '充电站2号'
          drone.station = '西湖总部'
          drone.currentOrder = null
          ElNotification({
            title: '低电量警告',
            message: `无人机 ${drone.droneNo} 电量仅剩 ${drone.battery}%，已自动返航充电`,
            type: 'warning',
            duration: 4000
          })
        }
      }
    })
  }, 3000)
  
  // 待命中：每7秒减少0.01%
  idleTimer = setInterval(() => {
    dashboardStore.droneList.forEach(drone => {
      if (drone.status === 'IDLE') {
        drone.battery = parseFloat(Math.max(0, drone.battery - 0.01).toFixed(2))
        // 电量低于20%自动去充电
        if (drone.battery <= 20) {
          drone.status = 'CHARGING'
          drone.currentLocation = drone.id % 2 === 0 ? '充电站1号' : '充电站2号'
          drone.station = '西湖总部'
          ElNotification({
            title: '电量不足',
            message: `无人机 ${drone.droneNo} 电量仅剩 ${drone.battery}%，已自动前往充电`,
            type: 'warning',
            duration: 4000
          })
        }
      }
    })
  }, 7000)
  
  // 充电中：每1秒增加0.21%
  chargingTimer = setInterval(() => {
    dashboardStore.droneList.forEach(drone => {
      if (drone.status === 'CHARGING') {
        drone.battery = parseFloat(Math.min(100, drone.battery + 0.21).toFixed(2))
        // 充满后变为待命中
        if (drone.battery >= 100) {
          drone.battery = 100
          drone.status = 'IDLE'
          const station = STATIONS[(drone.id - 1) % STATIONS.length]
          drone.currentLocation = station.name
          drone.station = station.name
          ElNotification({
            title: '充电完成',
            message: `无人机 ${drone.droneNo} 已完成充电，电量100%，可以投入任务`,
            type: 'success',
            duration: 4000
          })
        }
      }
    })
  }, 1000)
}

const stopDynamicUpdate = () => {
  if (deliveringTimer) clearInterval(deliveringTimer)
  if (idleTimer) clearInterval(idleTimer)
  if (chargingTimer) clearInterval(chargingTimer)
  deliveringTimer = null
  idleTimer = null
  chargingTimer = null
}

onMounted(() => {
  startDynamicUpdate()
})

onUnmounted(() => {
  stopDynamicUpdate()
})
</script>

<style scoped lang="scss">
.drone-manage {
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

.stat-row {
  margin-bottom: 24px;
}

.stat-card {
  .stat-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .stat-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .stat-value {
    font-size: 24px;
    font-weight: bold;
    color: #1a1a2e;
  }
  
  .stat-label {
    font-size: 13px;
    color: #909399;
    margin-top: 2px;
  }
}

.filter-card {
  margin-bottom: 20px;
}

.search-bar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.drone-grid {
  margin-bottom: 20px;
}

.drone-card {
  margin-bottom: 20px;
  transition: all 0.3s;
  
  &:hover {
    transform: translateY(-4px);
  }
  
  .drone-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #ebeef5;
    
    .drone-info {
      .drone-no {
        margin: 0 0 6px 0;
        font-size: 18px;
        color: #1a1a2e;
      }
      
      .drone-model {
        font-size: 13px;
        color: #909399;
      }
    }
  }
  
  .drone-body {
    .battery-section {
      margin-bottom: 16px;
      padding: 12px;
      background: #f5f7fa;
      border-radius: 8px;
      
      .battery-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 13px;
        color: #606266;
        
        .warning {
          color: #e6a23c;
          font-weight: 600;
        }
        
        .danger {
          color: #f56c6c;
          font-weight: 600;
        }
      }
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 16px;
      
      .info-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
        
        label {
          font-size: 12px;
          color: #909399;
        }
        
        span {
          font-size: 14px;
          color: #1a1a2e;
          font-weight: 500;
        }
      }
    }
    
    .location-section {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background: #ecf5ff;
      border-radius: 8px;
      font-size: 13px;
      color: #409EFF;
      
      .el-icon {
        font-size: 16px;
      }
    }
  }
  
  .drone-footer {
    display: flex;
    justify-content: space-between;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #ebeef5;
    
    .el-button {
      padding: 6px 8px;
      font-size: 13px;
    }
  }
}

.pagination {
  display: flex;
  justify-content: flex-end;
}

.unit {
  margin-left: 8px;
  color: #909399;
}

// 详情弹窗
.flight-records {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #ebeef5;
  
  h4 {
    margin: 0 0 16px 0;
    color: #1a1a2e;
    font-size: 16px;
  }
}

// 控制面板
.control-panel {
  .drone-status-bar {
    display: flex;
    justify-content: space-between;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;
    margin-bottom: 24px;
    
    span {
      font-size: 14px;
      
      strong {
        color: #67c23a;
        font-size: 16px;
        
        &.warning {
          color: #e6a23c;
        }
      }
    }
  }
  
  .control-buttons {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 24px;
    
    .el-button {
      height: 56px;
      font-size: 16px;
      
      .el-icon {
        font-size: 20px;
        margin-right: 8px;
      }
    }
  }
  
  .emergency-section {
    text-align: center;
    padding-top: 16px;
    border-top: 1px solid #ebeef5;
    margin-bottom: 20px;
    
    .emergency-btn {
      width: 100%;
      height: 48px;
      font-size: 16px;
      
      .el-icon {
        font-size: 20px;
        margin-right: 8px;
      }
    }
  }
  
  .control-logs {
    margin-top: 20px;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;
    
    .logs-title {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a2e;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e4e7ed;
    }
    
    .logs-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      
      .log-item {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 13px;
        padding: 8px 12px;
        background: #fff;
        border-radius: 6px;
        
        .log-time {
          color: #909399;
          font-family: 'Courier New', monospace;
          min-width: 70px;
        }
        
        .log-action {
          flex: 1;
          color: #1a1a2e;
          font-weight: 500;
        }
      }
    }
  }
}

.warning {
  color: #e6a23c;
}

.danger {
  color: #f56c6c;
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

// 空数据提示
.empty-data {
  text-align: center;
  padding: 60px 0;
  color: #909399;
  
  .el-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }
  
  p {
    font-size: 14px;
  }
}

// 定位弹窗
.track-container {
  display: flex;
  gap: 24px;
  
  .track-map {
    flex: 1;
    
    .drone-position-map {
      height: 100%;
    }
  }
  
  .track-info {
    width: 280px;
    
    h4 {
      margin: 0 0 16px 0;
      color: #1a1a2e;
    }
    
    .info-list {
      margin-top: 20px;
      
      .info-item {
        display: flex;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid #ebeef5;
        
        &:last-child {
          border-bottom: none;
        }
        
        label {
          color: #909399;
          font-size: 14px;
        }
        
        span {
          color: #1a1a2e;
          font-weight: 500;
          font-size: 14px;
          
          &.warning {
            color: #e6a23c;
          }
        }
      }
    }
  }
}
</style>
