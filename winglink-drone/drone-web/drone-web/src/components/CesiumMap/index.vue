<template>
  <div class="cesium-map-wrapper" :class="{ 'fullscreen': isFullscreen }">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <el-icon class="loading-icon" size="48"><Loading /></el-icon>
      <p>正在加载 3D 地图...</p>
    </div>
    
    <!-- 错误状态 -->
    <div v-if="error" class="error-overlay">
      <el-icon size="48" color="#f56c6c"><Warning /></el-icon>
      <p>{{ error }}</p>
      <el-button type="primary" @click="retryLoad">重试</el-button>
    </div>
    
    <!-- 地图容器 -->
    <div ref="cesiumContainer" class="cesium-container"></div>
    
    <!-- 控制按钮 -->
    <div class="map-controls">
      <el-button-group>
        <el-button size="small" @click="toggleFullscreen">
          <el-icon><FullScreen /></el-icon>
          {{ isFullscreen ? '退出全屏' : '全屏查看' }}
        </el-button>
        <el-button size="small" @click="resetView">
          <el-icon><Refresh /></el-icon>
          重置视角
        </el-button>
      </el-button-group>
    </div>
    
    <!-- 气象信息面板 -->
    <div class="weather-panel glass-panel">
      <div class="panel-header">
        <el-icon><PartlyCloudy /></el-icon>
        <span>杭州气象</span>
      </div>
      <div class="weather-content">
        <div class="weather-main">
          <span class="weather-status">{{ weatherData.status }}</span>
          <span class="temperature">{{ weatherData.temperature }}°C</span>
        </div>
        <div class="weather-details">
          <div class="detail-item">
            <span class="label">风速</span>
            <span class="value">{{ weatherData.windSpeed }} m/s</span>
          </div>
          <div class="detail-item">
            <span class="label">风向</span>
            <span class="value">{{ weatherData.windDirection }}</span>
          </div>
          <div class="detail-item">
            <span class="label">能见度</span>
            <span class="value">{{ weatherData.visibility }} km</span>
          </div>
          <div class="detail-item">
            <span class="label">湿度</span>
            <span class="value">{{ weatherData.humidity }}%</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 选中的地标信息面板 -->
    <div v-if="selectedLandmark" class="landmark-panel glass-panel">
      <div class="panel-header">
        <span>{{ selectedLandmark.name }}</span>
        <el-button link @click="selectedLandmark = null">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
      <div class="panel-content">
        <div class="info-section">
          <h4>地理信息</h4>
          <div class="info-row">
            <span class="label">经纬度:</span>
            <span class="value">{{ selectedLandmark.lon.toFixed(4) }}°, {{ selectedLandmark.lat.toFixed(4) }}°</span>
          </div>
          <div class="info-row">
            <span class="label">海拔高度:</span>
            <span class="value highlight">{{ selectedLandmark.elevation }} 米</span>
          </div>
        </div>
        
        <div class="info-section flight-assessment">
          <h4>适飞性评估</h4>
          <div class="assessment-item">
            <span class="label">建议飞行高度</span>
            <span class="value">{{ selectedLandmark.suggestedHeight }} 米</span>
          </div>
          <div class="assessment-item">
            <span class="label">空域类型</span>
            <el-tag :type="getZoneType(selectedLandmark.zoneType)" size="small">
              {{ selectedLandmark.zoneType }}
            </el-tag>
          </div>
          <div class="assessment-item">
            <span class="label">信号干扰风险</span>
            <el-tag :type="getRiskType(selectedLandmark.signalRisk)" size="small">
              {{ selectedLandmark.signalRisk }}
            </el-tag>
          </div>
          <div class="assessment-item">
            <span class="label">人口密度</span>
            <span class="value">{{ selectedLandmark.populationDensity }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 图例 -->
    <div class="map-legend glass-panel">
      <div class="legend-title">图例</div>
      <div class="legend-items">
        <div class="legend-item">
          <span class="dot airport"></span>
          <span>机场</span>
        </div>
        <div class="legend-item">
          <span class="dot landmark"></span>
          <span>地标</span>
        </div>
        <div class="legend-item">
          <span class="dot station"></span>
          <span>车站</span>
        </div>
        <div class="legend-item">
          <span class="line route"></span>
          <span>航线</span>
        </div>
        <div class="legend-item">
          <span class="zone forbidden"></span>
          <span>禁飞区</span>
        </div>
        <div class="legend-item">
          <span class="zone restricted"></span>
          <span>限飞区</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { FullScreen, Refresh, PartlyCloudy, Close, Loading, Warning } from '@element-plus/icons-vue'

// Props
const props = defineProps({
  isFullscreen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:isFullscreen'])

// Refs
const cesiumContainer = ref(null)
const viewer = ref(null)
const selectedLandmark = ref(null)
const loading = ref(true)
const error = ref(null)

// 杭州气象数据（模拟）
const weatherData = ref({
  status: '多云',
  temperature: 22,
  windSpeed: 3.5,
  windDirection: '东南风',
  visibility: 8.5,
  humidity: 65
})

// 杭州地标数据
const hangzhouLandmarks = [
  {
    id: 1,
    name: '萧山国际机场',
    lon: 120.4344,
    lat: 30.2295,
    elevation: 6.7,
    type: 'airport',
    suggestedHeight: 120,
    zoneType: '禁飞区',
    signalRisk: '低',
    populationDensity: '中等'
  },
  {
    id: 2,
    name: '西湖',
    lon: 120.1500,
    lat: 30.2500,
    elevation: 15,
    type: 'scenic',
    suggestedHeight: 80,
    zoneType: '限飞区',
    signalRisk: '中',
    populationDensity: '高'
  },
  {
    id: 3,
    name: '武林广场',
    lon: 120.1667,
    lat: 30.2833,
    elevation: 12,
    type: 'landmark',
    suggestedHeight: 100,
    zoneType: '限飞区',
    signalRisk: '高',
    populationDensity: '极高'
  },
  {
    id: 4,
    name: '钱江新城',
    lon: 120.2167,
    lat: 30.2500,
    elevation: 8,
    type: 'business',
    suggestedHeight: 150,
    zoneType: '绿区',
    signalRisk: '中',
    populationDensity: '中等'
  },
  {
    id: 5,
    name: '杭州东站',
    lon: 120.2167,
    lat: 30.3000,
    elevation: 10,
    type: 'station',
    suggestedHeight: 100,
    zoneType: '限飞区',
    signalRisk: '高',
    populationDensity: '极高'
  },
  {
    id: 6,
    name: '浙江大学',
    lon: 120.1000,
    lat: 30.3000,
    elevation: 25,
    type: 'education',
    suggestedHeight: 80,
    zoneType: '绿区',
    signalRisk: '低',
    populationDensity: '中等'
  },
  {
    id: 7,
    name: '未来科技城',
    lon: 120.0167,
    lat: 30.2833,
    elevation: 18,
    type: 'business',
    suggestedHeight: 120,
    zoneType: '绿区',
    signalRisk: '低',
    populationDensity: '中等'
  },
  {
    id: 8,
    name: '西溪湿地',
    lon: 120.0667,
    lat: 30.2667,
    elevation: 5,
    type: 'scenic',
    suggestedHeight: 60,
    zoneType: '限飞区',
    signalRisk: '低',
    populationDensity: '低'
  },
  {
    id: 9,
    name: '滨江高新区',
    lon: 120.2000,
    lat: 30.2000,
    elevation: 10,
    type: 'business',
    suggestedHeight: 100,
    zoneType: '绿区',
    signalRisk: '中',
    populationDensity: '高'
  },
  {
    id: 10,
    name: '城站火车站',
    lon: 120.1833,
    lat: 30.2500,
    elevation: 8,
    type: 'station',
    suggestedHeight: 90,
    zoneType: '限飞区',
    signalRisk: '高',
    populationDensity: '极高'
  }
]

// 初始化 Cesium
const initCesium = async () => {
  if (!cesiumContainer.value) return
  
  loading.value = true
  error.value = null
  
  try {
    // 导入 Cesium CSS
    await import('cesium/Build/Cesium/Widgets/widgets.css')
    
    // 使用全局脚本方式加载 Cesium
    const script = document.createElement('script')
    script.src = '/node_modules/cesium/Build/Cesium/Cesium.js'
    script.async = true
    
    script.onload = () => {
      const Cesium = window.Cesium
      
      // 设置静态资源路径
      const isDev = import.meta.env.DEV
      window.CESIUM_BASE_URL = isDev 
        ? '/node_modules/cesium/Build/Cesium/'
        : '/cesium/'
      
      console.log('Cesium loaded, base URL:', window.CESIUM_BASE_URL)
      
      try {
        // 创建 Viewer
        viewer.value = new Cesium.Viewer(cesiumContainer.value, {
          // 使用纯色底图
          imageryProvider: new Cesium.SingleTileImageryProvider({
            url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWEyMzNjIi8+PC9zdmc+',
            rectangle: Cesium.Rectangle.fromDegrees(-180, -90, 180, 90)
          }),
          baseLayerPicker: false,
          geocoder: false,
          homeButton: false,
          sceneModePicker: false,
          navigationHelpButton: false,
          animation: false,
          timeline: false,
          fullscreenButton: false,
          vrButton: false,
          infoBox: false,
          selectionIndicator: false,
          shouldAnimate: false
        })
        
        console.log('Viewer created')
        
        // 设置深色背景
        viewer.value.scene.backgroundColor = new Cesium.Color(0.1, 0.15, 0.25, 1.0)
        
        // 禁用高级功能
        viewer.value.scene.globe.show = true
        viewer.value.scene.globe.baseColor = new Cesium.Color(0.1, 0.15, 0.25, 1.0)
        viewer.value.scene.globe.enableLighting = false
        viewer.value.scene.globe.depthTestAgainstTerrain = false
        viewer.value.scene.skyAtmosphere.show = false
        viewer.value.scene.skyBox.show = false
        viewer.value.scene.sun.show = false
        viewer.value.scene.moon.show = false
        
        // 飞到杭州位置
        viewer.value.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(120.15, 30.28, 15000),
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-45),
            roll: 0
          }
        })
        
        // 添加地标、航线、空域
        addLandmarks(Cesium)
        addRoutes(Cesium)
        addZones(Cesium)
        
        console.log('Map initialized successfully')
        loading.value = false
        
      } catch (err) {
        console.error('Viewer creation failed:', err)
        error.value = '地图初始化失败: ' + err.message
        loading.value = false
      }
    }
    
    script.onerror = () => {
      error.value = 'Cesium 脚本加载失败'
      loading.value = false
    }
    
    document.head.appendChild(script)
    
  } catch (err) {
    console.error('Cesium 初始化失败:', err)
    error.value = '3D地图加载失败: ' + (err.message || '未知错误')
    loading.value = false
  }
}

