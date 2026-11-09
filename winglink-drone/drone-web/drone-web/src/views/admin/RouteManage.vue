<template>
  <div class="route-manage">
    <!-- 页面标题区 -->
    <div class="page-header">
      <div class="header-left">
        <h2>航线与空域管理</h2>
        <p class="header-desc">规划配送航线，管理空域资源，设置禁飞区和限飞区</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showAddDialog">
          <el-icon>
            <Plus />
          </el-icon>
          新增航线
        </el-button>
        <el-button @click="showZoneDialog">
          <el-icon>
            <CirclePlus />
          </el-icon>
          添加空域
        </el-button>
      </div>
    </div>

    <!-- 订单追踪提示横幅 -->
    <el-row v-if="isTracking" :gutter="20" class="tracking-banner-row">
      <el-col :span="24">
        <div class="tracking-banner">
          <div class="tracking-left">
            <div class="tracking-icon">
              <el-icon size="28" color="#fff"><MapLocation /></el-icon>
            </div>
            <div class="tracking-info">
              <div class="tracking-title">
                正在实时追踪订单
                <span class="order-no">{{ trackingOrderNo }}</span>
              </div>
              <div class="tracking-detail">
                无人机 <span class="highlight">{{ trackingDroneNo }}</span>
                &nbsp;|&nbsp;
                当前进度 <span class="highlight">{{ trackingProgress }}%</span>
                &nbsp;|&nbsp;
                从 <span class="highlight">{{ trackingStartName }}</span> 飞往 <span class="highlight">{{ trackingEndName }}</span>
              </div>
            </div>
          </div>
          <div class="tracking-right">
            <el-button type="danger" plain @click="stopTracking">
              <el-icon><CircleClose /></el-icon>
              结束追踪
            </el-button>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-row" v-if="!isTracking">
      <el-col :span="6" v-for="(stat, index) in routeStats" :key="index">
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

    <!-- 地图区域 -->
    <el-card shadow="never" class="map-card-container">
      <template #header>
        <div class="card-header">
          <span>杭州市区空域图</span>
          <el-tag type="success" effect="light">全城覆盖
          </el-tag>
        </div>
      </template>
      <Map2D :routes="mapRoutes" :zones="mapZones" :delivery-points="mapDeliveryPoints" :stations="mapStations" :focus-route="focusRoute" :focus-point="focusStation" :track-route="trackRoute" :track-drone="trackDrone" />
    </el-card>



    <!-- 主内容区：航线列表 + 侧边信息 -->
    <el-row :gutter="20" class="main-content" style="margin-top: 24px;">
      <!-- 左侧：航线列表 -->
      <el-col :span="16">
        <el-card shadow="never" class="route-list-card">
          <template #header>
            <div class="card-header">
              <span>主要航线列表</span>
              <div class="header-actions">
                <el-input v-model="searchForm.keyword" placeholder="搜索航线名称" style="width: 200px" clearable
                  size="small" />
                <el-select v-model="searchForm.riskLevel" placeholder="风险等级" clearable size="small"
                  style="width: 120px">
                  <el-option label="低风险" value="LOW" />
                  <el-option label="中风险" value="MEDIUM" />
                  <el-option label="高风险" value="HIGH" />
                </el-select>
              </div>
            </div>
          </template>

          <el-table :data="paginatedRouteList" v-loading="loading" stripe>
            <el-table-column type="index" width="50" />
            <el-table-column prop="name" label="航线名称" min-width="140" show-overflow-tooltip />
            <el-table-column prop="startPoint" label="起点" width="120" show-overflow-tooltip />
            <el-table-column prop="endPoint" label="终点" width="120" show-overflow-tooltip />
            <el-table-column prop="distance" label="距离" width="80">
              <template #default="{ row }">{{ row.distance }}km</template>
            </el-table-column>
            <el-table-column prop="duration" label="时长" width="80">
              <template #default="{ row }">{{ row.duration }}分钟</template>
            </el-table-column>
            <el-table-column prop="riskLevel" label="风险" width="80">
              <template #default="{ row }">
                <el-tag :type="riskType(row.riskLevel)" size="small">{{ riskText(row.riskLevel) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-switch v-model="row.status" :active-value="1" :inactive-value="0" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="handlePreview(row)">预览</el-button>
                <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
                <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination">
            <el-pagination v-model:current-page="pageInfo.page" v-model:page-size="pageInfo.size"
              :total="pageInfo.total" layout="total, prev, pager, next" small />
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：空域管理 -->
      <el-col :span="8">
        <el-card shadow="never" class="zone-card">
          <template #header>
            <div class="card-header">
              <span>空域限制区</span>
              <el-button link type="primary" size="small" @click="showZoneDialog">管理</el-button>
            </div>
          </template>

          <el-table :data="zoneList" size="small" :show-header="false">
            <el-table-column width="40">
              <template #default="{ row }">
                <el-icon :size="18" :color="row.type === 'FORBIDDEN' ? '#f56c6c' : '#e6a23c'">
                  <WarningFilled v-if="row.type === 'FORBIDDEN'" />
                  <Warning v-else />
                </el-icon>
              </template>
            </el-table-column>
            <el-table-column prop="name" show-overflow-tooltip />
            <el-table-column prop="type" width="80">
              <template #default="{ row }">
                <el-tag :type="row.type === 'FORBIDDEN' ? 'danger' : 'warning'" size="small">
                  {{ row.type === 'FORBIDDEN' ? '禁飞' : '限飞' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column width="60">
              <template #default="{ row }">
                <el-button link type="danger" size="small" @click="deleteZone(row)">
                  <el-icon>
                    <Delete />
                  </el-icon>
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 新增/编辑航线弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogType === 'add' ? '新增航线' : '编辑航线'" width="650px">
      <el-form :model="form" label-width="100px" :rules="formRules" ref="formRef">
        <el-form-item label="航线名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入航线名称" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="起点" prop="startPoint">
              <el-autocomplete
                v-model="form.startPoint"
                :fetch-suggestions="querySearchLandmark"
                placeholder="请选择起点地标"
                clearable
                style="width: 100%"
              >
                <template #append>
                  <el-button @click="selectLocation('start')">
                    <el-icon>
                      <MapLocation />
                    </el-icon>
                  </el-button>
                </template>
              </el-autocomplete>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="终点" prop="endPoint">
              <el-autocomplete
                v-model="form.endPoint"
                :fetch-suggestions="querySearchLandmark"
                placeholder="请选择终点地标"
                clearable
                style="width: 100%"
              >
                <template #append>
                  <el-button @click="selectLocation('end')">
                    <el-icon>
                      <MapLocation />
                    </el-icon>
                  </el-button>
                </template>
              </el-autocomplete>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="距离">
              <el-input-number v-model="form.distance" :min="0.1" :precision="2" step="0.5" style="width: 100%" disabled />
              <span class="unit">km</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预计时长">
              <el-input-number v-model="form.duration" :min="1" style="width: 100%" disabled />
              <span class="unit">分钟</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="风险等级" prop="riskLevel">
          <el-radio-group v-model="form.riskLevel">
            <el-radio-button label="LOW">
              <el-icon>
                <SuccessFilled />
              </el-icon>
              低风险
            </el-radio-button>
            <el-radio-button label="MEDIUM">
              <el-icon>
                <Warning />
              </el-icon>
              中风险
            </el-radio-button>
            <el-radio-button label="HIGH">
              <el-icon>
                <WarningFilled />
              </el-icon>
              高风险
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="航线描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="请输入航线描述或备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 空域管理弹窗 -->
    <el-dialog v-model="zoneDialogVisible" title="空域管理" width="600px">
      <el-form :model="zoneForm" label-width="100px">
        <el-form-item label="区域名称">
          <el-input v-model="zoneForm.name" placeholder="如：机场禁飞区" />
        </el-form-item>
        <el-form-item label="区域类型">
          <el-radio-group v-model="zoneForm.type">
            <el-radio-button label="FORBIDDEN">禁飞区</el-radio-button>
            <el-radio-button label="LIMITED">限飞区</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="中心位置">
          <el-autocomplete
            v-model="zoneForm.locationName"
            :fetch-suggestions="querySearchLandmark"
            placeholder="选择地标自动填充经纬度"
            clearable
            style="width: 100%"
          />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="中心经度">
              <el-input-number v-model="zoneForm.longitude" :precision="6" style="width: 100%" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="中心纬度">
              <el-input-number v-model="zoneForm.latitude" :precision="6" style="width: 100%" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="区域半径">
          <el-input-number v-model="zoneForm.radius" :min="100" :max="10000" step="100" style="width: 100%" />
          <span class="unit">米</span>
        </el-form-item>
        <el-form-item label="限制高度" v-if="zoneForm.type === 'LIMITED'">
          <el-input-number v-model="zoneForm.maxHeight" :min="10" :max="500" style="width: 100%" />
          <span class="unit">米</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="zoneDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddZone">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useDashboardStore } from '@/store/dashboard'
import Map2D from '@/components/Map2D/index-v2.vue'
import {
  Plus, CirclePlus, Delete, WarningFilled, Warning,
  SuccessFilled, Rank, InfoFilled, MapLocation, CircleClose
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const dashboardStore = useDashboardStore()

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const zoneDialogVisible = ref(false)
const dialogType = ref('add')
const formRef = ref(null)
const isMapFullscreen = ref(false)

// 杭州市区航线数据（27条真实地区航线）
const routeList = ref([
  { id: 1, name: '断桥-雷峰塔环线', startPoint: '断桥', endPoint: '雷峰塔', distance: 4.2, duration: 15, riskLevel: 'MEDIUM', status: 1 },
  { id: 2, name: '苏堤-西湖航线', startPoint: '苏堤', endPoint: '西湖', distance: 2.5, duration: 9, riskLevel: 'LOW', status: 1 },
  { id: 3, name: '白堤-曲院风荷航线', startPoint: '白堤', endPoint: '曲院风荷', distance: 3.5, duration: 12, riskLevel: 'LOW', status: 1 },
  { id: 4, name: '湖滨商圈配送线', startPoint: '杭州大厦', endPoint: '湖滨银泰', distance: 2.2, duration: 8, riskLevel: 'LOW', status: 1 },
  { id: 5, name: '滨江-钱江新城专线', startPoint: '滨江商圈', endPoint: '钱江新城', distance: 8.5, duration: 25, riskLevel: 'MEDIUM', status: 1 },
  { id: 6, name: '西站-未来科技城线', startPoint: '杭州西站', endPoint: '未来科技城', distance: 5.8, duration: 18, riskLevel: 'LOW', status: 1 },
  { id: 7, name: '东站-机场快线', startPoint: '杭州东站', endPoint: '萧山机场', distance: 12.0, duration: 35, riskLevel: 'LOW', status: 1 },
  { id: 8, name: '城站-西湖观光线', startPoint: '杭州站', endPoint: '西湖', distance: 5.5, duration: 16, riskLevel: 'LOW', status: 1 },
  { id: 9, name: '武林-钱江商务线', startPoint: '武林商圈', endPoint: '钱江新城', distance: 6.8, duration: 20, riskLevel: 'MEDIUM', status: 1 },
  { id: 10, name: '紫金港-西溪湿地线', startPoint: '浙大紫金港', endPoint: '西溪湿地', distance: 4.5, duration: 13, riskLevel: 'LOW', status: 1 },
  { id: 11, name: '大厦-奥体中心线', startPoint: '杭州大厦', endPoint: '奥体中心', distance: 9.2, duration: 28, riskLevel: 'MEDIUM', status: 1 },
  { id: 12, name: '滨江-机场货运线', startPoint: '滨江商圈', endPoint: '萧山机场', distance: 15.0, duration: 42, riskLevel: 'HIGH', status: 1 },
  { id: 13, name: '科技城-玉泉通勤线', startPoint: '未来科技城', endPoint: '浙大玉泉', distance: 8.0, duration: 24, riskLevel: 'MEDIUM', status: 1 },
  { id: 14, name: '下沙-东站接驳线', startPoint: '下沙商圈', endPoint: '杭州东站', distance: 7.5, duration: 22, riskLevel: 'LOW', status: 1 },
  { id: 15, name: '良渚-西站旅游线', startPoint: '良渚古城', endPoint: '杭州西站', distance: 18.0, duration: 50, riskLevel: 'LOW', status: 1 },
  { id: 16, name: '浙一-浙二医疗线', startPoint: '浙一医院', endPoint: '浙二医院', distance: 3.0, duration: 10, riskLevel: 'LOW', status: 1 },
  { id: 17, name: '黄龙-奥体赛事线', startPoint: '黄龙体育中心', endPoint: '奥体中心', distance: 7.0, duration: 21, riskLevel: 'MEDIUM', status: 1 },
  { id: 18, name: '政府-钱江政务线', startPoint: '杭州市政府', endPoint: '钱江新城', distance: 4.0, duration: 12, riskLevel: 'LOW', status: 1 },
  { id: 19, name: '万象城-大厦购物线', startPoint: '万象城', endPoint: '杭州大厦', distance: 5.0, duration: 15, riskLevel: 'LOW', status: 1 },
  { id: 20, name: '湘湖-机场旅游线', startPoint: '湘湖', endPoint: '萧山机场', distance: 22.0, duration: 60, riskLevel: 'MEDIUM', status: 1 },
  { id: 21, name: '西站-西溪生态线', startPoint: '杭州西站', endPoint: '西溪湿地', distance: 6.5, duration: 19, riskLevel: 'LOW', status: 1 },
  { id: 22, name: '花港观鱼-断桥环湖线', startPoint: '花港观鱼', endPoint: '断桥', distance: 3.8, duration: 11, riskLevel: 'LOW', status: 1 },
  { id: 23, name: '奥体-滨江观光线', startPoint: '奥体中心', endPoint: '滨江商圈', distance: 5.5, duration: 17, riskLevel: 'LOW', status: 1 },
  { id: 24, name: '东站-武林通勤线', startPoint: '杭州东站', endPoint: '武林商圈', distance: 4.8, duration: 14, riskLevel: 'MEDIUM', status: 1 },
  { id: 25, name: '科技城-大厦商务线', startPoint: '未来科技城', endPoint: '杭州大厦', distance: 11.0, duration: 32, riskLevel: 'MEDIUM', status: 1 },
  { id: 26, name: '玉泉-湖滨文化线', startPoint: '浙大玉泉', endPoint: '湖滨银泰', distance: 4.2, duration: 13, riskLevel: 'LOW', status: 1 },
  { id: 27, name: '良渚-武林历史线', startPoint: '良渚古城', endPoint: '武林商圈', distance: 16.5, duration: 48, riskLevel: 'LOW', status: 1 }
])

// 空域限制区（统一数据源，包含坐标与半径，单位：米）
const zoneList = ref([
  { id: 1, name: '萧山机场禁飞区', type: 'FORBIDDEN', longitude: 120.4323, latitude: 30.2295, radius: 3840 },
  { id: 2, name: '市政府禁飞区', type: 'FORBIDDEN', longitude: 120.2120, latitude: 30.2500, radius: 1600 },
  { id: 3, name: '西湖核心禁飞区', type: 'FORBIDDEN', longitude: 120.1420, latitude: 30.2425, radius: 2880 },
  { id: 4, name: '杭州站限飞区', type: 'LIMITED', longitude: 120.1804, latitude: 30.2471, radius: 1280 },
  { id: 5, name: '杭州东站限飞区', type: 'LIMITED', longitude: 120.2116, latitude: 30.2936, radius: 1600 },
  { id: 6, name: '杭州西站限飞区', type: 'LIMITED', longitude: 119.9685, latitude: 30.2916, radius: 1280 },
  { id: 7, name: '奥体中心限飞区', type: 'LIMITED', longitude: 120.2350, latitude: 30.2300, radius: 1408 },
  { id: 8, name: '皋亭山限飞区', type: 'LIMITED', longitude: 120.2020, latitude: 30.4050, radius: 1500 }
])

// 统计数据 - 杭州市区（根据实际数据动态计算）
const routeStats = computed(() => [
  { icon: 'Rank', value: routeList.value.length.toString(), label: '主要航线总数', color: '#409EFF' },
  { icon: 'SuccessFilled', value: routeList.value.filter(r => r.status === 1).length.toString(), label: '正常启用', color: '#67C23A' },
  { icon: 'Warning', value: routeList.value.filter(r => r.riskLevel === 'MEDIUM').length.toString(), label: '中风险航线', color: '#E6A23C' },
  { icon: 'WarningFilled', value: zoneList.value.length.toString(), label: '空域限制区', color: '#F56C6C' }
])

const searchForm = reactive({
  keyword: '',
  riskLevel: ''
})

const pageInfo = reactive({
  page: 1,
  size: 6,
  total: 27
})

// 搜索筛选后的航线列表
const filteredRouteList = computed(() => {
  let result = [...routeList.value]
  
  // 按关键词搜索（航线名称、起点、终点）
  if (searchForm.keyword) {
    const keyword = searchForm.keyword.toLowerCase()
    result = result.filter(route => 
      (route.name && route.name.toLowerCase().includes(keyword)) ||
      (route.startPoint && route.startPoint.includes(searchForm.keyword)) ||
      (route.endPoint && route.endPoint.includes(searchForm.keyword))
    )
  }
  
  // 按风险等级筛选
  if (searchForm.riskLevel) {
    result = result.filter(route => route.riskLevel === searchForm.riskLevel)
  }
  
  return result
})

// 分页后的航线列表
const paginatedRouteList = computed(() => {
  const start = (pageInfo.page - 1) * pageInfo.size
  const end = start + pageInfo.size
  return filteredRouteList.value.slice(start, end)
})

// 监听筛选结果变化，更新分页总数并回到第一页
watch(filteredRouteList, (newVal) => {
  pageInfo.total = newVal.length
  pageInfo.page = 1
}, { immediate: true })

const form = reactive({
  id: '',
  name: '',
  startPoint: '',
  endPoint: '',
  distance: 0,
  duration: 0,
  riskLevel: 'LOW',
  description: '',
  waypoints: []
})

const zoneForm = reactive({
  name: '',
  type: 'FORBIDDEN',
  locationName: '',
  longitude: 120.1551,
  latitude: 30.2741,
  radius: 1000,
  maxHeight: 120
})

// 监听空域中心位置选择，自动填充经纬度
watch(() => zoneForm.locationName, (name) => {
  if (!name) return
  const lm = hangzhouLandmarks.find(l => l.name === name)
  if (lm) {
    zoneForm.longitude = lm.lng
    zoneForm.latitude = lm.lat
  }
})

const formRules = {
  name: [{ required: true, message: '请输入航线名称', trigger: 'blur' }],
  startPoint: [{ required: true, message: '请输入起点', trigger: 'blur' }],
  endPoint: [{ required: true, message: '请输入终点', trigger: 'blur' }],
  riskLevel: [{ required: true, message: '请选择风险等级', trigger: 'change' }]
}

// 杭州主要地标 - GCJ-02 真实地理坐标 (转换为Canvas坐标)
// 坐标系转换: GCJ-02 -> Canvas
const gcj02ToCanvas = (lng, lat) => {
  const bounds = { minLng: 119.90, maxLng: 120.50, minLat: 30.10, maxLat: 30.45 }
  const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 900
  const y = 900 - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 900
  return { lng, lat, x: Math.round(x), y: Math.round(y) }
}

const hangzhouLandmarks = [
  // 交通枢纽
  { id: 1, name: '萧山机场', ...gcj02ToCanvas(120.4323, 30.2295), type: 'airport' },
  { id: 2, name: '杭州站', ...gcj02ToCanvas(120.1804, 30.2471), type: 'transport' },
  { id: 3, name: '杭州东站', ...gcj02ToCanvas(120.2116, 30.2936), type: 'transport' },
  { id: 4, name: '杭州西站', ...gcj02ToCanvas(119.9685, 30.2916), type: 'transport' },

  // 西湖景区
  { id: 5, name: '断桥', ...gcj02ToCanvas(120.1498, 30.2596), type: 'scenic' },
  { id: 6, name: '雷峰塔', ...gcj02ToCanvas(120.1488, 30.2311), type: 'scenic' },
  { id: 7, name: '西湖', ...gcj02ToCanvas(120.1420, 30.2425), type: 'scenic' },
  { id: 8, name: '苏堤', ...gcj02ToCanvas(120.1367, 30.2359), type: 'scenic' },
  { id: 9, name: '白堤', ...gcj02ToCanvas(120.1459, 30.2586), type: 'scenic' },
  { id: 10, name: '曲院风荷', ...gcj02ToCanvas(120.1240, 30.2628), type: 'scenic' },
  { id: 11, name: '花港观鱼', ...gcj02ToCanvas(120.1358, 30.2278), type: 'scenic' },

  // 商圈
  { id: 12, name: '湖滨银泰', ...gcj02ToCanvas(120.1625, 30.2545), type: 'business' },
  { id: 13, name: '杭州大厦', ...gcj02ToCanvas(120.1635, 30.2756), type: 'business' },
  { id: 14, name: '武林商圈', ...gcj02ToCanvas(120.1660, 30.2730), type: 'business' },
  { id: 15, name: '钱江新城', ...gcj02ToCanvas(120.2110, 30.2560), type: 'business' },
  { id: 16, name: '滨江商圈', ...gcj02ToCanvas(120.2120, 30.2080), type: 'business' },
  { id: 17, name: '下沙商圈', ...gcj02ToCanvas(120.3200, 30.3030), type: 'business' },
  { id: 18, name: '未来科技城', ...gcj02ToCanvas(119.9950, 30.2810), type: 'business' },
  { id: 19, name: '万象城', ...gcj02ToCanvas(120.2090, 30.2570), type: 'business' },

  // 医院
  { id: 20, name: '浙一医院', ...gcj02ToCanvas(120.1750, 30.2550), type: 'hospital' },
  { id: 21, name: '浙二医院', ...gcj02ToCanvas(120.1800, 30.2500), type: 'hospital' },

  // 高校
  { id: 19, name: '浙大紫金港', ...gcj02ToCanvas(120.0850, 30.3010), type: 'school' },
  { id: 20, name: '浙大玉泉', ...gcj02ToCanvas(120.1250, 30.2650), type: 'school' },

  // 政府
  { id: 21, name: '杭州市政府', ...gcj02ToCanvas(120.2120, 30.2500), type: 'gov' },

  // 公园
  { id: 22, name: '西溪湿地', ...gcj02ToCanvas(120.0650, 30.2650), type: 'park' },
  { id: 23, name: '湘湖', ...gcj02ToCanvas(120.2350, 30.1350), type: 'park' },
  { id: 24, name: '良渚古城', ...gcj02ToCanvas(119.9850, 30.4200), type: 'park' },

  // 其他
  { id: 25, name: '奥体中心', ...gcj02ToCanvas(120.2350, 30.2300), type: 'sports' },
  { id: 26, name: '黄龙体育中心', ...gcj02ToCanvas(120.1350, 30.2700), type: 'sports' },
]

// 计算两点间距离（Haversine 公式，单位 km）
const calcDistance = (lng1, lat1, lng2, lat2) => {
  const R = 6371
  const toRad = (v) => v * Math.PI / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// 地标自动补全
const querySearchLandmark = (queryString, cb) => {
  const results = queryString
    ? hangzhouLandmarks.filter(lm => lm.name.includes(queryString)).map(lm => ({ value: lm.name }))
    : hangzhouLandmarks.map(lm => ({ value: lm.name }))
  cb(results)
}

// 监听起点/终点变化，自动计算距离和时长
watch(() => [form.startPoint, form.endPoint], ([startName, endName]) => {
  if (!startName || !endName) return
  const start = hangzhouLandmarks.find(l => l.name === startName)
  const end = hangzhouLandmarks.find(l => l.name === endName)
  if (start && end && start.name !== end.name) {
    const d = calcDistance(start.lng, start.lat, end.lng, end.lat)
    form.distance = Number(d.toFixed(2))
    // 平均巡航速度 35 km/h
    form.duration = Math.max(1, Math.round(form.distance / 35 * 60))
    form.waypoints = [
      { name: start.name, lng: start.lng, lat: start.lat },
      { name: end.name, lng: end.lng, lat: end.lat }
    ]
  }
})

// 地图显示的航线数据（直接使用地标坐标）
const mapRoutes = computed(() => {
  return routeList.value.map(route => {
    const start = hangzhouLandmarks.find(l => route.startPoint === l.name)
    const end = hangzhouLandmarks.find(l => route.endPoint === l.name)

    if (start && end) {
      // 添加一个弯曲的中间点（Canvas 像素坐标）
      const midX = (start.x + end.x) / 2 + 30
      const midY = (start.y + end.y) / 2 - 20
      // 添加一个弯曲的中间点（真实经纬度）
      const midLng = (start.lng + end.lng) / 2 + 0.02
      const midLat = (start.lat + end.lat) / 2 + 0.01

      return {
        ...route,
        points: [[start.x, start.y], [midX, midY], [end.x, end.y]],
        path: [[start.lng, start.lat], [midLng, midLat], [end.lng, end.lat]],
        color: route.riskLevel === 'LOW' ? '#67C23A' : route.riskLevel === 'MEDIUM' ? '#E6A23C' : '#F56C6C'
      }
    }
    return null
  }).filter(Boolean)
})

// 地图显示的空域数据（从统一数据源计算）
const mapZones = computed(() => {
  return zoneList.value.map(zone => {
    const pos = gcj02ToCanvas(zone.longitude, zone.latitude)
    return {
      name: zone.name,
      type: zone.type === 'FORBIDDEN' ? 'forbidden' : 'limited',
      center: [pos.x, pos.y],
      lngLat: [zone.longitude, zone.latitude],
      radius: zone.radius,
      radiusMeters: zone.radius
    }
  })
})

// 地图显示的配送点（直接使用坐标）
const mapDeliveryPoints = computed(() => {
  return hangzhouLandmarks.map(lm => ({
    name: lm.name,
    x: lm.x,
    y: lm.y,
    lng: lm.lng,
    lat: lm.lat,
    type: lm.type
  }))
})

// 地图显示的站点（从 store 获取）
const mapStations = computed(() => dashboardStore.stations || [])

// ===== 订单追踪相关 =====
const trackRoute = ref(null)
const trackDrone = ref(null)
const focusStation = ref(null)
let trackTimer = null
let trackedOrderId = null

const isTracking = computed(() => !!trackRoute.value)
const trackingOrderNo = computed(() => {
  const order = dashboardStore.orderList.find(o => o.id === trackedOrderId)
  return order?.orderNo || '--'
})
const trackingDroneNo = computed(() => trackDrone.value?.droneNo || '--')
const trackingProgress = computed(() => trackDrone.value?.progress || 0)
const trackingStartName = computed(() => {
  if (!trackRoute.value?.path) return '--'
  // 找起点对应的地标名
  const start = trackRoute.value.path[0]
  const lm = hangzhouLandmarks.find(l => Math.abs(l.lng - start[0]) < 0.01 && Math.abs(l.lat - start[1]) < 0.01)
  return lm?.name || '起点'
})
const trackingEndName = computed(() => {
  if (!trackRoute.value?.path) return '--'
  const end = trackRoute.value.path[trackRoute.value.path.length - 1]
  const lm = hangzhouLandmarks.find(l => Math.abs(l.lng - end[0]) < 0.01 && Math.abs(l.lat - end[1]) < 0.01)
  return lm?.name || '终点'
})

const stopTracking = () => {
  if (trackTimer) {
    clearInterval(trackTimer)
    trackTimer = null
  }
  trackRoute.value = null
  trackDrone.value = null
  trackedOrderId = null
}

const findLandmarkByAddress = (address) => {
  if (!address) return null
  // 优先直接匹配
  let lm = hangzhouLandmarks.find(l => address.includes(l.name))
  if (lm) return lm

  // 关键字映射兜底
  const keywordMap = {
    '科技园A座': '未来科技城',
    '科技园B座': '未来科技城',
    '市立医院': '浙一医院',
    '浙一医院': '浙一医院',
    '浙二医院': '浙二医院',
    '武林广场': '武林商圈',
    '杭州站': '杭州站',
    '杭州东站': '杭州东站',
    '杭州西站': '杭州西站',
    '湖滨银泰': '湖滨银泰',
    '杭州大厦': '杭州大厦',
    '钱江新城': '钱江新城',
    '滨江高新园区': '滨江商圈',
    '滨江商圈': '滨江商圈',
    '萧山机场': '萧山机场',
    '锦绣花园': '西湖',
    '阳光小区': '西湖',
    '物流园区': '西溪湿地',
    '第一中学': '杭州市政府',
    '中国银行': '武林商圈',
    '购物中心': '湖滨银泰',
    '总部基地': '未来科技城',
    '机场T3': '萧山机场',
    '市民中心': '钱江新城',
    '西湖区': '西湖',
    '上城区': '杭州站',
    '滨江区': '滨江商圈',
    '拱墅区': '武林商圈',
    '钱塘区': '下沙商圈',
    '浙大紫金港': '浙大紫金港',
    '浙大玉泉': '浙大玉泉',
    '西湖景区入口': '西湖',
    '西溪湿地': '西溪湿地',
    '良渚古城': '良渚古城',
    '京杭大运河': '西湖',
    '黄龙体育中心': '黄龙体育中心',
    '奥体中心': '奥体中心',
    '万象城': '万象城',
    '邵逸夫医院': '浙一医院',
    '城站火车站': '杭州站',
    '下沙商圈': '下沙商圈'
  }
  for (const [keyword, landmarkName] of Object.entries(keywordMap)) {
    if (address.includes(keyword)) {
      lm = hangzhouLandmarks.find(l => l.name === landmarkName)
      if (lm) return lm
    }
  }
  return null
}

const getPointOnPath = (path, progress) => {
  if (!path || path.length < 2) return path?.[0]
  const segments = []
  let totalLength = 0
  for (let i = 0; i < path.length - 1; i++) {
    const dx = path[i + 1][0] - path[i][0]
    const dy = path[i + 1][1] - path[i][1]
    const len = Math.sqrt(dx * dx + dy * dy)
    segments.push(len)
    totalLength += len
  }
  if (totalLength === 0) return path[0]
  const targetLength = (progress / 100) * totalLength
  let currentLength = 0
  for (let i = 0; i < segments.length; i++) {
    if (currentLength + segments[i] >= targetLength) {
      const ratio = (targetLength - currentLength) / segments[i]
      return [
        path[i][0] + (path[i + 1][0] - path[i][0]) * ratio,
        path[i][1] + (path[i + 1][1] - path[i][1]) * ratio
      ]
    }
    currentLength += segments[i]
  }
  return path[path.length - 1]
}

const updateTrackDrone = (order) => {
  if (!trackRoute.value) return
  const position = getPointOnPath(trackRoute.value.path, order.progress || 0)
  trackDrone.value = {
    orderId: order.id,
    position,
    progress: order.progress || 0,
    droneNo: order.droneNo
  }
}

const setupTracking = (orderId) => {
  trackedOrderId = orderId
  const order = dashboardStore.orderList.find(o => o.id === orderId)
  if (!order) {
    ElMessage.warning('未找到订单信息')
    return
  }

  const startLm = findLandmarkByAddress(order.senderAddress)
  const endLm = findLandmarkByAddress(order.receiverAddress)

  if (!startLm || !endLm) {
    ElMessage.warning('无法在地图上定位该订单的配送地址，将显示模拟航线')
    // 使用默认地标兜底
    const defaultStart = hangzhouLandmarks[0]
    const defaultEnd = hangzhouLandmarks[1]
    trackRoute.value = {
      id: `track-${orderId}`,
      name: `订单追踪：${order.orderNo}`,
      path: [[defaultStart.lng, defaultStart.lat], [120.2, 30.25], [defaultEnd.lng, defaultEnd.lat]],
      color: '#409EFF'
    }
    updateTrackDrone(order)
    trackTimer = setInterval(() => {
      const liveOrder = dashboardStore.orderList.find(o => o.id === orderId)
      if (liveOrder) updateTrackDrone(liveOrder)
    }, 1000)
    return
  }

  const midLng = (startLm.lng + endLm.lng) / 2 + 0.015
  const midLat = (startLm.lat + endLm.lat) / 2 + 0.008

  trackRoute.value = {
    id: `track-${orderId}`,
    name: `订单追踪：${order.orderNo}`,
    path: [[startLm.lng, startLm.lat], [midLng, midLat], [endLm.lng, endLm.lat]],
    color: '#409EFF'
  }

  updateTrackDrone(order)

  trackTimer = setInterval(() => {
    const liveOrder = dashboardStore.orderList.find(o => o.id === orderId)
    if (liveOrder) {
      updateTrackDrone(liveOrder)
    }
  }, 1000)
}

// 监听 URL 参数，支持从订单管理跳转过来的追踪和站点定位
watch(() => route.query, (query) => {
  if (query.trackOrderId) {
    setupTracking(Number(query.trackOrderId))
    router.replace({ path: route.path, query: {} })
  } else if (query.focusStationId) {
    const station = mapStations.value.find(s => s.id === query.focusStationId)
    if (station) {
      focusStation.value = station
      ElMessage.success(`正在定位站点：${station.name}`)
    }
    router.replace({ path: route.path, query: {} })
  }
}, { immediate: true })

onUnmounted(() => {
  if (trackTimer) {
    clearInterval(trackTimer)
    trackTimer = null
  }
})

// 地图点击事件
const handlePointClick = (point) => {
  ElMessage.info(`选中配送点：${point.name}`)
}

const handleRouteClick = (route) => {
  ElMessage.info(`选中航线：${route.name}`)
}

const riskType = (level) => {
  const types = { LOW: 'success', MEDIUM: 'warning', HIGH: 'danger' }
  return types[level] || 'info'
}

const riskText = (level) => {
  const texts = { LOW: '低', MEDIUM: '中', HIGH: '高' }
  return texts[level] || level
}

const showAddDialog = () => {
  dialogType.value = 'add'
  Object.assign(form, {
    id: '',
    name: '',
    startPoint: '',
    endPoint: '',
    distance: 0,
    duration: 0,
    riskLevel: 'LOW',
    description: '',
    waypoints: []
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogType.value = 'edit'
  Object.assign(form, row)
  dialogVisible.value = true
}

const focusRoute = ref(null)

const handlePreview = (row) => {
  const matched = mapRoutes.value.find(r => r.id === row.id)
  if (matched && matched.path) {
    focusRoute.value = { path: matched.path, name: matched.name }
    ElMessage.success(`正在预览航线：${row.name}`)
  } else {
    ElMessage.warning('未找到该航线的地图数据')
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  const start = hangzhouLandmarks.find(l => l.name === form.startPoint)
  const end = hangzhouLandmarks.find(l => l.name === form.endPoint)
  if (!start || !end) {
    ElMessage.warning('请选择有效的起点和终点地标')
    return
  }
  if (start.name === end.name) {
    ElMessage.warning('起点和终点不能相同')
    return
  }

  submitting.value = true
  setTimeout(() => {
    if (dialogType.value === 'add') {
      const newId = routeList.value.length > 0 ? Math.max(...routeList.value.map(r => r.id)) + 1 : 1
      routeList.value.push({
        id: newId,
        name: form.name,
        startPoint: form.startPoint,
        endPoint: form.endPoint,
        distance: Number(form.distance),
        duration: Math.round(Number(form.duration)),
        riskLevel: form.riskLevel,
        description: form.description,
        status: 1
      })
    } else {
      const idx = routeList.value.findIndex(r => r.id === form.id)
      if (idx !== -1) {
        routeList.value[idx] = {
          ...routeList.value[idx],
          name: form.name,
          startPoint: form.startPoint,
          endPoint: form.endPoint,
          distance: Number(form.distance),
          duration: Math.round(Number(form.duration)),
          riskLevel: form.riskLevel,
          description: form.description
        }
      }
    }
    ElMessage.success(dialogType.value === 'add' ? '新增成功' : '修改成功')
    dialogVisible.value = false
    submitting.value = false
  }, 600)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除航线 ${row.name} 吗？`, '提示', {
    type: 'warning'
  }).then(() => {
    routeList.value = routeList.value.filter(r => r.id !== row.id)
    ElMessage.success('删除成功')
  })
}

const showZoneDialog = () => {
  Object.assign(zoneForm, {
    name: '',
    type: 'FORBIDDEN',
    locationName: '',
    longitude: 120.1551,
    latitude: 30.2741,
    radius: 1000,
    maxHeight: 120
  })
  zoneDialogVisible.value = true
}

const confirmAddZone = () => {
  if (!zoneForm.name || zoneForm.longitude == null || zoneForm.latitude == null || !zoneForm.radius) {
    ElMessage.warning('请完整填写空域信息')
    return
  }
  const newId = zoneList.value.length > 0 ? Math.max(...zoneList.value.map(z => z.id)) + 1 : 1
  zoneList.value.push({
    id: newId,
    name: zoneForm.name,
    type: zoneForm.type,
    longitude: Number(zoneForm.longitude),
    latitude: Number(zoneForm.latitude),
    radius: Math.round(Number(zoneForm.radius)),
    maxHeight: zoneForm.type === 'LIMITED' ? Math.round(Number(zoneForm.maxHeight || 120)) : undefined
  })
  ElMessage.success('空域限制区添加成功')
  zoneDialogVisible.value = false
  Object.assign(zoneForm, {
    name: '',
    type: 'FORBIDDEN',
    locationName: '',
    longitude: 120.1551,
    latitude: 30.2741,
    radius: 1000,
    maxHeight: 120
  })
}

const deleteZone = (row) => {
  ElMessageBox.confirm(`确定删除 ${row.name} 吗？`, '提示', {
    type: 'warning'
  }).then(() => {
    zoneList.value = zoneList.value.filter(z => z.id !== row.id)
    ElMessage.success('删除成功')
  })
}

const selectLocation = (type) => {
  ElMessage.info(`请在输入框中选择${type === 'start' ? '起点' : '终点'}地标，系统将自动定位并计算距离`)
}
</script>

<style scoped lang="scss">
.route-manage {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
  }

  .tracking-banner-row {
    margin-bottom: 20px;

    .tracking-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, #409EFF 0%, #67C23A 100%);
      border-radius: 12px;
      padding: 16px 24px;
      color: #fff;
      box-shadow: 0 4px 16px rgba(64, 158, 255, 0.35);
      animation: slideDown 0.4s ease-out;

      .tracking-left {
        display: flex;
        align-items: center;
        gap: 16px;

        .tracking-icon {
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tracking-info {
          .tracking-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 4px;

            .order-no {
              background: rgba(255, 255, 255, 0.25);
              padding: 2px 10px;
              border-radius: 6px;
              margin-left: 8px;
              font-size: 15px;
            }
          }

          .tracking-detail {
            font-size: 13px;
            opacity: 0.95;

            .highlight {
              font-weight: 600;
              color: #fffde7;
            }
          }
        }
      }

      .tracking-right {
        .el-button {
          background: #fff;
          border-color: #fff;
          color: #F56C6C;

          &:hover {
            background: #fef0f0;
            border-color: #fff;
            color: #F56C6C;
          }
        }
      }
    }
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .page-header {
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
    width: 52px;
    height: 52px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stat-value {
    font-size: 26px;
    font-weight: bold;
    color: #1a1a2e;
  }

  .stat-label {
    font-size: 13px;
    color: #909399;
    margin-top: 4px;
  }
}

// 大地图容器
.map-card-container {
  margin-bottom: 24px;

  :deep(.el-card__body) {
    padding: 0;
  }
}

.main-content {
  margin-top: 24px;

  .route-list-card,
  .zone-card {
    height: 100%;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .header-actions {
    display: flex;
    gap: 10px;
    align-items: center;
  }
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.unit {
  margin-left: 8px;
  color: #909399;
}
</style>
