<template>
  <div class="dashboard" v-loading="pageLoading" element-loading-text="数据加载中..." element-loading-background="rgba(255, 255, 255, 0.8)">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-title">
        <h1>首页概览</h1>
        <p class="subtitle">实时监控无人机配送系统运行状态</p>
      </div>
      <div class="header-actions">
        <el-radio-group v-model="timeRange" size="small" @change="handleTimeRangeChange">
          <el-radio-button label="today">今日</el-radio-button>
          <el-radio-button label="week">本周</el-radio-button>
          <el-radio-button label="month">本月</el-radio-button>
          <el-radio-button label="year">全年</el-radio-button>
        </el-radio-group>
        <el-button 
          type="primary" 
          :icon="Refresh" 
          @click="refreshData" 
          :loading="loading"
          class="refresh-btn"
          :class="{ 'rotating': isRotating }"
        >
          刷新
        </el-button>
      </div>
    </div>

    <!-- 统计卡片区域 -->
    <div class="stats-cards">
      <div 
        v-for="(card, index) in statsCards" 
        :key="index" 
        class="stat-card"
        :style="{ '--card-color': card.color }"
        @click="navigateTo(card.route)"
      >
        <div class="card-icon">
          <el-icon :size="32" :color="card.color">
            <component :is="card.icon" />
          </el-icon>
        </div>
        <div class="card-content">
          <div class="card-value">{{ card.value }}</div>
          <div class="card-label">{{ card.label }}</div>
          <div v-if="card.trend" class="card-trend" :class="card.trend >= 0 ? 'up' : 'down'">
            <el-icon><ArrowUp v-if="card.trend >= 0" /><ArrowDown v-else /></el-icon>
            {{ Math.abs(card.trend) }}%
          </div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <!-- 订单趋势图 -->
      <div class="chart-card">
        <div class="chart-header">
          <h3>订单趋势</h3>
          <el-radio-group v-model="trendType" size="small">
            <el-radio-button label="orders">订单量</el-radio-button>
            <el-radio-button label="revenue">收入</el-radio-button>
          </el-radio-group>
        </div>
        <div ref="trendChart" class="chart-container"></div>
      </div>

      <!-- 无人机状态分布 -->
      <div class="chart-card">
        <div class="chart-header">
          <h3>无人机状态分布</h3>
          <el-button text type="primary" @click="$router.push('/admin/drones')">
            查看详情
          </el-button>
        </div>
        <div ref="droneChart" class="chart-container"></div>
        <div class="drone-stats">
          <div class="drone-stat-item">
            <span class="dot delivering"></span>
            <span>配送中: {{ droneStatusStats.delivering }}</span>
          </div>
          <div class="drone-stat-item">
            <span class="dot idle"></span>
            <span>待命中: {{ droneStatusStats.idle }}</span>
          </div>
          <div class="drone-stat-item">
            <span class="dot charging"></span>
            <span>充电中: {{ droneStatusStats.charging }}</span>
          </div>
          <div class="drone-stat-item">
            <span class="dot maintenance"></span>
            <span>维护中: {{ droneStatusStats.maintenance }}</span>
          </div>
          <div class="drone-stat-item">
            <span class="dot offline"></span>
            <span>离线: {{ droneStatusStats.offline }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 下方内容区域 -->
    <div class="bottom-section">
      <!-- 最近订单 -->
      <div class="panel-card">
        <div class="panel-header">
          <h3>最近订单</h3>
          <el-button text type="primary" @click="$router.push('/admin/orders')">
            查看全部
          </el-button>
        </div>
        <div class="order-list">
          <div 
            v-for="order in recentOrders" 
            :key="order.id" 
            class="order-item"
            @click="viewOrder(order)"
          >
            <div class="order-info">
              <div class="order-no">{{ order.orderNo }}</div>
              <div class="order-route">
                {{ order.senderAddress }} → {{ order.receiverAddress }}
              </div>
            </div>
            <div class="order-status">
              <el-tag :type="getStatusType(order.status)" size="small">
                {{ getStatusText(order.status) }}
              </el-tag>
              <div v-if="order.progress > 0" class="progress-text">{{ order.progress }}%</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 系统公告 -->
      <div class="panel-card">
        <div class="panel-header">
          <h3>系统公告</h3>
          <el-button text type="primary" @click="showAddNotice = true">
            <el-icon><Plus /></el-icon>
            发布公告
          </el-button>
        </div>
        <div class="notice-list">
          <div 
            v-for="notice in notices" 
            :key="notice.id" 
            class="notice-item"
            :class="{ 'important': notice.type === 'warning' }"
          >
            <div class="notice-icon">
              <el-icon :size="20" :color="getNoticeColor(notice.type)">
                <component :is="notice.icon" />
              </el-icon>
            </div>
            <div class="notice-content">
              <div class="notice-title">{{ notice.title }}</div>
              <div class="notice-time">{{ notice.time }}</div>
            </div>
            <el-button 
              v-if="notice.closable" 
              text 
              type="danger" 
              size="small"
              @click="removeNotice(notice.id)"
            >
              删除
            </el-button>
          </div>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="panel-card">
        <div class="panel-header">
          <h3>快捷操作</h3>
        </div>
        <div class="quick-actions">
          <div class="action-item" @click="$router.push('/admin/orders')">
            <div class="action-icon" style="background: #ecf5ff; color: #409eff;">
              <el-icon><Document /></el-icon>
            </div>
            <span>创建订单</span>
          </div>
          <div class="action-item" @click="$router.push('/admin/drones')">
            <div class="action-icon" style="background: #f0f9eb; color: #67c23a;">
              <el-icon><Upload /></el-icon>
            </div>
            <span>无人机调度</span>
          </div>
          <div class="action-item" @click="$router.push('/admin/routes')">
            <div class="action-icon" style="background: #fdf6ec; color: #e6a23c;">
              <el-icon><MapLocation /></el-icon>
            </div>
            <span>航线规划</span>
          </div>
          <div class="action-item" @click="$router.push('/admin/statistics')">
            <div class="action-icon" style="background: #f4f4f5; color: #909399;">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <span>数据报表</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 发布公告对话框 -->
    <el-dialog v-model="showAddNotice" title="发布公告" width="500px">
      <el-form :model="noticeForm" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="noticeForm.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="noticeForm.type">
            <el-radio label="info">通知</el-radio>
            <el-radio label="warning">警告</el-radio>
            <el-radio label="success">成功</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="内容">
          <el-input 
            v-model="noticeForm.content" 
            type="textarea" 
            :rows="4"
            placeholder="请输入公告内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddNotice = false">取消</el-button>
        <el-button type="primary" @click="addNotice">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { useDashboardStore } from '@/store/dashboard'
import {
  Document, TakeawayBox, MapLocation, TrendCharts,
  ArrowUp, ArrowDown, Refresh, Plus,
  Warning, CircleCheck, InfoFilled, Money, Timer
} from '@element-plus/icons-vue'

const router = useRouter()
const dashboardStore = useDashboardStore()

// 状态
const loading = ref(false)
const pageLoading = ref(false)
const isRotating = ref(false)
const timeRange = ref('today')
const trendType = ref('orders')
const trendChart = ref(null)
const droneChart = ref(null)
let trendChartInstance = null
let droneChartInstance = null

// 公告相关
const showAddNotice = ref(false)
const notices = ref([
  {
    id: 1,
    title: '系统维护通知：今晚凌晨2:00-4:00进行系统升级',
    time: '2026-04-12 10:30',
    type: 'warning',
    icon: 'Warning',
    closable: true
  },
  {
    id: 2,
    title: '新功能上线：智能航线规划功能已启用',
    time: '2026-04-12 09:00',
    type: 'success',
    icon: 'CircleCheck',
    closable: true
  },
  {
    id: 3,
    title: '今日配送任务已全部完成',
    time: '2026-04-12 18:00',
    type: 'info',
    icon: 'InfoFilled',
    closable: true
  }
])

const noticeForm = ref({
  title: '',
  content: '',
  type: 'info'
})

// 统计卡片数据
const statsCards = computed(() => {
  const stats = dashboardStore[timeRange.value === 'today' ? 'todayStats' : 
                                timeRange.value === 'week' ? 'weekStats' : 
                                timeRange.value === 'month' ? 'monthStats' : 'yearStats']
  return [
    {
      icon: 'Document',
      value: stats.orders.toString(),
      label: '订单总数',
      color: '#409EFF',
      trend: 12.5,
      route: '/admin/orders'
    },
    {
      icon: 'TakeawayBox',
      value: dashboardStore.deliveringCount.toString(),
      label: '配送中',
      color: '#E6A23C',
      trend: 8.3,
      route: '/admin/orders'
    },
    {
      icon: 'CircleCheck',
      value: stats.completed.toString(),
      label: '已完成',
      color: '#67C23A',
      trend: 15.2,
      route: '/admin/orders'
    },
    {
      icon: 'Money',
      value: '¥' + stats.revenue.toLocaleString(),
      label: '总收入',
      color: '#F56C6C',
      trend: 23.1,
      route: '/admin/statistics'
    },
    {
      icon: 'Timer',
      value: stats.avgTime + '分',
      label: '平均时效',
      color: '#909399',
      trend: -5.2,
      route: '/admin/statistics'
    },
    {
      icon: 'MapLocation',
      value: stats.distance + 'km',
      label: '配送里程',
      color: '#00d4ff',
      trend: 18.7,
      route: '/admin/statistics'
    }
  ]
})

// 无人机状态统计
const droneStatusStats = computed(() => dashboardStore.droneStatusStats)

// 最近订单
const recentOrders = computed(() => {
  return dashboardStore.orderList
    .filter(o => !o.isHistory)
    .slice(0, 5)
})

// 获取订单状态类型
const getStatusType = (status) => {
  const types = {
    'PENDING': 'info',
    'ASSIGNED': 'warning',
    'DELIVERING': 'primary',
    'DELIVERED': 'success',
    'CANCELLED': 'danger'
  }
  return types[status] || 'info'
}

// 获取订单状态文本
const getStatusText = (status) => {
  const texts = {
    'PENDING': '待分配',
    'ASSIGNED': '已分配',
    'DELIVERING': '配送中',
    'DELIVERED': '已完成',
    'CANCELLED': '已取消'
  }
  return texts[status] || status
}

// 获取公告颜色
const getNoticeColor = (type) => {
  const colors = {
    'info': '#409EFF',
    'warning': '#E6A23C',
    'success': '#67C23A',
    'danger': '#F56C6C'
  }
  return colors[type] || '#409EFF'
}

// 初始化趋势图表
const initTrendChart = () => {
  if (!trendChart.value) return
  
  trendChartInstance = echarts.init(trendChart.value)
  updateTrendChart()
}

// 更新趋势图表
const updateTrendChart = () => {
  if (!trendChartInstance) return
  
  let xData, seriesData, completedData, title
  
  switch (timeRange.value) {
    case 'today':
      // 今日按小时统计
      const hourlyData = dashboardStore.hourlyStats
      xData = hourlyData.map(h => h.hour)
      if (trendType.value === 'orders') {
        seriesData = hourlyData.map(h => h.orders)
        completedData = hourlyData.map(h => h.completed)
        title = '今日订单量趋势（按小时）'
      } else {
        seriesData = hourlyData.map(h => h.orders * 35) // 模拟收入
        title = '今日收入趋势（按小时）'
      }
      break
      
    case 'week':
      // 本周按星期统计
      const weeklyData = dashboardStore.weeklyDailyStats
      xData = weeklyData.map(d => d.day)
      if (trendType.value === 'orders') {
        seriesData = weeklyData.map(d => d.orders)
        completedData = weeklyData.map(d => d.completed)
        title = '本周订单量趋势（按星期）'
      } else {
        seriesData = weeklyData.map(d => d.revenue)
        title = '本周收入趋势（按星期）'
      }
      break
      
    case 'month':
      // 本月按日期统计（每周显示一个标签：1日、8日、15日、22日、29日）
      const monthlyData = dashboardStore.monthlyDailyStats
      xData = monthlyData.map(d => {
        const day = parseInt(d.day)
        // 只显示1日、8日、15日、22日、29日
        if (day === 1 || day === 8 || day === 15 || day === 22 || day === 29) {
          return d.day
        }
        return ''
      })
      if (trendType.value === 'orders') {
        seriesData = monthlyData.map(d => d.orders)
        completedData = monthlyData.map(d => d.completed)
        title = '本月订单量趋势（30天走势）'
      } else {
        seriesData = monthlyData.map(d => d.revenue)
        title = '本月收入趋势（30天走势）'
      }
      break
      
    case 'year':
      // 本年按月统计
      const yearlyData = dashboardStore.yearlyMonthlyStats
      xData = yearlyData.map(m => m.month)
      if (trendType.value === 'orders') {
        seriesData = yearlyData.map(m => m.orders)
        completedData = yearlyData.map(m => m.completed)
        title = '本年订单量趋势（按月）'
      } else {
        seriesData = yearlyData.map(m => m.revenue)
        title = '本年收入趋势（按月）'
      }
      break
  }
  
  const isOrders = trendType.value === 'orders'
  const series = []
  
  // 根据时间范围选择图表类型
  const isMonthView = timeRange.value === 'month'
  const isYearView = timeRange.value === 'year'
  
  if (isOrders && completedData) {
    // 订单量模式
    if (isMonthView) {
      // 本月使用折线图 + 面积图，更适合展示30天趋势
      series.push({
        name: '总订单',
        type: 'line',
        data: seriesData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 3,
          color: '#409EFF'
        },
        itemStyle: {
          color: '#409EFF'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        }
      })
      series.push({
        name: '已完成',
        type: 'line',
        data: completedData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 3,
          color: '#67C23A'
        },
        itemStyle: {
          color: '#67C23A'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
          ])
        }
      })
    } else {
      // 其他视图使用柱状图
      const barWidth = isYearView ? 24 : 20
      series.push({
        name: '总订单',
        type: 'bar',
        data: seriesData,
        barWidth: barWidth,
        barGap: '20%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#409EFF' },
            { offset: 1, color: '#67C23A' }
          ]),
          borderRadius: [4, 4, 0, 0]
        }
      })
      series.push({
        name: '已完成',
        type: 'bar',
        data: completedData,
        barWidth: barWidth,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#67C23A' },
            { offset: 1, color: '#95d475' }
          ]),
          borderRadius: [4, 4, 0, 0]
        }
      })
    }
  } else {
    // 收入模式
    if (isMonthView) {
      // 本月使用面积图
      series.push({
        name: '收入(元)',
        type: 'line',
        data: seriesData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 3,
          color: '#f56c6c'
        },
        itemStyle: {
          color: '#f56c6c'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(245, 108, 108, 0.4)' },
            { offset: 1, color: 'rgba(245, 108, 108, 0.05)' }
          ])
        }
      })
    } else {
      // 其他视图使用柱状图
      const barWidth = isYearView ? 24 : 20
      series.push({
        name: '收入(元)',
        type: 'bar',
        data: seriesData,
        barWidth: barWidth,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#f56c6c' },
            { offset: 1, color: '#f89898' }
          ]),
          borderRadius: [4, 4, 0, 0]
        }
      })
    }
  }
  
  const option = {
    title: {
      text: title,
      left: 'center',
      top: 2,
      textStyle: {
        fontSize: 14,
        color: '#606266'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { 
        type: timeRange.value === 'month' ? 'line' : 'shadow',
        lineStyle: {
          color: '#409EFF',
          width: 1,
          type: 'dashed'
        }
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e4e7ed',
      borderWidth: 1,
      textStyle: {
        color: '#303133'
      }
    },
    legend: {
      show: isOrders,
      bottom: -2,
      itemGap: 20,
      textStyle: {
        fontSize: 12
      },
      data: isOrders ? ['总订单', '已完成'] : ['收入(元)']
    },
    grid: {
      left: 40,
      right: 20,
      bottom: isOrders ? 50 : 30,
      top: 50,
      containLabel: false
    },
    xAxis: {
      type: 'category',
      data: xData,
      boundaryGap: timeRange.value !== 'month', // 折线图不需要留白
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisTick: { alignWithLabel: true },
      axisLabel: { 
        color: '#606266',
        interval: timeRange.value === 'month' ? 6 : (timeRange.value === 'today' ? 1 : 0),
        fontSize: 12
      }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#e4e7ed' } },
      axisLabel: { 
        color: '#606266',
        fontSize: 12
      }
    },
    series: series
  }
  
  trendChartInstance.setOption(option, true)
}

// 初始化无人机图表
const initDroneChart = () => {
  if (!droneChart.value) return
  
  droneChartInstance = echarts.init(droneChart.value)
  
  const stats = droneStatusStats.value
  const data = [
    { value: stats.delivering, name: '配送中', itemStyle: { color: '#409EFF' } },
    { value: stats.idle, name: '待命中', itemStyle: { color: '#67C23A' } },
    { value: stats.charging, name: '充电中', itemStyle: { color: '#E6A23C' } },
    { value: stats.maintenance, name: '维护中', itemStyle: { color: '#909399' } },
    { value: stats.offline, name: '离线', itemStyle: { color: '#F56C6C' } }
  ]
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}架 ({d}%)'
    },
    legend: {
      show: false
    },
    series: [{
      type: 'pie',
      radius: ['35%', '65%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        formatter: '{b}\n{c}架',
        fontSize: 12
      },
      labelLine: {
        show: true,
        length: 10,
        length2: 10
      },
      data: data
    }]
  }
  
  droneChartInstance.setOption(option)
}