// 重试加载
const retryLoad = () => {
  if (viewer.value) {
    viewer.value.destroy()
    viewer.value = null
  }
  initCesium()
}

// 添加地标标记
const addLandmarks = (Cesium) => {
  if (!viewer.value) return
  
  hangzhouLandmarks.forEach(landmark => {
    const entity = viewer.value.entities.add({
      name: landmark.name,
      position: Cesium.Cartesian3.fromDegrees(landmark.lon, landmark.lat, landmark.elevation + 50),
      billboard: {
        image: createPinImage(landmark.type),
        scale: 1.5,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
      },
      label: {
        text: landmark.name,
        font: '14px sans-serif',
        fillColor: Cesium.Color.fromCssColorString('#00D4FF'),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.TOP,
        pixelOffset: new Cesium.Cartesian2(0, -40),
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
      },
      properties: landmark
    })
  })
  
  // 监听点击事件
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.value.scene.canvas)
  handler.setInputAction((click) => {
    const pickedObject = viewer.value.scene.pick(click.position)
    if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject.id)) {
      const properties = pickedObject.id.properties
      if (properties) {
        selectedLandmark.value = properties.getValue(Cesium.JulianDate.now())
      }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
}

// 创建标记图标
const createPinImage = (type) => {
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 48
  const ctx = canvas.getContext('2d')
  
  const colors = {
    airport: '#f56c6c',
    station: '#e6a23c',
    landmark: '#409EFF',
    business: '#67c23a',
    scenic: '#00D4FF',
    education: '#909399'
  }
  const color = colors[type] || '#00D4FF'
  
  ctx.beginPath()
  ctx.moveTo(16, 48)
  ctx.quadraticCurveTo(0, 24, 0, 12)
  ctx.arc(16, 12, 12, Math.PI, 0)
  ctx.quadraticCurveTo(32, 24, 16, 48)
  ctx.closePath()
  
  const gradient = ctx.createRadialGradient(16, 12, 0, 16, 12, 16)
  gradient.addColorStop(0, color)
  gradient.addColorStop(1, '#0A0F1F')
  ctx.fillStyle = gradient
  ctx.fill()
  
  ctx.shadowColor = color
  ctx.shadowBlur = 10
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.stroke()
  
  ctx.beginPath()
  ctx.arc(16, 12, 4, 0, Math.PI * 2)
  ctx.fillStyle = '#fff'
  ctx.fill()
  
  return canvas.toDataURL()
}

