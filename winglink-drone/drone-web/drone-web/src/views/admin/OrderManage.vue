<template>
  <div class="order-manage">
    <!-- 页面标题区 -->
    <div class="page-header">
      <div class="header-left">
        <h2>订单管理</h2>
        <p class="header-desc">管理所有配送订单，包括订单创建、分配、追踪和完成</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          新建订单
        </el-button>
        <el-button @click="handleRefresh" :loading="isRefreshing">
          <el-icon v-if="!isRefreshing"><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>
    
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :span="6" v-for="(stat, index) in orderStats" :key="index">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: stat.color + '15', color: stat.color }">
              <el-icon :size="28">
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
    
    <!-- 搜索和筛选 -->
    <el-card class="filter-card" shadow="never">
      <div class="search-bar">
        <!-- 综合搜索 -->
        <el-input 
          v-model="searchForm.keyword" 
          placeholder="搜索订单号/寄收件人/地址/电话" 
          style="width: 280px" 
          clearable 
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
        />
        <el-divider direction="vertical" />
        <el-input 
          v-model="searchForm.orderNo" 
          placeholder="订单号" 
          style="width: 160px" 
          clearable 
          @keyup.enter="handleSearch"
        />
        <el-input 
          v-model="searchForm.sender" 
          placeholder="寄件人姓名" 
          style="width: 130px" 
          clearable 
          @keyup.enter="handleSearch"
        />
        <el-input 
          v-model="searchForm.receiver" 
          placeholder="收件人姓名" 
          style="width: 130px" 
          clearable 
          @keyup.enter="handleSearch"
        />
        <el-input 
          v-model="searchForm.phone" 
          placeholder="联系电话" 
          style="width: 140px" 
          clearable 
          @keyup.enter="handleSearch"
        />
        <el-select v-model="searchForm.status" placeholder="订单状态" clearable style="width: 120px">
          <el-option label="待分配" value="PENDING">
            <el-tag size="small" type="info">待分配</el-tag>
          </el-option>
          <el-option label="已分配" value="ASSIGNED">
            <el-tag size="small" type="warning">已分配</el-tag>
          </el-option>
          <el-option label="配送中" value="DELIVERING">
            <el-tag size="small" type="primary">配送中</el-tag>
          </el-option>
          <el-option label="已完成" value="DELIVERED">
            <el-tag size="small" type="success">已完成</el-tag>
          </el-option>
          <el-option label="已取消" value="CANCELLED">
            <el-tag size="small" type="danger">已取消</el-tag>
          </el-option>
        </el-select>
        <el-select v-model="searchForm.cargoType" placeholder="货物类型" clearable style="width: 120px">
          <el-option label="文件资料" value="文件资料" />
          <el-option label="食品生鲜" value="食品生鲜" />
          <el-option label="药品医疗" value="药品医疗" />
          <el-option label="电子产品" value="电子产品" />
          <el-option label="服装鞋帽" value="服装鞋帽" />
          <el-option label="其他物品" value="其他物品" />
        </el-select>
        <el-select v-model="searchForm.district" placeholder="配送区域" clearable style="width: 120px">
          <el-option label="西湖区" value="西湖区" />
          <el-option label="上城区" value="上城区" />
          <el-option label="滨江区" value="滨江区" />
          <el-option label="拱墅区" value="拱墅区" />
          <el-option label="钱塘区" value="钱塘区" />
        </el-select>
        <el-date-picker
          v-model="searchForm.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 220px"
          value-format="YYYY-MM-DD"
        />
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
    
    <!-- 订单列表 -->
    <el-card shadow="never">
      <el-table :data="paginatedOrderList" v-loading="loading" stripe>
        <el-table-column type="selection" width="55" />
        <el-table-column prop="orderNo" label="订单号" width="160">
          <template #default="{ row }">
            <el-link type="primary" @click="handleDetail(row)">{{ row.orderNo }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="senderName" label="寄件人" width="100" />
        <el-table-column prop="senderAddress" label="寄件地址" show-overflow-tooltip min-width="150" />
        <el-table-column prop="receiverName" label="收件人" width="100" />
        <el-table-column prop="receiverAddress" label="收件地址" show-overflow-tooltip min-width="150" />
        <el-table-column prop="district" label="配送区域" width="100">
          <template #default="{ row }">
            <el-tag size="small" effect="plain" v-if="row.district">{{ row.district }}</el-tag>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="cargoType" label="货物类型" width="100" />
        <el-table-column prop="cargoWeight" label="重量" width="80">
          <template #default="{ row }">{{ row.cargoWeight }}kg</template>
        </el-table-column>
        <el-table-column prop="price" label="金额" width="90">
          <template #default="{ row }">
            <span class="price">¥{{ row.price }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="140">
          <template #default="{ row }">
            <div class="status-cell">
              <el-tag :type="statusType(row.status)" effect="light" size="small">
                {{ statusText(row.status) }}
              </el-tag>
              <!-- 配送中订单显示进度条 -->
              <el-progress 
                v-if="row.status === 'DELIVERING'" 
                :percentage="row.progress || 0" 
                :show-text="false"
                :stroke-width="4"
                class="order-progress"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="droneNo" label="配送无人机" width="120">
          <template #default="{ row }">
            <span v-if="row.droneNo" class="drone-tag">
              <el-icon><Coordinate /></el-icon>
              {{ row.droneNo }}
            </span>
            <span v-else class="no-drone">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="下单时间" width="170" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleDetail(row)">详情</el-button>
            <el-button v-if="row.status === 'PENDING'" link type="success" @click="handleAssign(row)">分配</el-button>
            <el-button v-if="row.status === 'DELIVERING'" link type="warning" @click="handleTrack(row)">追踪</el-button>
            <el-button v-if="['PENDING', 'ASSIGNED'].includes(row.status)" link type="danger" @click="handleCancel(row)">取消</el-button>
            <el-button v-if="row.status === 'CANCELLED'" link type="warning" @click="handleRestore(row)">恢复</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination">
        <el-pagination
          v-model:current-page="pageInfo.page"
          v-model:page-size="pageInfo.size"
          :total="filteredOrderList.length"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
    
    <!-- 新建订单弹窗 -->
    <el-dialog v-model="createVisible" title="新建订单" width="700px" destroy-on-close>
      <el-form :model="createForm" label-width="100px" :rules="createRules" ref="createFormRef">
        <el-divider content-position="left">寄件信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="寄件人" prop="senderName">
              <el-input v-model="createForm.senderName" placeholder="请输入寄件人姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="senderPhone">
              <el-input v-model="createForm.senderPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="寄件地址" prop="senderAddress">
          <el-input v-model="createForm.senderAddress" placeholder="请输入详细地址" />
        </el-form-item>
        
        <el-divider content-position="left">收件信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="收件人" prop="receiverName">
              <el-input v-model="createForm.receiverName" placeholder="请输入收件人姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="receiverPhone">
              <el-input v-model="createForm.receiverPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="收件地址" prop="receiverAddress">
          <el-input v-model="createForm.receiverAddress" placeholder="请输入详细地址" />
        </el-form-item>
        <el-form-item label="配送区域" prop="district">
          <el-select v-model="createForm.district" placeholder="请选择配送区域" style="width: 100%">
            <el-option label="西湖区" value="西湖区" />
            <el-option label="上城区" value="上城区" />
            <el-option label="滨江区" value="滨江区" />
            <el-option label="拱墅区" value="拱墅区" />
            <el-option label="钱塘区" value="钱塘区" />
          </el-select>
        </el-form-item>
        
        <el-divider content-position="left">货物信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="货物类型" prop="cargoType">
              <el-select v-model="createForm.cargoType" placeholder="请选择" style="width: 100%">
                <el-option label="文件资料" value="文件资料" />
                <el-option label="食品生鲜" value="食品生鲜" />
                <el-option label="药品医疗" value="药品医疗" />
                <el-option label="电子产品" value="电子产品" />
                <el-option label="服装鞋帽" value="服装鞋帽" />
                <el-option label="其他物品" value="其他物品" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="货物重量" prop="cargoWeight">
              <el-input-number v-model="createForm.cargoWeight" :min="0.1" :max="10" :precision="1" step="0.5" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="createForm.remark" type="textarea" :rows="2" placeholder="请输入备注信息（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCreate" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 订单详情弹窗 -->
    <el-dialog v-model="detailVisible" title="订单详情" width="700px">
      <el-descriptions :column="2" border v-if="currentOrder.id">
        <el-descriptions-item label="订单号" :span="2">{{ currentOrder.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="订单状态" :span="2">
          <el-tag :type="statusType(currentOrder.status)" size="large">{{ statusText(currentOrder.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="寄件人">{{ currentOrder.senderName }}</el-descriptions-item>
        <el-descriptions-item label="寄件电话">{{ currentOrder.senderPhone }}</el-descriptions-item>
        <el-descriptions-item label="寄件地址" :span="2">{{ currentOrder.senderAddress }}</el-descriptions-item>
        <el-descriptions-item label="收件人">{{ currentOrder.receiverName }}</el-descriptions-item>
        <el-descriptions-item label="收件电话">{{ currentOrder.receiverPhone }}</el-descriptions-item>
        <el-descriptions-item label="收件地址" :span="2">{{ currentOrder.receiverAddress }}</el-descriptions-item>
        <el-descriptions-item label="配送区域">
          <el-tag size="small" effect="plain" v-if="currentOrder.district">{{ currentOrder.district }}</el-tag>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="货物类型">{{ currentOrder.cargoType }}</el-descriptions-item>
        <el-descriptions-item label="货物重量">{{ currentOrder.cargoWeight }}kg</el-descriptions-item>
        <el-descriptions-item label="订单金额">
          <span class="price-highlight">¥{{ currentOrder.price }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="配送无人机">
          <span v-if="currentOrder.droneNo" class="drone-tag">
            <el-icon><Coordinate /></el-icon>
            {{ currentOrder.droneNo }}
          </span>
          <span v-else>待分配</span>
        </el-descriptions-item>
        <el-descriptions-item label="下单时间" :span="2">{{ currentOrder.createTime }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentOrder.remark || '无' }}</el-descriptions-item>
      </el-descriptions>
      <!-- 订单时间轴 -->
      <div class="order-timeline" v-if="currentOrder.timeline">
        <h4>订单轨迹</h4>
        <el-timeline>
          <el-timeline-item
            v-for="(item, index) in currentOrder.timeline"
            :key="index"
            :type="item.type"
            :timestamp="item.time"
          >
            {{ item.content }}
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-dialog>
    
    <!-- 分配无人机弹窗 -->
    <el-dialog v-model="assignVisible" title="分配无人机" width="500px">
      <el-form label-width="100px">
        <el-form-item label="选择无人机">
          <el-select v-model="selectedDrone" placeholder="请选择可用无人机" style="width: 100%" @change="handleDroneChange">
            <el-option 
              v-for="drone in availableDrones" 
              :key="drone.id"
              :label="drone.droneNo + ' - ' + drone.model + ' (电量' + drone.battery + '%' + (drone.distanceToSender !== null ? '，距发货点' + drone.distanceToSender + 'km' : '') + '，约' + drone.estimateTime + '分钟)'"
              :value="drone.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="预计时间">
          <el-input-number v-model="estimateTime" :min="5" :max="120" disabled />
          <span class="unit">分钟（系统根据无人机位置与订单距离自动计算，每架不同）</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAssign" :loading="submitting">确定分配</el-button>
      </template>
    </el-dialog>
    

    
    <!-- 订单追踪弹窗 -->
    <el-dialog v-model="trackVisible" title="实时追踪" width="800px" :before-close="closeTrackDialog">
      <div class="track-container">
        <div class="track-map">
          <DronePositionMap show-route :progress="deliveryProgress" />
        </div>
        <div class="track-info">
          <h4>配送进度</h4>
          <el-progress :percentage="deliveryProgress" :color="progressColors" />
          <div class="info-list">
            <div class="info-item">
              <label>当前位置：</label>
              <span>{{ currentPosition }}</span>
            </div>
            <div class="info-item">
              <label>剩余距离：</label>
              <span>{{ remainingDistance }}km</span>
            </div>
            <div class="info-item">
              <label>预计到达：</label>
              <span>{{ estimateArrival }}</span>
            </div>
            <div class="info-item">
              <label>无人机电量：</label>
              <span :class="{ 'warning': droneBattery < 30 }">{{ droneBattery }}%</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="trackVisible = false">关闭</el-button>
        <el-button type="primary" @click="showOnMap">
          <el-icon><MapLocation /></el-icon>
          在地图上显示
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { useDashboardStore } from '@/store/dashboard'
import { useSettingsStore } from '@/store/settings'
import { cancelOrderApi, restoreOrderApi } from '@/api/order'
import DronePositionMap from '@/components/DronePositionMap/index.vue'
import { 
  Plus, Search, Refresh, Coordinate, Location,
  Document, Box, Timer, Check, Warning, CircleCheck, MapLocation
} from '@element-plus/icons-vue'

const router = useRouter()
const dashboardStore = useDashboardStore()
const settingsStore = useSettingsStore()
const loading = ref(false)
const submitting = ref(false)
const detailVisible = ref(false)
const createVisible = ref(false)
const assignVisible = ref(false)
const trackVisible = ref(false)
const currentOrder = ref({})
const isRefreshing = ref(false)
const selectedDrone = ref('')
const estimateTime = ref(15)
const createFormRef = ref(null)

// 订单统计数据 - 从store获取，与首页概览统一
const orderStats = computed(() => dashboardStore.orderStats)

const searchForm = reactive({
  keyword: '', // 综合搜索关键词
  orderNo: '',
  sender: '',
  receiver: '',
  phone: '', // 联系电话
  status: '',
  cargoType: '', // 货物类型
  district: '', // 配送区域
  dateRange: []
})

const createForm = reactive({
  senderName: '',
  senderPhone: '',
  senderAddress: '',
  receiverName: '',
  receiverPhone: '',
  receiverAddress: '',
  district: '',
  cargoType: '',
  cargoWeight: 1,
  remark: ''
})

const createRules = {
  senderName: [{ required: true, message: '请输入寄件人姓名', trigger: 'blur' }],
  senderPhone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  senderAddress: [{ required: true, message: '请输入寄件地址', trigger: 'blur' }],
  receiverName: [{ required: true, message: '请输入收件人姓名', trigger: 'blur' }],
  receiverPhone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  receiverAddress: [{ required: true, message: '请输入收件地址', trigger: 'blur' }],
  district: [{ required: true, message: '请选择配送区域', trigger: 'change' }],
  cargoType: [{ required: true, message: '请选择货物类型', trigger: 'change' }],
  cargoWeight: [{ required: true, message: '请输入货物重量', trigger: 'blur' }]
}

const pageInfo = reactive({
  page: 1,
  size: 10
})

// 搜索筛选后的订单列表
const filteredOrderList = computed(() => {
  let result = [...dashboardStore.orderList]
  
  // 综合关键词搜索（搜索订单号、姓名、地址、电话等）
  if (searchForm.keyword) {
    const keyword = searchForm.keyword.toLowerCase()
    result = result.filter(order => {
      return (
        (order.orderNo && order.orderNo.toLowerCase().includes(keyword)) ||
        (order.senderName && order.senderName.includes(searchForm.keyword)) ||
        (order.receiverName && order.receiverName.includes(searchForm.keyword)) ||
        (order.senderAddress && order.senderAddress.includes(searchForm.keyword)) ||
        (order.receiverAddress && order.receiverAddress.includes(searchForm.keyword)) ||
        (order.senderPhone && order.senderPhone.includes(searchForm.keyword)) ||
        (order.receiverPhone && order.receiverPhone.includes(searchForm.keyword)) ||
        (order.droneNo && order.droneNo.toLowerCase().includes(keyword)) ||
        (order.cargoType && order.cargoType.includes(searchForm.keyword))
      )
    })
  }
  
  // 按订单号搜索
  if (searchForm.orderNo) {
    const orderNo = searchForm.orderNo.toLowerCase()
    result = result.filter(order => 
      order.orderNo && order.orderNo.toLowerCase().includes(orderNo)
    )
  }
  
  // 按寄件人搜索
  if (searchForm.sender) {
    result = result.filter(order => 
      order.senderName && order.senderName.includes(searchForm.sender)
    )
  }
  
  // 按收件人搜索
  if (searchForm.receiver) {
    result = result.filter(order => 
      order.receiverName && order.receiverName.includes(searchForm.receiver)
    )
  }
  
  // 按联系电话搜索
  if (searchForm.phone) {
    result = result.filter(order => 
      (order.senderPhone && order.senderPhone.includes(searchForm.phone)) ||
      (order.receiverPhone && order.receiverPhone.includes(searchForm.phone))
    )
  }
  
  // 按状态筛选
  if (searchForm.status) {
    result = result.filter(order => order.status === searchForm.status)
  }
  
  // 按货物类型筛选
  if (searchForm.cargoType) {
    result = result.filter(order => order.cargoType === searchForm.cargoType)
  }
  
  // 按配送区域筛选
  if (searchForm.district) {
    result = result.filter(order => order.district === searchForm.district)
  }
  
  // 按日期范围筛选
  if (searchForm.dateRange && searchForm.dateRange.length === 2) {
    const startDate = new Date(searchForm.dateRange[0] + ' 00:00:00').getTime()
    const endDate = new Date(searchForm.dateRange[1] + ' 23:59:59').getTime()
    result = result.filter(order => {
      const orderDate = new Date(order.createTime).getTime()
      return orderDate >= startDate && orderDate <= endDate
    })
  }
  
  return result
})

// 分页后的订单列表
const paginatedOrderList = computed(() => {
  const start = (pageInfo.page - 1) * pageInfo.size
  const end = start + pageInfo.size
  return filteredOrderList.value.slice(start, end)
})

// 分页大小变化
const handleSizeChange = (size) => {
  pageInfo.size = size
  pageInfo.page = 1
}

// 页码变化
const handlePageChange = (page) => {
  pageInfo.page = page
}

// 可用无人机列表（分配时根据订单动态获取推荐列表）
const availableDrones = ref([])

// 追踪相关 - 改为计算属性，实时同步订单数据
const remainingDistance = ref(1.2)
const estimateArrival = ref('14:55')
const dronePosition = reactive({ left: '65%', top: '50%' })

// 当前位置从 store 中分配无人机的 currentLocation 实时读取
const currentPosition = computed(() => {
  if (!currentOrder.value || !currentOrder.value.droneNo) return '未知位置'
  const drone = dashboardStore.droneList.find(d => d.droneNo === currentOrder.value.droneNo)
  return drone ? (drone.currentLocation || '配送途中') : '未知位置'
})

// 无人机电量从 store 实时读取
const droneBattery = computed(() => {
  if (!currentOrder.value || !currentOrder.value.droneNo) return 0
  const drone = dashboardStore.droneList.find(d => d.droneNo === currentOrder.value.droneNo)
  return drone ? (drone.battery || 0) : 0
})
const progressColors = [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#5cb87a', percentage: 60 },
  { color: '#1989fa', percentage: 80 },
  { color: '#6f7ad3', percentage: 100 }
]

// 追踪弹窗定时器
let trackTimer = null

// 计算当前追踪的订单实时进度
const deliveryProgress = computed(() => {
  if (!currentOrder.value || !currentOrder.value.id) return 0
  const order = dashboardStore.orderList.find(o => o.id === currentOrder.value.id)
  return order ? (order.progress || 0) : 0
})

// 打开追踪弹窗
const handleTrack = (row) => {
  currentOrder.value = row
  updateTrackInfo()
  trackVisible.value = true
  
  // 启动追踪弹窗内的动画更新（只更新UI，不修改进度）
  startTrackAnimation()
}

// 在地图上显示
const showOnMap = () => {
  const orderId = currentOrder.value?.id
  if (!orderId) return
  trackVisible.value = false
  router.push({ path: '/admin/routes', query: { trackOrderId: orderId } })
  closeTrackDialog()
}

// 更新追踪信息显示
const updateTrackInfo = () => {
  remainingDistance.value = ((100 - deliveryProgress.value) / 100 * 3.5).toFixed(1)
  
  // 计算预计到达时间
  const remainingMinutes = Math.ceil((100 - deliveryProgress.value) / 20)
  const now = new Date()
  const arrivalTime = new Date(now.getTime() + remainingMinutes * 60000)
  estimateArrival.value = `${String(arrivalTime.getHours()).padStart(2, '0')}:${String(arrivalTime.getMinutes()).padStart(2, '0')}`
  
  // 更新无人机位置
  const progressPercent = deliveryProgress.value / 100
  dronePosition.left = `${20 + progressPercent * 60}%`
}

// 追踪弹窗内的动画更新（只更新UI展示，进度从store实时获取）
const startTrackAnimation = () => {
  // 清除之前的定时器
  if (trackTimer) clearInterval(trackTimer)
  
  trackTimer = setInterval(() => {
    if (!trackVisible.value) {
      clearInterval(trackTimer)
      return
    }
    
    // 从store获取最新进度
    const progress = deliveryProgress.value
    
    // 更新位置和距离
    updateTrackInfo()
    
    // 电量已从 store 实时计算，无需在此手动更新
    
    // 进度完成提示
    if (progress >= 100) {
      clearInterval(trackTimer)
      ElMessage.success('配送即将完成！')
    }
  }, 2000) // 每2秒更新一次
}

// 关闭追踪弹窗时清除定时器
const closeTrackDialog = () => {
  trackVisible.value = false
  currentOrder.value = {} // 清空当前订单
  if (trackTimer) {
    clearInterval(trackTimer)
    trackTimer = null
  }
}

const statusType = (status) => {
  const types = { PENDING: 'info', ASSIGNED: 'warning', DELIVERING: 'primary', DELIVERED: 'success', CANCELLED: 'danger' }
  return types[status] || 'info'
}

const statusText = (status) => {
  const texts = { PENDING: '待分配', ASSIGNED: '已分配', DELIVERING: '配送中', DELIVERED: '已完成', CANCELLED: '已取消' }
  return texts[status] || status
}

// 执行搜索
const handleSearch = () => {
  pageInfo.page = 1 // 重置到第一页
  const count = filteredOrderList.value.length
  const total = dashboardStore.orderList.length
  
  if (count === 0) {
    ElMessage.warning('未找到匹配的订单，请尝试其他搜索条件')
  } else if (count === total) {
    ElMessage.info(`显示全部 ${total} 条订单`)
  } else {
    ElMessage.success(`搜索完成，找到 ${count} 条订单（共 ${total} 杩）`)
  }
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.orderNo = ''
  searchForm.sender = ''
  searchForm.receiver = ''
  searchForm.phone = ''
  searchForm.status = ''
  searchForm.cargoType = ''
  searchForm.district = ''
  searchForm.dateRange = []
  pageInfo.page = 1
  ElMessage.success('搜索条件已重置')
}

const showCreateDialog = () => {
  Object.keys(createForm).forEach(key => {
    createForm[key] = key === 'cargoWeight' ? 1 : ''
  })
  createVisible.value = true
}

const confirmCreate = async () => {
  const valid = await createFormRef.value.validate().catch(() => false)
  if (!valid) return
  
  submitting.value = true
  setTimeout(() => {
    const now = new Date()
    const newId = dashboardStore.orderList.length > 0 ? Math.max(...dashboardStore.orderList.map(o => o.id)) + 1 : 1
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    
    dashboardStore.addOrder({
      id: newId,
      orderNo: `DR${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(newId).padStart(3, '0')}`,
      senderName: createForm.senderName,
      senderPhone: createForm.senderPhone,
      senderAddress: createForm.senderAddress,
      receiverName: createForm.receiverName,
      receiverPhone: createForm.receiverPhone,
      receiverAddress: createForm.receiverAddress,
      district: createForm.district,
      cargoType: createForm.cargoType,
      cargoWeight: createForm.cargoWeight,
      price: Math.floor(25 + Math.random() * 50),
      status: 'PENDING',
      droneNo: null,
      progress: 0,
      distance: parseFloat((2 + Math.random() * 6).toFixed(1)),
      deliveryTime: null,
      estimatedTime: 20,
      isOnTime: null,
      createTime: timeStr,
      remark: createForm.remark || '',
      timeline: [{ time: timeStr, content: '订单创建', type: 'primary' }]
    })
    
    ElMessage.success('订单创建成功')
    createVisible.value = false
    submitting.value = false
  }, 800)
}

const handleDetail = (row) => {
  currentOrder.value = row
  detailVisible.value = true
}

// 根据距离计算预计配送时间（分钟）
const calculateEstimateTime = (distance) => {
  // 无人机平均速度约 60km/h = 1km/min
  // 加上起降、装卸等时间，基础时间 5 分钟，每公里增加 1 分钟
  const baseTime = 5
  const distanceTime = (distance || 3) * 1.5
  return Math.max(5, Math.min(120, Math.ceil(baseTime + distanceTime)))
}

const handleAssign = (row) => {
  currentOrder.value = row
  selectedDrone.value = ''
  // 获取推荐无人机列表（已按距离排序，并带有各自不同的预计时间）
  availableDrones.value = dashboardStore.getRecommendedDrones(row)
  // 默认选中第一架（最合适的）
  if (availableDrones.value.length > 0) {
    selectedDrone.value = availableDrones.value[0].id
    estimateTime.value = availableDrones.value[0].estimateTime
  } else {
    estimateTime.value = calculateEstimateTime(row.distance)
  }
  assignVisible.value = true
}

// 选择不同无人机时同步更新预计时间
const handleDroneChange = (val) => {
  const drone = availableDrones.value.find(d => d.id === val)
  if (drone) {
    estimateTime.value = drone.estimateTime
  }
}

const confirmAssign = () => {
  if (!selectedDrone.value) {
    ElMessage.warning('请选择无人机')
    return
  }
  
  // 获取选中的无人机信息
  const selectedDroneInfo = availableDrones.value.find(d => d.id === selectedDrone.value)
  if (!selectedDroneInfo) {
    ElMessage.error('选择的无人机不可用')
    return
  }
  
  submitting.value = true
  setTimeout(() => {
    // 使用store分配无人机并更新订单状态
    dashboardStore.assignDroneToOrder(currentOrder.value.id, selectedDroneInfo.droneNo)
    
    // 将选中无人机的预计时间写入订单
    const order = dashboardStore.orderList.find(o => o.id === currentOrder.value.id)
    if (order) {
      order.estimatedTime = estimateTime.value
    }
    
    if (settingsStore.shouldShowNotification('orderAssigned')) {
      ElMessage.success(`分配成功，无人机 ${selectedDroneInfo.droneNo} 准备起飞，预计 ${estimateTime.value} 分钟送达`)
    }
    assignVisible.value = false
    submitting.value = false
  }, 800)
}

// 使用store的方法添加新订单

const handleRestore = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要恢复订单 ${row.orderNo} 吗？恢复后订单将变为待分配状态。`, '提示', {
      type: 'warning'
    })

    submitting.value = true

    // 调用后端接口
    try {
      await restoreOrderApi(row.id)
    } catch (apiErr) {
      console.warn('后端恢复接口调用失败，使用本地状态更新:', apiErr)
    }

    // 更新本地状态
    dashboardStore.restoreOrder(row.id)

    if (settingsStore.shouldShowNotification('orderRestored')) {
      ElMessage.success('订单已恢复')
    }
  } catch (err) {
    if (err !== 'cancel') {
      console.error('恢复订单失败:', err)
      ElMessage.error('恢复订单失败')
    }
  } finally {
    submitting.value = false
  }
}

const handleCancel = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要取消订单 ${row.orderNo} 吗？`, '提示', {
      type: 'warning'
    })
    
    submitting.value = true
    
    // 调用后端接口
    try {
      await cancelOrderApi(row.id)
    } catch (apiErr) {
      console.warn('后端取消接口调用失败，使用本地状态更新:', apiErr)
    }
    
    // 更新本地状态
    dashboardStore.cancelOrder(row.id)
    
    if (settingsStore.shouldShowNotification('orderCancelled')) {
      ElMessage.success('订单已取消')
    }
  } catch (err) {
    // 用户取消确认或发生错误
    if (err !== 'cancel') {
      console.error('取消订单失败:', err)
      ElMessage.error('取消订单失败')
    }
  } finally {
    submitting.value = false
  }
}

const handleRefresh = async () => {
  isRefreshing.value = true
  // 模拟刷新延迟，带动画效果
  await new Promise(resolve => setTimeout(resolve, 800))
  // 重置分页到第一页
  pageInfo.page = 1
  // 重新加载本地状态（如果存在）
  dashboardStore.loadState()
  isRefreshing.value = false
  ElMessage.success('订单数据已刷新')
}

// 页面挂载时启动进度更新（如果Dashboard没有启动的话）
onMounted(() => {
  // 启动订单进度更新
  dashboardStore.startProgressUpdate((completedOrder) => {
    if (settingsStore.shouldShowNotification('orderCompleted')) {
      ElMessage.success(`订单 ${completedOrder.orderNo} 已配送完成！`)
    }
  })
  
  // 启动自动添加新订单
  dashboardStore.startAutoAddOrders((newOrder) => {
    if (settingsStore.shouldShowNotification('newOrder')) {
      ElNotification({
        title: '新订单',
        message: `收到新订单 ${newOrder.orderNo}，请及时处理`,
        type: 'info',
        duration: 3000
      })
    }
  })
  
  // 启动自动分配（PENDING订单约1分钟后自动分配最优无人机）
  dashboardStore.startAutoAssign()
})

// 页面卸载时
onUnmounted(() => {
  if (trackTimer) clearInterval(trackTimer)
  // 注意：这里不停止进度更新定时器，因为其他页面可能还需要
  // 如果需要在离开所有管理页面时停止，可以在AdminLayout中处理
})
</script>

<style scoped lang="scss">
.order-manage {
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
    gap: 16px;
  }
  
  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .stat-value {
    font-size: 28px;
    font-weight: bold;
    color: #1a1a2e;
  }
  
  .stat-label {
    font-size: 14px;
    color: #909399;
    margin-top: 4px;
  }
}

.filter-card {
  margin-bottom: 20px;
}

.search-bar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.price {
  color: #f56c6c;
  font-weight: 600;
}

.price-highlight {
  color: #f56c6c;
  font-weight: bold;
  font-size: 18px;
}

.drone-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #409EFF;
  font-size: 13px;
  
  .el-icon {
    font-size: 14px;
  }
}

.no-drone {
  color: #909399;
}

// 状态单元格样式
.status-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  
  .order-progress {
    width: 80px;
  }
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.unit {
  margin-left: 8px;
  color: #909399;
}

// 订单时间轴
.order-timeline {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #ebeef5;
  
  h4 {
    margin: 0 0 16px 0;
    color: #1a1a2e;
    font-size: 16px;
  }
}

// 追踪弹窗样式
.track-container {
  display: flex;
  gap: 24px;
  
  .track-map {
    flex: 1;
    
    .mock-map {
      height: 300px;
      background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
      border-radius: 12px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 40px;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="0" y="0" width="100" height="100" fill="none" stroke="rgba(64,158,255,0.1)" stroke-width="1"/></svg>');
        background-size: 20px 20px;
      }
      
      .map-point {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        
        .el-icon {
          font-size: 32px;
          color: #409EFF;
        }
        
        span {
          font-size: 14px;
          color: #606266;
          font-weight: 600;
        }
        
        &.end .el-icon {
          color: #67c23a;
        }
      }
      
      .map-route {
        flex: 1;
        height: 4px;
        background: linear-gradient(90deg, #409EFF 0%, #67c23a 100%);
        border-radius: 2px;
        margin: 0 20px;
        position: relative;
        
        &::after {
          content: '';
          position: absolute;
          right: 0;
          top: -3px;
          width: 10px;
          height: 10px;
          background: #67c23a;
          border-radius: 50%;
        }
      }
      
      .map-drone {
        position: absolute;
        left: 65%;
        top: 50%;
        transform: translate(-50%, -50%);
        background: #fff;
        padding: 8px 12px;
        border-radius: 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: #409EFF;
        font-weight: 600;
        animation: float-drone 2s ease-in-out infinite;
        
        .el-icon {
          font-size: 18px;
        }
      }
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

@keyframes float-drone {
  0%, 100% { transform: translate(-50%, -50%) translateY(0); }
  50% { transform: translate(-50%, -50%) translateY(-8px); }
}

// 导出报表样式
.export-report {
  .report-header {
    text-align: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid #e4e7ed;
    
    h3 {
      margin: 0 0 8px 0;
      font-size: 20px;
      color: #1a1a2e;
    }
    
    .report-meta {
      margin: 0;
      color: #909399;
      font-size: 13px;
    }
  }
  
  .report-table-wrapper {
    margin-bottom: 20px;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .report-summary {
    background: #f5f7fa;
    padding: 15px 20px;
    border-radius: 4px;
    
    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .label {
        color: #606266;
        font-size: 13px;
      }
      
      .value {
        color: #1a1a2e;
        font-weight: 600;
        font-size: 14px;
      }
    }
  }
}
</style>
