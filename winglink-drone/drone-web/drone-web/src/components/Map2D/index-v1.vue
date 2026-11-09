<template>
  <div class="map-container">
    <canvas ref="mapCanvas" class="map-canvas" />
    
    <!-- 图例 -->
    <div class="map-legend">
      <div class="legend-title">杭州市区空域图</div>
      <div class="legend-subtitle">GCJ-02坐标系 | 真实地理数据</div>
      <div class="legend-items">
        <div class="legend-item">
          <span class="dot" style="background: #67C23A;"></span>
          <span>配送点</span>
        </div>
        <div class="legend-item">
          <span class="line" style="background: #409EFF;"></span>
          <span>航线</span>
        </div>
        <div class="legend-item">
          <span class="zone forbidden"></span>
          <span>禁飞区</span>
        </div>
        <div class="legend-item">
          <span class="zone limited"></span>
          <span>限飞区</span>
        </div>
      </div>
    </div>

    <!-- 区域标签 -->
    <div class="district-labels">
      <div class="district" style="left: 8%; top: 42%;">余杭区</div>
      <div class="district" style="left: 28%; top: 30%;">拱墅区</div>
      <div class="district" style="left: 22%; top: 52%;">西湖区</div>
      <div class="district main" style="left: 38%; top: 55%;">上城区</div>
      <div class="district" style="left: 52%; top: 75%;">萧山区</div>
      <div class="district" style="left: 72%; top: 45%;">钱塘区</div>
      <div class="district" style="left: 58%; top: 22%;">临平区</div>
      <div class="district" style="left: 55%; top: 60%;">滨江区</div>
    </div>

    <!-- 坐标显示 -->
    <div class="coordinate-display" v-if="hoverPoint">
      {{ hoverPoint.name }}: {{ hoverPoint.lng.toFixed(4) }}, {{ hoverPoint.lat.toFixed(4) }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  routes: { type: Array, default: () => [] },
  zones: { type: Array, default: () => [] },
  deliveryPoints: { type: Array, default: () => [] }
})

const mapCanvas = ref(null)
const hoverPoint = ref(null)

// 杭州市区边界 (GCJ-02 坐标系)
const HANGZHOU_BOUNDS = {
  minLng: 119.90,  // 西边界
  maxLng: 120.50,  // 东边界
  minLat: 30.10,   // 南边界
  maxLat: 30.45    // 北边界
}

// 真实地标数据 (GCJ-02 坐标系)
const HANGZHOU_LANDMARKS = [
  // 交通枢纽
  { id: 1, name: '萧山机场', lng: 120.4323, lat: 30.2295, type: 'airport', icon: '✈️' },
  { id: 2, name: '杭州站', lng: 120.1804, lat: 30.2471, type: 'transport', icon: '🚄' },
  { id: 3, name: '杭州东站', lng: 120.2116, lat: 30.2936, type: 'transport', icon: '🚅' },
  { id: 4, name: '杭州西站', lng: 119.9685, lat: 30.2916, type: 'transport', icon: '🚆' },
  
  // 西湖景区
  { id: 5, name: '断桥', lng: 120.1498, lat: 30.2596, type: 'scenic', icon: '🌉' },
  { id: 6, name: '雷峰塔', lng: 120.1488, lat: 30.2311, type: 'scenic', icon: '🗼' },
  { id: 7, name: '西湖', lng: 120.1420, lat: 30.2425, type: 'scenic', icon: '🏞️' },
  { id: 8, name: '苏堤', lng: 120.1367, lat: 30.2359, type: 'scenic', icon: '🌿' },
  { id: 9, name: '白堤', lng: 120.1459, lat: 30.2586, type: 'scenic', icon: '🌸' },
  { id: 10, name: '曲院风荷', lng: 120.1240, lat: 30.2628, type: 'scenic', icon: '🪷' },
  { id: 11, name: '花港观鱼', lng: 120.1358, lat: 30.2278, type: 'scenic', icon: '🐟' },
  { id: 12, name: '岳王庙', lng: 120.1274, lat: 30.2584, type: 'scenic', icon: '⛩️' },
  
  // 商圈
  { id: 13, name: '湖滨银泰', lng: 120.1625, lat: 30.2545, type: 'business', icon: '🏬' },
  { id: 14, name: '杭州大厦', lng: 120.1635, lat: 30.2756, type: 'business', icon: '🏢' },
  { id: 15, name: '武林商圈', lng: 120.1660, lat: 30.2730, type: 'business', icon: '🛍️' },
  { id: 16, name: '钱江新城', lng: 120.2110, lat: 30.2560, type: 'business', icon: '🌆' },
  { id: 17, name: '滨江商圈', lng: 120.2120, lat: 30.2080, type: 'business', icon: '🏦' },
  { id: 18, name: '下沙商圈', lng: 120.3200, lat: 30.3030, type: 'business', icon: '🏪' },
  { id: 19, name: '未来科技城', lng: 119.9950, lat: 30.2810, type: 'business', icon: '🔬' },
  { id: 20, name: '万象城', lng: 120.2090, lat: 30.2570, type: 'business', icon: '🏙️' },
  
  // 高校
  { id: 21, name: '浙大紫金港', lng: 120.0850, lat: 30.3010, type: 'school', icon: '🎓' },
  { id: 22, name: '浙大玉泉', lng: 120.1250, lat: 30.2650, type: 'school', icon: '📚' },
  
  // 政府
  { id: 23, name: '杭州市政府', lng: 120.2120, lat: 30.2500, type: 'gov', icon: '🏛️' },
  
  // 公园
  { id: 24, name: '西溪湿地', lng: 120.0650, lat: 30.2650, type: 'park', icon: '🦆' },
  { id: 25, name: '湘湖', lng: 120.2350, lat: 30.1350, type: 'park', icon: '🚣' },
  { id: 26, name: '良渚古城', lng: 119.9850, lat: 30.4200, type: 'park', icon: '🏛️' },
  
  // 医院
  { id: 27, name: '浙一医院', lng: 120.1750, lat: 30.2550, type: 'hospital', icon: '🏥' },
  { id: 28, name: '浙二医院', lng: 120.1800, lat: 30.2500, type: 'hospital', icon: '🏥' },
  
  // 体育场馆
  { id: 29, name: '奥体中心', lng: 120.2350, lat: 30.2300, type: 'sports', icon: '🏟️' },
  { id: 30, name: '黄龙体育中心', lng: 120.1350, lat: 30.2700, type: 'sports', icon: '⚽' },
]

