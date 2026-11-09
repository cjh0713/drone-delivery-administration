<template>
  <div class="map2d">
    <div id="container"></div>
    <p v-if="mapMessage" class="map-message" role="status">{{ mapMessage }}</p>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  routes: { type: Array, default: () => [] },
  zones: { type: Array, default: () => [] },
  deliveryPoints: { type: Array, default: () => [] },
  stations: { type: Array, default: () => [] },
  focusRoute: { type: Object, default: null },
  focusPoint: { type: Object, default: null },
  trackRoute: { type: Object, default: null },
  trackDrone: { type: Object, default: null }
})

const mapMessage = ref('')

let map = null
let overlays = []
let trackOverlays = []
let droneMarker = null
let AMapRef = null
let droneAnimationTimer = null

const initMap = () => {
  const amapKey = (import.meta.env.VITE_AMAP_JS_KEY || '').trim()
  if (!amapKey) {
    mapMessage.value = '地图暂未配置'
    return
  }

  if (!window.AMapLoader) {
    mapMessage.value = '地图加载器暂不可用'
    console.error('AMapLoader 未加载')
    return
  }

  window.AMapLoader.load({
    key: amapKey,
    version: '2.0',
    plugins: ['AMap.Scale', 'AMap.ToolBar']
  })
    .then((AMap) => {
      map = new AMap.Map('container', {
        viewMode: '2D',
        zoom: 11,
        center: [120.168565, 30.285295],
      })

      // 添加地图控件
      map.addControl(new AMap.Scale())
      map.addControl(new AMap.ToolBar({
        position: 'RB'
      }))

      AMapRef = AMap
      renderOverlays(AMap)
      renderTrackOverlay()
      updateDroneMarker()
    })
    .catch((e) => {
      mapMessage.value = '地图暂不可用'
      console.error('高德地图加载失败:', e)
    })
}

const renderOverlays = (AMap) => {
  if (!map) return

  // 清除旧覆盖物（保留追踪覆盖物）
  map.remove(overlays)
  overlays = []

  const isTracking = !!props.trackRoute

  // 1. 绘制航线（追踪时隐藏普通航线，只保留空域和配送点）
  if (!isTracking) {
    props.routes.forEach((route) => {
      if (!route.path || route.path.length < 2) return
      const polyline = new AMap.Polyline({
        path: route.path,
        strokeColor: route.color || '#409EFF',
        strokeWeight: route.riskLevel === 'HIGH' ? 5 : route.riskLevel === 'MEDIUM' ? 4 : 3,
        strokeOpacity: 0.9,
        strokeStyle: 'solid',
        lineJoin: 'round',
        showDir: true,
        extData: route
      })
      overlays.push(polyline)

      // 航线名称标签（显示在弯曲中点）
      const midPoint = route.path[1] || route.path[Math.floor(route.path.length / 2)]
      if (midPoint) {
        const text = new AMap.Text({
          text: route.name,
          position: midPoint,
          anchor: 'center',
          offset: new AMap.Pixel(0, -12),
          style: {
            'background-color': 'rgba(255,255,255,0.9)',
            'border-color': route.color || '#409EFF',
            'border-width': '1px',
            'border-style': 'solid',
            'padding': '2px 6px',
            'font-size': '12px',
            'color': '#333',
            'border-radius': '4px',
            'white-space': 'nowrap',
            'box-shadow': '0 1px 3px rgba(0,0,0,0.15)'
          },
          extData: route
        })
        overlays.push(text)
      }
    })
  }

  // 2. 绘制禁飞区 / 限飞区（追踪时淡化）
  props.zones.forEach((zone) => {
    if (!zone.lngLat || zone.lngLat.length < 2) return
    const isForbidden = zone.type === 'forbidden'
    const circle = new AMap.Circle({
      center: zone.lngLat,
      radius: zone.radiusMeters || zone.radius * 64,
      strokeColor: isForbidden ? '#e74c3c' : '#E6A23C',
      strokeWeight: 2,
      strokeOpacity: isTracking ? 0.35 : 0.8,
      fillColor: isForbidden ? '#e74c3c' : '#E6A23C',
      fillOpacity: isTracking ? 0.12 : 0.25,
      strokeStyle: 'dashed',
      extData: zone
    })
    overlays.push(circle)
  })

  // 3. 绘制配送点（追踪时淡化）
  props.deliveryPoints.forEach((point) => {
    if (point.lng == null || point.lat == null) return
    const marker = new AMap.Marker({
      position: [point.lng, point.lat],
      title: point.name,
      opacity: isTracking ? 0.4 : 1,
      label: {
        content: point.name,
        direction: 'top',
        offset: new AMap.Pixel(0, -5)
      },
      extData: point
    })
    overlays.push(marker)
  })

  // 4. 绘制站点（总部/分部/站点）
  props.stations.forEach((station) => {
    if (station.lng == null || station.lat == null) return
    const isHQ = station.type === 'HQ'
    const isBranch = station.type === 'BRANCH'
    const size = isHQ ? 40 : isBranch ? 32 : 24
    const color = isHQ ? '#f56c6c' : isBranch ? '#e6a23c' : '#409eff'
    const labelText = isHQ ? '总' : isBranch ? '分' : '站'

    const marker = new AMap.Marker({
      position: [station.lng, station.lat],
      title: station.name,
      content: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-size:${isHQ ? 14 : isBranch ? 12 : 10}px;font-weight:bold;box-shadow:0 2px 10px rgba(0,0,0,0.35);">${labelText}</div>`,
      offset: new AMap.Pixel(-size / 2, -size / 2),
      anchor: 'center',
      label: {
        content: station.name,
        direction: 'top',
        offset: new AMap.Pixel(0, -6)
      },
      extData: station,
      zIndex: 120
    })
    overlays.push(marker)
  })

  // 将所有覆盖物添加到地图
  if (overlays.length > 0) {
    map.add(overlays)
    // 如果没有追踪航线，自动调整视野
    if (!props.trackRoute) {
      map.setFitView(overlays, false, [60, 60, 60, 60], 10)
    }
  }
}