// 刷新数据
const refreshData = () => {
  loading.value = true
  isRotating.value = true
  pageLoading.value = true
  
  // 模拟数据刷新
  setTimeout(() => {
    loading.value = false
    pageLoading.value = false
    
    // 更新图表
    updateTrendChart()
    initDroneChart()
    
    ElMessage.success('数据已刷新')
    
    // 停止旋转动画
    setTimeout(() => {
      isRotating.value = false
    }, 500)
  }, 800)
}

// 时间范围切换
const handleTimeRangeChange = () => {
  pageLoading.value = true
  
  setTimeout(() => {
    pageLoading.value = false
    updateTrendChart()
  }, 300)
}

// 导航
const navigateTo = (route) => {
  if (route) {
    router.push(route)
  }
}

// 查看订单
const viewOrder = (order) => {
  ElMessage.info(`查看订单 ${order.orderNo}`)
  router.push('/admin/orders')
}

// 删除公告
const removeNotice = (id) => {
  notices.value = notices.value.filter(n => n.id !== id)
  ElMessage.success('公告已删除')
}

// 添加公告
const addNotice = () => {
  if (!noticeForm.value.title) {
    ElMessage.warning('请输入标题')
    return
  }
  
  const iconMap = {
    'info': 'InfoFilled',
    'warning': 'Warning',
    'success': 'CircleCheck'
  }
  
  notices.value.unshift({
    id: Date.now(),
    title: noticeForm.value.title,
    time: new Date().toLocaleString('zh-CN'),
    type: noticeForm.value.type,
    icon: iconMap[noticeForm.value.type],
    closable: true
  })
  
  showAddNotice.value = false
  noticeForm.value = { title: '', content: '', type: 'info' }
  ElMessage.success('公告已发布')
}