// 添加航线
const addRoutes = (Cesium) => {
  if (!viewer.value) return
  
  const routes = [
    {
      name: '西湖-机场航线',
      positions: [
        [120.15, 30.25, 100],
        [120.2, 30.24, 120],
        [120.3, 30.23, 150],
        [120.4344, 30.2295, 200]
      ]
    },
    {
      name: '东站-西湖航线',
      positions: [
        [120.2167, 30.3, 80],
        [120.19, 30.28, 100],
        [120.15, 30.25, 120]
      ]
    }
  ]
  
  routes.forEach(route => {
    const positions = route.positions.map(p => 
      Cesium.Cartesian3.fromDegrees(p[0], p[1], p[2])
    )
    
    viewer.value.entities.add({
      name: route.name,
      polyline: {
        positions: positions,
        width: 3,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.2,
          color: Cesium.Color.fromCssColorString('#00D4FF')
        }),
        clampToGround: false
      }
    })
  })
}

// 添加禁飞区和限飞区
const addZones = (Cesium) => {
  if (!viewer.value) return
  
  // 禁飞区（机场）
  viewer.value.entities.add({
    name: '机场禁飞区',
    position: Cesium.Cartesian3.fromDegrees(120.4344, 30.2295, 0),
    ellipse: {
      semiMinorAxis: 5000,
      semiMajorAxis: 5000,
      material: Cesium.Color.fromCssColorString('#f56c6c').withAlpha(0.3),
      outline: true,
      outlineColor: Cesium.Color.fromCssColorString('#f56c6c'),
      outlineWidth: 2,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
    }
  })
  
  // 限飞区（西湖）
  viewer.value.entities.add({
    name: '西湖限飞区',
    position: Cesium.Cartesian3.fromDegrees(120.15, 30.25, 0),
    ellipse: {
      semiMinorAxis: 3000,
      semiMajorAxis: 4000,
      material: Cesium.Color.fromCssColorString('#e6a23c').withAlpha(0.2),
      outline: true,
      outlineColor: Cesium.Color.fromCssColorString('#e6a23c'),
      outlineWidth: 2,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
    }
  })
}

