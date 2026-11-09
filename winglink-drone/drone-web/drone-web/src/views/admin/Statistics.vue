<template>
  <div class="statistics-page">
    <!-- 页面标题区 -->
    <div class="page-header fade-in-down">
      <div class="header-left">
        <h2>数据统计与报表</h2>
        <p class="header-desc">全面分析业务数据，生成统计报表，支持数据导出</p>
      </div>
      <div class="header-right">
        <el-radio-group v-model="dateRange" size="large">
          <el-radio-button label="today">今日</el-radio-button>
          <el-radio-button label="week">本周</el-radio-button>
          <el-radio-button label="month">本月</el-radio-button>
          <el-radio-button label="year">全年</el-radio-button>
        </el-radio-group>
        <el-date-picker
          v-model="customDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 240px; margin-left: 16px"
          size="large"
        />
      </div>
    </div>
    
    <!-- 核心指标卡片 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :span="4" v-for="(stat, index) in coreStats" :key="index">
        <div 
          class="stat-card-wrapper"
          :class="{ 'slide-in-up': cardsAnimated }"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <el-card 
            class="core-stat-card" 
            shadow="hover"
            :class="{ 'card-hover': hoveredCard === index }"
            @mouseenter="hoveredCard = index"
            @mouseleave="hoveredCard = null"
            @click="handleCardClick(stat, index)"
          >
          <div class="stat-header">
            <span class="stat-name">{{ stat.name }}</span>
            <el-tag :type="stat.trend > 0 ? 'success' : 'danger'" size="small" effect="plain">
              <el-icon><component :is="stat.trend > 0 ? 'ArrowUp' : 'ArrowDown'" /></el-icon>
              {{ Math.abs(stat.trend) }}%
            </el-tag>
          </div>
          <div class="stat-value-large" :class="{ 'count-up': valueAnimated }">
            <span class="value-prefix" v-if="stat.value.includes('¥')">¥</span>
            {{ getNumericValue(stat.value) }}
            <span class="value-suffix" v-if="stat.value.includes('分')">分</span>
            <span class="value-suffix" v-if="stat.value.includes('km')">km</span>
            <span class="value-suffix" v-if="stat.value.includes('次')">次</span>
            <span class="value-suffix" v-if="stat.value.includes('%')">%</span>
          </div>
          <div class="stat-compare">
            <span class="compare-label">较上期 {{ stat.trend > 0 ? '增加' : '减少' }}</span>
            <span class="compare-value" :class="stat.trend > 0 ? 'up' : 'down'">
              {{ Math.abs(stat.compare) }}
            </span>
          </div>
          <!-- 进度条动画 -->
          <div class="stat-progress">
            <div class="progress-track">
              <div 
                class="progress-bar" 
                :class="{ 'progress-animate': cardsAnimated }"
                :style="{ width: `${stat.progress || 75}%`, animationDelay: `${0.5 + index * 0.1}s` }"
              ></div>
            </div>
          </div>
          </el-card>
        </div>
      </el-col>
    </el-row>
    
    <!-- 气象数据实时监测 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="24">
        <el-card shadow="never" class="chart-card weather-monitor-card" :class="{ 'scale-in': chartsAnimated }" :style="{ animationDelay: '0.15s' }">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <span class="title-text">气象数据实时监测</span>
                <el-tag size="small" type="info">过去6小时 + 未来10小时预测</el-tag>
              </div>
              <div class="header-actions">
                <el-button link type="primary" size="small" @click="loadWeatherData" :loading="weatherLoading">
                  <el-icon><Refresh /></el-icon>
                  刷新数据
                </el-button>
              </div>
            </div>
          </template>
          <div ref="weatherChart" class="chart-container weather-chart-container" :class="{ 'chart-loading': !chartsAnimated }"></div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card shadow="never" class="chart-card" :class="{ 'scale-in': chartsAnimated }">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <span class="title-text">订单量趋势</span>
                <el-tag size="small" type="info">单位：单</el-tag>
              </div>
              <el-button link type="primary" @click="openChartExportDialog('order')">
                <el-icon><Download /></el-icon>
                导出
              </el-button>
            </div>
          </template>
          <div ref="orderTrendChart" class="chart-container" :class="{ 'chart-loading': !chartsAnimated }"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never" class="chart-card" :class="{ 'scale-in': chartsAnimated }" :style="{ animationDelay: '0.2s' }">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <span class="title-text">收入趋势</span>
                <el-tag size="small" type="info">单位：元</el-tag>
              </div>
              <el-button link type="primary" @click="openChartExportDialog('revenue')">
                <el-icon><Download /></el-icon>
                导出
              </el-button>
            </div>
          </template>
          <div ref="revenueTrendChart" class="chart-container" :class="{ 'chart-loading': !chartsAnimated }"></div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card shadow="never" class="chart-card area-distribution-card" :class="{ 'scale-in': chartsAnimated }" :style="{ animationDelay: '0.3s' }">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <span class="title-text">配送区域分布</span>
                <el-tag size="small" type="info">五大区域</el-tag>
              </div>
              <div class="header-right">
                <el-radio-group v-model="areaChartMode" size="small">
                  <el-radio-button label="orders">订单量</el-radio-button>
                  <el-radio-button label="revenue">收入</el-radio-button>
                  <el-radio-button label="efficiency">效率</el-radio-button>
                </el-radio-group>
                <el-button link type="primary" size="small" @click="openAreaDetailDialog" style="margin-left: 8px;">
                  <el-icon><View /></el-icon>
                  详情
                </el-button>
              </div>
            </div>
          </template>
          <div class="area-chart-wrapper">
            <div ref="areaChart" class="chart-container" :class="{ 'chart-loading': !chartsAnimated }"></div>
            <!-- 区域排行榜 -->
            <div class="area-ranking" v-if="areaRankingData.length > 0">
              <div class="ranking-header">
                <span class="ranking-title">🏆 区域排行榜</span>
                <span class="ranking-subtitle">五大区域</span>
              </div>
              <div class="ranking-list">
                <div 
                  v-for="(item, index) in areaRankingData" 
                  :key="index"
                  class="ranking-item"
                  :class="{ 'top3': index < 3 }"
                >
                  <div class="rank-number" :class="`rank-${index + 1}`">{{ index + 1 }}</div>
                  <div class="rank-info">
                    <div class="rank-name">{{ item.name }}</div>
                    <div class="rank-bar">
                      <div class="rank-progress" :style="{ width: `${(item.value / areaMaxValue) * 100}%` }"></div>
                    </div>
                  </div>
                  <div class="rank-value">
                    <span class="value">{{ item.value.toLocaleString() }}</span>
                    <span class="unit">{{ areaChartMode === 'revenue' ? '元' : (areaChartMode === 'efficiency' ? '分' : '单') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never" class="chart-card" :class="{ 'scale-in': chartsAnimated }" :style="{ animationDelay: '0.4s' }">
          <template #header>
            <div class="card-header">
              <span class="title-text">货物类型占比</span>
            </div>
          </template>
          <div ref="cargoChart" class="chart-container" :class="{ 'chart-loading': !chartsAnimated }"></div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 无人机使用率分析 - 滑动卡片展示 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="24">
        <el-card shadow="never" class="chart-card drone-usage-card" :class="{ 'scale-in': chartsAnimated }" :style="{ animationDelay: '0.5s' }">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <span class="title-text">无人机机队实时监控</span>
                <el-tag size="small" type="success">{{ runningDroneCount }}架运行中</el-tag>
              </div>
              <div class="header-actions">
                <el-radio-group v-model="droneSortMode" size="small">
                  <el-radio-button label="default">默认</el-radio-button>
                  <el-radio-button label="flight">使用时长</el-radio-button>
                  <el-radio-button label="efficiency">配送效率</el-radio-button>
                </el-radio-group>
                <el-button 
                  link 
                  type="primary" 
                  size="small" 
                  @click="refreshDroneData"
                  :loading="droneRefreshing"
                >
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
              </div>
            </div>
          </template>
          <div class="drone-slider-container">
            <div class="drone-slider" ref="droneSlider">
              <div 
                v-for="(drone, index) in sortedDroneList" 
                :key="drone.id"
                class="drone-item"
                :class="{ 'active': selectedDrone?.id === drone.id }"
                :style="{ animationDelay: `${index * 0.05}s` }"
                @click="selectDrone(drone)"
              >
                <div class="drone-header">
                  <div class="drone-id">{{ drone.id }}</div>
                  <div class="drone-status" :class="drone.status">
                    <span class="status-dot"></span>
                    {{ drone.statusText }}
                  </div>
                </div>
                <div class="drone-icon">
                  <div class="drone-animation" :class="{ 'flying': drone.flightTime > 5 }">
                    <el-icon :size="32"><VideoCamera /></el-icon>
                  </div>
                </div>
                <div class="drone-metrics">
                  <div class="metric-item">
                    <div class="metric-icon">⏱️</div>
                    <div class="metric-info">
                      <div class="metric-value">{{ drone.flightTime.toFixed(1) }}h</div>
                      <div class="metric-label">飞行时长</div>
                    </div>
                  </div>
                  <div class="metric-item">
                    <div class="metric-icon">⚡</div>
                    <div class="metric-info">
                      <div class="metric-value">{{ drone.efficiency }}</div>
                      <div class="metric-label">效率指数</div>
                    </div>
                  </div>
                </div>
                <div class="drone-progress">
                  <div class="progress-ring" :style="{ '--progress': drone.battery }">
                    <svg viewBox="0 0 36 36">
                      <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path class="circle" :stroke-dasharray="`${drone.battery}, 100`" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div class="battery-text">{{ drone.battery }}%</div>
                  </div>
                </div>
                <div class="drone-footer">
                  <span class="task-count">今日: {{ drone.completedTasks }}/{{ drone.tasks }}单</span>
                  <span class="distance">{{ drone.distance }}km</span>
                </div>
              </div>
            </div>
            <!-- 左右滑动按钮 -->
            <button class="slider-btn prev" @click="slideDrone(-1)">
              <el-icon><ArrowLeft /></el-icon>
            </button>
            <button class="slider-btn next" @click="slideDrone(1)">
              <el-icon><ArrowRight /></el-icon>
            </button>
          </div>
          <!-- 选中无人机详情 -->
          <div v-if="selectedDrone" class="drone-detail-panel">
            <div class="detail-panel-header">
              <h4>{{ selectedDrone.id }} 详细数据</h4>
              <el-button link type="danger" size="small" @click="selectedDrone = null">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
            <div class="detail-panel-content">
              <div class="detail-chart-wrapper">
                <div ref="singleDroneChart" class="single-drone-chart"></div>
              </div>
              <div class="detail-stats">
                <div class="stat-row">
                  <span class="stat-label">累计飞行:</span>
                  <span class="stat-value">{{ selectedDrone.totalFlight.toFixed(1) }} 小时</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">平均速度:</span>
                  <span class="stat-value">{{ selectedDrone.avgSpeed }} km/h</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">配送准点率:</span>
                  <span class="stat-value">
                    <el-tag :type="selectedDrone.punctuality >= 95 ? 'success' : 'warning'" size="small">
                      {{ selectedDrone.punctuality }}%
                    </el-tag>
                  </span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">故障次数:</span>
                  <span class="stat-value">{{ selectedDrone.faults }} 次</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">维护日期:</span>
                  <span class="stat-value">{{ selectedDrone.lastMaintain }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 详细数据表格 -->
    <el-card shadow="never" class="data-table-card" :class="{ 'fade-in-up': tableAnimated }">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <span class="title-text">每日数据明细</span>
            <el-button-group size="small" style="margin-left: 16px">
              <el-button :type="tableType === 'daily' ? 'primary' : ''" @click="tableType = 'daily'">日报</el-button>
              <el-button :type="tableType === 'weekly' ? 'primary' : ''" @click="tableType = 'weekly'">周报</el-button>
              <el-button :type="tableType === 'monthly' ? 'primary' : ''" @click="tableType = 'monthly'">月报</el-button>
            </el-button-group>
          </div>
          <el-button type="primary" size="small" @click="exportData">
            <el-icon><Document /></el-icon>
            导出报表
          </el-button>
        </div>
      </template>
      
      <el-table :data="tableData" stripe v-loading="tableLoading" element-loading-text="数据加载中...">
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="orders" label="订单量">
          <template #default="{ row }">
            <div class="cell-with-trend">
              <span class="cell-value">{{ row.orders }}</span>
              <el-tag :type="row.orderTrend > 0 ? 'success' : 'danger'" size="small" v-if="row.orderTrend">
                {{ row.orderTrend > 0 ? '+' : '' }}{{ row.orderTrend }}%
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="completed" label="完成量" />
        <el-table-column prop="cancelled" label="取消量">
          <template #default="{ row }">
            <span :class="{ 'warning': row.cancelled > 10 }">{{ row.cancelled }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="revenue" label="收入">
          <template #default="{ row }">
            <span class="price">¥{{ row.revenue.toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="avgTime" label="平均时效" />
        <el-table-column prop="distance" label="总里程">
          <template #default="{ row }">{{ row.distance }}km</template>
        </el-table-column>
        <el-table-column prop="drones" label="出动无人机" />
        <el-table-column label="准时率" width="100">
          <template #default="{ row }">
            <el-progress :percentage="row.onTimeRate" :color="onTimeColor" :stroke-width="8" />
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination">
        <el-pagination
          v-model:current-page="pageInfo.page"
          v-model:page-size="pageInfo.size"
          :total="pageInfo.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
    
    <!-- 详情模态框 -->
    <el-dialog 
      v-model="detailModalVisible" 
      :title="activeStatData?.name + ' 详情'" 
      width="70%"
      :class="{ 'detail-modal': true, 'modal-animate': detailModalVisible }"
      destroy-on-close
    >
      <div class="detail-content">
        <div class="detail-header">
          <div class="detail-metric">
            <div class="metric-value">{{ activeStatData?.value }}</div>
            <div class="metric-label">当前数值</div>
          </div>
          <div class="detail-trend">
            <div class="trend-value" :class="activeStatData?.trend > 0 ? 'up' : 'down'">
              <el-icon size="24"><component :is="activeStatData?.trend > 0 ? 'ArrowUp' : 'ArrowDown'" /></el-icon>
              {{ Math.abs(activeStatData?.trend || 0) }}%
            </div>
            <div class="trend-label">较上期变化</div>
          </div>
          <div class="detail-compare">
            <div class="compare-value">{{ activeStatData?.compare }}</div>
            <div class="compare-label">增减量</div>
          </div>
        </div>
        <div ref="detailChart" class="detail-chart-container"></div>
      </div>
    </el-dialog>
    
    <!-- 区域分布详情弹窗 -->
    <el-dialog
      v-model="areaDetailDialogVisible"
      title="配送区域详细分析"
      width="80%"
      top="5vh"
      :class="{ 'area-detail-modal': true }"
      destroy-on-close
    >
      <div class="area-detail-content">
        <!-- 概览统计 -->
        <div class="area-overview">
          <div class="overview-card" v-for="(item, idx) in areaOverviewData" :key="idx">
            <div class="overview-icon" :style="{ background: item.bgColor }">
              <el-icon :size="24" :color="item.iconColor"><component :is="item.icon" /></el-icon>
            </div>
            <div class="overview-info">
              <div class="overview-value">{{ item.value }}</div>
              <div class="overview-label">{{ item.label }}</div>
            </div>
          </div>
        </div>
        
        <!-- 数据表格 -->
        <div class="area-table-wrapper">
          <div class="table-header">
            <h4>区域配送详情</h4>
            <el-radio-group v-model="areaTableMode" size="small">
              <el-radio-button label="orders">按订单量</el-radio-button>
              <el-radio-button label="revenue">按收入</el-radio-button>
              <el-radio-button label="efficiency">按效率</el-radio-button>
            </el-radio-group>
          </div>
          <el-table :data="sortedAreaData" stripe border height="400">
            <el-table-column type="index" label="排名" width="70" align="center">
              <template #default="{ $index }">
                <span class="rank-badge" :class="`rank-${$index + 1}`">{{ $index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="区域" width="120" />
            <el-table-column prop="orders" label="订单量" align="right" sortable>
              <template #default="{ row }">
                <span class="highlight">{{ row.orders }}</span> 单
              </template>
            </el-table-column>
            <el-table-column prop="revenue" label="收入" align="right" sortable>
              <template #default="{ row }">
                <span class="price">¥{{ row.revenue.toLocaleString() }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="completed" label="完成/总数" align="center">
              <template #default="{ row }">
                <el-progress 
                  :percentage="row.orders > 0 ? Math.round((row.completed / row.orders) * 100) : 0" 
                  :status="row.completed === row.orders ? 'success' : ''"
                  :stroke-width="8"
                />
                <span class="progress-text">{{ row.completed }}/{{ row.orders }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="avgTime" label="平均时效" align="center" sortable>
              <template #default="{ row }">
                <span :class="{ 'fast': parseFloat(row.avgTime) < 20, 'slow': parseFloat(row.avgTime) > 22 }">
                  {{ row.avgTime }} 分
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="efficiency" label="效率指数" align="center" sortable>
              <template #default="{ row }">
                <el-tag :type="parseFloat(row.efficiency) > 50 ? 'success' : (parseFloat(row.efficiency) > 45 ? 'warning' : 'danger')" size="small">
                  {{ row.efficiency }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="center">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="viewAreaTrend(row)">
                  趋势
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>
    
    <!-- 导出报表预览弹窗 -->
    <el-dialog v-model="exportDialogVisible" title="报表导出预览" width="90%" top="5vh" :close-on-click-modal="false">
      <div class="export-report">
        <div class="report-header">
          <h3>{{ reportTitle }}数据报表</h3>
          <p class="report-meta">生成时间：{{ new Date().toLocaleString() }} | 共 {{ rawTableData.length }} 条记录</p>
        </div>
        <div class="report-table-wrapper">
          <el-table :data="rawTableData" stripe border size="small" height="55vh">
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column prop="date" label="日期" width="140" />
            <el-table-column prop="orders" label="订单量" width="100" align="center">
              <template #default="{ row }">
                <div class="cell-with-trend">
                  <span>{{ row.orders }}</span>
                  <el-tag :type="row.orderTrend > 0 ? 'success' : 'danger'" size="small" v-if="row.orderTrend !== 0">
                    {{ row.orderTrend > 0 ? '+' : '' }}{{ row.orderTrend }}%
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="completed" label="完成量" width="90" align="center" />
            <el-table-column prop="cancelled" label="取消量" width="90" align="center">
              <template #default="{ row }">
                <span :class="{ 'warning': row.cancelled > 10 }">{{ row.cancelled }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="revenue" label="收入(元)" width="120" align="right">
              <template #default="{ row }">¥{{ row.revenue.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="avgTime" label="平均时效" width="100" align="center" />
            <el-table-column prop="distance" label="总里程(km)" width="110" align="center" />
            <el-table-column prop="drones" label="出动无人机" width="100" align="center" />
            <el-table-column prop="onTimeRate" label="准时率(%)" width="100" align="center">
              <template #default="{ row }">{{ row.onTimeRate }}%</template>
            </el-table-column>
          </el-table>
        </div>
        <div class="report-summary">
          <el-row :gutter="20">
            <el-col :span="4">
              <div class="summary-item">
                <span class="label">订单总量：</span>
                <span class="value">{{ rawTableData.reduce((sum, d) => sum + d.orders, 0) }}</span>
              </div>
            </el-col>
            <el-col :span="4">
              <div class="summary-item">
                <span class="label">完成总量：</span>
                <span class="value">{{ rawTableData.reduce((sum, d) => sum + d.completed, 0) }}</span>
              </div>
            </el-col>
            <el-col :span="4">
              <div class="summary-item">
                <span class="label">取消总量：</span>
                <span class="value">{{ rawTableData.reduce((sum, d) => sum + d.cancelled, 0) }}</span>
              </div>
            </el-col>
            <el-col :span="4">
              <div class="summary-item">
                <span class="label">总收入：</span>
                <span class="value">¥{{ rawTableData.reduce((sum, d) => sum + d.revenue, 0).toLocaleString() }}</span>
              </div>
            </el-col>
            <el-col :span="4">
              <div class="summary-item">
                <span class="label">总里程：</span>
                <span class="value">{{ rawTableData.reduce((sum, d) => sum + d.distance, 0) }}km</span>
              </div>
            </el-col>
            <el-col :span="4">
              <div class="summary-item">
                <span class="label">数据条数：</span>
                <span class="value">{{ rawTableData.length }}条</span>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
      <template #footer>
        <el-button @click="exportDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="downloadCSV">
          <el-icon><Download /></el-icon>
          下载 CSV
        </el-button>
        <el-button type="success" @click="downloadExcel">
          <el-icon><Document /></el-icon>
          下载 Excel
        </el-button>
      </template>
    </el-dialog>
    
    <!-- 图表数据导出预览弹窗 -->
    <el-dialog v-model="chartExportDialogVisible" :title="chartExportTitle" width="80%" top="5vh" :close-on-click-modal="false">
      <div class="export-report">
        <div class="report-header">
          <h3>{{ chartExportTitle }}</h3>
          <p class="report-meta">生成时间：{{ new Date().toLocaleString() }} | 共 {{ chartExportData.length }} 条数据</p>
        </div>
        <div class="report-table-wrapper">
          <el-table :data="chartExportData" stripe border size="small" height="50vh">
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column prop="date" label="日期" width="120" />
            <el-table-column v-if="chartExportType === 'order'" prop="orders" label="订单量" width="100" align="center" />
            <el-table-column v-if="chartExportType === 'order'" prop="completed" label="完成量" width="100" align="center" />
            <el-table-column v-if="chartExportType === 'order'" prop="cancelled" label="取消量" width="100" align="center" />
            <el-table-column v-if="chartExportType === 'revenue'" prop="revenue" label="收入(元)" width="120" align="right">
              <template #default="{ row }">¥{{ row.revenue.toLocaleString() }}</template>
            </el-table-column>
          </el-table>
        </div>
        <div class="report-summary">
          <el-row :gutter="20">
            <el-col :span="8" v-if="chartExportType === 'order'">
              <div class="summary-item">
                <span class="label">总订单量：</span>
                <span class="value">{{ chartExportData.reduce((sum, d) => sum + d.orders, 0) }}</span>
              </div>
            </el-col>
            <el-col :span="8" v-if="chartExportType === 'order'">
              <div class="summary-item">
                <span class="label">总完成量：</span>
                <span class="value">{{ chartExportData.reduce((sum, d) => sum + d.completed, 0) }}</span>
              </div>
            </el-col>
            <el-col :span="8" v-if="chartExportType === 'revenue'">
              <div class="summary-item">
                <span class="label">总收入：</span>
                <span class="value">¥{{ chartExportData.reduce((sum, d) => sum + d.revenue, 0).toLocaleString() }}</span>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
      <template #footer>
        <el-button @click="chartExportDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="downloadChartCSV">
          <el-icon><Download /></el-icon>
          下载 CSV
        </el-button>
        <el-button type="success" @click="downloadChartExcel">
          <el-icon><Document /></el-icon>
          下载 Excel
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, reactive, nextTick } from 'vue'
import * as echarts from 'echarts'
import { 
  ArrowUp, ArrowDown, Download, Document, View,
  Location, Money, CircleCheck, Trophy, Refresh,
  VideoCamera, ArrowLeft, ArrowRight, Close
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useDashboardStore } from '@/store/dashboard'
import { getWeatherStatisticsApi } from '@/api/statistics'

const dashboardStore = useDashboardStore()

// ============ 响应式状态 ============
const dateRange = ref('today')
const customDateRange = ref([])
const tableType = ref('daily')
const droneStatType = ref('usage')
const exportDialogVisible = ref(false)
const chartExportDialogVisible = ref(false)
const chartExportType = ref('order')
const hoveredCard = ref(null)
const tableLoading = ref(true)

// 动画状态
const cardsAnimated = ref(false)
const chartsAnimated = ref(false)
const tableAnimated = ref(false)
const valueAnimated = ref(false)

// 无人机相关
const droneSortMode = ref('default')
const selectedDrone = ref(null)
const droneRefreshing = ref(false)
const droneSlider = ref(null)
const singleDroneChart = ref(null)
let singleDroneChartInstance = null

// 监听store中的无人机数据变化，实时更新
watch(() => dashboardStore.droneList, () => {
  droneListData.value = generateDroneData()
}, { deep: true })

// 监听订单列表变化，当订单完成时更新使用时长和配送效率
watch(() => dashboardStore.orderList, () => {
  droneListData.value = generateDroneData()
}, { deep: true })

// 从store获取真实无人机数据并转换格式
const generateDroneData = () => {
  // 获取真实的无人机列表
  const realDrones = dashboardStore.droneList || []
  
  // 状态映射
  const statusMap = {
    'DELIVERING': { status: 'online', statusText: '运行中' },
    'IDLE': { status: 'online', statusText: '待命中' },
    'CHARGING': { status: 'charging', statusText: '充电中' },
    'MAINTENANCE': { status: 'maintenance', statusText: '维护中' },
    'OFFLINE': { status: 'offline', statusText: '离线' }
  }
  
  return realDrones.map(drone => {
    const statusInfo = statusMap[drone.status] || { status: 'offline', statusText: '离线' }
    
    // 获取今日该无人机的所有相关订单（包括已完成和配送中）
    const todayOrders = dashboardStore.orderList?.filter(order => 
      order.droneNo === drone.droneNo && !order.isHistory
    ) || []
    
    // 已完成配送的订单
    const completedTasks = todayOrders.filter(order => order.status === 'DELIVERED')
    // 配送中的订单
    const deliveringTasks = todayOrders.filter(order => order.status === 'DELIVERING')
    // 总任务数
    const totalTasks = completedTasks.length + deliveringTasks.length
    
    // 计算今日配送里程（已完成 + 配送中订单的实际里程）
    const todayDistance = todayOrders.reduce((sum, order) => sum + (order.distance || 0), 0)
    
    // 计算使用时长（基于实际配送订单数和配送里程）
    // 每单平均飞行时间 = 距离/平均速度(45km/h) + 起降时间(0.08h)
    const avgSpeed = 45 // km/h
    const takeoffLandingTime = 0.08 // 约5分钟
    
    // 根据已完成订单的实际飞行距离计算使用时长
    let flightTime = completedTasks.reduce((sum, order) => {
      const orderFlightTime = (order.distance || 0) / avgSpeed + takeoffLandingTime
      return sum + orderFlightTime
    }, 0)
    
    // 加上配送中订单的估算使用时长（基于进度）
    flightTime += deliveringTasks.reduce((sum, order) => {
      const progress = order.progress || 0
      const orderFlightTime = ((order.distance || 0) / avgSpeed + takeoffLandingTime) * (progress / 100)
      return sum + orderFlightTime
    }, 0)
    
    // 四舍五入到1位小数
    flightTime = Math.round(flightTime * 10) / 10
    
    // 计算配送效率（已完成单数 / 使用时长）
    // 如果还在配送中，加上正在配送的订单数 × 进度百分比
    const effectiveCompletedCount = completedTasks.length + 
      deliveringTasks.reduce((sum, order) => sum + ((order.progress || 0) / 100), 0)
    
    const efficiency = flightTime > 0 
      ? Math.round((effectiveCompletedCount / flightTime) * 10) / 10 
      : 0
    
    // 计算准点率（基于已完成的订单）
    const onTimeOrders = completedTasks.filter(order => order.isOnTime).length
    const punctuality = completedTasks.length > 0
      ? Math.round((onTimeOrders / completedTasks.length) * 100)
      : 95 // 默认值
    
    return {
      id: drone.droneNo,
      status: statusInfo.status,
      statusText: statusInfo.statusText,
      flightTime: flightTime,
      efficiency: efficiency,
      battery: Math.round(drone.battery),
      tasks: totalTasks,
      completedTasks: completedTasks.length,
      distance: todayDistance.toFixed(1),
      totalFlight: (drone.totalFlightTime || 0) / 60, // 转换为小时
      avgSpeed: avgSpeed,
      punctuality: punctuality,
      faults: Math.floor(Math.random() * 3),
      lastMaintain: '2026-03-15'
    }
  })
}

const droneListData = ref(generateDroneData())

const sortedDroneList = computed(() => {
  const list = [...droneListData.value]
  if (droneSortMode.value === 'flight') {
    return list.sort((a, b) => b.flightTime - a.flightTime)
  } else if (droneSortMode.value === 'efficiency') {
    return list.sort((a, b) => b.efficiency - a.efficiency)
  }
  return list
})

// 计算运行中的无人机数量（配送中或待命中状态的无人机）
const runningDroneCount = computed(() => {
  return droneListData.value.filter(drone => 
    drone.status === 'online' || drone.status === 'charging'
  ).length
})

const refreshDroneData = async () => {
  droneRefreshing.value = true
  await new Promise(resolve => setTimeout(resolve, 800))
  droneListData.value = generateDroneData()
  droneRefreshing.value = false
  selectedDrone.value = null
}

const selectDrone = (drone) => {
  selectedDrone.value = drone
  nextTick(() => {
    initSingleDroneChart(drone)
  })
}

const initSingleDroneChart = (drone) => {
  if (!singleDroneChart.value) return
  
  if (singleDroneChartInstance) {
    singleDroneChartInstance.dispose()
  }
  
  singleDroneChartInstance = echarts.init(singleDroneChart.value)
  
  // 生成24小时内的飞行数据
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
  const flightData = hours.map(() => Math.random() > 0.3 ? Math.random() * 0.8 : 0)
  
  const option = {
    grid: { left: '10%', right: '5%', bottom: '15%', top: '10%' },
    xAxis: {
      type: 'category',
      data: hours,
      axisLabel: { fontSize: 10, interval: 3 }
    },
    yAxis: {
      type: 'value',
      name: '飞行时长(h)',
      axisLabel: { fontSize: 10 }
    },
    series: [{
      type: 'bar',
      data: flightData,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#409EFF' },
          { offset: 1, color: '#67C23A' }
        ])
      },
      animationDuration: 1000
    }]
  }
  
  singleDroneChartInstance.setOption(option)
}

const slideDrone = (direction) => {
  if (!droneSlider.value) return
  const scrollAmount = 300
  droneSlider.value.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' })
}

// 详情模态框
const detailModalVisible = ref(false)
const activeStatData = ref(null)
const detailChart = ref(null)
let detailChartInstance = null

// 根据地址解析所属区域（兼容旧数据）
const getDistrictByAddress = (address) => {
  if (!address) return null
  const districtMap = {
    '西湖区': ['西湖区', '科技园A座', '浙江大学', '西湖景区入口', '浙大玉泉', '西湖区政府', '西溪湿地', '良渚古城', '浙大紫金港', '浙大清河坊', '杭州西站'],
    '上城区': ['上城区', '市立医院', '浙一医院', '武林广场', '城站火车站', '杭州站', '湖滨银泰', '杭州大厦', '浙二医院', '邵逸夫医院', '黄龙体育中心'],
    '滨江区': ['滨江区', '滨江高新园区', '滨江商圈', '萧山机场'],
    '拱墅区': ['拱墅区', '物流园区', '锦绣花园', '阳光小区', '京杭大运河', '余杭区政府'],
    '钱塘区': ['钱塘区', '第一中学', '中国银行', '购物中心', '下沙商圈', '总部基地', '机场T3', '市民中心', '杭州东站', '钱江新城']
  }
  for (const [district, keywords] of Object.entries(districtMap)) {
    if (keywords.some(k => address.includes(k))) return district
  }
  return null
}

// 区域分布图相关
const areaChartMode = ref('orders')
const areaDetailDialogVisible = ref(false)

const areaRankingData = computed(() => {
  const mode = areaChartMode.value
  const districts = ['西湖区', '上城区', '滨江区', '拱墅区', '钱塘区']
  
  // 优先使用 store 中的区域统计
  const storeStats = dashboardStore.districtStats || []
  const statMap = {}
  storeStats.forEach(s => {
    statMap[s.district] = s
  })
  
  // 确保五大区域都有数据
  const result = districts.map(name => {
    const s = statMap[name]
    const orders = s ? s.orders : 0
    const completed = s ? s.completed : 0
    const revenue = s ? s.revenue : 0
    const avgTime = s ? parseFloat(s.avgTime) : 0
    const efficiency = s ? parseFloat(s.efficiency) : 0
    return {
      name,
      orders,
      completed,
      revenue,
      completionRate: orders > 0 ? ((completed / orders) * 100).toFixed(1) : 0,
      avgTime: avgTime.toFixed(1),
      efficiency: efficiency.toFixed(1),
      value: mode === 'orders' ? orders : (mode === 'revenue' ? revenue : parseFloat(efficiency.toFixed(1) || 0))
    }
  })
  
  // 根据当前模式排序
  const sortKey = mode === 'orders' ? 'orders' : (mode === 'revenue' ? 'revenue' : 'efficiency')
  return result.sort((a, b) => b[sortKey] - a[sortKey])
})

const areaMaxValue = computed(() => {
  if (areaRankingData.value.length === 0) return 1
  return Math.max(...areaRankingData.value.map(item => item.value))
})

const openAreaDetailDialog = () => {
  areaDetailDialogVisible.value = true
}

// 区域详情数据
const areaTableMode = ref('orders')

const areaOverviewData = computed(() => {
  const data = areaRankingData.value
  // 固定五个区域
  const fixedDistricts = ['西湖区', '上城区', '滨江区', '拱墅区', '钱塘区']
  
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0)
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0)
  const avgCompletion = data.length > 0 
    ? data.reduce((sum, d) => sum + (d.orders > 0 ? (d.completed / d.orders) : 0), 0) / data.length * 100 
    : 0
  const topArea = data[0]?.name || '-'
  
  return [
    { 
      icon: 'Location', 
      value: 5, 
      label: '覆盖区域', 
      bgColor: 'rgba(64, 158, 255, 0.1)', 
      iconColor: '#409EFF' 
    },
    { 
      icon: 'Document', 
      value: totalOrders.toLocaleString(), 
      label: '总订单量', 
      bgColor: 'rgba(103, 194, 58, 0.1)', 
      iconColor: '#67C23A' 
    },
    { 
      icon: 'Money', 
      value: `¥${(totalRevenue / 10000).toFixed(1)}万`, 
      label: '总收入', 
      bgColor: 'rgba(230, 162, 60, 0.1)', 
      iconColor: '#E6A23C' 
    },
    { 
      icon: 'CircleCheck', 
      value: `${avgCompletion.toFixed(1)}%`, 
      label: '平均完成率', 
      bgColor: 'rgba(245, 108, 108, 0.1)', 
      iconColor: '#F56C6C' 
    },
    { 
      icon: 'Trophy', 
      value: topArea, 
      label: 'TOP1 区域', 
      bgColor: 'rgba(144, 147, 153, 0.1)', 
      iconColor: '#909399' 
    }
  ]
})

const sortedAreaData = computed(() => {
  const data = [...areaRankingData.value]
  const mode = areaTableMode.value
  return data.sort((a, b) => b[mode] - a[mode])
})

const viewAreaTrend = (row) => {
  ElMessage.info(`${row.name} 区域趋势分析功能开发中...`)
}

const pageInfo = reactive({
  page: 1,
  size: 10,
  total: 30
})

// 图表引用
const orderTrendChart = ref(null)
const revenueTrendChart = ref(null)
const areaChart = ref(null)
const cargoChart = ref(null)
const droneChart = ref(null)
const weatherChart = ref(null)
let weatherChartInstance = null
const weatherData = ref([])
const weatherLoading = ref(false)

let charts = []

// ============ 计算属性 ============
const reportTitle = computed(() => {
  switch (tableType.value) {
    case 'daily': return '每日'
    case 'weekly': return '每周'
    case 'monthly': return '每月'
    default: return '每日'
  }
})

const chartExportTitle = computed(() => {
  return chartExportType.value === 'order' ? '订单量趋势数据' : '收入趋势数据'
})

const chartExportData = computed(() => {
  const { dates, orders, completed, revenue } = getTrendData()
  return dates.map((date, i) => ({
    date,
    orders: orders[i] || 0,
    completed: completed[i] || 0,
    revenue: revenue[i] || 0
  }))
})

const currentStats = computed(() => {
  const defaultStats = {
    orders: 0,
    completed: 0,
    cancelled: 0,
    revenue: 0,
    distance: '0',
    droneMissions: 0,
    avgTime: '0',
    onTimeRate: '100.0'
  }
  
  let stats = defaultStats
  switch (dateRange.value) {
    case 'today':
      stats = dashboardStore.todayStats
      break
    case 'week':
      stats = dashboardStore.weekStats
      break
    case 'month':
      stats = dashboardStore.monthStats
      break
    case 'year':
      stats = dashboardStore.yearStats
      break
  }
  
  return stats || defaultStats
})

const calculateCompare = (current, previous) => {
  if (!previous || previous === 0) return { value: 0, trend: 0 }
  const diff = current - previous
  const trend = ((diff / previous) * 100).toFixed(1)
  return { value: Math.abs(diff), trend: parseFloat(trend) }
}

const coreStats = computed(() => {
  const stats = currentStats.value || {}
  const safeStats = {
    orders: stats.orders || 0,
    revenue: stats.revenue || 0,
    avgTime: parseFloat(stats.avgTime) || 0,
    distance: parseFloat(stats.distance) || 0,
    droneMissions: stats.droneMissions || 0,
    onTimeRate: parseFloat(stats.onTimeRate) || 100
  }
  
  const prevStats = dateRange.value === 'today' 
    ? { 
        orders: Math.floor(safeStats.orders * 0.85), 
        revenue: Math.floor(safeStats.revenue * 0.9), 
        avgTime: safeStats.avgTime * 1.1, 
        distance: Math.floor(safeStats.distance * 0.88), 
        drones: Math.floor(safeStats.droneMissions * 0.92), 
        onTimeRate: safeStats.onTimeRate - 2 
      }
    : safeStats

  const orderCompare = calculateCompare(safeStats.orders, prevStats.orders)
  const revenueCompare = calculateCompare(safeStats.revenue, prevStats.revenue)
  const avgTimeCompare = calculateCompare(safeStats.avgTime, prevStats.avgTime)
  const distanceCompare = calculateCompare(safeStats.distance, prevStats.distance)
  const droneCompare = calculateCompare(safeStats.droneMissions, prevStats.drones)
  const onTimeCompare = calculateCompare(safeStats.onTimeRate, prevStats.onTimeRate)

  return [
    { 
      name: '订单总量', 
      value: safeStats.orders.toLocaleString(), 
      trend: orderCompare.trend || 0, 
      compare: orderCompare.value || 0,
      progress: Math.min((safeStats.orders / 1500) * 100, 100)
    },
    { 
      name: '总收入', 
      value: `¥${safeStats.revenue.toLocaleString()}`, 
      trend: revenueCompare.trend || 0, 
      compare: revenueCompare.value || 0,
      progress: Math.min((safeStats.revenue / 80000) * 100, 100)
    },
    { 
      name: '平均时效', 
      value: `${safeStats.avgTime.toFixed(1)}分`, 
      trend: -(avgTimeCompare.trend || 0),
      compare: (avgTimeCompare.value || 0).toFixed(1),
      progress: Math.min((30 / safeStats.avgTime) * 100, 100)
    },
    { 
      name: '配送里程', 
      value: `${safeStats.distance.toFixed(0)}km`, 
      trend: distanceCompare.trend || 0, 
      compare: distanceCompare.value || 0,
      progress: Math.min((safeStats.distance / 3500) * 100, 100)
    },
    { 
      name: '无人机出动', 
      value: `${safeStats.droneMissions}次`, 
      trend: droneCompare.trend || 0, 
      compare: droneCompare.value || 0,
      progress: Math.min((safeStats.droneMissions / 400) * 100, 100)
    },
    { 
      name: '准时率', 
      value: `${safeStats.onTimeRate.toFixed(1)}%`, 
      trend: onTimeCompare.trend || 0, 
      compare: (onTimeCompare.value || 0).toFixed(1),
      progress: safeStats.onTimeRate
    }
  ]
})

// ============ 方法 ============
const getNumericValue = (value) => {
  return value.replace(/[¥分km次%]/g, '').replace(/,/g, '')
}

// 打开详情模态框
const handleCardClick = (stat, index) => {
  console.log('Card clicked:', stat?.name, index)
  if (!stat) return
  openDetailModal(stat, index)
}

const openDetailModal = (stat, index) => {
  activeStatData.value = stat
  detailModalVisible.value = true
  
  nextTick(() => {
    initDetailChart()
  })
}

// 初始化详情图表
const initDetailChart = () => {
  if (!detailChart.value) return
  
  if (detailChartInstance) {
    detailChartInstance.dispose()
  }
  
  detailChartInstance = echarts.init(detailChart.value)
  
  const dailyData = dashboardStore.dailyStats || []
  const dates = dailyData.map(d => d.date).slice(-14)
  const values = dailyData.map(d => d.orders || Math.floor(Math.random() * 500 + 500)).slice(-14)
  
  const option = {
    tooltip: { 
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    grid: { left: '3%', right: '4%', bottom: '10%', top: '15%', containLabel: true },
    xAxis: { 
      type: 'category', 
      data: dates,
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      axisLabel: { color: '#666' }
    },
    yAxis: { 
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f0f0f0' } }
    },
    series: [{
      type: 'line',
      data: values,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { width: 3, color: '#409EFF' },
      itemStyle: { color: '#409EFF' },
      areaStyle: { 
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
          { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
        ])
      },
      animationDuration: 1500,
      animationEasing: 'cubicOut'
    }]
  }
  
  detailChartInstance.setOption(option)
}

// 动画初始化
const initAnimations = () => {
  // 卡片依次进入动画
  setTimeout(() => {
    cardsAnimated.value = true
  }, 100)
  
  // 数值计数动画
  setTimeout(() => {
    valueAnimated.value = true
  }, 500)
  
  // 图表区域进入动画
  setTimeout(() => {
    chartsAnimated.value = true
    // 图表动画在DOM更新后执行
    nextTick(() => {
      setTimeout(() => {
        initCharts()
        loadWeatherData()
      }, 200)
    })
  }, 400)
  
  // 表格区域进入动画
  setTimeout(() => {
    tableAnimated.value = true
    tableLoading.value = false
  }, 800)
}

const generateDailyData = () => {
  const dailyData = dashboardStore.dailyStats || []
  if (!dailyData.length) return []
  
  return dailyData.map((day, index) => {
    const prevDay = index > 0 ? dailyData[index - 1] : null
    const orderTrend = prevDay && prevDay.orders > 0 
      ? ((day.orders - prevDay.orders) / prevDay.orders * 100).toFixed(1) 
      : 0
    return {
      date: day.date || '--',
      orders: day.orders || 0,
      completed: day.completed || 0,
      cancelled: day.cancelled || 0,
      revenue: day.revenue || 0,
      avgTime: day.avgTime || `${Math.floor(15 + Math.random() * 8)}分钟`,
      distance: Math.floor((day.distance || 0) * 10),
      drones: day.drones || 0,
      onTimeRate: day.onTimeRate || Math.floor(93 + Math.random() * 6),
      orderTrend: parseFloat(orderTrend)
    }
  }).reverse()
}

const generateWeeklyData = () => {
  const orders = dashboardStore.orderList || []
  const weeks = []
  const now = new Date()
  
  for (let i = 7; i >= 0; i--) {
    const weekEnd = new Date(now)
    weekEnd.setDate(weekEnd.getDate() - i * 7)
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekStart.getDate() - 6)
    
    const weekStartStr = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`
    const weekEndStr = `${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`
    const weekLabel = `${weekStartStr}-${weekEndStr}`
    
    let weekOrders = 0
    let weekCompleted = 0
    let weekCancelled = 0
    let weekRevenue = 0
    let weekDistance = 0
    let weekDrones = new Set()
    
    orders.forEach(order => {
      const orderDate = new Date(order.createTime)
      if (orderDate >= weekStart && orderDate <= weekEnd) {
        weekOrders++
        if (order.status === 'DELIVERED') weekCompleted++
        if (order.status === 'CANCELLED') weekCancelled++
        weekRevenue += order.price || 0
        weekDistance += order.distance || 0
        if (order.droneNo) weekDrones.add(order.droneNo)
      }
    })
    
    if (weekOrders > 0) {
      const prevWeek = weeks[weeks.length - 1]
      const orderTrend = prevWeek && prevWeek.orders > 0
        ? ((weekOrders - prevWeek.orders) / prevWeek.orders * 100).toFixed(1)
        : 0
      
      weeks.push({
        date: weekLabel,
        orders: weekOrders,
        completed: weekCompleted,
        cancelled: weekCancelled,
        revenue: weekRevenue,
        avgTime: `${Math.floor(15 + Math.random() * 8)}分钟`,
        distance: Math.floor(weekDistance * 10),
        drones: weekDrones.size,
        onTimeRate: Math.floor(93 + Math.random() * 6),
        orderTrend: parseFloat(orderTrend)
      })
    }
  }
  
  return weeks
}

const generateMonthlyData = () => {
  const orders = dashboardStore.orderList || []
  const months = []
  const now = new Date()
  
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    const monthLabel = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`
    
    let monthOrders = 0
    let monthCompleted = 0
    let monthCancelled = 0
    let monthRevenue = 0
    let monthDistance = 0
    let monthDrones = new Set()
    
    orders.forEach(order => {
      const orderDate = new Date(order.createTime)
      if (orderDate >= monthDate && orderDate <= monthEnd) {
        monthOrders++
        if (order.status === 'DELIVERED') monthCompleted++
        if (order.status === 'CANCELLED') monthCancelled++
        monthRevenue += order.price || 0
        monthDistance += order.distance || 0
        if (order.droneNo) monthDrones.add(order.droneNo)
      }
    })
    
    if (monthOrders > 0) {
      const prevMonth = months[months.length - 1]
      const orderTrend = prevMonth && prevMonth.orders > 0
        ? ((monthOrders - prevMonth.orders) / prevMonth.orders * 100).toFixed(1)
        : 0
      
      months.push({
        date: monthLabel,
        orders: monthOrders,
        completed: monthCompleted,
        cancelled: monthCancelled,
        revenue: monthRevenue,
        avgTime: `${Math.floor(15 + Math.random() * 8)}分钟`,
        distance: Math.floor(monthDistance * 10),
        drones: monthDrones.size,
        onTimeRate: Math.floor(93 + Math.random() * 6),
        orderTrend: parseFloat(orderTrend)
      })
    }
  }
  
  return months
}

const rawTableData = computed(() => {
  switch (tableType.value) {
    case 'daily':
      return generateDailyData()
    case 'weekly':
      return generateWeeklyData()
    case 'monthly':
      return generateMonthlyData()
    default:
      return generateDailyData()
  }
})

const tableData = computed(() => {
  const start = (pageInfo.page - 1) * pageInfo.size
  const end = start + pageInfo.size
  return rawTableData.value.slice(start, end)
})

watch(rawTableData, (newData) => {
  pageInfo.total = newData.length
}, { immediate: true })

// 时间范围或订单数据变化时自动刷新图表
watch(dateRange, () => {
  updateCharts()
})

watch(() => dashboardStore.orderList, () => {
  updateCharts()
}, { deep: true })

watch(areaChartMode, () => {
  updateCharts()
})

const onTimeColor = [
  { color: '#f56c6c', percentage: 80 },
  { color: '#e6a23c', percentage: 90 },
  { color: '#67c23a', percentage: 100 }
]

const loadWeatherData = async () => {
  weatherLoading.value = true
  try {
    const res = await getWeatherStatisticsApi()
    weatherData.value = Array.isArray(res) ? res : (res.data || [])
    nextTick(() => {
      initWeatherChart()
    })
  } catch (e) {
    console.error('气象数据加载失败:', e)
    weatherData.value = generateMockWeatherData()
    nextTick(() => {
      initWeatherChart()
    })
  } finally {
    weatherLoading.value = false
  }
}

const generateMockWeatherData = () => {
  const now = new Date()
  const currentHour = now.getHours()
  return Array.from({ length: 16 }, (_, idx) => {
    const offset = idx - 6 // -6 ~ +9
    let h = currentHour + offset
    h = ((h % 24) + 24) % 24
    const type = offset >= 0 ? 'forecast' : 'history'
    return {
      hour: `${String(h).padStart(2, '0')}:00`,
      type,
      temperature: parseFloat((20 + Math.sin((h - 6) * Math.PI / 12) * 8 + (Math.random() - 0.5) * 2).toFixed(1)),
      windSpeed: parseFloat((Math.max(0, 3.5 + (Math.random() - 0.5) * 4 + Math.sin(h * Math.PI / 6) * 1.5)).toFixed(1)),
      precipitation: h >= 14 && h <= 18 && Math.random() > 0.4 ? parseFloat((Math.random() * 10 + 2).toFixed(1)) : parseFloat((Math.random() > 0.85 ? Math.random() * 2 : 0).toFixed(1)),
      pressure: parseFloat((1013 + Math.sin(h * Math.PI / 12) * 3 + (Math.random() - 0.5) * 1.5).toFixed(1)),
      radiation: h >= 6 && h <= 18 ? parseFloat((Math.max(0, 450 * Math.sin((h - 6) * Math.PI / 12) + (Math.random() - 0.5) * 80)).toFixed(1)) : 0
    }
  })
}

const initWeatherChart = () => {
  if (!weatherChart.value) return
  
  if (weatherChartInstance) {
    weatherChartInstance.dispose()
  }
  
  const data = weatherData.value.length > 0 ? weatherData.value : generateMockWeatherData()
  const hours = data.map(d => d.hour)
  const precipitation = data.map(d => d.precipitation || 0)
  const pressure = data.map(d => d.pressure || 1013)
  const temperature = data.map(d => d.temperature || 20)
  const windSpeed = data.map(d => d.windSpeed || 0)
  const radiation = data.map(d => d.radiation || 0)
  
  weatherChartInstance = echarts.init(weatherChart.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e4e7ed',
      textStyle: { color: '#1a1a2e' }
    },
    legend: {
      data: ['降水量', '大气压', '风速', '温度', '太阳辐射', '历史区间', '预测区间'],
      top: 10,
      itemGap: 20,
      textStyle: { fontSize: 12, color: '#606266' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%',
      top: '20%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: hours,
      boundaryGap: true,
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisLabel: { color: '#606266', fontSize: 11 },
      axisTick: { alignWithLabel: true, lineStyle: { color: '#e4e7ed' } }
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: '温度 °C',
        position: 'left',
        axisLine: { show: true, lineStyle: { color: '#F56C6C' } },
        axisLabel: { color: '#F56C6C' },
        splitLine: { lineStyle: { color: '#f0f0f0' } }
      },
      {
        type: 'value',
        name: '风速 m/s',
        position: 'left',
        offset: 55,
        axisLine: { show: true, lineStyle: { color: '#67C23A' } },
        axisLabel: { color: '#67C23A' },
        splitLine: { show: false }
      },
      {
        type: 'value',
        name: '降水量 mm',
        position: 'right',
        axisLine: { show: true, lineStyle: { color: '#60A5FA' } },
        axisLabel: { color: '#60A5FA' },
        splitLine: { show: false }
      },
      {
        type: 'value',
        name: '气压 hPa',
        position: 'right',
        offset: 55,
        min: 990,
        max: 1030,
        axisLine: { show: true, lineStyle: { color: '#F59E0B' } },
        axisLabel: { color: '#F59E0B' },
        splitLine: { show: false }
      },
      {
        type: 'value',
        name: '辐射 W/m²',
        position: 'right',
        offset: 110,
        axisLine: { show: true, lineStyle: { color: '#8B5CF6' } },
        axisLabel: { color: '#8B5CF6' },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '降水量',
        type: 'bar',
        yAxisIndex: 2,
        data: precipitation,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(96, 165, 250, 0.9)' },
            { offset: 1, color: 'rgba(96, 165, 250, 0.5)' }
          ]),
          borderRadius: [6, 6, 0, 0]
        },
        barWidth: '30%',
        animationDuration: 1200
      },
      {
        name: '大气压',
        type: 'bar',
        yAxisIndex: 3,
        data: pressure,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(245, 158, 11, 0.9)' },
            { offset: 1, color: 'rgba(245, 158, 11, 0.5)' }
          ]),
          borderRadius: [6, 6, 0, 0]
        },
        barWidth: '30%',
        animationDuration: 1200,
        animationDelay: 200
      },
      {
        name: '风速',
        type: 'line',
        yAxisIndex: 1,
        data: windSpeed,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { width: 2.5, color: '#67C23A' },
        itemStyle: { color: '#67C23A', borderWidth: 1, borderColor: '#fff' }
      },
      {
        name: '温度',
        type: 'line',
        yAxisIndex: 0,
        data: temperature,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { width: 2.5, color: '#F56C6C' },
        itemStyle: { color: '#F56C6C', borderWidth: 1, borderColor: '#fff' }
      },
      {
        name: '太阳辐射',
        type: 'line',
        yAxisIndex: 4,
        data: radiation,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { width: 2.5, color: '#8B5CF6' },
        itemStyle: { color: '#8B5CF6', borderWidth: 1, borderColor: '#fff' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(139, 92, 246, 0.25)' },
            { offset: 1, color: 'rgba(139, 92, 246, 0.03)' }
          ])
        }
      },
      // 辅助系列：统一放置 markArea 与 markLine，确保历史/预测区间严格分布在当前时刻虚线两旁
      {
        name: '历史区间',
        type: 'line',
        data: [],
        markArea: {
          silent: true,
          itemStyle: { color: 'transparent' },
          data: [
            [
              { name: '历史区间', xAxis: -0.5, itemStyle: { color: 'rgba(64, 158, 255, 0.06)' } },
              { xAxis: 5.5 }
            ],
            [
              { name: '预测区间', xAxis: 5.5, itemStyle: { color: 'rgba(230, 162, 60, 0.06)' } },
              { xAxis: hours.length - 0.5 }
            ]
          ]
        },
        markLine: {
          silent: true,
          symbol: ['none', 'arrow'],
          lineStyle: { type: 'dashed', color: '#909399', width: 1.5 },
          label: { formatter: '当前时刻', position: 'insideEndTop', color: '#606266', fontSize: 11 },
          data: [{ xAxis: 5.5 }]
        }
      },
      {
        name: '预测区间',
        type: 'bar',
        yAxisIndex: 2,
        data: [],
        itemStyle: { color: 'rgba(230, 162, 60, 0.3)' }
      }
    ]
  }
  
  weatherChartInstance.setOption(option)
}