const renderTrackOverlay = () => {
  if (!map || !AMapRef) return

  // 清除旧追踪覆盖物
  if (trackOverlays.length) {
    map.remove(trackOverlays)
    trackOverlays = []
  }

  if (!props.trackRoute || !props.trackRoute.path) return

  const path = props.trackRoute.path

  // 绘制发光背景虚线（更粗、更淡，制造发光效果）
  const glowPolyline = new AMapRef.Polyline({
    path,
    strokeColor: '#409EFF',
    strokeWeight: 10,
    strokeOpacity: 0.25,
    strokeStyle: 'dashed',
    lineJoin: 'round',
    strokeDasharray: [14, 6]
  })
  trackOverlays.push(glowPolyline)

  // 绘制主虚线追踪航线
  const polyline = new AMapRef.Polyline({
    path,
    strokeColor: '#409EFF',
    strokeWeight: 5,
    strokeOpacity: 1,
    strokeStyle: 'dashed',
    lineJoin: 'round',
    strokeDasharray: [14, 6],
    showDir: true
  })
  trackOverlays.push(polyline)

  // 起点标记
  const startMarker = new AMapRef.Marker({
    position: path[0],
    content: '<div style="width:36px;height:36px;background:#67C23A;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.35);">起</div>',
    offset: new AMapRef.Pixel(-18, -18),
    anchor: 'center',
    zIndex: 100
  })
  trackOverlays.push(startMarker)

  // 终点标记
  const endMarker = new AMapRef.Marker({
    position: path[path.length - 1],
    content: '<div style="width:36px;height:36px;background:#F56C6C;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.35);">终</div>',
    offset: new AMapRef.Pixel(-18, -18),
    anchor: 'center',
    zIndex: 100
  })
  trackOverlays.push(endMarker)

  map.add(trackOverlays)
  map.setFitView(trackOverlays, false, [100, 100, 100, 100], 13)
}