// 钱塘江主要点坐标（GCJ-02）
const QIANTANG_RIVER_POINTS = [
  { lng: 120.50, lat: 30.38 },  // 东北
  { lng: 120.42, lat: 30.32 },
  { lng: 120.35, lat: 30.28 },
  { lng: 120.28, lat: 30.25 },
  { lng: 120.22, lat: 30.22 },
  { lng: 120.18, lat: 30.18 },
  { lng: 120.15, lat: 30.15 },
  { lng: 120.12, lat: 30.12 },  // 西南
]

// 京杭大运河主要点
const GRAND_CANAL_POINTS = [
  { lng: 119.95, lat: 30.32 },
  { lng: 120.05, lat: 30.31 },
  { lng: 120.15, lat: 30.30 },
  { lng: 120.25, lat: 30.29 },
  { lng: 120.35, lat: 30.28 },
]

// 坐标转换：GCJ-02 -> Canvas
const gcj02ToCanvas = (lng, lat) => {
  const { minLng, maxLng, minLat, maxLat } = HANGZHOU_BOUNDS
  const canvasWidth = 900
  const canvasHeight = 900
  
  const x = ((lng - minLng) / (maxLng - minLng)) * canvasWidth
  const y = canvasHeight - ((lat - minLat) / (maxLat - minLat)) * canvasHeight
  
  return { x, y }
}

// 绘制地图
const drawMap = () => {
  const canvas = mapCanvas.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height
  
  // 清空画布
  ctx.fillStyle = '#fefce8'
  ctx.fillRect(0, 0, w, h)
  
  // 绘制区域背景
  drawDistrictBackgrounds(ctx)
  
  // 绘制网格
  drawGrid(ctx)
  
  // 绘制水域
  drawWaters(ctx)
  
  // 绘制禁飞区和限飞区
  drawZones(ctx)
  
  // 绘制地标点
  drawLandmarks(ctx)
  
  // 绘制航线
  drawRoutes(ctx)
  
  // 绘制配送点
  drawDeliveryPoints(ctx)
  
  // 绘制props传入的空域限制区
  drawPropZones(ctx)
  
  // 绘制坐标轴
  drawCoordinates(ctx)
}