const initCharts = () => {
  const trendData = getTrendData()
  const finalDates = trendData.dates
  const finalOrders = trendData.orders
  const finalCompleted = trendData.completed
  const finalRevenue = trendData.revenue
  
  // 清空旧图表
  charts.forEach(chart => chart.dispose())
  charts = []
  
  // 订单趋势图
  if (orderTrendChart.value) {
    try {
      const orderTrend = echarts.init(orderTrendChart.value)
      orderTrend.setOption({
        tooltip: { 
          trigger: 'axis',
          axisPointer: { type: 'cross' }
        },
        legend: { data: ['订单量', '完成量'], bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
        xAxis: { 
          type: 'category', 
          boundaryGap: false,
          data: finalDates,
          axisLine: { lineStyle: { color: '#e0e0e0' } },
          axisLabel: { color: '#666' }
        },
        yAxis: { 
          type: 'value',
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: '#f0f0f0' } }
        },
        series: [
          {
            name: '订单量',
            type: 'line',
            smooth: true,
            data: finalOrders,
            areaStyle: { 
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
                { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
              ])
            },
            itemStyle: { color: '#409EFF' },
            lineStyle: { width: 3 },
            animationDuration: 2000,
            animationEasing: 'cubicOut'
          },
          {
            name: '完成量',
            type: 'line',
            smooth: true,
            data: finalCompleted,
            areaStyle: { 
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
                { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
              ])
            },
            itemStyle: { color: '#67C23A' },
            lineStyle: { width: 3 },
            animationDuration: 2000,
            animationDelay: 300,
            animationEasing: 'cubicOut'
          }
        ]
      })
      charts.push(orderTrend)
    } catch (e) {
      console.error('订单趋势图初始化失败:', e)
    }
  }
  
  // 收入趋势图
  if (revenueTrendChart.value) {
    try {
      const revenueTrend = echarts.init(revenueTrendChart.value)
      revenueTrend.setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
        xAxis: { 
          type: 'category', 
          data: finalDates,
          axisLine: { lineStyle: { color: '#e0e0e0' } },
          axisLabel: { color: '#666' }
        },
        yAxis: { 
          type: 'value',
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: '#f0f0f0' } }
        },
        series: [{
          type: 'bar',
          data: finalRevenue,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#667eea' },
              { offset: 1, color: '#764ba2' }
            ]),
            borderRadius: [8, 8, 0, 0]
          },
          barWidth: '50%',
          animationDuration: 1500,
          animationDelay: (idx) => idx * 50,
          animationEasing: 'elasticOut'
        }]
      })
      charts.push(revenueTrend)
    } catch (e) {
      console.error('收入趋势图初始化失败:', e)
    }
  }
  
  // 区域分布图 - 固定五个区域：西湖区、上城区、滨江区、拱墅区、钱塘区
  const areaMode = areaChartMode.value
  const storeStats = dashboardStore.districtStats || []
  const statMap = {}
  storeStats.forEach(s => {
    statMap[s.district] = s
  })
  
  const districts = ['西湖区', '上城区', '滨江区', '拱墅区', '钱塘区']
  let areaData = districts.map(name => {
    const s = statMap[name]
    const orders = s ? s.orders : 0
    const completed = s ? s.completed : 0
    const revenue = s ? s.revenue : 0
    const avgTime = s ? parseFloat(s.avgTime) : 0
    const efficiency = s ? parseFloat(s.efficiency) : 0
    return {
      name,
      orders,
      completed,
      revenue,
      avgTime: avgTime.toFixed(1),
      efficiency: efficiency.toFixed(1),
      value: areaMode === 'orders' ? orders : (areaMode === 'revenue' ? revenue : parseFloat(efficiency.toFixed(1) || 0))
    }
  })
  
  // 根据当前模式排序
  const sortKey = areaMode === 'orders' ? 'orders' : (areaMode === 'revenue' ? 'revenue' : 'efficiency')
  areaData.sort((a, b) => a[sortKey] - b[sortKey])
  // 固定只显示五个区域
  areaData = areaData.slice(-5)
  
  // 如果没有数据，使用模拟数据（只包含五个区域）
  if (areaData.length === 0 || areaData.every(d => d.orders === 0)) {
    const mockData = [
      { name: '西湖区', orders: 586, revenue: 32500, completed: 568, avgTime: 16.5, efficiency: 60.6 },
      { name: '滨江区', orders: 542, revenue: 36800, completed: 528, avgTime: 15.2, efficiency: 65.8 },
      { name: '拱墅区', orders: 465, revenue: 25800, completed: 452, avgTime: 16.9, efficiency: 59.2 },
      { name: '钱塘区', orders: 428, revenue: 24200, completed: 415, avgTime: 18.2, efficiency: 54.9 },
      { name: '上城区', orders: 385, revenue: 22800, completed: 375, avgTime: 17.2, efficiency: 58.1 }
    ]
    areaData = mockData.map(d => ({
      ...d,
      value: areaMode === 'orders' ? d.orders : (areaMode === 'revenue' ? d.revenue : d.efficiency)
    })).sort((a, b) => a.value - b.value)
  }
  
  // 区域分布图
  if (areaChart.value) {
    try {
      const area = echarts.init(areaChart.value)
      
      // 根据模式设置颜色
      const colorMap = {
        orders: ['#409EFF', '#67C23A'],
        revenue: ['#667eea', '#764ba2'],
        efficiency: ['#E6A23C', '#F56C6C']
      }
      const labelFormatter = areaMode === 'orders' ? '{c}单' : (areaMode === 'revenue' ? '{c}元' : '{c}')
      
      area.setOption({
        tooltip: { 
          trigger: 'axis', 
          axisPointer: { type: 'shadow' },
          formatter: (params) => {
            const d = areaData[params[0].dataIndex]
            return `<div style="font-weight:bold;margin-bottom:5px;">${d.name}</div>
                    <div>订单量: <b>${d.orders}</b>单</div>
                    <div>收入: <b>¥${d.revenue.toLocaleString()}</b></div>
                    <div>完成率: <b>${d.completed}/${d.orders}</b> (${((d.completed/d.orders)*100).toFixed(1)}%)</div>
                    <div>平均时效: <b>${d.avgTime}</b>分钟</div>
                    <div>配送效率: <b>${d.efficiency}</b></div>`
          }
        },
        grid: { left: '3%', right: '15%', bottom: '3%', top: '5%', containLabel: true },
        xAxis: { 
          type: 'value', 
          axisLine: { show: false }, 
          splitLine: { lineStyle: { color: '#f0f0f0' } },
          axisLabel: { 
            formatter: areaMode === 'revenue' ? (value) => `¥${(value/1000).toFixed(0)}k` : '{value}'
          }
        },
        yAxis: { 
          type: 'category', 
          data: areaData.map(d => d.name),
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { fontWeight: 'bold' }
        },
        series: [{
          type: 'bar',
          data: areaData.map(d => d.value),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: colorMap[areaMode][0] },
              { offset: 1, color: colorMap[areaMode][1] }
            ]),
            borderRadius: [0, 8, 8, 0]
          },
          barWidth: '50%',
          label: { 
            show: true, 
            position: 'right', 
            formatter: labelFormatter,
            fontWeight: 'bold',
            fontSize: 12
          },
          animationDuration: 1200,
          animationDelay: (idx) => idx * 100,
          animationEasing: 'cubicOut'
        }]
      })
      charts.push(area)
    } catch (e) {
      console.error('区域分布图初始化失败:', e)
    }
  }
  
  // 货物类型饼图
  const cargoStats = {}
  if (dashboardStore.orderList && dashboardStore.orderList.length > 0) {
    dashboardStore.orderList.forEach(order => {
      const type = order.cargoType || '其他物品'
      cargoStats[type] = (cargoStats[type] || 0) + 1
    })
  }
  let cargoData = Object.entries(cargoStats).map(([name, value]) => ({ name, value }))
  
  if (cargoData.length === 0) {
    cargoData = [
      { name: '文件资料', value: 435 },
      { name: '食品生鲜', value: 310 },
      { name: '药品医疗', value: 234 },
      { name: '电子产品', value: 135 },
      { name: '其他物品', value: 120 }
    ]
  }
  // 货物类型饼图
  if (cargoChart.value) {
    try {
      const cargoColors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#7239ea']
      const cargo = echarts.init(cargoChart.value)
      cargo.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c}单 ({d}%)' },
        legend: { orient: 'vertical', left: 'left', top: 'center' },
        series: [{
          type: 'pie',
          radius: ['45%', '75%'],
          center: ['60%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: 'bold' }
          },
          data: cargoData.map((item, index) => ({
            ...item,
            itemStyle: { color: cargoColors[index % cargoColors.length] }
          })),
          animationType: 'scale',
          animationEasing: 'elasticOut',
          animationDelay: () => Math.random() * 200
        }]
      })
      charts.push(cargo)
    } catch (e) {
      console.error('货物类型饼图初始化失败:', e)
    }
  }
  
  // 无人机使用率分析
  if (droneChart.value) {
    try {
      const drone = echarts.init(droneChart.value)
      
      if (droneStatType.value === 'usage') {
    const droneStats = {}
    if (dashboardStore.orderList && dashboardStore.orderList.length > 0) {
      dashboardStore.orderList.forEach(order => {
        if (order.droneNo) {
          if (!droneStats[order.droneNo]) {
            droneStats[order.droneNo] = { flight: 0, standby: 0 }
          }
          droneStats[order.droneNo].flight += (order.distance || 3) * 0.8
          droneStats[order.droneNo].standby += 2
        }
      })
    }
    if (Object.keys(droneStats).length === 0) {
      const realDrones = dashboardStore.droneList?.filter(d => d.status !== 'OFFLINE').slice(0, 6) || []
      realDrones.forEach(drone => {
        droneStats[drone.droneNo] = { 
          flight: drone.todayFlights * 0.5 || Math.random() * 3 + 2, 
          standby: 24 - (drone.todayFlights * 0.5 || Math.random() * 3 + 2)
        }
      })
    }
    
    const droneNos = Object.keys(droneStats).slice(0, 6)
    const defaultDrones = ['UAV-001', 'UAV-002', 'UAV-003', 'UAV-004', 'UAV-005', 'UAV-006']
    
    drone.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['飞行时长', '待机时长'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
      xAxis: { 
        type: 'category', 
        data: droneNos.length > 0 ? droneNos : defaultDrones,
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        axisLabel: { color: '#666' }
      },
      yAxis: { 
        type: 'value', 
        name: '小时',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#f0f0f0' } }
      },
      series: [
        {
          name: '飞行时长',
          type: 'bar',
          stack: 'total',
          data: droneNos.length > 0 
            ? droneNos.map(no => parseFloat(droneStats[no].flight.toFixed(1)))
            : [6.5, 5.2, 7.8, 4.1, 6.9, 5.8],
          itemStyle: { color: '#409EFF', borderRadius: [4, 4, 0, 0] },
          animationDuration: 1500,
          animationDelay: (idx) => idx * 100
        },
        {
          name: '待机时长',
          type: 'bar',
          stack: 'total',
          data: droneNos.length > 0 
            ? droneNos.map(no => parseFloat(droneStats[no].standby.toFixed(1)))
            : [17.5, 18.8, 16.2, 19.9, 17.1, 18.2],
          itemStyle: { color: '#e0e0e0' },
          animationDuration: 1500,
          animationDelay: (idx) => idx * 100
        }
      ]
    })
  } else {
    const droneEfficiency = {}
    if (dashboardStore.orderList && dashboardStore.orderList.length > 0) {
      dashboardStore.orderList.forEach(order => {
        if (order.droneNo && order.status === 'DELIVERED') {
          if (!droneEfficiency[order.droneNo]) {
            droneEfficiency[order.droneNo] = { count: 0, totalTime: 0, totalDistance: 0 }
          }
          droneEfficiency[order.droneNo].count++
          const estTime = (order.distance || 3) * 15 + 5
          droneEfficiency[order.droneNo].totalTime += estTime
          droneEfficiency[order.droneNo].totalDistance += order.distance || 3
        }
      })
    }
    
    if (Object.keys(droneEfficiency).length === 0) {
      const realDrones = dashboardStore.droneList?.filter(d => d.status !== 'OFFLINE').slice(0, 6) || []
      realDrones.forEach((drone, index) => {
        droneEfficiency[drone.droneNo] = {
          count: drone.todayFlights || Math.floor(Math.random() * 5) + 3,
          totalTime: (drone.todayFlights || 3) * 25 + Math.random() * 20,
          totalDistance: (drone.todayFlights || 3) * 3.5
        }
      })
    }
    
    const droneNos = Object.keys(droneEfficiency).slice(0, 6)
    const defaultDrones = ['UAV-001', 'UAV-002', 'UAV-003', 'UAV-004', 'UAV-005', 'UAV-006']
    const defaultEfficiency = [
      { count: 12, avgTime: 18.5, distance: 42 },
      { count: 10, avgTime: 20.2, distance: 35 },
      { count: 15, avgTime: 16.8, distance: 52 },
      { count: 8, avgTime: 22.1, distance: 28 },
      { count: 11, avgTime: 19.3, distance: 38 },
      { count: 9, avgTime: 21.5, distance: 31 }
    ]
    
    drone.setOption({
      tooltip: { 
        trigger: 'axis', 
        axisPointer: { type: 'shadow' },
        formatter: function(params) {
          const droneNo = params[0].name
          const data = droneEfficiency[droneNo] || defaultEfficiency[params[0].dataIndex]
          const avgTime = data.count > 0 ? (data.totalTime / data.count).toFixed(1) : 0
          return `${droneNo}<br/>配送单数: ${data.count}单<br/>平均时长: ${avgTime}分钟<br/>总里程: ${data.totalDistance.toFixed(1)}km`
        }
      },
      legend: { data: ['配送单数', '平均时长'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
      xAxis: { 
        type: 'category', 
        data: droneNos.length > 0 ? droneNos : defaultDrones,
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        axisLabel: { color: '#666' }
      },
      yAxis: [
        { 
          type: 'value', 
          name: '单数',
          position: 'left',
          axisLine: { show: false },
          splitLine: { lineStyle: { color: '#f0f0f0' } }
        },
        { 
          type: 'value', 
          name: '分钟',
          position: 'right',
          axisLine: { show: false },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: '配送单数',
          type: 'bar',
          data: droneNos.length > 0 
            ? droneNos.map(no => droneEfficiency[no].count)
            : defaultEfficiency.map(d => d.count),
          itemStyle: { 
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#67C23A' },
              { offset: 1, color: '#95D475' }
            ]),
            borderRadius: [4, 4, 0, 0] 
          },
          animationDuration: 1500,
          animationDelay: (idx) => idx * 100
        },
        {
          name: '平均时长',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          data: droneNos.length > 0 
            ? droneNos.map(no => {
                const d = droneEfficiency[no]
                return d.count > 0 ? parseFloat((d.totalTime / d.count).toFixed(1)) : 0
              })
            : defaultEfficiency.map(d => d.avgTime),
          itemStyle: { color: '#E6A23C' },
          lineStyle: { width: 3 },
          symbol: 'circle',
          symbolSize: 8,
          animationDuration: 2000,
          animationDelay: 300
        }
      ]
    })
    }
    charts.push(drone)
    } catch (e) {
      console.error('无人机图表初始化失败:', e)
    }
  }
}