// 切换全屏
const toggleFullscreen = () => {
  emit('update:isFullscreen', !props.isFullscreen)
}

// 重置视角
const resetView = () => {
  if (!viewer.value || !window.Cesium) return
  const Cesium = window.Cesium
  viewer.value.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(120.15, 30.28, 15000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-45),
      roll: 0
    }
  })
}

// 获取空域等级标签类型
const getZoneType = (zoneType) => {
  const types = {
    '禁飞区': 'danger',
    '限飞区': 'warning',
    '绿区': 'success'
  }
  return types[zoneType] || 'info'
}

// 获取风险等级标签类型
const getRiskType = (risk) => {
  const types = {
    '低': 'success',
    '中': 'warning',
    '高': 'danger'
  }
  return types[risk] || 'info'
}

// 监听 ESC 键退出全屏
const handleKeydown = (e) => {
  if (e.key === 'Escape' && props.isFullscreen) {
    emit('update:isFullscreen', false)
  }
}

onMounted(() => {
  initCesium()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (viewer.value) {
    viewer.value.destroy()
    viewer.value = null
  }
})

// 监听全屏变化
watch(() => props.isFullscreen, (newVal) => {
  if (viewer.value && window.Cesium) {
    const Cesium = window.Cesium
    setTimeout(() => {
      viewer.value.resize()
      if (newVal) {
        viewer.value.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(120.15, 30.28, 8000),
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-45),
            roll: 0
          }
        })
      }
    }, 100)
  }
})
</script>

