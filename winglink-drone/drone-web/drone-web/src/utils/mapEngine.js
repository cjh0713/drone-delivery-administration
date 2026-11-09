// 模拟地图引擎
export class SimulatedMap {
  constructor(canvasId, config = {}) {
    this.canvas = document.getElementById(canvasId)
    if (!this.canvas) return
    
    this.ctx = this.canvas.getContext('2d')
    this.config = {
      width: 1200,
      height: 800,
      gridSize: 50,
      ...config
    }
    this.canvas.width = this.config.width
    this.canvas.height = this.config.height
    
    this.drones = []
    this.routes = []
    this.buildings = config.buildings || this.generateBuildings()
    this.roads = config.roads || this.generateRoads()
    this.noFlyZones = config.noFlyZones || this.generateNoFlyZones()
    
    this.animationId = null
  }

  // 生成默认建筑物
  generateBuildings() {
    return [
      { id: 1, type: 'office', x: 100, y: 100, width: 80, height: 100, name: '科技园A座' },
      { id: 2, type: 'office', x: 200, y: 100, width: 70, height: 90, name: '科技园B座' },
      { id: 3, type: 'hospital', x: 800, y: 150, width: 120, height: 120, name: '市立医院' },
      { id: 4, type: 'school', x: 700, y: 500, width: 150, height: 100, name: '第一中学' },
      { id: 5, type: 'mall', x: 300, y: 550, width: 100, height: 80, name: '购物中心' },
      { id: 6, type: 'bank', x: 600, y: 300, width: 80, height: 60, name: '中国银行' },
      { id: 7, type: 'factory', x: 50, y: 600, width: 150, height: 120, name: '物流园区' },
      { id: 8, type: 'residential', x: 450, y: 100, width: 60, height: 70, name: '阳光小区' },
      { id: 9, type: 'residential', x: 550, y: 100, width: 60, height: 70, name: '锦绣花园' },
      { id: 10, type: 'residential', x: 450, y: 200, width: 60, height: 70, name: '翡翠城' },
      { id: 11, type: 'park', x: 350, y: 300, width: 150, height: 150, name: '中央公园' },
    ]
  }

  // 生成道路
  generateRoads() {
    return [
      { id: 1, points: [[0, 250], [1200, 250]], type: 'main', name: '中山路' },
      { id: 2, points: [[0, 500], [1200, 500]], type: 'main', name: '解放路' },
      { id: 3, points: [[300, 0], [300, 800]], type: 'main', name: '建设大道' },
      { id: 4, points: [[700, 0], [700, 800]], type: 'main', name: '人民路' },
      { id: 5, points: [[500, 250], [500, 500]], type: 'secondary' },
      { id: 6, points: [[300, 400], [700, 400]], type: 'secondary' },
    ]
  }

  // 生成禁飞区
  generateNoFlyZones() {
    return [
      { id: 1, center: [600, 375], radius: 80, type: 'airport', name: '机场禁飞区' },
      { id: 2, center: [850, 550], radius: 60, type: 'military', name: '军事管理区' },
    ]
  }

  // 获取建筑物颜色
  getBuildingColor(type) {
    const colors = {
      office: '#a8c5e2',
      hospital: '#f5b5b5',
      school: '#b8e6b8',
      mall: '#ffe4b5',
      bank: '#e6e6fa',
      factory: '#d3d3d3',
      residential: '#f0e68c',
      park: '#90ee90'
    }
    return colors[type] || '#e0e0e0'
  }

  // 初始化地图
  init() {
    this.drawBackground()
    this.drawGrid()
    this.drawRoads()
    this.drawBuildings()
    this.drawNoFlyZones()
  }

  // 绘制背景
  drawBackground() {
    this.ctx.fillStyle = '#f8f9fa'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  // 绘制网格
  drawGrid() {
    const { ctx, config } = this
    ctx.strokeStyle = '#e8e8e8'
    ctx.lineWidth = 1
    
    for (let x = 0; x <= config.width; x += config.gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, config.height)
      ctx.stroke()
    }
    for (let y = 0; y <= config.height; y += config.gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(config.width, y)
      ctx.stroke()
    }
  }