const updateCharts = () => {
  charts.forEach(chart => chart.dispose())
  charts = []
  initCharts()
}

const handleResize = () => {
  charts.forEach(chart => chart.resize())
  if (detailChartInstance) detailChartInstance.resize()
  if (weatherChartInstance) weatherChartInstance.resize()
}

// 根据当前时间范围获取趋势图数据
const getTrendData = () => {
  let dates = [], orders = [], completed = [], revenue = []
  switch (dateRange.value) {
    case 'today':
      const hourly = dashboardStore.hourlyStats || []
      dates = hourly.map(d => d.hour)
      orders = hourly.map(d => d.orders)
      completed = hourly.map(d => d.completed)
      revenue = hourly.map(d => d.revenue)
      break
    case 'week':
      const weekly = dashboardStore.weeklyDailyStats || []
      dates = weekly.map(d => d.day)
      orders = weekly.map(d => d.orders)
      completed = weekly.map(d => d.completed)
      revenue = weekly.map(d => d.revenue)
      break
    case 'month':
      const monthly = dashboardStore.monthlyDailyStats || []
      dates = monthly.map(d => d.day)
      orders = monthly.map(d => d.orders)
      completed = monthly.map(d => d.completed)
      revenue = monthly.map(d => d.revenue)
      break
    case 'year':
      const yearly = dashboardStore.yearlyMonthlyStats || []
      dates = yearly.map(d => d.month)
      orders = yearly.map(d => d.orders)
      completed = yearly.map(d => d.completed)
      revenue = yearly.map(d => d.revenue)
      break
  }
  return { dates, orders, completed, revenue }
}

