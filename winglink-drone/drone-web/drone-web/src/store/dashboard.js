import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

// localStorage 存储键名
const STORAGE_KEY = 'drone_dashboard_data_v3'
const STORAGE_TIMESTAMP_KEY = 'drone_dashboard_timestamp_v3'

// 从 localStorage 加载数据
const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.warn('Failed to load data from localStorage:', e)
  }
  return null
}

// 站点数据：1总部 + 3分部 + 8站点
export const STATIONS = [
  { id: 'hq', name: '西湖总部', type: 'HQ', lng: 120.1420, lat: 30.2425, coord: [650, 350] },
  { id: 'b1', name: '滨江分部', type: 'BRANCH', lng: 120.2120, lat: 30.2080, coord: [900, 500] },
  { id: 'b2', name: '余杭分部', type: 'BRANCH', lng: 119.9950, lat: 30.2810, coord: [100, 200] },
  { id: 'b3', name: '上城分部', type: 'BRANCH', lng: 120.2110, lat: 30.2560, coord: [850, 450] },
  { id: 's1', name: '西湖站点', type: 'STATION', lng: 120.1498, lat: 30.2596, coord: [620, 320] },
  { id: 's2', name: '上城站点', type: 'STATION', lng: 120.1804, lat: 30.2471, coord: [600, 250] },
  { id: 's3', name: '滨江站点', type: 'STATION', lng: 120.2350, lat: 30.2300, coord: [920, 480] },
  { id: 's4', name: '拱墅站点', type: 'STATION', lng: 120.1660, lat: 30.2730, coord: [600, 300] },
  { id: 's5', name: '钱塘站点', type: 'STATION', lng: 120.3200, lat: 30.3030, coord: [1000, 100] },
  { id: 's6', name: '余杭站点', type: 'STATION', lng: 119.9685, lat: 30.2916, coord: [150, 250] },
  { id: 's7', name: '萧山站点', type: 'STATION', lng: 120.4323, lat: 30.2295, coord: [950, 650] },
  { id: 's8', name: '西溪站点', type: 'STATION', lng: 120.0650, lat: 30.2650, coord: [100, 300] }
]

// 根据地址或坐标查找最近站点
export const getNearestStation = (addressOrCoord) => {
  let coord
  if (Array.isArray(addressOrCoord)) {
    coord = addressOrCoord
  } else {
    coord = getAddressCoord(addressOrCoord)
  }
  if (!coord) return STATIONS[0]
  let nearest = STATIONS[0]
  let minDist = Infinity
  STATIONS.forEach(station => {
    const dx = station.coord[0] - coord[0]
    const dy = station.coord[1] - coord[1]
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < minDist) {
      minDist = dist
      nearest = station
    }
  })
  return nearest
}

// 地点坐标映射（基于 canvas 坐标系的相对位置，用于距离估算）
const locationCoords = {
  '科技园A座': [100, 100],
  '科技园B座': [200, 100],
  '市立医院': [800, 150],
  '第一中学': [700, 500],
  '购物中心': [300, 550],
  '中国银行': [600, 300],
  '物流园区': [50, 600],
  '阳光小区': [450, 100],
  '锦绣花园': [550, 100],
  '翡翠城': [450, 200],
  '中央公园': [350, 300],
  '总部基地': [150, 150],
  '机场T3': [600, 375],
  '充电站1号': [100, 700],
  '充电站2号': [200, 700],
  '维修中心': [300, 700],
  '希尔顿酒店': [900, 300],
  '建设大街': [600, 250],
  '滨江高新园区': [900, 500],
  '西湖景区入口': [350, 300],
  '浙江大学': [100, 200],
  '浙一医院': [800, 150],
  '武林广场': [600, 300],
  '城站火车站': [600, 250],
  '杭州东站': [900, 250],
  '市民中心': [700, 400],
  '萧山机场': [950, 650],
  '杭州站': [600, 250],
  '杭州西站': [150, 250],
  '湖滨银泰': [650, 350],
  '杭州大厦': [550, 150],
  '钱江新城': [850, 450],
  '滨江商圈': [900, 500],
  '下沙商圈': [1000, 100],
  '浙大紫金港': [100, 200],
  '浙大清河坊': [650, 350],
  '浙大玉泉': [150, 100],
  '西湖区政府': [150, 150],
  '余杭区政府': [100, 250],
  '良渚古城': [50, 50],
  '皋亭山': [800, 50],
  '西溪湿地': [100, 300],
  '京杭大运河': [500, 50],
  '浙二医院': [650, 350],
  '邵逸夫医院': [700, 400],
  '黄龙体育中心': [150, 100],
  '西湖总部': [650, 350],
  '滨江分部': [900, 500],
  '余杭分部': [100, 200],
  '上城分部': [850, 450],
  '西湖站点': [620, 320],
  '上城站点': [600, 250],
  '滨江站点': [920, 480],
  '拱墅站点': [600, 300],
  '钱塘站点': [1000, 100],
  '余杭站点': [150, 250],
  '萧山站点': [950, 650],
  '西溪站点': [100, 300],
  '充电站': [150, 700]
}

// 根据地址获取坐标（通过关键词匹配）
const getAddressCoord = (address) => {
  if (!address) return null
  // 直接匹配
  if (locationCoords[address]) return locationCoords[address]
  // 关键词匹配
  for (const [key, coord] of Object.entries(locationCoords)) {
    if (address.includes(key)) return coord
  }
  return null
}

// 计算两点之间的距离（km，基于相对坐标估算）
const calculateCoordDistance = (coord1, coord2) => {
  if (!coord1 || !coord2) return null
  const dx = coord2[0] - coord1[0]
  const dy = coord2[1] - coord1[1]
  // 相对坐标到 km 的换算系数（根据现有订单距离校准）
  const scale = 0.015
  return Math.sqrt(dx * dx + dy * dy) * scale
}

// 根据坐标查找最近的地标名称
const getNearestLocation = (coord) => {
  if (!coord) return null
  let nearest = null
  let minDistance = Infinity
  for (const [key, keyCoord] of Object.entries(locationCoords)) {
    const dx = keyCoord[0] - coord[0]
    const dy = keyCoord[1] - coord[1]
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < minDistance) {
      minDistance = dist
      nearest = key
    }
  }
  return nearest
}