  // 绘制道路
  drawRoads() {
    const { ctx } = this
    this.roads.forEach(road => {
      ctx.strokeStyle = road.type === 'main' ? '#7f8c8d' : '#95a5a6'
      ctx.lineWidth = road.type === 'main' ? 12 : 8
      ctx.lineCap = 'round'
      
      ctx.beginPath()
      ctx.moveTo(road.points[0][0], road.points[0][1])
      ctx.lineTo(road.points[1][0], road.points[1][1])
      ctx.stroke()
      
      // 道路中心线
      ctx.strokeStyle = '#ecf0f1'
      ctx.lineWidth = 2
      ctx.setLineDash([10, 10])
      ctx.beginPath()
      ctx.moveTo(road.points[0][0], road.points[0][1])
      ctx.lineTo(road.points[1][0], road.points[1][1])
      ctx.stroke()
      ctx.setLineDash([])
    })
  }

  // 绘制建筑物
  drawBuildings() {
    const { ctx } = this
    this.buildings.forEach(b => {
      // 建筑主体
      ctx.fillStyle = this.getBuildingColor(b.type)
      ctx.fillRect(b.x, b.y, b.width, b.height)
      
      // 建筑边框
      ctx.strokeStyle = '#666'
      ctx.lineWidth = 1
      ctx.strokeRect(b.x, b.y, b.width, b.height)
      
      // 建筑标签
      ctx.fillStyle = '#333'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(b.name, b.x + b.width / 2, b.y - 5)
      
      // 建筑图标
      this.drawBuildingIcon(b)
    })
  }

  // 绘制建筑物图标
  drawBuildingIcon(b) {
    const { ctx } = this
    const cx = b.x + b.width / 2
    const cy = b.y + b.height / 2
    
    ctx.fillStyle = '#fff'
    ctx.font = '16px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    const icons = {
      office: '🏢',
      hospital: '🏥',
      school: '🏫',
      mall: '🏬',
      bank: '🏦',
      factory: '🏭',
      residential: '🏠',
      park: '🌳'
    }
    
    ctx.fillText(icons[b.type] || '📦', cx, cy)
  }

  // 绘制禁飞区
  drawNoFlyZones() {
    const { ctx } = this
    this.noFlyZones.forEach(zone => {
      // 填充区域
      ctx.fillStyle = 'rgba(231, 76, 60, 0.3)'
      ctx.beginPath()
      ctx.arc(zone.center[0], zone.center[1], zone.radius, 0, Math.PI * 2)
      ctx.fill()
      
      // 边框
      ctx.strokeStyle = 'rgba(231, 76, 60, 0.8)'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.arc(zone.center[0], zone.center[1], zone.radius, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
      
      // 禁飞标识
      ctx.fillStyle = '#c0392b'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('⛔ ' + zone.name, zone.center[0], zone.center[1] + zone.radius + 15)
    })
  }

  // 绘制无人机
  drawDrone(drone) {
    const { ctx } = this
    const { x, y, direction = 0, battery = 100 } = drone
    
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((direction * Math.PI) / 180)
    
    // 无人机主体
    ctx.fillStyle = battery > 20 ? '#3498db' : '#e74c3c'
    ctx.beginPath()
    ctx.moveTo(0, -15)
    ctx.lineTo(12, 10)
    ctx.lineTo(0, 5)
    ctx.lineTo(-12, 10)
    ctx.closePath()
    ctx.fill()
    
    // 螺旋桨
    ctx.strokeStyle = '#2c3e50'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(-15, -5)
    ctx.lineTo(15, -5)
    ctx.stroke()
    
    ctx.restore()
    
    // 电量指示
    ctx.fillStyle = '#333'
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${battery}%`, x, y + 28)
  }

  // 绘制航线
  drawRoute(route) {
    const { ctx } = this
    const points = [route.start, ...(route.waypoints || []), route.end]
    
    if (points.length < 2) return
    
    // 航线
    ctx.strokeStyle = route.color || '#3498db'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.setLineDash([8, 4])
    
    ctx.beginPath()
    ctx.moveTo(points[0][0], points[0][1])
    
    // 使用贝塞尔曲线平滑连接
    for (let i = 1; i < points.length; i++) {
      const xc = (points[i][0] + points[i-1][0]) / 2
      const yc = (points[i][1] + points[i-1][1]) / 2
      ctx.quadraticCurveTo(points[i-1][0], points[i-1][1], xc, yc)
    }
    ctx.lineTo(points[points.length-1][0], points[points.length-1][1])
    ctx.stroke()
    
    ctx.setLineDash([])
    
    // 起点终点标记
    this.drawMarker(points[0], '起', '#27ae60')
    this.drawMarker(points[points.length-1], '终', '#e74c3c')
    
    // 途经点
    if (route.waypoints) {
      route.waypoints.forEach((wp, idx) => {
        this.drawMarker(wp, `${idx + 1}`, '#f39c12', 16)
      })
    }
  }

  // 绘制标记点
  drawMarker(point, text, color, size = 24) {
    const { ctx } = this
    const [x, y] = point
    
    // 背景圆
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, size / 2, 0, Math.PI * 2)
    ctx.fill()
    
    // 文字
    ctx.fillStyle = '#fff'
    ctx.font = `bold ${size * 0.6}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, x, y)
  }

  // 添加无人机
  addDrone(drone) {
    this.drones.push(drone)
  }

  // 更新无人机位置
  updateDrone(id, position) {
    const drone = this.drones.find(d => d.id === id)
    if (drone) {
      Object.assign(drone, position)
    }
  }

  // 添加航线
  addRoute(route) {
    this.routes.push(route)
  }

  // 清除航线
  clearRoutes() {
    this.routes = []
  }

  // 动画循环
  animate() {
    this.init()
    
    this.routes.forEach(r => this.drawRoute(r))
    this.drones.forEach(d => this.drawDrone(d))
    
    this.animationId = requestAnimationFrame(() => this.animate())
  }

  // 停止动画
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
  }

  // 坐标转换：屏幕坐标转地图坐标
  screenToMap(x, y) {
    const rect = this.canvas.getBoundingClientRect()
    return [x - rect.left, y - rect.top]
  }

  // 检查点是否在禁飞区
  isInNoFlyZone(point) {
    const [x, y] = point
    return this.noFlyZones.some(zone => {
      const dx = x - zone.center[0]
      const dy = y - zone.center[1]
      return Math.sqrt(dx * dx + dy * dy) < zone.radius
    })
  }
}