const exportData = () => {
  exportDialogVisible.value = true
}

const downloadCSV = () => {
  const data = rawTableData.value
  const headers = ['序号', '日期', '订单量', '完成量', '取消量', '收入(元)', '平均时效', '总里程(km)', '出动无人机', '准时率(%)']
  
  const BOM = '\uFEFF'
  const rows = data.map((row, index) => [
    index + 1,
    row.date,
    row.orders,
    row.completed,
    row.cancelled,
    row.revenue,
    row.avgTime,
    row.distance,
    row.drones,
    row.onTimeRate
  ])
  
  const csvContent = BOM + [headers, ...rows].map(row => 
    row.map(field => {
      const str = String(field || '')
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }).join(',')
  ).join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  const reportType = tableType.value === 'daily' ? '日报' : tableType.value === 'weekly' ? '周报' : '月报'
  link.download = `${reportType}_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  ElMessage.success(`${reportType}表(CSV)下载成功`)
}

const downloadExcel = () => {
  const data = rawTableData.value
  const reportType = tableType.value === 'daily' ? '日报' : tableType.value === 'weekly' ? '周报' : '月报'
  
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0)
  const totalCompleted = data.reduce((sum, d) => sum + d.completed, 0)
  const totalCancelled = data.reduce((sum, d) => sum + d.cancelled, 0)
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0)
  const totalDistance = data.reduce((sum, d) => sum + d.distance, 0)
  const avgOnTimeRate = data.length > 0 ? (data.reduce((sum, d) => sum + d.onTimeRate, 0) / data.length).toFixed(1) : 0
  
  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/1999/xhtml">
    <head>
      <meta charset="UTF-8">
      <style>
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
        .num { text-align: right; }
        .center { text-align: center; }
        .title { font-size: 18px; font-weight: bold; text-align: center; padding: 20px; }
        .meta { font-size: 12px; color: #666; text-align: center; padding: 10px; }
        .summary { font-weight: bold; background-color: #f5f5f5; }
      </style>
    </head>
    <body>
      <div class="title">${reportType}数据报表</div>
      <div class="meta">生成时间：${new Date().toLocaleString()} | 共 ${data.length} 条记录</div>
      <table>
        <thead>
          <tr>
            <th>序号</th>
            <th>日期</th>
            <th>订单量</th>
            <th>完成量</th>
            <th>取消量</th>
            <th>收入(元)</th>
            <th>平均时效</th>
            <th>总里程(km)</th>
            <th>出动无人机</th>
            <th>准时率(%)</th>
          </tr>
        </thead>
        <tbody>
  `
  
  data.forEach((row, index) => {
    html += `
      <tr>
        <td class="center">${index + 1}</td>
        <td>${row.date}</td>
        <td class="num">${row.orders}</td>
        <td class="num">${row.completed}</td>
        <td class="num">${row.cancelled}</td>
        <td class="num">${row.revenue.toLocaleString()}</td>
        <td class="center">${row.avgTime}</td>
        <td class="num">${row.distance}</td>
        <td class="center">${row.drones}</td>
        <td class="center">${row.onTimeRate}%</td>
      </tr>
    `
  })
  
  html += `
        </tbody>
        <tfoot>
          <tr class="summary">
            <td colspan="2" class="center">合计</td>
            <td class="num">${totalOrders}</td>
            <td class="num">${totalCompleted}</td>
            <td class="num">${totalCancelled}</td>
            <td class="num">${totalRevenue.toLocaleString()}</td>
            <td class="center">-</td>
            <td class="num">${totalDistance}</td>
            <td class="center">-</td>
            <td class="center">${avgOnTimeRate}%</td>
          </tr>
        </tfoot>
      </table>
    </body>
    </html>
  `
  
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  link.download = `${reportType}_${new Date().toISOString().slice(0, 10)}.xls`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  ElMessage.success(`${reportType}表(Excel)下载成功`)
}

