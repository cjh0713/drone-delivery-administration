<template>
  <div class="simulated-map">
    <canvas 
      :id="canvasId" 
      class="map-canvas"
      @click="handleClick"
      @mousemove="handleMouseMove"
    ></canvas>
    <div class="map-legend">
      <div class="legend-title">图例</div>
      <div class="legend-item">
        <span class="icon">🏢</span>
        <span>写字楼</span>
      </div>
      <div class="legend-item">
        <span class="icon">🏥</span>
        <span>医院</span>
      </div>
      <div class="legend-item">
        <span class="icon">🏫</span>
        <span>学校</span>
      </div>
      <div class="legend-item">
        <span class="icon">🏠</span>
        <span>住宅</span>
      </div>
      <div class="legend-item">
        <span class="icon">🌳</span>
        <span>公园</span>
      </div>
      <div class="legend-item">
        <span class="icon">⛔</span>
        <span>禁飞区</span>
      </div>
    </div>
    <div v-if="hoverInfo.visible" class="hover-info" :style="hoverInfo.style">
      {{ hoverInfo.text }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { SimulatedMap } from '@/utils/mapEngine'

const props = defineProps({
  drones: {
    type: Array,
    default: () => []
  },
  routes: {
    type: Array,
    default: () => []
  },
  clickMode: {
    type: String,
    default: 'none' // 'none', 'start', 'end'
  }
})

const emit = defineEmits(['mapClick', 'update:routes'])

const canvasId = 'simulated-map-' + Math.random().toString(36).substr(2, 9)
let mapInstance = null

const hoverInfo = ref({
  visible: false,
  text: '',
  style: { left: '0px', top: '0px' }
})

onMounted(() => {
  mapInstance = new SimulatedMap(canvasId)
  mapInstance.animate()
  
  // 添加无人机
  props.drones.forEach(drone => {
    mapInstance.addDrone(drone)
  })
  
  // 添加航线
  props.routes.forEach(route => {
    mapInstance.addRoute(route)
  })
})

onUnmounted(() => {
  if (mapInstance) {
    mapInstance.stop()
  }
})

// 监听无人机变化
watch(() => props.drones, (newDrones) => {
  if (!mapInstance) return
  mapInstance.drones = []
  newDrones.forEach(drone => {
    mapInstance.addDrone(drone)
  })
}, { deep: true })

// 监听航线变化
watch(() => props.routes, (newRoutes) => {
  if (!mapInstance) return
  mapInstance.clearRoutes()
  newRoutes.forEach(route => {
    mapInstance.addRoute(route)
  })
}, { deep: true })

const handleClick = (e) => {
  if (props.clickMode === 'none' || !mapInstance) return
  
  const point = mapInstance.screenToMap(e.clientX, e.clientY)
  emit('mapClick', { mode: props.clickMode, point })
}

const handleMouseMove = (e) => {
  if (!mapInstance) return
  
  const point = mapInstance.screenToMap(e.clientX, e.clientY)
  const [x, y] = point
  
  // 检查是否悬停在建筑物上
  const building = mapInstance.buildings.find(b => 
    x >= b.x && x <= b.x + b.width && 
    y >= b.y && y <= b.y + b.height
  )
  
  if (building) {
    hoverInfo.value = {
      visible: true,
      text: building.name,
      style: {
        left: e.clientX + 10 + 'px',
        top: e.clientY - 30 + 'px'
      }
    }
  } else {
    hoverInfo.value.visible = false
  }
}

// 暴露方法
const addDrone = (drone) => {
  if (mapInstance) {
    mapInstance.addDrone(drone)
  }
}

const updateDrone = (id, position) => {
  if (mapInstance) {
    mapInstance.updateDrone(id, position)
  }
}

const addRoute = (route) => {
  if (mapInstance) {
    mapInstance.addRoute(route)
  }
}

const clearRoutes = () => {
  if (mapInstance) {
    mapInstance.clearRoutes()
  }
}

const isInNoFlyZone = (point) => {
  if (mapInstance) {
    return mapInstance.isInNoFlyZone(point)
  }
  return false
}

defineExpose({
  addDrone,
  updateDrone,
  addRoute,
  clearRoutes,
  isInNoFlyZone
})
</script>

<style scoped lang="scss">
.simulated-map {
  position: relative;
  width: 100%;
  height: 100%;
  background: #f8f9fa;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.map-canvas {
  width: 100%;
  height: 100%;
  cursor: crosshair;
}

.map-legend {
  position: absolute;
  bottom: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.95);
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  font-size: 12px;
  
  .legend-title {
    font-weight: bold;
    margin-bottom: 8px;
    color: #333;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 4px 0;
    color: #666;
    
    .icon {
      font-size: 14px;
    }
  }
}

.hover-info {
  position: fixed;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  z-index: 100;
}
</style>