// 绘制区域背景
const drawDistrictBackgrounds = (ctx) => {
  // 西湖区
  const xihu = gcj02ToCanvas(120.13, 30.25)
  ctx.fillStyle = 'rgba(34, 197, 94, 0.06)'
  ctx.beginPath()
  ctx.ellipse(xihu.x, xihu.y, 120, 90, -0.2, 0, Math.PI * 2)
  ctx.fill()
  
  // 萧山区
  const xiaoshan = gcj02ToCanvas(120.27, 30.18)
  ctx.fillStyle = 'rgba(251, 146, 60, 0.06)'
  ctx.beginPath()
  ctx.ellipse(xiaoshan.x, xiaoshan.y, 150, 100, 0, 0, Math.PI * 2)
  ctx.fill()
  
  // 钱塘区
  const qiantang = gcj02ToCanvas(120.35, 30.30)
  ctx.fillStyle = 'rgba(96, 165, 250, 0.06)'
  ctx.beginPath()
  ctx.ellipse(qiantang.x, qiantang.y, 100, 80, 0, 0, Math.PI * 2)
  ctx.fill()
  
  // 余杭区
  const yuhang = gcj02ToCanvas(119.98, 30.32)
  ctx.fillStyle = 'rgba(168, 85, 247, 0.05)'
  ctx.beginPath()
  ctx.ellipse(yuhang.x, yuhang.y, 140, 110, 0, 0, Math.PI * 2)
  ctx.fill()
  
  // 滨江区
  const binjiang = gcj02ToCanvas(120.21, 30.21)
  ctx.fillStyle = 'rgba(236, 72, 153, 0.05)'
  ctx.beginPath()
  ctx.ellipse(binjiang.x, binjiang.y, 80, 60, 0, 0, Math.PI * 2)
  ctx.fill()
}

// 绘制网格
const drawGrid = (ctx) => {
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 0.5
  
  for (let i = 0; i < 900; i += 50) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, 900)
    ctx.stroke()
  }
  for (let i = 0; i < 600; i += 50) {
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(900, i)
    ctx.stroke()
  }
}