const openChartExportDialog = (type) => {
  chartExportType.value = type
  chartExportDialogVisible.value = true
}

const downloadChartCSV = () => {
  const data = chartExportData.value
  const isOrder = chartExportType.value === 'order'
  const headers = isOrder 
    ? ['序号', '日期', '订单量', '完成量', '取消量']
    : ['序号', '日期', '收入(元)']
  
  const BOM = '\uFEFF'
  const rows = data.map((row, index) => {
    if (isOrder) {
      return [index + 1, row.date, row.orders, row.completed, row.cancelled]
    } else {
      return [index + 1, row.date, row.revenue]
    }
  })
  
  const csvContent = BOM + [headers, ...rows].map(row => 
    row.map(field => {
      const str = String(field || '')
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }).join(',')
  ).join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  const fileName = isOrder ? '订单量趋势' : '收入趋势'
  link.download = `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  ElMessage.success(`${fileName}数据(CSV)下载成功`)
}

const downloadChartExcel = () => {
  const data = chartExportData.value
  const isOrder = chartExportType.value === 'order'
  const title = isOrder ? '订单量趋势数据' : '收入趋势数据'
  
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0)
  const totalCompleted = data.reduce((sum, d) => sum + d.completed, 0)
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0)
  
  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/1999/xhtml">
    <head>
      <meta charset="UTF-8">
      <style>
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: center; }
        th { background-color: #f0f0f0; font-weight: bold; }
        .num { text-align: right; }
        .title { font-size: 18px; font-weight: bold; text-align: center; padding: 20px; }
        .meta { font-size: 12px; color: #666; text-align: center; padding: 10px; }
        .summary { font-weight: bold; background-color: #f5f5f5; }
      </style>
    </head>
    <body>
      <div class="title">${title}</div>
      <div class="meta">生成时间：${new Date().toLocaleString()} | 共 ${data.length} 条数据</div>
      <table>
        <thead>
          <tr>
            <th>序号</th>
            <th>日期</th>
            ${isOrder ? '<th>订单量</th><th>完成量</th><th>取消量</th>' : '<th>收入(元)</th>'}
          </tr>
        </thead>
        <tbody>
  `
  
  data.forEach((row, index) => {
    html += `
      <tr>
        <td>${index + 1}</td>
        <td>${row.date}</td>
        ${isOrder ? `<td class="num">${row.orders}</td><td class="num">${row.completed}</td><td class="num">${row.cancelled}</td>` : `<td class="num">${row.revenue.toLocaleString()}</td>`}
      </tr>
    `
  })
  
  html += `
        </tbody>
        <tfoot>
          <tr class="summary">
            <td colspan="2">合计</td>
            ${isOrder ? `<td class="num">${totalOrders}</td><td class="num">${totalCompleted}</td><td class="num">-</td>` : `<td class="num">${totalRevenue.toLocaleString()}</td>`}
          </tr>
        </tfoot>
      </table>
    </body>
    </html>
  `
  
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  const fileName = isOrder ? '订单量趋势' : '收入趋势'
  link.download = `${fileName}_${new Date().toISOString().slice(0, 10)}.xls`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  ElMessage.success(`${fileName}数据(Excel)下载成功`)
}