// 监听趋势类型变化
watch(trendType, () => {
  nextTick(() => updateTrendChart())
})

// 窗口大小变化时重新渲染图表
const handleResize = () => {
  trendChartInstance?.resize()
  droneChartInstance?.resize()
}

onMounted(() => {
  nextTick(() => {
    initTrendChart()
    initDroneChart()
  })
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trendChartInstance?.dispose()
  droneChartInstance?.dispose()
})
</script>

<style scoped lang="scss">
.dashboard {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100%;
}

// 页面标题
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  .header-title {
    h1 {
      margin: 0 0 8px 0;
      font-size: 24px;
      color: #303133;
    }
    .subtitle {
      margin: 0;
      color: #909399;
      font-size: 14px;
    }
  }
  
  .header-actions {
    display: flex;
    gap: 12px;
    
    .refresh-btn {
      .el-icon {
        transition: transform 0.3s ease;
      }
      
      &.rotating {
        .el-icon {
          animation: rotate 1s linear infinite;
        }
      }
    }
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 统计卡片
.stats-cards {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 24px;
  
  @media (max-width: 1600px) {
    grid-template-columns: repeat(3, 1fr);
  }
  
  @media (max-width: 992px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 576px) {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #ebeef5;
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
    border-color: var(--card-color);
    
    &::before {
      opacity: 1;
    }
    
    .card-icon::before {
      opacity: 0.2;
    }
    
    .card-icon .el-icon {
      transform: scale(1.1);
    }
  }
  
  // 顶部彩色装饰条
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--card-color);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .card-icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
    transition: transform 0.3s ease;
    
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--card-color);
      opacity: 0.12;
      border-radius: inherit;
      transition: opacity 0.3s ease;
    }
    
    .el-icon {
      position: relative;
      z-index: 1;
      font-size: 32px;
      color: var(--card-color);
      transition: transform 0.3s ease;
    }
  }
  
  .card-content {
    flex: 1;
    min-width: 0;
  }
  
  .card-value {
    font-size: 28px;
    font-weight: 700;
    color: #1a1a2e;
    margin-bottom: 6px;
    letter-spacing: -0.5px;
  }
  
  .card-label {
    font-size: 14px;
    color: #606266;
    margin-bottom: 10px;
    font-weight: 500;
  }
  
  .card-trend {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 20px;
    
    &.up {
      color: #67c23a;
      background: #f0f9eb;
    }
    
    &.down {
      color: #f56c6c;
      background: #fef0f0;
    }
  }
}