const updateDroneMarker = () => {
  if (!map || !AMapRef || !props.trackDrone || !props.trackDrone.position) {
    if (droneMarker) {
      map.remove(droneMarker)
      droneMarker = null
    }
    stopDroneAnimation()
    return
  }

  const buildDroneContent = (scale = 1) => {
    return `<div class="drone-icon-wrapper" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;transform:scale(${scale});">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="#F59E0B" style="transform:rotate(-45deg);filter:drop-shadow(0 2px 5px rgba(0,0,0,0.4));">
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
      </svg>
      <div class="drone-pulse" style="position:absolute;width:40px;height:40px;border-radius:50%;background:rgba(245,158,11,0.35);animation:pulse 1.5s infinite;"></div>
    </div>`
  }

  if (!droneMarker) {
    droneMarker = new AMapRef.Marker({
      position: props.trackDrone.position,
      content: buildDroneContent(1),
      offset: new AMapRef.Pixel(-20, -20),
      anchor: 'center',
      zIndex: 200
    })
    map.add(droneMarker)
    startDroneAnimation()
  } else {
    droneMarker.setPosition(props.trackDrone.position)
  }
}

const startDroneAnimation = () => {
  stopDroneAnimation()
  let scale = 1
  let growing = true
  droneAnimationTimer = setInterval(() => {
    if (!droneMarker) return
    scale = growing ? scale + 0.03 : scale - 0.03
    if (scale >= 1.15) growing = false
    if (scale <= 0.95) growing = true
    const content = `<div class="drone-icon-wrapper" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;transform:scale(${scale.toFixed(2)});">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="#F59E0B" style="transform:rotate(-45deg);filter:drop-shadow(0 2px 5px rgba(0,0,0,0.4));">
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
      </svg>
      <div style="position:absolute;width:40px;height:40px;border-radius:50%;background:rgba(245,158,11,0.35);animation:pulse 1.5s infinite;"></div>
    </div>`
    droneMarker.setContent(content)
  }, 80)
}

const stopDroneAnimation = () => {
  if (droneAnimationTimer) {
    clearInterval(droneAnimationTimer)
    droneAnimationTimer = null
  }
}

onMounted(() => {
  initMap()
})

onBeforeUnmount(() => {
  stopDroneAnimation()
  if (map) {
    map.remove(overlays)
    if (trackOverlays.length) map.remove(trackOverlays)
    if (droneMarker) map.remove(droneMarker)
    map.destroy()
    map = null
  }
})

// 监听数据变化，重绘覆盖物
watch(() => [props.routes, props.zones, props.deliveryPoints, props.stations], () => {
  if (AMapRef && map) {
    renderOverlays(AMapRef)
  }
}, { deep: true })

// 监听预览航线，地图跳转并放大
watch(() => props.focusRoute, (route) => {
  if (!map || !route || !route.path || route.path.length === 0) return
  const center = route.path[Math.floor(route.path.length / 2)]
  map.setCenter(center)
  map.setZoom(14)
}, { deep: true })

// 监听聚焦点（站点），地图跳转并放大
watch(() => props.focusPoint, (point) => {
  if (!map || !point || point.lng == null || point.lat == null) return
  map.setCenter([point.lng, point.lat])
  map.setZoom(14)
}, { deep: true })

// 监听追踪航线
watch(() => props.trackRoute, () => {
  if (AMapRef && map) {
    renderOverlays(AMapRef)
    renderTrackOverlay()
  }
}, { deep: true })

// 监听无人机位置
watch(() => props.trackDrone, () => {
  if (AMapRef && map) {
    updateDroneMarker()
  }
}, { deep: true })
</script>

<style scoped>
.map2d {
  position: relative;
  width: 100%;
  height: 690px;
}

#container {
  width: 100%;
  height: 100%;
  border-radius: 8px;
}

.map-message {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
  color: #606266;
  background: #f5f7fa;
  border-radius: 8px;
}

@keyframes pulse {
  0% {
    transform: scale(0.6);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}
</style>