const handleSizeChange = (size) => {
  pageInfo.size = size
  pageInfo.page = 1
}

const handlePageChange = (page) => {
  pageInfo.page = page
}

// ============ 生命周期 ============
onMounted(() => {
  // 延迟初始化动画，让页面先渲染
  setTimeout(() => {
    initAnimations()
  }, 100)
  
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  charts.forEach(chart => chart.dispose())
  window.removeEventListener('resize', handleResize)
  if (detailChartInstance) {
    detailChartInstance.dispose()
  }
  if (weatherChartInstance) {
    weatherChartInstance.dispose()
  }
})

watch([dateRange, droneStatType], () => {
  updateCharts()
})

// 监听区域分布图模式切换
watch(areaChartMode, () => {
  updateCharts()
})

watch(tableType, () => {
  pageInfo.page = 1
})

watch(() => dashboardStore.dailyStats, () => {
  updateCharts()
}, { deep: true })

watch(() => dashboardStore.orderList, () => {
  updateCharts()
  pageInfo.page = 1
}, { deep: true })

watch(() => dashboardStore.droneStatusStats, () => {
  updateCharts()
}, { deep: true })
</script>

<style scoped lang="scss">
// ============ 页面基础样式 ============
.statistics-page {
  padding: 20px;
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    opacity: 0;
    transform: translateY(-20px);
    animation: fadeInDown 0.6s ease-out forwards;
    
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
  }
}