<style scoped lang="scss">
.cesium-map-wrapper {
  position: relative;
  width: 100%;
  height: 500px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  
  &.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    height: 100vh;
    width: 100vw;
    z-index: 2000;
    border-radius: 0;
    
    .cesium-container {
      height: 100%;
    }
  }
}

// 加载和错误覆盖层
.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #0A0F1F;
  z-index: 200;
  color: #fff;
  gap: 16px;
  
  .loading-icon {
    animation: rotate 1s linear infinite;
    color: #00D4FF;
  }
  
  p {
    font-size: 14px;
    color: #909399;
  }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.cesium-container {
  width: 100%;
  height: 100%;
  background: #0A0F1F;
}

// 玻璃态面板样式
.glass-panel {
  background: rgba(10, 15, 31, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

// 控制按钮
.map-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 100;
}

// 气象面板
.weather-panel {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 200px;
  padding: 16px;
  z-index: 100;
  
  .panel-header {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #00D4FF;
    font-weight: 600;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(0, 212, 255, 0.2);
    
    .el-icon {
      font-size: 20px;
    }
  }
  
  .weather-content {
    .weather-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      
      .weather-status {
        color: #fff;
        font-size: 14px;
      }
      
      .temperature {
        color: #00D4FF;
        font-size: 24px;
        font-weight: bold;
      }
    }
    
    .weather-details {
      .detail-item {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        
        &:last-child {
          border-bottom: none;
        }
        
        .label {
          color: #909399;
          font-size: 12px;
        }
        
        .value {
          color: #fff;
          font-size: 12px;
        }
      }
    }
  }
}

// 地标信息面板
.landmark-panel {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 280px;
  max-height: 80%;
  overflow-y: auto;
  z-index: 100;
  
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #00D4FF;
    font-weight: 600;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(0, 212, 255, 0.2);
  }
  
  .panel-content {
    padding: 16px;
    
    .info-section {
      margin-bottom: 20px;
      
      h4 {
        color: #fff;
        font-size: 14px;
        margin-bottom: 12px;
        padding-left: 8px;
        border-left: 3px solid #00D4FF;
      }
      
      .info-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        
        .label {
          color: #909399;
          font-size: 13px;
        }
        
        .value {
          color: #fff;
          font-size: 13px;
          
          &.highlight {
            color: #00D4FF;
            font-weight: 600;
          }
        }
      }
      
      &.flight-assessment {
        .assessment-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          
          &:last-child {
            border-bottom: none;
          }
          
          .label {
            color: #909399;
            font-size: 13px;
          }
          
          .value {
            color: #fff;
            font-size: 13px;
          }
        }
      }
    }
  }
}

// 图例
.map-legend {
  position: absolute;
  bottom: 16px;
  left: 16px;
  padding: 12px 16px;
  z-index: 100;
  
  .legend-title {
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 10px;
  }
  
  .legend-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #fff;
      font-size: 12px;
      
      .dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        
        &.airport { background: #f56c6c; }
        &.landmark { background: #409EFF; }
        &.station { background: #e6a23c; }
      }
      
      .line {
        width: 20px;
        height: 3px;
        border-radius: 2px;
        
        &.route {
          background: #00D4FF;
          box-shadow: 0 0 5px #00D4FF;
        }
      }
      
      .zone {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px dashed;
        
        &.forbidden {
          border-color: #f56c6c;
          background: rgba(245, 108, 108, 0.3);
        }
        
        &.restricted {
          border-color: #e6a23c;
          background: rgba(230, 162, 60, 0.3);
        }
      }
    }
  }
}

:deep(.cesium-viewer) {
  .cesium-viewer-toolbar {
    display: none;
  }
  
  .cesium-viewer-animationContainer,
  .cesium-viewer-timelineContainer {
    display: none;
  }
  
  .cesium-viewer-bottom {
    display: none;
  }
}
</style>