// 路径规划算法
export function planRoute(start, end, noFlyZones) {
  const waypoints = []
  
  // 简化的路径规划：如果直线穿过禁飞区，则添加避让点
  for (const zone of noFlyZones) {
    if (lineIntersectsCircle(start, end, zone.center, zone.radius)) {
      // 计算避让点
      const avoidPoint = calculateAvoidPoint(start, end, zone)
      waypoints.push(avoidPoint)
    }
  }
  
  // 计算总距离
  let distance = 0
  const allPoints = [start, ...waypoints, end]
  for (let i = 1; i < allPoints.length; i++) {
    distance += pointDistance(allPoints[i-1], allPoints[i])
  }
  
  // 预计时间（假设速度 15m/s）
  const duration = Math.round(distance / 15)
  
  // 风险评估
  const riskLevel = waypoints.length > 1 ? 'HIGH' : waypoints.length > 0 ? 'MEDIUM' : 'LOW'
  
  return {
    start,
    end,
    waypoints,
    distance: Math.round(distance / 10) / 100, // 转换为km
    duration,
    riskLevel
  }
}

// 直线与圆相交检测
function lineIntersectsCircle(p1, p2, center, radius) {
  const [x1, y1] = p1
  const [x2, y2] = p2
  const [cx, cy] = center
  
  const dx = x2 - x1
  const dy = y2 - y1
  const fx = x1 - cx
  const fy = y1 - cy
  
  const a = dx * dx + dy * dy
  const b = 2 * (fx * dx + fy * dy)
  const c = fx * fx + fy * fy - radius * radius
  
  const discriminant = b * b - 4 * a * c
  
  if (discriminant < 0) return false
  
  const t1 = (-b - Math.sqrt(discriminant)) / (2 * a)
  const t2 = (-b + Math.sqrt(discriminant)) / (2 * a)
  
  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1)
}

// 计算避让点
function calculateAvoidPoint(start, end, zone) {
  const [x1, y1] = start
  const [x2, y2] = end
  const [cx, cy] = zone.center
  
  // 计算垂直避让方向
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  
  const perpX = -dy / len
  const perpY = dx / len
  
  // 避让距离
  const avoidDistance = zone.radius + 50
  
  // 选择避让方向
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2
  
  const dir = (midX - cx) * perpX + (midY - cy) * perpY > 0 ? 1 : -1
  
  return [
    cx + perpX * avoidDistance * dir,
    cy + perpY * avoidDistance * dir
  ]
}

// 两点距离
function pointDistance(p1, p2) {
  const dx = p2[0] - p1[0]
  const dy = p2[1] - p1[1]
  return Math.sqrt(dx * dx + dy * dy)
}