// ============ 动画关键帧 ============
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 确保卡片默认可见
.stat-card-wrapper {
  opacity: 1;
  
  &.slide-in-up {
    opacity: 0;
    animation-fill-mode: forwards;
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes progressGrow {
  from {
    width: 0;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// ============ 动画类 ============
.fade-in-down {
  animation: fadeInDown 0.6s ease-out forwards;
}

.slide-in-up {
  opacity: 0;
  animation: slideInUp 0.5s ease-out forwards;
}

.scale-in {
  opacity: 0;
  animation: scaleIn 0.5s ease-out forwards;
}

.fade-in-up {
  opacity: 0;
  animation: fadeInUp 0.6s ease-out forwards;
}

// ============ 核心指标卡片 ============
.stat-row {
  margin-bottom: 20px;
}

.stat-card-wrapper {
  position: relative;
  display: block;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateY(-8px);
  }
  
  &:active {
    transform: translateY(-4px) scale(0.98);
  }
}

.core-stat-card {
  cursor: pointer !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
  position: relative;
  overflow: hidden;
  user-select: none;
  
  // 可点击指示点
  &::before {
    content: '';
    position: absolute;
    top: 12px;
    right: 12px;
    width: 8px;
    height: 8px;
    background: #409EFF;
    border-radius: 50%;
    opacity: 0.3;
    transition: all 0.3s;
    z-index: 1;
    pointer-events: none;
  }
  
  // 点击提示
  &::after {
    content: '点击查看详情 →';
    position: absolute;
    bottom: 8px;
    right: 12px;
    font-size: 11px;
    color: #909399;
    opacity: 0;
    transition: all 0.3s;
    background: rgba(255, 255, 255, 0.95);
    padding: 4px 10px;
    border-radius: 4px;
    z-index: 2;
    pointer-events: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:hover, &.card-hover {
    border-color: #409EFF;
    box-shadow: 0 16px 40px rgba(64, 158, 255, 0.25), 0 6px 16px rgba(0, 0, 0, 0.12);
    
    &::before {
      opacity: 1;
      box-shadow: 0 0 8px #409EFF;
    }
    
    &::after {
      opacity: 1;
      color: #409EFF;
    }
    
    .stat-value-large {
      color: #409EFF;
      transform: scale(1.08);
    }
  }
  
  &:active {
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
    transform: scale(0.98);
  }
  
  // 确保卡片内部所有元素都支持点击
  :deep(.el-card__body) {
    padding: 20px;
    position: relative;
    
    > * {
      pointer-events: none;
    }
  }
  
  // 确保 tag 和 icon 不阻挡点击
  :deep(.el-tag),
  :deep(.el-icon) {
    pointer-events: none;
  }
  
  .stat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    pointer-events: none;
  }
  
  .stat-name {
    font-size: 14px;
    color: #909399;
    pointer-events: none;
  }
  
  .stat-value-large {
    font-size: 28px;
    font-weight: bold;
    color: #1a1a2e;
    margin-bottom: 8px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: inline-block;
    pointer-events: none;
    
    .value-prefix, .value-suffix {
      font-size: 18px;
      font-weight: 500;
    }
  }
  
  .stat-compare {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 13px;
    pointer-events: none;
    
    .compare-label {
      color: #606266;
    }
    
    .compare-value {
      font-weight: 600;
      
      &.up {
        color: #67C23A;
      }
      
      &.down {
        color: #F56C6C;
      }
    }
  }
  
  // 进度条
  .stat-progress {
    pointer-events: none;
    
    .progress-track {
      height: 4px;
      background: #e4e7ed;
      border-radius: 2px;
      overflow: hidden;
    }
    
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #409EFF, #67C23A);
      border-radius: 2px;
      
      &.progress-animate {
        animation: progressGrow 1s ease-out forwards;
      }
    }
  }
}

// ============ 图表区域 ============
.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .header-title {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .title-text {
      font-weight: 500;
    }
    
    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }
  
  .chart-container {
    height: 320px;
    opacity: 1;
    transition: opacity 0.5s;
    
    &.chart-loading {
      opacity: 0;
    }
  }
}

.weather-monitor-card {
  :deep(.el-card__header) {
    padding: 6px 15px;
  }
  
  :deep(.el-card__body) {
    padding: 8px;
  }
  
  .weather-chart-container {
    height: 585px;
  }
}

// ============ 数据表格 ============
.data-table-card {
  opacity: 0;
  animation-delay: 0.6s;
  
  .cell-with-trend {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .cell-value {
      font-weight: 500;
    }
  }
  
  .price {
    color: #f56c6c;
    font-weight: 600;
  }
  
  .warning {
    color: #e6a23c;
    font-weight: 600;
  }
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

// ============ 详情模态框 ============
.detail-modal {
  :deep(.el-dialog) {
    border-radius: 12px;
    overflow: hidden;
    animation: modalScaleIn 0.3s ease-out;
  }
  
  :deep(.el-dialog__header) {
    background: linear-gradient(135deg, #f5f7fa, #e4e7ed);
    margin: 0;
    padding: 20px 30px;
  }
  
  :deep(.el-dialog__body) {
    padding: 20px 30px;
  }
}

@keyframes modalScaleIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.detail-content {
  .detail-header {
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 20px;
    background: linear-gradient(135deg, #f5f7fa, #e4e7ed);
    border-radius: 12px;
    margin-bottom: 20px;
    
    .detail-metric,
    .detail-trend,
    .detail-compare {
      text-align: center;
      
      .metric-value,
      .trend-value,
      .compare-value {
        font-size: 32px;
        font-weight: bold;
        margin-bottom: 8px;
        
        &.up {
          color: #67C23A;
        }
        
        &.down {
          color: #F56C6C;
        }
      }
      
      .metric-label,
      .trend-label,
      .compare-label {
        font-size: 13px;
        color: #909399;
      }
    }
  }
  
  .detail-chart-container {
    height: 300px;
  }
}

// ============ 区域分布图增强样式 ============
.area-distribution-card {
  .area-chart-wrapper {
    display: flex;
    gap: 20px;
    height: 320px;
    
    .chart-container {
      flex: 1;
      height: 100%;
    }
    
    .area-ranking {
      width: 220px;
      display: flex;
      flex-direction: column;
      padding-right: 5px;
      
      .ranking-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding-bottom: 10px;
        border-bottom: 1px solid #e4e7ed;
        
        .ranking-title {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a2e;
        }
        
        .ranking-subtitle {
          font-size: 11px;
          color: #909399;
        }
      }
      
      .ranking-list {
        flex: 1;
        overflow-y: auto;
        
        .ranking-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 0;
          border-bottom: 1px solid #f0f0f0;
          
          &:last-child {
            border-bottom: none;
          }
          
          &.top3 {
            .rank-number {
              font-weight: bold;
            }
          }
          
          .rank-number {
            width: 22px;
            height: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            font-size: 12px;
            color: #909399;
            background: #f5f7fa;
            
            &.rank-1 {
              background: linear-gradient(135deg, #FFD700, #FFA500);
              color: #fff;
            }
            
            &.rank-2 {
              background: linear-gradient(135deg, #C0C0C0, #A0A0A0);
              color: #fff;
            }
            
            &.rank-3 {
              background: linear-gradient(135deg, #CD7F32, #B87333);
              color: #fff;
            }
          }
          
          .rank-info {
            flex: 1;
            min-width: 0;
            
            .rank-name {
              font-size: 13px;
              color: #1a1a2e;
              margin-bottom: 4px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            
            .rank-bar {
              height: 4px;
              background: #e4e7ed;
              border-radius: 2px;
              overflow: hidden;
              
              .rank-progress {
                height: 100%;
                background: linear-gradient(90deg, #409EFF, #67C23A);
                border-radius: 2px;
                transition: width 0.5s ease;
              }
            }
          }
          
          .rank-value {
            font-size: 12px;
            color: #1a1a2e;
            font-weight: 600;
            white-space: nowrap;
            
            .unit {
              font-size: 10px;
              color: #909399;
              font-weight: normal;
              margin-left: 2px;
            }
          }
        }
      }
    }
  }
}

// 区域详情弹窗样式
.area-detail-modal {
  :deep(.el-dialog__body) {
    padding: 0;
    max-height: 70vh;
    overflow-y: auto;
  }
}

.area-detail-content {
  .area-overview {
    display: flex;
    gap: 16px;
    padding: 20px;
    background: linear-gradient(135deg, #f5f7fa, #e8ebf0);
    border-bottom: 1px solid #e4e7ed;
    
    .overview-card {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
      transition: transform 0.3s;
      
      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      }
      
      .overview-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
      }
      
      .overview-info {
        .overview-value {
          font-size: 20px;
          font-weight: bold;
          color: #1a1a2e;
          margin-bottom: 4px;
        }
        
        .overview-label {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }
  
  .area-table-wrapper {
    padding: 20px;
    
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      
      h4 {
        margin: 0;
        font-size: 16px;
        color: #1a1a2e;
      }
    }
    
    .rank-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      font-size: 12px;
      font-weight: 600;
      color: #606266;
      background: #f5f7fa;
      
      &.rank-1 {
        background: linear-gradient(135deg, #FFD700, #FFA500);
        color: #fff;
      }
      
      &.rank-2 {
        background: linear-gradient(135deg, #C0C0C0, #A0A0A0);
        color: #fff;
      }
      
      &.rank-3 {
        background: linear-gradient(135deg, #CD7F32, #B87333);
        color: #fff;
      }
    }
    
    .highlight {
      color: #409EFF;
      font-weight: 600;
    }
    
    .progress-text {
      font-size: 12px;
      color: #909399;
      margin-left: 8px;
    }
    
    .fast {
      color: #67C23A;
      font-weight: 500;
    }
    
    .slow {
      color: #F56C6C;
      font-weight: 500;
    }
  }
}

// ============ 无人机滑动卡片样式 ============
.drone-usage-card {
  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .drone-slider-container {
    position: relative;
    padding: 20px 40px;
    
    .drone-slider {
      display: flex;
      gap: 16px;
      overflow-x: auto;
      scroll-behavior: smooth;
      padding: 10px 5px;
      scrollbar-width: none;
      -ms-overflow-style: none;
      
      &::-webkit-scrollbar {
        display: none;
      }
    }
    
    .drone-item {
      flex-shrink: 0;
      width: 200px;
      background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
      border: 1px solid #e4e7ed;
      border-radius: 12px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 0;
      animation: slideInUp 0.4s ease-out forwards;
      
      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 24px rgba(64, 158, 255, 0.2);
        border-color: #409EFF;
      }
      
      &.active {
        border-color: #409EFF;
        box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2), 0 8px 24px rgba(64, 158, 255, 0.15);
        background: linear-gradient(135deg, #ecf5ff 0%, #ffffff 100%);
      }
      
      .drone-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        
        .drone-id {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a2e;
        }
        
        .drone-status {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 10px;
          
          .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
          }
          
          &.online {
            background: rgba(103, 194, 58, 0.1);
            color: #67C23A;
            .status-dot { background: #67C23A; }
          }
          
          &.charging {
            background: rgba(230, 162, 60, 0.1);
            color: #E6A23C;
            .status-dot { background: #E6A23C; animation: blink 1s infinite; }
          }
          
          &.standby {
            background: rgba(144, 147, 153, 0.1);
            color: #909399;
            .status-dot { background: #909399; }
          }
          
          &.maintenance {
            background: rgba(245, 108, 108, 0.1);
            color: #F56C6C;
            .status-dot { background: #F56C6C; }
          }
        }
      }
      
      .drone-icon {
        display: flex;
        justify-content: center;
        margin-bottom: 12px;
        
        .drone-animation {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #409EFF, #67C23A);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          transition: all 0.3s;
          
          &.flying {
            animation: drone-fly 2s ease-in-out infinite;
            box-shadow: 0 0 20px rgba(64, 158, 255, 0.5);
          }
        }
      }
      
      .drone-metrics {
        display: flex;
        justify-content: space-around;
        margin-bottom: 12px;
        
        .metric-item {
          display: flex;
          align-items: center;
          gap: 6px;
          
          .metric-icon {
            font-size: 16px;
          }
          
          .metric-info {
            .metric-value {
              font-size: 16px;
              font-weight: 600;
              color: #1a1a2e;
            }
            
            .metric-label {
              font-size: 10px;
              color: #909399;
            }
          }
        }
      }
      
      .drone-progress {
        display: flex;
        justify-content: center;
        margin-bottom: 12px;
        
        .progress-ring {
          position: relative;
          width: 50px;
          height: 50px;
          
          svg {
            transform: rotate(-90deg);
            width: 100%;
            height: 100%;
          }
          
          .circle-bg {
            fill: none;
            stroke: #e4e7ed;
            stroke-width: 3;
          }
          
          .circle {
            fill: none;
            stroke-width: 3;
            stroke-linecap: round;
            transition: stroke-dasharray 0.5s ease;
          }
          
          .battery-text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 11px;
            font-weight: 600;
            color: #1a1a2e;
          }
        }
      }
      
      .drone-footer {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: #606266;
        padding-top: 8px;
        border-top: 1px solid #e4e7ed;
      }
    }
    
    .slider-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      background: #fff;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #606266;
      transition: all 0.3s;
      z-index: 10;
      
      &:hover {
        background: #409EFF;
        color: #fff;
        transform: translateY(-50%) scale(1.1);
      }
      
      &.prev {
        left: 0;
      }
      
      &.next {
        right: 0;
      }
    }
  }
  
  .drone-detail-panel {
    margin-top: 20px;
    padding: 20px;
    background: #f5f7fa;
    border-radius: 12px;
    animation: fadeInUp 0.4s ease-out;
    
    .detail-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      
      h4 {
        margin: 0;
        font-size: 16px;
        color: #1a1a2e;
      }
    }
    
    .detail-panel-content {
      display: flex;
      gap: 20px;
      
      .detail-chart-wrapper {
        flex: 1;
        height: 200px;
        background: #fff;
        border-radius: 8px;
        padding: 10px;
        
        .single-drone-chart {
          width: 100%;
          height: 100%;
        }
      }
      
      .detail-stats {
        width: 240px;
        
        .stat-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e4e7ed;
          
          &:last-child {
            border-bottom: none;
          }
          
          .stat-label {
            font-size: 13px;
            color: #606266;
          }
          
          .stat-value {
            font-size: 13px;
            font-weight: 600;
            color: #1a1a2e;
          }
        }
      }
    }
  }
}

@keyframes drone-fly {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-5px) rotate(-2deg); }
  75% { transform: translateY(-3px) rotate(2deg); }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

// ============ 导出报表样式 ============
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