// 图表区域
.charts-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
  
  @media (max-width: 1400px) {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
  
  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    flex-shrink: 0;
    
    h3 {
      margin: 0;
      font-size: 16px;
      color: #303133;
    }
  }
  
  .chart-container {
    height: 340px;
    min-height: 280px;
    flex: 1;
    
    @media (min-width: 1920px) {
      height: 420px;
    }
    
    @media (min-width: 2560px) {
      height: 500px;
    }
  }
}

// 无人机统计
.drone-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
  
  .drone-stat-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #606266;
    
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      
      &.delivering { background: #409eff; }
      &.idle { background: #67c23a; }
      &.charging { background: #e6a23c; }
      &.maintenance { background: #909399; }
      &.offline { background: #f56c6c; }
    }
  }
}

// 下方内容区域
.bottom-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  
  @media (max-width: 1400px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 992px) {
    grid-template-columns: 1fr;
  }
}

.panel-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #ebeef5;
  
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    h3 {
      margin: 0;
      font-size: 16px;
      color: #303133;
    }
  }
}

// 订单列表
.order-list {
  .order-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #ebeef5;
    cursor: pointer;
    transition: background 0.2s;
    
    &:last-child {
      border-bottom: none;
    }
    
    &:hover {
      background: #f5f7fa;
      margin: 0 -12px;
      padding-left: 12px;
      padding-right: 12px;
      border-radius: 6px;
    }
    
    .order-info {
      flex: 1;
      min-width: 0;
      
      .order-no {
        font-size: 14px;
        font-weight: 500;
        color: #303133;
        margin-bottom: 4px;
      }
      
      .order-route {
        font-size: 12px;
        color: #909399;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
    
    .order-status {
      text-align: right;
      
      .progress-text {
        font-size: 12px;
        color: #409eff;
        margin-top: 4px;
      }
    }
  }
}

// 公告列表
.notice-list {
  .notice-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid #ebeef5;
    
    &:last-child {
      border-bottom: none;
    }
    
    &.important {
      background: #fdf6ec;
      margin: 0 -12px;
      padding: 12px;
      border-radius: 6px;
    }
    
    .notice-icon {
      flex-shrink: 0;
    }
    
    .notice-content {
      flex: 1;
      min-width: 0;
      
      .notice-title {
        font-size: 14px;
        color: #303133;
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .notice-time {
        font-size: 12px;
        color: #909399;
      }
    }
  }
}

// 快捷操作
.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  
  .action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 20px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    border: 1px solid #ebeef5;
    
    &:hover {
      background: #f5f7fa;
      border-color: #dcdfe6;
      transform: translateY(-2px);
    }
    
    .action-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }
    
    span {
      font-size: 14px;
      color: #606266;
    }
  }
}
</style>