// 生成初始订单数据（日期基于当前真实日期动态生成，确保今日/本周/本月/全年数据层次分明）
const generateInitialOrders = () => {
  const orders = []
  const cargoTypes = ['文件资料', '食品生鲜', '药品医疗', '电子产品', '服装鞋帽', '其他物品']
  const addresses = [
    { sender: '西湖区科技园A座301室', receiver: '上城区市立医院门诊楼', distance: 2.5, district: '上城区' },
    { sender: '拱墅区物流园区B区', receiver: '钱塘区购物中心3楼', distance: 3.2, district: '钱塘区' },
    { sender: '拱墅区阳光小区5号楼', receiver: '钱塘区第一中学教学楼', distance: 1.8, district: '钱塘区' },
    { sender: '滨江区滨江高新园区', receiver: '西湖区浙江大学图书馆', distance: 4.5, district: '西湖区' },
    { sender: '滨江区滨江高新园区', receiver: '钱塘区市民中心', distance: 5.6, district: '钱塘区' },
    { sender: '西湖区西湖景区入口', receiver: '滨江区杭州东站', distance: 8.3, district: '滨江区' },
    { sender: '西湖区浙江大学', receiver: '上城区浙一医院', distance: 3.7, district: '上城区' },
    { sender: '上城区武林广场', receiver: '拱墅区城站火车站', distance: 6.2, district: '拱墅区' },
    { sender: '钱塘区购物中心3楼', receiver: '西湖区西溪湿地北门', distance: 5.1, district: '西湖区' },
    { sender: '上城区市立医院门诊楼', receiver: '滨江区萧山机场T4', distance: 9.2, district: '滨江区' },
    { sender: '拱墅区物流园区B区', receiver: '西湖区良渚古城遗址', distance: 4.8, district: '西湖区' },
    { sender: '滨江区网易大厦', receiver: '拱墅区京杭大运河博物馆', distance: 6.5, district: '拱墅区' },
    { sender: '钱塘区第一中学教学楼', receiver: '上城区杭州大厦购物城', distance: 5.3, district: '上城区' },
    { sender: '西湖区浙大玉泉校区', receiver: '滨江区华为研究所', distance: 4.2, district: '滨江区' },
    { sender: '拱墅区锦绣花园8栋', receiver: '钱塘区中国银行大厦', distance: 4.1, district: '钱塘区' }
  ]
  
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const currentDate = now.getDate()
  const todayStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDate).padStart(2, '0')}`
  
  // 生成今日订单（非历史，用于首页今日统计）
  for (let i = 1; i <= 25; i++) {
    const addr = addresses[i % addresses.length]
    const status = i <= 8 ? 'DELIVERING' : (i <= 12 ? 'PENDING' : (i <= 18 ? 'ASSIGNED' : 'DELIVERED'))
    const progress = status === 'DELIVERING' ? Math.floor(Math.random() * 60) + 20 : (status === 'DELIVERED' ? 100 : 0)
    
    orders.push({
      id: i,
      orderNo: `DR${currentYear}${String(currentMonth).padStart(2, '0')}${String(currentDate).padStart(2, '0')}${String(i).padStart(3, '0')}`,
      senderName: `寄件人${i}`,
      senderPhone: `1380013${String(8000 + i).padStart(4, '0')}`,
      senderAddress: addr.sender,
      receiverName: `收件人${i}`,
      receiverPhone: `1380013${String(9000 + i).padStart(4, '0')}`,
      receiverAddress: addr.receiver,
      district: addr.district,
      cargoType: cargoTypes[i % cargoTypes.length],
      cargoWeight: parseFloat((0.5 + Math.random() * 3).toFixed(1)),
      price: Math.floor(25 + Math.random() * 50),
      status: status,
      droneNo: status === 'PENDING' ? null : `UAV-${String(i % 10 + 1).padStart(3, '0')}`,
      progress: progress,
      distance: addr.distance,
      deliveryTime: status === 'DELIVERED' ? Math.floor(12 + Math.random() * 15) : null,
      estimatedTime: 20,
      isOnTime: status === 'DELIVERED' ? Math.random() > 0.05 : null,
      createTime: `${todayStr} ${String(8 + Math.floor(Math.random() * 12)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
      completeTime: status === 'DELIVERED' ? `${todayStr} ${String(8 + Math.floor(Math.random() * 12)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00` : null,
      remark: i % 3 === 0 ? '急件，请优先配送' : '',
      timeline: [
        { time: `${todayStr} ${String(8 + Math.floor(Math.random() * 12)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`, content: '订单创建', type: 'primary' }
      ]
    })
  }
  
  // 生成本周历史订单（本周一到昨天，用于本周统计）
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  const daysSinceWeekStart = (now.getDay() + 6) % 7
  for (let offset = 0; offset < daysSinceWeekStart; offset++) {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + offset)
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    const dayOrders = Math.floor(15 + Math.random() * 20) // 每天15-35单
    for (let i = 0; i < dayOrders; i++) {
      const addr = addresses[(offset + i) % addresses.length]
      orders.push({
        id: 1000 + offset * 100 + i,
        orderNo: `DR${dateStr.replace(/-/g, '')}${String(i).padStart(3, '0')}`,
        senderName: `寄件人${i}`,
        senderPhone: `1380013${String(8000 + i).padStart(4, '0')}`,
        senderAddress: addr.sender,
        receiverName: `收件人${i}`,
        receiverPhone: `1380013${String(9000 + i).padStart(4, '0')}`,
        receiverAddress: addr.receiver,
        district: addr.district,
        cargoType: cargoTypes[i % cargoTypes.length],
        cargoWeight: parseFloat((0.5 + Math.random() * 3).toFixed(1)),
        price: Math.floor(25 + Math.random() * 50),
        status: 'DELIVERED',
        droneNo: `UAV-${String(i % 10 + 1).padStart(3, '0')}`,
        progress: 100,
        distance: addr.distance,
        deliveryTime: Math.floor(12 + Math.random() * 15),
        estimatedTime: 20,
        isOnTime: Math.random() > 0.05,
        createTime: `${dateStr} ${String(8 + Math.floor(Math.random() * 12)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
        completeTime: `${dateStr} ${String(14 + Math.floor(Math.random() * 8)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
        remark: '',
        isHistory: true
      })
    }
  }
  
  // 生成本月其他历史订单（本月1号到本周日之前，用于本月统计）
  for (let d = 1; d < weekStart.getDate(); d++) {
    const date = new Date(now.getFullYear(), now.getMonth(), d)
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    const dayOrders = Math.floor(10 + Math.random() * 15) // 每天10-25单
    for (let i = 0; i < dayOrders; i++) {
      const addr = addresses[(d + i) % addresses.length]
      orders.push({
        id: 2000 + d * 100 + i,
        orderNo: `DR${dateStr.replace(/-/g, '')}${String(i).padStart(3, '0')}`,
        senderName: `寄件人${i}`,
        senderPhone: `1380013${String(8000 + i).padStart(4, '0')}`,
        senderAddress: addr.sender,
        receiverName: `收件人${i}`,
        receiverPhone: `1380013${String(9000 + i).padStart(4, '0')}`,
        receiverAddress: addr.receiver,
        cargoType: cargoTypes[i % cargoTypes.length],
        cargoWeight: parseFloat((0.5 + Math.random() * 3).toFixed(1)),
        price: Math.floor(25 + Math.random() * 50),
        status: 'DELIVERED',
        droneNo: `UAV-${String(i % 10 + 1).padStart(3, '0')}`,
        progress: 100,
        distance: addr.distance,
        deliveryTime: Math.floor(12 + Math.random() * 15),
        estimatedTime: 20,
        isOnTime: Math.random() > 0.05,
        createTime: `${dateStr} ${String(8 + Math.floor(Math.random() * 12)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
        completeTime: `${dateStr} ${String(14 + Math.floor(Math.random() * 8)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
        remark: '',
        isHistory: true
      })
    }
  }
  
  // 生成全年更早月份的历史订单（1月到上月，用于全年统计）
  for (let m = 0; m < now.getMonth(); m++) {
    const daysInMonth = new Date(currentYear, m + 1, 0).getDate()
    const sampleDays = Math.floor(5 + Math.random() * 5) // 每个月随机5-10天有订单
    for (let s = 0; s < sampleDays; s++) {
      const day = Math.floor(1 + Math.random() * daysInMonth)
      const dateStr = `${currentYear}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayOrders = Math.floor(8 + Math.random() * 12) // 每天8-20单
      for (let i = 0; i < dayOrders; i++) {
        const addr = addresses[(day + i) % addresses.length]
        orders.push({
          id: 3000 + m * 1000 + s * 100 + i,
          orderNo: `DR${dateStr.replace(/-/g, '')}${String(i).padStart(3, '0')}`,
          senderName: `寄件人${i}`,
          senderPhone: `1380013${String(8000 + i).padStart(4, '0')}`,
          senderAddress: addr.sender,
          receiverName: `收件人${i}`,
          receiverPhone: `1380013${String(9000 + i).padStart(4, '0')}`,
          receiverAddress: addr.receiver,
          district: addr.district,
          cargoType: cargoTypes[i % cargoTypes.length],
          cargoWeight: parseFloat((0.5 + Math.random() * 3).toFixed(1)),
          price: Math.floor(25 + Math.random() * 50),
          status: 'DELIVERED',
          droneNo: `UAV-${String(i % 10 + 1).padStart(3, '0')}`,
          progress: 100,
          distance: addr.distance,
          deliveryTime: Math.floor(12 + Math.random() * 15),
          estimatedTime: 20,
          isOnTime: Math.random() > 0.05,
          createTime: `${dateStr} ${String(8 + Math.floor(Math.random() * 12)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
          completeTime: `${dateStr} ${String(14 + Math.floor(Math.random() * 8)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
          remark: '',
          isHistory: true
        })
      }
    }
  }
  
  return orders
}

// 生成无人机列表 - 24架，与DroneManage.vue保持一致
const generateDrones = () => {
  const drones = []
  const models = ['DJI Matrice 300', 'DJI Mavic 3', 'DJI Matrice 30']
  const deliveringLocations = ['建设大街', '锦绣花园', '阳光小区', '中国银行', '第一中学', '希尔顿酒店', '科技园附近', '物流园区']
  
  // 定义各状态的数量
  const statusConfig = [
    ...Array(8).fill('DELIVERING'),   // 配送中 8架
    ...Array(6).fill('IDLE'),          // 待命中 6架
    ...Array(4).fill('CHARGING'),      // 充电中 4架
    ...Array(4).fill('MAINTENANCE'),   // 维护中 4架
    ...Array(2).fill('OFFLINE')        // 离线 2架
  ]
  
  // 随机打乱状态数组
  for (let i = statusConfig.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [statusConfig[i], statusConfig[j]] = [statusConfig[j], statusConfig[i]]
  }
  
  let idleIndex = 0
  let deliveringIndex = 0
  
  // 生成24架无人机
  for (let i = 1; i <= 24; i++) {
    const status = statusConfig[i - 1]
    let battery, location, station, currentOrder, todayFlights
    
    switch (status) {
      case 'DELIVERING':
        battery = parseFloat((45 + Math.random() * 40).toFixed(2))
        location = deliveringLocations[deliveringIndex % deliveringLocations.length]
        const nearestStation = getNearestStation(location)
        station = nearestStation.name
        currentOrder = `DR20260412${String(100 + i).padStart(3, '0')}`
        todayFlights = Math.floor(2 + Math.random() * 6)
        deliveringIndex++
        break
      case 'IDLE':
        battery = parseFloat((75 + Math.random() * 25).toFixed(2))
        station = STATIONS[idleIndex % STATIONS.length].name
        location = station
        currentOrder = null
        todayFlights = Math.floor(1 + Math.random() * 4)
        idleIndex++
        break
      case 'CHARGING':
        battery = parseFloat((20 + Math.random() * 50).toFixed(2))
        station = '西湖总部'
        location = i % 2 === 0 ? '充电站1号' : '充电站2号'
        currentOrder = null
        todayFlights = Math.floor(3 + Math.random() * 5)
        break
      case 'MAINTENANCE':
        battery = parseFloat((30 + Math.random() * 60).toFixed(2))
        station = '西湖总部'
        location = '维修中心'
        currentOrder = null
        todayFlights = 0
        break
      case 'OFFLINE':
        battery = parseFloat((15 + Math.random() * 30).toFixed(2))
        station = '西湖总部'
        location = '西湖总部'
        currentOrder = null
        todayFlights = 0
        break
    }
    
    drones.push({
      id: i,
      droneNo: `UAV-${String(i).padStart(3, '0')}`,
      model: models[i % 3],
      battery: battery,
      maxLoad: parseFloat((2.5 + (i % 3) * 0.3).toFixed(1)),
      status: status,
      currentLocation: location,
      station: station,
      flightTime: Math.floor(50 + Math.random() * 200),
      currentOrder: currentOrder,
      todayFlights: todayFlights,
      serialNo: `SN2024${String(i).padStart(3, '0')}`,
      purchaseDate: '2024-03-15',
      totalFlightTime: Math.floor(100 + Math.random() * 300),
      totalFlights: Math.floor(200 + Math.random() * 400)
    })
  }
  
  return drones.sort((a, b) => a.id - b.id)
}

export const useDashboardStore = defineStore('dashboard', () => {
  // 尝试从 localStorage 加载保存的数据
  const savedData = loadFromStorage()
  
  // State - 订单列表（优先使用保存的数据）
  const orderList = ref(savedData?.orderList || generateInitialOrders())
  
  // State - 无人机列表（优先使用保存的数据）
  const droneList = ref(savedData?.droneList || generateDrones())
  
  // 迁移：为已有无人机补充 station 字段
  if (savedData?.droneList) {
    droneList.value.forEach(drone => {
      if (!drone.station) {
        if (drone.status === 'IDLE') {
          const station = STATIONS[(drone.id - 1) % STATIONS.length]
          drone.station = station.name
          drone.currentLocation = station.name
        } else if (drone.status === 'DELIVERING') {
          const nearest = getNearestStation(drone.currentLocation)
          drone.station = nearest ? nearest.name : STATIONS[0].name
        } else if (drone.status === 'CHARGING') {
          drone.station = '西湖总部'
        } else if (drone.status === 'MAINTENANCE') {
          drone.station = '西湖总部'
        } else {
          drone.station = STATIONS[0].name
        }
      }
    })
  }
  
  // State - 站点列表
  const stations = ref(STATIONS)
  
  // State - 保存时间戳
  const lastSavedTime = ref(savedData?.timestamp || null)
  
  // State - 定时器
  let progressTimer = null
  let autoAddOrderTimer = null
  let autoAssignTimer = null
  let saveTimer = null

  // ============ 基础统计 ============
  
  // Getters - 今日订单总数(非历史订单)
  const todayOrderCount = computed(() => 
    orderList.value.filter(o => !o.isHistory).length
  )

  // Getters - 配送中订单数
  const deliveringCount = computed(() => 
    orderList.value.filter(o => o.status === 'DELIVERING').length
  )

  // Getters - 已完成订单数
  const deliveredCount = computed(() => 
    orderList.value.filter(o => o.status === 'DELIVERED' && !o.isHistory).length
  )

  // Getters - 异常订单数（已取消）
  const exceptionCount = computed(() => 
    orderList.value.filter(o => o.status === 'CANCELLED' && !o.isHistory).length
  )

  // Getters - 待处理订单数
  const pendingCount = computed(() => 
    orderList.value.filter(o => o.status === 'PENDING').length
  )

  // Getters - 配送完成率
  const deliveryCompletionRate = computed(() => {
    const todayOrders = orderList.value.filter(o => !o.isHistory)
    const total = todayOrders.length
    if (total === 0) return '0.0'
    const delivered = todayOrders.filter(o => o.status === 'DELIVERED').length
    return ((delivered / total) * 100).toFixed(1)
  })

  // Getters - 在线无人机数（非离线状态）
  const onlineDroneCount = computed(() => 
    droneList.value.filter(d => d.status !== 'OFFLINE').length
  )

  // Getters - 总无人机数
  const totalDroneCount = computed(() => droneList.value.length)

  // Getters - 任务中无人机数（配送中）
  const busyDroneCount = computed(() => 
    droneList.value.filter(d => d.status === 'DELIVERING').length
  )

  // Getters - 待命中无人机数
  const idleDroneCount = computed(() => 
    droneList.value.filter(d => d.status === 'IDLE').length
  )

  // Getters - 异常告警数（低电量无人机 + 异常订单）
  const alertCount = computed(() => {
    const lowBatteryDrones = droneList.value.filter(d => d.battery < 20).length
    const cancelledOrders = orderList.value.filter(o => o.status === 'CANCELLED' && !o.isHistory).length
    return lowBatteryDrones + cancelledOrders
  })

  // Getters - 各状态无人机数量统计（用于DroneManage）
  const droneStatusStats = computed(() => {
    const total = droneList.value.length
    const idle = droneList.value.filter(d => d.status === 'IDLE').length
    const delivering = droneList.value.filter(d => d.status === 'DELIVERING').length
    const charging = droneList.value.filter(d => d.status === 'CHARGING').length
    const maintenance = droneList.value.filter(d => d.status === 'MAINTENANCE').length
    const offline = droneList.value.filter(d => d.status === 'OFFLINE').length
    return { total, idle, delivering, charging, maintenance, offline }
  })

  // ============ 收入统计 ============
  
  // Getters - 今日总收入
  const todayRevenue = computed(() => {
    return orderList.value
      .filter(o => !o.isHistory && o.status === 'DELIVERED')
      .reduce((sum, o) => sum + (o.price || 0), 0)
  })

  // Getters - 本周收入
  const weekRevenue = computed(() => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    return orderList.value
      .filter(o => o.status === 'DELIVERED')
      .filter(o => {
        const date = new Date(o.createTime)
        return date >= weekStart && date <= weekEnd
      })
      .reduce((sum, o) => sum + (o.price || 0), 0)
  })

  // Getters - 本月收入
  const monthRevenue = computed(() => {
    const now = new Date()
    return orderList.value
      .filter(o => o.status === 'DELIVERED')
      .filter(o => {
        const date = new Date(o.createTime)
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      })
      .reduce((sum, o) => sum + (o.price || 0), 0)
  })

  // Getters - 本年收入
  const yearRevenue = computed(() => {
    const now = new Date()
    return orderList.value
      .filter(o => o.status === 'DELIVERED')
      .filter(o => {
        const date = new Date(o.createTime)
        return date.getFullYear() === now.getFullYear()
      })
      .reduce((sum, o) => sum + (o.price || 0), 0)
  })

  // ============ 配送里程统计 ============
  
  // Getters - 今日配送里程
  const todayDistance = computed(() => {
    return orderList.value
      .filter(o => !o.isHistory && (o.status === 'DELIVERED' || o.status === 'DELIVERING'))
      .reduce((sum, o) => sum + (o.distance || 0), 0)
  })

  // Getters - 本周配送里程
  const weekDistance = computed(() => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    return orderList.value
      .filter(o => o.status === 'DELIVERED' || o.status === 'DELIVERING')
      .filter(o => {
        const date = new Date(o.createTime)
        return date >= weekStart && date <= weekEnd
      })
      .reduce((sum, o) => sum + (o.distance || 0), 0)
  })

  // Getters - 本月配送里程
  const monthDistance = computed(() => {
    const now = new Date()
    return orderList.value
      .filter(o => (o.status === 'DELIVERED' || o.status === 'DELIVERING'))
      .filter(o => {
        const date = new Date(o.createTime)
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      })
      .reduce((sum, o) => sum + (o.distance || 0), 0)
  })

  // Getters - 全年配送里程
  const yearDistance = computed(() => {
    const now = new Date()
    return orderList.value
      .filter(o => (o.status === 'DELIVERED' || o.status === 'DELIVERING'))
      .filter(o => {
        const date = new Date(o.createTime)
        return date.getFullYear() === now.getFullYear()
      })
      .reduce((sum, o) => sum + (o.distance || 0), 0)
  })

  // ============ 无人机出动统计 ============
  
  // Getters - 今日无人机出动次数
  const todayDroneMissions = computed(() => {
    return orderList.value.filter(o => !o.isHistory && o.droneNo).length
  })

  // Getters - 本周无人机出动次数
  const weekDroneMissions = computed(() => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    return orderList.value.filter(o => {
      const date = new Date(o.createTime)
      return o.droneNo && date >= weekStart && date <= weekEnd
    }).length
  })

  // Getters - 本月无人机出动次数
  const monthDroneMissions = computed(() => {
    const now = new Date()
    return orderList.value.filter(o => {
      const date = new Date(o.createTime)
      return o.droneNo && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    }).length
  })

  // Getters - 全年无人机出动次数
  const yearDroneMissions = computed(() => {
    const now = new Date()
    return orderList.value.filter(o => {
      const date = new Date(o.createTime)
      return o.droneNo && date.getFullYear() === now.getFullYear()
    }).length
  })

  // ============ 时效统计 ============
  
  // Getters - 今日平均配送时效
  const todayAvgDeliveryTime = computed(() => {
    const deliveredOrders = orderList.value.filter(o => !o.isHistory && o.status === 'DELIVERED' && o.deliveryTime)
    if (deliveredOrders.length === 0) return 0
    const totalTime = deliveredOrders.reduce((sum, o) => sum + o.deliveryTime, 0)
    return (totalTime / deliveredOrders.length).toFixed(1)
  })

  // Getters - 今日准时率
  const todayOnTimeRate = computed(() => {
    const deliveredOrders = orderList.value.filter(o => !o.isHistory && o.status === 'DELIVERED')
    if (deliveredOrders.length === 0) return '100.0'
    const onTimeOrders = deliveredOrders.filter(o => o.isOnTime)
    return ((onTimeOrders.length / deliveredOrders.length) * 100).toFixed(1)
  })

  // Getters - 本周准时率
  const weekOnTimeRate = computed(() => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    const deliveredOrders = orderList.value.filter(o => {
      const date = new Date(o.createTime)
      return o.status === 'DELIVERED' && date >= weekStart && date <= weekEnd
    })
    if (deliveredOrders.length === 0) return '100.0'
    const onTimeOrders = deliveredOrders.filter(o => o.isOnTime)
    return ((onTimeOrders.length / deliveredOrders.length) * 100).toFixed(1)
  })

  // Getters - 本周平均配送时效
  const weekAvgDeliveryTime = computed(() => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    const deliveredOrders = orderList.value.filter(o => {
      const date = new Date(o.createTime)
      return o.status === 'DELIVERED' && o.deliveryTime && date >= weekStart && date <= weekEnd
    })
    if (deliveredOrders.length === 0) return 0
    const totalTime = deliveredOrders.reduce((sum, o) => sum + o.deliveryTime, 0)
    return (totalTime / deliveredOrders.length).toFixed(1)
  })

  // Getters - 本月平均配送时效
  const monthAvgDeliveryTime = computed(() => {
    const now = new Date()
    const deliveredOrders = orderList.value.filter(o => {
      const date = new Date(o.createTime)
      return o.status === 'DELIVERED' && o.deliveryTime && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    })
    if (deliveredOrders.length === 0) return 0
    const totalTime = deliveredOrders.reduce((sum, o) => sum + o.deliveryTime, 0)
    return (totalTime / deliveredOrders.length).toFixed(1)
  })

  // Getters - 本月准时率
  const monthOnTimeRate = computed(() => {
    const now = new Date()
    const deliveredOrders = orderList.value.filter(o => {
      const date = new Date(o.createTime)
      return o.status === 'DELIVERED' && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    })
    if (deliveredOrders.length === 0) return '100.0'
    const onTimeOrders = deliveredOrders.filter(o => o.isOnTime)
    return ((onTimeOrders.length / deliveredOrders.length) * 100).toFixed(1)
  })

  // Getters - 全年平均配送时效
  const yearAvgDeliveryTime = computed(() => {
    const now = new Date()
    const deliveredOrders = orderList.value.filter(o => {
      const date = new Date(o.createTime)
      return o.status === 'DELIVERED' && o.deliveryTime && date.getFullYear() === now.getFullYear()
    })
    if (deliveredOrders.length === 0) return 0
    const totalTime = deliveredOrders.reduce((sum, o) => sum + o.deliveryTime, 0)
    return (totalTime / deliveredOrders.length).toFixed(1)
  })

  // Getters - 全年准时率
  const yearOnTimeRate = computed(() => {
    const now = new Date()
    const deliveredOrders = orderList.value.filter(o => {
      const date = new Date(o.createTime)
      return o.status === 'DELIVERED' && date.getFullYear() === now.getFullYear()
    })
    if (deliveredOrders.length === 0) return '100.0'
    const onTimeOrders = deliveredOrders.filter(o => o.isOnTime)
    return ((onTimeOrders.length / deliveredOrders.length) * 100).toFixed(1)
  })

  // ============ 按时间维度统计数据 ============
  
  // Getters - 今日统计数据
  const todayStats = computed(() => ({
    orders: todayOrderCount.value,
    completed: deliveredCount.value,
    cancelled: exceptionCount.value,
    revenue: todayRevenue.value,
    distance: todayDistance.value.toFixed(1),
    droneMissions: todayDroneMissions.value,
    avgTime: todayAvgDeliveryTime.value,
    onTimeRate: todayOnTimeRate.value
  }))

  // Getters - 本周统计数据（基于真实本周订单数据）
  const weekStats = computed(() => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const weekOrders = orderList.value.filter(o => {
      const date = new Date(o.createTime)
      return date >= weekStart && date <= weekEnd
    })
    const weekCompleted = weekOrders.filter(o => o.status === 'DELIVERED').length
    const weekCancelled = weekOrders.filter(o => o.status === 'CANCELLED').length
    return {
      orders: weekOrders.length,
      completed: weekCompleted,
      cancelled: weekCancelled,
      revenue: weekRevenue.value,
      distance: weekDistance.value.toFixed(1),
      droneMissions: weekDroneMissions.value,
      avgTime: weekAvgDeliveryTime.value,
      onTimeRate: weekOnTimeRate.value
    }
  })

  // Getters - 本月统计数据（基于真实订单数据）
  const monthStats = computed(() => {
    const now = new Date()
    const monthOrders = orderList.value.filter(o => {
      const date = new Date(o.createTime)
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    })
    const monthCompleted = monthOrders.filter(o => o.status === 'DELIVERED')
    const monthCancelled = monthOrders.filter(o => o.status === 'CANCELLED')
    return {
      orders: monthOrders.length,
      completed: monthCompleted.length,
      cancelled: monthCancelled.length,
      revenue: monthRevenue.value,
      distance: monthDistance.value.toFixed(1),
      droneMissions: monthDroneMissions.value,
      avgTime: monthAvgDeliveryTime.value,
      onTimeRate: monthOnTimeRate.value
    }
  })

  // Getters - 全年统计数据（基于真实订单数据）
  const yearStats = computed(() => {
    const now = new Date()
    const yearOrders = orderList.value.filter(o => {
      const date = new Date(o.createTime)
      return date.getFullYear() === now.getFullYear()
    })
    const yearCompleted = yearOrders.filter(o => o.status === 'DELIVERED')
    const yearCancelled = yearOrders.filter(o => o.status === 'CANCELLED')
    return {
      orders: yearOrders.length,
      completed: yearCompleted.length,
      cancelled: yearCancelled.length,
      revenue: yearRevenue.value,
      distance: yearDistance.value.toFixed(1),
      droneMissions: yearDroneMissions.value,
      avgTime: yearAvgDeliveryTime.value,
      onTimeRate: yearOnTimeRate.value
    }
  })

  // Getters - 按日期分组的统计数据（用于图表）
  const dailyStats = computed(() => {
    const stats = {}
    orderList.value.forEach(order => {
      const date = order.createTime.split(' ')[0].slice(5) // 取 MM-DD
      if (!stats[date]) {
        stats[date] = { date, orders: 0, completed: 0, cancelled: 0, revenue: 0, distance: 0, drones: 0 }
      }
      stats[date].orders++
      if (order.status === 'DELIVERED') {
        stats[date].completed++
        stats[date].revenue += order.price || 0
      }
      if (order.status === 'CANCELLED') {
        stats[date].cancelled++
      }
      stats[date].distance += order.distance || 0
      if (order.droneNo) {
        stats[date].drones++
      }
    })
    return Object.values(stats).sort((a, b) => a.date.localeCompare(b.date)).slice(-14) // 最近14天
  })

  // Getters - 按小时分组的统计数据（用于实时趋势图）
  const hourlyStats = computed(() => {
    const hours = []
    const now = new Date()
    const currentHour = now.getHours()
    
    // 生成最近12个小时的数据
    for (let i = 11; i >= 0; i--) {
      const hour = (currentHour - i + 24) % 24
      const hourStr = `${String(hour).padStart(2, '0')}:00`
      hours.push({
        hour: hourStr,
        orders: 0,
        completed: 0,
        revenue: 0
      })
    }
    
    // 统计订单数据
    orderList.value.forEach(order => {
      const orderHour = parseInt(order.createTime.split(' ')[1].split(':')[0])
      const hourIndex = hours.findIndex(h => parseInt(h.hour) === orderHour)
      if (hourIndex >= 0) {
        hours[hourIndex].orders++
        if (order.status === 'DELIVERED') {
          hours[hourIndex].completed++
          hours[hourIndex].revenue += order.price || 0
        }
      }
    })
    
    return hours
  })

  // Getters - 本周按天分组的统计数据
  const weeklyDailyStats = computed(() => {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    const stats = days.map(day => ({ day, orders: 0, completed: 0, revenue: 0 }))
    
    orderList.value.forEach(order => {
      const date = new Date(order.createTime.split(' ')[0])
      const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1 // 转换为0-6（周一开始）
      if (dayIndex >= 0 && dayIndex < 7) {
        stats[dayIndex].orders++
        if (order.status === 'DELIVERED') {
          stats[dayIndex].completed++
          stats[dayIndex].revenue += order.price || 0
        }
      }
    })
    
    return stats
  })

  // Getters - 本月按天分组的统计数据（1-30/31日）
  const monthlyDailyStats = computed(() => {
    const now = new Date()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const stats = []
    
    // 初始化本月每一天
    for (let i = 1; i <= daysInMonth; i++) {
      stats.push({
        day: `${i}日`,
        date: `${now.getMonth() + 1}-${String(i).padStart(2, '0')}`,
        orders: 0,
        completed: 0,
        revenue: 0
      })
    }
    
    // 统计订单数据
    orderList.value.forEach(order => {
      const dateStr = order.createTime.split(' ')[0]
      const date = new Date(dateStr)
      // 只统计本月的数据
      if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
        const day = date.getDate()
        if (day >= 1 && day <= daysInMonth) {
          stats[day - 1].orders++
          if (order.status === 'DELIVERED') {
            stats[day - 1].completed++
            stats[day - 1].revenue += order.price || 0
          }
        }
      }
    })
    
    return stats
  })

  // Getters - 本年按月分组的统计数据（1-12月）
  const yearlyMonthlyStats = computed(() => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    const stats = months.map(month => ({ month, orders: 0, completed: 0, revenue: 0 }))
    
    const now = new Date()
    const currentYear = now.getFullYear()
    
    // 统计订单数据
    orderList.value.forEach(order => {
      const date = new Date(order.createTime.split(' ')[0])
      if (date.getFullYear() === currentYear) {
        const month = date.getMonth()
        if (month >= 0 && month < 12) {
          stats[month].orders++
          if (order.status === 'DELIVERED') {
            stats[month].completed++
            stats[month].revenue += order.price || 0
          }
        }
      }
    })
    
    return stats
  })

  // Getters - 按区域统计订单数据（五大区域）
  const districtStats = computed(() => {
    const districts = ['西湖区', '上城区', '滨江区', '拱墅区', '钱塘区']
    const stats = {}
    districts.forEach(d => {
      stats[d] = { district: d, orders: 0, completed: 0, cancelled: 0, revenue: 0, totalTime: 0, count: 0 }
    })
    
    orderList.value.forEach(order => {
      const district = order.district
      if (district && stats[district]) {
        stats[district].orders++
        if (order.status === 'DELIVERED') {
          stats[district].completed++
          stats[district].revenue += order.price || 0
          const time = order.deliveryTime || (order.distance || 3) * 3
          stats[district].totalTime += time
          stats[district].count++
        }
        if (order.status === 'CANCELLED') {
          stats[district].cancelled++
        }
      }
    })
    
    return districts.map(d => ({
      district: d,
      orders: stats[d].orders,
      completed: stats[d].completed,
      cancelled: stats[d].cancelled,
      revenue: stats[d].revenue,
      avgTime: stats[d].count > 0 ? (stats[d].totalTime / stats[d].count).toFixed(1) : 0,
      completionRate: stats[d].orders > 0 ? ((stats[d].completed / stats[d].orders) * 100).toFixed(1) : 0,
      efficiency: stats[d].count > 0 ? (stats[d].completed / (stats[d].totalTime / stats[d].count)).toFixed(1) : 0
    }))
  })

  // Getters - 首页概览统计数据
  const dashboardStats = computed(() => [
    { 
      icon: 'Document', 
      value: todayOrderCount.value.toString(), 
      label: '今日订单', 
      color: '#409EFF', 
      trend: 12.5, 
      route: '/admin/orders' 
    },
    { 
      icon: 'Box', 
      value: deliveryCompletionRate.value + '%', 
      label: '配送完成率', 
      color: '#67C23A', 
      trend: 2.3, 
      route: '/admin/orders' 
    },
    { 
      icon: 'Coordinate', 
      value: `${onlineDroneCount.value}/${totalDroneCount.value}`, 
      label: '在线无人机', 
      color: '#E6A23C', 
      trend: -1.2, 
      route: '/admin/drones' 
    },
    { 
      icon: 'Warning', 
      value: alertCount.value.toString(), 
      label: '异常告警', 
      color: '#F56C6C', 
      trend: -25, 
      route: '/admin/settings' 
    }
  ])

  // Getters - 订单管理页面统计数据
  const orderStats = computed(() => [
    { icon: 'Document', value: todayOrderCount.value.toString(), label: '今日订单', color: '#409EFF' },
    { icon: 'Box', value: deliveringCount.value.toString(), label: '配送中', color: '#E6A23C' },
    { icon: 'CircleCheck', value: deliveredCount.value.toString(), label: '已完成', color: '#67C23A' },
    { icon: 'Warning', value: exceptionCount.value.toString(), label: '异常订单', color: '#F56C6C' }
  ])

  // Getters - 待处理订单（前10条，首页展示更多）
  const pendingOrders = computed(() => 
    orderList.value
      .filter(o => o.status === 'PENDING')
      .slice(0, 10)
      .map(o => ({
        orderNo: o.orderNo,
        from: o.senderAddress,
        to: o.receiverAddress,
        time: o.createTime.split(' ')[1].slice(0, 5),
        goodsType: o.cargoType || '普通物品',
        weight: o.cargoWeight || (0.5 + Math.random() * 3).toFixed(1),
        price: o.price || 0,
        distance: o.distance || 0,
        senderName: o.senderName,
        senderPhone: o.senderPhone,
        receiverName: o.receiverName,
        receiverPhone: o.receiverPhone
      }))
  )

  // Getters - 无人机状态列表
  const droneStatusList = computed(() => droneList.value)

  // Actions - 生成新订单
  const generateNewOrder = () => {
    const cargoTypes = ['文件资料', '食品生鲜', '药品医疗', '电子产品', '服装鞋帽', '其他物品']
    const addresses = [
      { sender: '西湖区科技园A座301室', receiver: '上城区市立医院门诊楼', distance: 2.5, district: '上城区' },
      { sender: '拱墅区物流园区B区', receiver: '钱塘区购物中心3楼', distance: 3.2, district: '钱塘区' },
      { sender: '拱墅区阳光小区5号楼', receiver: '钱塘区第一中学教学楼', distance: 1.8, district: '钱塘区' },
      { sender: '滨江区滨江高新园区', receiver: '西湖区浙江大学图书馆', distance: 4.5, district: '西湖区' },
      { sender: '滨江区滨江高新园区', receiver: '钱塘区市民中心', distance: 5.6, district: '钱塘区' },
      { sender: '西湖区西湖景区入口', receiver: '滨江区杭州东站', distance: 8.3, district: '滨江区' },
      { sender: '西湖区浙江大学', receiver: '上城区浙一医院', distance: 3.7, district: '上城区' },
      { sender: '上城区武林广场', receiver: '拱墅区城站火车站', distance: 6.2, district: '拱墅区' },
      { sender: '钱塘区购物中心3楼', receiver: '西湖区西溪湿地北门', distance: 5.1, district: '西湖区' },
      { sender: '上城区市立医院门诊楼', receiver: '滨江区萧山机场T4', distance: 9.2, district: '滨江区' },
      { sender: '拱墅区物流园区B区', receiver: '西湖区良渚古城遗址', distance: 4.8, district: '西湖区' },
      { sender: '滨江区网易大厦', receiver: '拱墅区京杭大运河博物馆', distance: 6.5, district: '拱墅区' },
      { sender: '钱塘区第一中学教学楼', receiver: '上城区杭州大厦购物城', distance: 5.3, district: '上城区' },
      { sender: '西湖区浙大玉泉校区', receiver: '滨江区华为研究所', distance: 4.2, district: '滨江区' },
      { sender: '拱墅区锦绣花园8栋', receiver: '钱塘区中国银行大厦', distance: 4.1, district: '钱塘区' }
    ]
    
    const newId = orderList.value.length > 0 ? Math.max(...orderList.value.map(o => o.id)) + 1 : 1
    const addr = addresses[Math.floor(Math.random() * addresses.length)]
    const now = new Date()
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    
    return {
      id: newId,
      orderNo: `DR${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(newId).padStart(3, '0')}`,
      senderName: `寄件人${newId}`,
      senderPhone: `1380013${String(8000 + newId).padStart(4, '0')}`,
      senderAddress: addr.sender,
      receiverName: `收件人${newId}`,
      receiverPhone: `1380013${String(9000 + newId).padStart(4, '0')}`,
      receiverAddress: addr.receiver,
      district: addr.district,
      cargoType: cargoTypes[Math.floor(Math.random() * cargoTypes.length)],
      cargoWeight: parseFloat((0.5 + Math.random() * 3).toFixed(1)),
      price: Math.floor(25 + Math.random() * 50),
      status: 'PENDING',
      droneNo: null,
      progress: 0,
      distance: addr.distance, // 配送距离
      deliveryTime: null, // 实际配送时效
      estimatedTime: 20, // 预计配送时效(分钟)
      isOnTime: null, // 是否准时送达
      createTime: timeStr,
      remark: Math.random() > 0.7 ? '急件，请优先配送' : '',
      timeline: [{ time: timeStr, content: '订单创建', type: 'primary' }]
    }
  }

  // Actions - 添加新订单
  const addOrder = (order) => {
    if (!order) {
      order = generateNewOrder()
    }
    orderList.value.unshift(order)
    return order
  }

  // Actions - 更新订单状态
  const updateOrderStatus = (orderId, status, extraData = {}) => {
    const order = orderList.value.find(o => o.id === orderId)
    if (order) {
      order.status = status
      Object.assign(order, extraData)
      
      // 添加时间轴记录
      const now = new Date()
      const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      
      let content = ''
      switch (status) {
        case 'ASSIGNED':
          content = `已分配无人机 ${extraData.droneNo || ''}`
          break
        case 'DELIVERING':
          content = '开始配送'
          break
        case 'DELIVERED':
          content = '配送完成，订单已签收'
          break
        case 'CANCELLED':
          content = '订单已取消'
          break
        default:
          content = '订单状态更新'
      }
      
      if (!order.timeline) order.timeline = []
      order.timeline.push({ time: timeStr, content, type: 'success' })
      
      return true
    }
    return false
  }

  // Actions - 启动自动添加订单（随机间隔，约1分钟10单）
  const startAutoAddOrders = (callback) => {
    if (autoAddOrderTimer) clearTimeout(autoAddOrderTimer)
    
    const scheduleNext = () => {
      const delay = Math.floor(3000 + Math.random() * 7000) // 3-10秒随机间隔
      autoAddOrderTimer = setTimeout(() => {
        const newOrder = addOrder()
        if (callback) callback(newOrder)
        scheduleNext()
      }, delay)
    }
    scheduleNext()
  }

  // Actions - 停止自动添加订单
  const stopAutoAddOrders = () => {
    if (autoAddOrderTimer) {
      clearTimeout(autoAddOrderTimer)
      autoAddOrderTimer = null
    }
  }

  // Actions - 启动自动分配（未分配订单约1分钟后自动选择最优无人机）
  const startAutoAssign = () => {
    if (autoAssignTimer) clearInterval(autoAssignTimer)
    
    autoAssignTimer = setInterval(() => {
      const now = new Date()
      orderList.value.forEach(order => {
        if (order.status === 'PENDING') {
          const createTime = new Date(order.createTime).getTime()
          const elapsed = now.getTime() - createTime
          const threshold = 50000 + Math.floor(Math.random() * 20000) // 50-70秒随机阈值
          if (elapsed >= threshold) {
            const recommended = getRecommendedDrones(order)
            if (recommended.length > 0) {
              const bestDrone = recommended[0]
              assignDroneToOrder(order.id, bestDrone.droneNo)
              order.estimatedTime = bestDrone.estimateTime
              
              // 添加时间轴记录
              const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
              if (!order.timeline) order.timeline = []
              order.timeline.push({ time: timeStr, content: `系统自动分配无人机 ${bestDrone.droneNo}，预计 ${bestDrone.estimateTime} 分钟送达`, type: 'success' })
            }
          }
        }
      })
    }, 10000) // 每10秒检查一次
  }

  // Actions - 停止自动分配
  const stopAutoAssign = () => {
    if (autoAssignTimer) {
      clearInterval(autoAssignTimer)
      autoAssignTimer = null
    }
  }

  // Actions - 分配无人机给订单
  const assignDroneToOrder = (orderId, droneNo) => {
    // 更新订单
    const order = orderList.value.find(o => o.id === orderId)
    if (order) {
      order.droneNo = droneNo
      order.status = 'DELIVERING'
      order.progress = 0
    }
    
    // 更新无人机状态
    const drone = droneList.value.find(d => d.droneNo === droneNo)
    if (drone) {
      drone.status = 'DELIVERING'
      drone.currentOrder = order ? order.orderNo : null
      drone.todayFlights += 1
      // 分配时初始位置设为发货地址，站点设为离收货地址（配送终点）最近的站点
      if (order) {
        const senderCoord = getAddressCoord(order.senderAddress)
        drone.currentLocation = order.senderAddress
        if (senderCoord) {
          drone.currentLng = senderCoord[0]
          drone.currentLat = senderCoord[1]
        }
        const receiverStation = getNearestStation(order.receiverAddress)
        drone.station = receiverStation ? receiverStation.name : order.receiverAddress
      }
    }
  }

  // Actions - 根据订单进度更新配送中无人机的位置和坐标
  const updateDroneDeliveryPosition = (droneNo, order) => {
    if (!droneNo || !order) return
    const drone = droneList.value.find(d => d.droneNo === droneNo)
    if (!drone) return

    const senderCoord = getAddressCoord(order.senderAddress)
    const receiverCoord = getAddressCoord(order.receiverAddress)
    const progress = order.progress || 0

    if (progress <= 10) {
      drone.currentLocation = order.senderAddress
      if (senderCoord) {
        drone.currentLng = senderCoord[0]
        drone.currentLat = senderCoord[1]
      }
    } else if (progress >= 90) {
      drone.currentLocation = order.receiverAddress
      if (receiverCoord) {
        drone.currentLng = receiverCoord[0]
        drone.currentLat = receiverCoord[1]
      }
    } else if (senderCoord && receiverCoord) {
      const percent = progress / 100
      const currentCoord = [
        senderCoord[0] + (receiverCoord[0] - senderCoord[0]) * percent,
        senderCoord[1] + (receiverCoord[1] - senderCoord[1]) * percent
      ]
      const nearest = getNearestLocation(currentCoord)
      drone.currentLocation = nearest ? `配送途中（${nearest}附近）` : '配送途中'
      drone.currentLng = parseFloat(currentCoord[0].toFixed(2))
      drone.currentLat = parseFloat(currentCoord[1].toFixed(2))
    } else {
      drone.currentLocation = progress < 50 ? `${order.senderAddress}（途中）` : `${order.receiverAddress}（即将到达）`
    }
  }

  // Actions - 释放无人机（订单完成时调用）
  const releaseDrone = (droneNo) => {
    const drone = droneList.value.find(d => d.droneNo === droneNo)
    if (drone) {
      // 根据电量决定释放到什么状态
      if (drone.battery <= 20) {
        drone.status = 'CHARGING'
        drone.currentLocation = drone.id % 2 === 0 ? '充电站1号' : '充电站2号'
        drone.station = '西湖总部'
      } else {
        drone.status = 'IDLE'
        const station = STATIONS[(drone.id - 1) % STATIONS.length]
        drone.currentLocation = station.name
        drone.station = station.name
      }
      drone.currentOrder = null
    }
  }

  // Actions - 启动配送进度更新
  const startProgressUpdate = (onOrderComplete) => {
    if (progressTimer) clearInterval(progressTimer)
    
    progressTimer = setInterval(() => {
      orderList.value.forEach(order => {
        if (order.status === 'DELIVERING') {
          // 每5秒增加5-15%的进度
          const increase = Math.floor(Math.random() * 10) + 5
          order.progress = (order.progress || 0) + increase
          
          // 同步更新无人机位置
          if (order.droneNo) {
            updateDroneDeliveryPosition(order.droneNo, order)
          }
          
          // 进度达到100%时，订单变为已完成
          if (order.progress >= 100) {
            order.progress = 100
            // 计算配送时效（模拟：基于距离的合理时间 + 随机波动）
            const baseTime = order.distance * 3 // 每公里约3分钟
            const randomFactor = 0.8 + Math.random() * 0.4 // 0.8-1.2的随机因子
            order.deliveryTime = Math.floor(baseTime * randomFactor)
            // 判断是否准时（实际时间 <= 预计时间 + 5分钟缓冲）
            order.isOnTime = order.deliveryTime <= (order.estimatedTime + 5)
            order.completeTime = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')} ${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}:${String(new Date().getSeconds()).padStart(2, '0')}`
            
            // 释放无人机
            if (order.droneNo) {
              releaseDrone(order.droneNo)
            }
            
            updateOrderStatus(order.id, 'DELIVERED')
            if (onOrderComplete) onOrderComplete(order)
          }
        }
      })
    }, 5000) // 每5秒更新一次
  }

  // Actions - 停止配送进度更新
  const stopProgressUpdate = () => {
    if (progressTimer) {
      clearInterval(progressTimer)
      progressTimer = null
    }
  }

  // Actions - 获取可用无人机列表（只返回状态为IDLE的无人机）
  const getAvailableDrones = () => {
    return droneList.value
      .filter(drone => drone.status === 'IDLE')
      .map(drone => ({
        id: drone.id,
        droneNo: drone.droneNo,
        model: drone.model,
        battery: drone.battery,
        currentLocation: drone.currentLocation
      }))
  }

  // Actions - 获取推荐无人机列表（根据订单地点和无人机位置排序，并计算不同的预计时间）
  const getRecommendedDrones = (order) => {
    if (!order) return []
    const senderCoord = getAddressCoord(order.senderAddress)
    const orderDistance = order.distance || 3
    
    return droneList.value
      .filter(drone => drone.status === 'IDLE')
      .map(drone => {
        const droneCoord = getAddressCoord(drone.currentLocation)
        const distanceToSender = calculateCoordDistance(droneCoord, senderCoord)
        // 预计时间 = 无人机飞到发货点的时间 + 配送时间 + 基础操作时间
        // 无人机飞行速度约 60km/h = 1km/min，所以飞行距离≈飞行时间(分钟)
        const flyToSenderTime = distanceToSender ? Math.ceil(distanceToSender) : Math.ceil(Math.random() * 8 + 2)
        const deliveryTime = Math.ceil(orderDistance * 1.5)
        const baseTime = 5
        // 加入微小随机因子确保每个无人机时间不同
        const randomOffset = parseFloat((Math.random() * 2 - 1).toFixed(1))
        const estimateTime = Math.max(5, Math.min(120, Math.ceil(flyToSenderTime + deliveryTime + baseTime + randomOffset)))
        
        return {
          id: drone.id,
          droneNo: drone.droneNo,
          model: drone.model,
          battery: drone.battery,
          currentLocation: drone.currentLocation,
          distanceToSender: distanceToSender ? parseFloat(distanceToSender.toFixed(1)) : null,
          estimateTime: estimateTime
        }
      })
      .sort((a, b) => {
        // 优先按距离排序，距离相同的按电量降序
        const distA = a.distanceToSender !== null ? a.distanceToSender : 999
        const distB = b.distanceToSender !== null ? b.distanceToSender : 999
        if (distA !== distB) return distA - distB
        return b.battery - a.battery
      })
  }

  // Actions - 取消订单
  const cancelOrder = (orderId) => {
    const order = orderList.value.find(o => o.id === orderId)
    if (order && order.droneNo) {
      releaseDrone(order.droneNo)
      order.droneNo = null
    }
    return updateOrderStatus(orderId, 'CANCELLED')
  }

  // Actions - 恢复订单
  const restoreOrder = (orderId) => {
    return updateOrderStatus(orderId, 'PENDING')
  }

  // Actions - 同步无人机与订单状态
  const syncDroneAndOrderStatus = () => {
    // 收集所有配送中的订单对应的无人机
    const activeAssignments = new Map()
    orderList.value.forEach(order => {
      if (order.status === 'DELIVERING' && order.droneNo) {
        activeAssignments.set(order.droneNo, order)
      }
    })
    
    droneList.value.forEach(drone => {
      const activeOrder = activeAssignments.get(drone.droneNo)
      if (activeOrder) {
        // 有配送中的订单，无人机应为配送中
        if (drone.status !== 'DELIVERING') {
          drone.status = 'DELIVERING'
        }
        if (drone.currentOrder !== activeOrder.orderNo) {
          drone.currentOrder = activeOrder.orderNo
        }
        // 同步无人机位置到订单进度
        updateDroneDeliveryPosition(drone.droneNo, activeOrder)
      } else if (drone.status === 'DELIVERING') {
        // 无人机显示配送中，但没有对应的配送订单，重置状态
        if (drone.battery <= 20) {
          drone.status = 'CHARGING'
          drone.currentLocation = drone.id % 2 === 0 ? '充电站1号' : '充电站2号'
          drone.station = '西湖总部'
        } else {
          drone.status = 'IDLE'
          const station = STATIONS[(drone.id - 1) % STATIONS.length]
          drone.currentLocation = station.name
          drone.station = station.name
        }
        drone.currentOrder = null
      }
    })
  }

  // Actions - 保存状态到 localStorage
  const saveState = () => {
    try {
      const dataToSave = {
        orderList: orderList.value,
        droneList: droneList.value,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
      localStorage.setItem(STORAGE_TIMESTAMP_KEY, new Date().toISOString())
      lastSavedTime.value = dataToSave.timestamp
      console.log('Dashboard data saved at:', new Date().toLocaleString())
    } catch (e) {
      console.error('Failed to save data to localStorage:', e)
    }
  }

  // Actions - 从 localStorage 加载状态
  const loadState = () => {
    const data = loadFromStorage()
    if (data) {
      orderList.value = data.orderList || orderList.value
      droneList.value = data.droneList || droneList.value
      lastSavedTime.value = data.timestamp || null
      console.log('Dashboard data loaded from:', data.timestamp ? new Date(data.timestamp).toLocaleString() : 'unknown')
      return true
    }
    return false
  }

  // Actions - 重置为初始状态
  const resetState = () => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_TIMESTAMP_KEY)
    orderList.value = generateInitialOrders()
    droneList.value = generateDrones()
    lastSavedTime.value = null
    console.log('Dashboard state reset to initial')
  }

  // Actions - 启动自动保存（每30秒保存一次）
  const startAutoSave = () => {
    if (saveTimer) clearInterval(saveTimer)
    saveTimer = setInterval(() => {
      saveState()
    }, 30000) // 30秒自动保存一次
  }

  // Actions - 停止自动保存
  const stopAutoSave = () => {
    if (saveTimer) {
      clearInterval(saveTimer)
      saveTimer = null
    }
  }

  // 监听数据变化，自动保存
  watch(orderList, () => {
    saveState()
  }, { deep: true })

  watch(droneList, () => {
    saveState()
  }, { deep: true })

  // 启动自动保存
  startAutoSave()

  // 初始化后同步一次，确保无人机与订单状态一致
  syncDroneAndOrderStatus()

  return {
    // State
    orderList,
    droneList,
    stations,
    lastSavedTime,
    // 坐标映射（供外部统一使用）
    locationCoords,
    // 站点工具
    getNearestStation,
    // Getters - 基础统计
    todayOrderCount,
    deliveringCount,
    deliveredCount,
    exceptionCount,
    pendingCount,
    deliveryCompletionRate,
    onlineDroneCount,
    totalDroneCount,
    busyDroneCount,
    idleDroneCount,
    alertCount,
    // Getters - 收入统计
    todayRevenue,
    weekRevenue,
    monthRevenue,
    yearRevenue,
    // Getters - 里程统计
    todayDistance,
    weekDistance,
    monthDistance,
    yearDistance,
    // Getters - 无人机出动统计
    todayDroneMissions,
    weekDroneMissions,
    monthDroneMissions,
    yearDroneMissions,
    // Getters - 时效统计
    todayAvgDeliveryTime,
    todayOnTimeRate,
    weekOnTimeRate,
    weekAvgDeliveryTime,
    monthAvgDeliveryTime,
    monthOnTimeRate,
    yearAvgDeliveryTime,
    yearOnTimeRate,
    // Getters - 时间维度统计
    todayStats,
    weekStats,
    monthStats,
    yearStats,
    dailyStats,
    hourlyStats,
    weeklyDailyStats,
    monthlyDailyStats,
    yearlyMonthlyStats,
    // Getters - 区域统计
    districtStats,
    // Getters - 无人机状态统计
    droneStatusStats,
    // Getters - 页面展示数据
    dashboardStats,
    orderStats,
    pendingOrders,
    droneStatusList,
    // Actions
    addOrder,
    updateOrderStatus,
    assignDroneToOrder,
    releaseDrone,
    startAutoAddOrders,
    stopAutoAddOrders,
    startAutoAssign,
    stopAutoAssign,
    startProgressUpdate,
    stopProgressUpdate,
    getAvailableDrones,
    getRecommendedDrones,
    cancelOrder,
    restoreOrder,
    syncDroneAndOrderStatus,
    updateDroneDeliveryPosition,
    generateNewOrder,
    // Actions - 数据持久化
    saveState,
    loadState,
    resetState,
    startAutoSave,
    stopAutoSave
  }
})
