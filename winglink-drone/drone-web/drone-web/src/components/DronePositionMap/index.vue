<template>
  <div class="drone-position-map">
    <div class="mock-map">
      <div v-if="showRoute" class="map-point start">
        <el-icon><Location /></el-icon>
        <span>起</span>
      </div>
      <div v-if="showRoute" class="map-route"></div>
      <div class="map-drone" :style="droneStyle">
        <el-icon><Coordinate /></el-icon>
        <span v-if="droneLabel">{{ droneLabel }}</span>
      </div>
      <div v-if="showRoute" class="map-point end">
        <el-icon><Location /></el-icon>
        <span>终</span>
      </div>
      <div v-if="locationName && !showRoute" class="location-label">
        <el-icon><MapLocation /></el-icon>
        <span>{{ locationName }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Location, Coordinate, MapLocation } from '@element-plus/icons-vue'

const props = defineProps({
  progress: {
    type: Number,
    default: 0
  },
  showRoute: {
    type: Boolean,
    default: false
  },
  position: {
    type: Object,
    default: () => ({ left: '50%', top: '50%' })
  },
  locationName: {
    type: String,
    default: ''
  },
  droneLabel: {
    type: String,
    default: ''
  }
})

const droneStyle = computed(() => {
  if (props.showRoute) {
    const progressPercent = Math.min(100, Math.max(0, props.progress)) / 100
    return {
      left: `${20 + progressPercent * 60}%`,
      top: '50%'
    }
  }
  return {
    left: props.position.left,
    top: props.position.top
  }
})
</script>

<style scoped lang="scss">
.drone-position-map {
  width: 100%;
  
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
      left: 50%;
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
      z-index: 2;
      
      .el-icon {
        font-size: 18px;
      }
    }
    
    .location-label {
      position: absolute;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 255, 255, 0.95);
      padding: 8px 16px;
      border-radius: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: #606266;
      font-weight: 500;
      z-index: 1;
      
      .el-icon {
        font-size: 16px;
        color: #409EFF;
      }
    }
  }
}

@keyframes float-drone {
  0%, 100% { transform: translate(-50%, -50%) translateY(0); }
  50% { transform: translate(-50%, -50%) translateY(-8px); }
}
</style>