// 绘制水域
const drawWaters = (ctx) => {
  // 绘制钱塘江
  ctx.fillStyle = '#dbeafe'
  ctx.strokeStyle = '#60a5fa'
  ctx.lineWidth = 2
  
  ctx.beginPath()
  const riverPoints = QIANTANG_RIVER_POINTS.map(p => gcj02ToCanvas(p.lng, p.lat))
  
  // 上边界
  ctx.moveTo(riverPoints[0].x - 25, riverPoints[0].y - 15)
  for (let i = 1; i < riverPoints.length; i++) {
    const prev = riverPoints[i-1]
    const curr = riverPoints[i]
    const xc = (prev.x + curr.x) / 2
    const yc = (prev.y + curr.y) / 2
    ctx.quadraticCurveTo(prev.x - 25, prev.y - 15, xc - 25, yc - 15)
  }
  
  // 下边界
  for (let i = riverPoints.length - 1; i >= 0; i--) {
    const curr = riverPoints[i]
    if (i > 0) {
      const prev = riverPoints[i-1]
      const xc = (curr.x + prev.x) / 2
      const yc = (curr.y + prev.y) / 2
      ctx.quadraticCurveTo(curr.x + 25, curr.y + 15, xc + 25, yc + 15)
    } else {
      ctx.lineTo(curr.x + 25, curr.y + 15)
    }
  }
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  
  // 钱塘江标签
  ctx.save()
  ctx.fillStyle = '#3b82f6'
  ctx.font = 'bold 13px sans-serif'
  const riverLabel = gcj02ToCanvas(120.32, 30.28)
  ctx.translate(riverLabel.x, riverLabel.y)
  ctx.rotate(-0.5)
  ctx.fillText('钱塘江', 0, 0)
  ctx.restore()
  
  // 绘制京杭大运河
  ctx.strokeStyle = '#93c5fd'
  ctx.lineWidth = 8
  ctx.beginPath()
  const canalPoints = GRAND_CANAL_POINTS.map(p => gcj02ToCanvas(p.lng, p.lat))
  ctx.moveTo(canalPoints[0].x, canalPoints[0].y)
  for (let i = 1; i < canalPoints.length; i++) {
    ctx.lineTo(canalPoints[i].x, canalPoints[i].y)
  }
  ctx.stroke()
  
  ctx.fillStyle = '#3b82f6'
  ctx.font = 'bold 11px sans-serif'
  const canalLabel = gcj02ToCanvas(120.10, 30.31)
  ctx.fillText('京杭大运河', canalLabel.x, canalLabel.y)
  
  // 绘制西湖
  const xihu = gcj02ToCanvas(120.142, 30.2425)
  ctx.fillStyle = '#93c5fd'
  ctx.strokeStyle = '#60a5fa'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(xihu.x, xihu.y, 70, 50, 0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  
  ctx.fillStyle = '#1e40af'
  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('西湖', xihu.x, xihu.y + 5)
}

// 绘制禁飞区和限飞区
const drawZones = (ctx) => {
  // 萧山机场禁飞区 (10km)
  const airport = gcj02ToCanvas(120.4323, 30.2295)
  ctx.fillStyle = 'rgba(239, 68, 68, 0.12)'
  ctx.strokeStyle = '#ef4444'
  ctx.lineWidth = 2
  ctx.setLineDash([8, 4])
  ctx.beginPath()
  ctx.arc(airport.x, airport.y, 60, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = '#dc2626'
  ctx.font = 'bold 10px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('萧山机场禁飞区', airport.x, airport.y - 65)
  
  // 西湖核心禁飞区
  const xihuZone = gcj02ToCanvas(120.142, 30.2425)
  ctx.fillStyle = 'rgba(239, 68, 68, 0.12)'
  ctx.strokeStyle = '#ef4444'
  ctx.setLineDash([8, 4])
  ctx.beginPath()
  ctx.arc(xihuZone.x, xihuZone.y, 45, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = '#dc2626'
  ctx.font = 'bold 10px sans-serif'
  ctx.fillText('西湖禁飞区', xihuZone.x, xihuZone.y - 50)
  
  // 市政府禁飞区
  const gov = gcj02ToCanvas(120.212, 30.25)
  ctx.fillStyle = 'rgba(239, 68, 68, 0.12)'
  ctx.strokeStyle = '#ef4444'
  ctx.setLineDash([8, 4])
  ctx.beginPath()
  ctx.arc(gov.x, gov.y, 25, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.setLineDash([])
  
  // 限飞区
  const limitedZones = [
    { lng: 120.1804, lat: 30.2471, name: '杭州站' },
    { lng: 120.2116, lat: 30.2936, name: '杭州东站' },
    { lng: 120.235, lat: 30.23, name: '奥体中心' },
  ]
  
  limitedZones.forEach(zone => {
    const pos = gcj02ToCanvas(zone.lng, zone.lat)
    ctx.fillStyle = 'rgba(245, 158, 11, 0.10)'
    ctx.strokeStyle = '#f59e0b'
    ctx.setLineDash([6, 3])
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.setLineDash([])
  })
}

// 绘制地标点
const drawLandmarks = (ctx) => {
  HANGZHOU_LANDMARKS.forEach(lm => {
    const pos = gcj02ToCanvas(lm.lng, lm.lat)
    
    // 绘制图标背景
    ctx.fillStyle = getLandmarkColor(lm.type)
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2)
    ctx.fill()
    
    // 白边
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // 绘制图标
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(lm.icon, pos.x, pos.y)
    
    // 绘制名称（重要地标才显示）
    if (['airport', 'transport', 'scenic', 'sports', 'gov'].includes(lm.type)) {
      ctx.fillStyle = '#1e293b'
      ctx.font = 'bold 10px sans-serif'
      ctx.fillText(lm.name, pos.x, pos.y + 20)
    }
  })
}

// 获取地标颜色
const getLandmarkColor = (type) => {
  const colors = {
    airport: '#f87171',
    transport: '#a78bfa',
    scenic: '#f472b6',
    business: '#60a5fa',
    park: '#4ade80',
    school: '#fbbf24',
    gov: '#9ca3af',
    hospital: '#fb7185',
    sports: '#2dd4bf',
    landmark: '#94a3b8'
  }
  return colors[type] || '#94a3b8'
}

// 绘制航线
const drawRoutes = (ctx) => {
  props.routes.forEach(route => {
    if (!route.points || route.points.length < 2) return
    
    const color = route.color || '#409EFF'
    
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.beginPath()
    
    route.points.forEach((point, i) => {
      if (i === 0) ctx.moveTo(point[0], point[1])
      else ctx.lineTo(point[0], point[1])
    })
    ctx.stroke()
    
    // 航点
    route.points.forEach((point, i) => {
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(point[0], point[1], 5, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(point[0], point[1], 2, 0, Math.PI * 2)
      ctx.fill()
    })
  })
}

// 绘制配送点
const drawDeliveryPoints = (ctx) => {
  props.deliveryPoints.forEach(point => {
    ctx.fillStyle = '#22c55e'
    ctx.beginPath()
    ctx.arc(point.x, point.y, 8, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2)
    ctx.fill()
    
    if (point.name) {
      ctx.fillStyle = '#166534'
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(point.name, point.x, point.y - 12)
    }
  })
}

// 绘制props传入的空域限制区
const drawPropZones = (ctx) => {
  props.zones.forEach(zone => {
    if (!zone.center || !zone.radius) return
    
    const isForbidden = zone.type === 'forbidden'
    const color = isForbidden ? '#ef4444' : '#f59e0b'
    
    ctx.fillStyle = color + '25'
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.setLineDash([6, 3])
    
    ctx.beginPath()
    ctx.arc(zone.center[0], zone.center[1], zone.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    
    ctx.setLineDash([])
    
    if (zone.name) {
      ctx.fillStyle = color
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(zone.name, zone.center[0], zone.center[1] + 4)
    }
  })
}

// 绘制坐标轴参考
const drawCoordinates = (ctx) => {
  ctx.fillStyle = '#9ca3af'
  ctx.font = '9px sans-serif'
  ctx.textAlign = 'left'
  
  // 四角坐标标注
  const corners = [
    { x: 10, y: 15, lng: HANGZHOU_BOUNDS.minLng, lat: HANGZHOU_BOUNDS.maxLat },
    { x: 850, y: 15, lng: HANGZHOU_BOUNDS.maxLng, lat: HANGZHOU_BOUNDS.maxLat },
    { x: 10, y: 890, lng: HANGZHOU_BOUNDS.minLng, lat: HANGZHOU_BOUNDS.minLat },
    { x: 820, y: 890, lng: HANGZHOU_BOUNDS.maxLng, lat: HANGZHOU_BOUNDS.minLat },
  ]
  
  corners.forEach(c => {
    ctx.fillText(`${c.lng.toFixed(2)}, ${c.lat.toFixed(2)}`, c.x, c.y)
  })
}

const initCanvas = () => {
  const canvas = mapCanvas.value
  if (!canvas) return
  
  canvas.width = 900
  canvas.height = 900
  
  // 添加鼠标事件
  canvas.addEventListener('mousemove', handleMouseMove)
  
  drawMap()
}

// 鼠标移动处理
const handleMouseMove = (e) => {
  const canvas = mapCanvas.value
  if (!canvas) return
  
  const rect = canvas.getBoundingClientRect()
  const x = (e.clientX - rect.left) * (900 / rect.width)
  const y = (e.clientY - rect.top) * (900 / rect.height)
  
  // 查找附近的地标
  let found = null
  for (const lm of HANGZHOU_LANDMARKS) {
    const pos = gcj02ToCanvas(lm.lng, lm.lat)
    const dist = Math.sqrt((pos.x - x) ** 2 + (pos.y - y) ** 2)
    if (dist < 15) {
      found = { name: lm.name, lng: lm.lng, lat: lm.lat }
      break
    }
  }
  
  hoverPoint.value = found
}

onMounted(() => {
  initCanvas()
})

watch(() => props.routes, drawMap, { deep: true })
watch(() => props.zones, drawMap, { deep: true })
watch(() => props.deliveryPoints, drawMap, { deep: true })
</script>

<style scoped lang="scss">
.map-container {
  position: relative;
  width: 100%;
  height: 900px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: center;
  align-items: center;
}

.map-canvas {
  width: 900px;
  height: 900px;
  cursor: crosshair;
}

.map-legend {
  position: absolute;
  bottom: 16px;
  left: 16px;
  background: rgba(255, 255, 255, 0.98);
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  
  .legend-title {
    font-weight: 600;
    font-size: 13px;
    color: #1e293b;
    margin-bottom: 4px;
  }
  
  .legend-subtitle {
    font-size: 10px;
    color: #9ca3af;
    margin-bottom: 8px;
  }
  
  .legend-items {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #475569;
    
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    
    .line {
      width: 20px;
      height: 3px;
      border-radius: 2px;
    }
    
    .zone {
      width: 16px;
      height: 10px;
      border-radius: 2px;
      
      &.forbidden {
        background: repeating-linear-gradient(
          45deg,
          #ef4444,
          #ef4444 2px,
          #fee2e2 2px,
          #fee2e2 4px
        );
        border: 1px solid #ef4444;
      }
      
      &.limited {
        background: repeating-linear-gradient(
          45deg,
          #f59e0b,
          #f59e0b 2px,
          #fef3c7 2px,
          #fef3c7 4px
        );
        border: 1px solid #f59e0b;
      }
    }
  }
}

.district-labels {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  
  .district {
    position: absolute;
    font-size: 14px;
    font-weight: 600;
    color: #64748b;
    text-shadow: 0 1px 2px rgba(255,255,255,0.8);
    opacity: 0.5;
    
    &.main {
      font-size: 16px;
      color: #374151;
      opacity: 0.7;
    }
  }
}

.coordinate-display {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.95);
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 11px;
  color: #4b5563;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-family: monospace;
}
</style>
