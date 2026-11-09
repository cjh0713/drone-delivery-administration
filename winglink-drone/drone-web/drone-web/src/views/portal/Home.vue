<template>
  <div class="home-page">
    <!-- Hero Section - 带有背景图片和登录按钮 -->
    <section class="hero-section">
      <div class="hero-bg">
        <img src="/images/hero-bg.jpg" alt="未来无人机配送" class="hero-bg-img" />
        <div class="hero-bg-overlay"></div>
        <div class="hero-grid-overlay"></div>
      </div>
      <div class="hero-content">
        <ScrollReveal>
          <h1 class="hero-title">
            <span class="title-main">翼联智航</span>
            <span class="subtitle">WINGLINK AVIATION</span>
          </h1>
        </ScrollReveal>
        <ScrollReveal :delay="1">
          <p class="hero-subtitle-cn">无人机智能配送管理系统</p>
          <p class="hero-desc">
            智能航线规划 · 实时状态追踪 · 高效配送服务 · 全方位资源管理
          </p>
        </ScrollReveal>
        <ScrollReveal :delay="2">
          <div class="hero-actions">
            <el-button type="primary" size="large" class="login-btn" @click="goToLogin">
              <el-icon class="btn-icon"><UserFilled /></el-icon>
              立即登录
            </el-button>
          </div>
        </ScrollReveal>
      </div>
      <div class="hero-stats">
        <ScrollReveal :delay="3">
          <div class="stat-item">
            <div class="stat-value" data-target="10000">10,000+</div>
            <div class="stat-label">成功配送</div>
          </div>
        </ScrollReveal>
        <ScrollReveal :delay="4">
          <div class="stat-item">
            <div class="stat-value" data-target="500">500+</div>
            <div class="stat-label">服务区域</div>
          </div>
        </ScrollReveal>
        <ScrollReveal :delay="5">
          <div class="stat-item">
            <div class="stat-value" data-target="98">98%</div>
            <div class="stat-label">准时率</div>
          </div>
        </ScrollReveal>
      </div>
      
      <!-- 滚动提示 -->
      <div class="scroll-hint">
        <span class="hint-text">向下滚动探索更多</span>
        <div class="hint-arrow">
          <el-icon :size="24"><ArrowDown /></el-icon>
        </div>
      </div>
    </section>

    <!-- Features Section - 核心功能 -->
    <section class="features-section">
      <div class="section-container">
        <ScrollReveal>
          <div class="section-header">
            <h2 class="section-title">核心功能</h2>
            <span class="section-title-en">CORE FUNCTIONS</span>
            <p class="section-desc">六大核心功能模块，构建完整无人机配送生态</p>
          </div>
        </ScrollReveal>
        <div class="features-grid">
          <ScrollReveal v-for="(feature, index) in features" :key="index" :delay="index + 1">
            <div class="feature-card" :class="`feature-${index}`">
              <div class="feature-glow"></div>
              <div class="feature-icon">
                <el-icon :size="40" :color="feature.color">
                  <component :is="feature.icon" />
                </el-icon>
              </div>
              <h3 class="feature-title">{{ feature.title }}</h3>
              <p class="feature-desc">{{ feature.desc }}</p>
              <div class="feature-line"></div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>

    <!-- Virtual Device Section - 虚拟设备展示 -->
    <section class="device-section">
      <div class="section-container">
        <ScrollReveal>
          <div class="section-header">
            <h2 class="section-title">智能调度中心</h2>
            <span class="section-title-en">SMART DISPATCH CENTER</span>
            <p class="section-desc">实时监控与智能调度，全方位掌控配送状态</p>
          </div>
        </ScrollReveal>
        
        <ScrollReveal :delay="1">
          <div class="device-showcase">
            <!-- 虚拟平板设备 -->
            <div class="device-tablet">
              <div class="device-frame">
                <div class="device-camera"></div>
                <div class="device-screen">
                  <div class="screen-header">
                    <span class="screen-title">实时追踪</span>
                    <span class="screen-time">{{ currentTime }}</span>
                  </div>
                  <div class="screen-map">
                    <div class="map-grid">
                      <div v-for="n in 20" :key="n" class="grid-line" :style="{ animationDelay: n * 0.1 + 's' }"></div>
                    </div>
                    <!-- 动态航线 -->
                    <svg class="route-svg" viewBox="0 0 300 200">
                      <defs>
                        <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" style="stop-color:#00d4ff;stop-opacity:1" />
                          <stop offset="100%" style="stop-color:#00ff88;stop-opacity:1" />
                        </linearGradient>
                      </defs>
                      <path class="route-path" d="M 30 150 Q 100 50, 150 100 T 270 60" 
                            fill="none" stroke="url(#routeGradient)" stroke-width="2" 
                            stroke-dasharray="8 4"/>
                    </svg>
                    <!-- 无人机标记 -->
                    <div class="drone-marker marker-start">
                      <div class="marker-pulse"></div>
                      <el-icon :size="16" color="#00ff88"><Position /></el-icon>
                    </div>
                    <div class="drone-marker marker-end">
                      <div class="marker-pulse"></div>
                      <el-icon :size="16" color="#00d4ff"><Flag /></el-icon>
                    </div>
                    <div class="drone-marker marker-drone">
                      <div class="drone-body">
                        <el-icon :size="20" color="#fff"><Upload /></el-icon>
                      </div>
                    </div>
                  </div>
                  <div class="screen-info">
                    <div class="info-item">
                      <span class="info-label">速度</span>
                      <span class="info-value">{{ droneSpeed }} m/s</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">电量</span>
                      <span class="info-value" :style="{ color: batteryColor }">{{ batteryLevel }}%</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">距离</span>
                      <span class="info-value">{{ remainingDistance }} m</span>
                    </div>
                  </div>
                </div>
                <div class="device-home-btn"></div>
              </div>
              <div class="device-reflection"></div>
            </div>
            
            <!-- 功能说明 -->
            <div class="device-features">
              <div class="device-feature-item">
                <div class="feature-dot" style="background: #00ff88;"></div>
                <div class="feature-text">
                  <h4>实时定位</h4>
                  <p>GPS+北斗双模定位，精度达厘米级</p>
                </div>
              </div>
              <div class="device-feature-item">
                <div class="feature-dot" style="background: #00d4ff;"></div>
                <div class="feature-text">
                  <h4>智能避障</h4>
                  <p>AI视觉识别，自动规避障碍物</p>
                </div>
              </div>
              <div class="device-feature-item">
                <div class="feature-dot" style="background: #ff6b6b;"></div>
                <div class="feature-text">
                  <h4>状态监控</h4>
                  <p>电量、速度、高度实时回传</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>

    <!-- Process Section - 配送流程 -->
    <section class="process-section">
      <div class="section-container">
        <ScrollReveal>
          <div class="section-header">
            <h2 class="section-title">配送流程</h2>
            <span class="section-title-en">DELIVERY PROCESS</span>
            <p class="section-desc">简单五步，轻松完成无人机配送</p>
          </div>
        </ScrollReveal>
        
        <ScrollReveal :delay="1">
          <div class="service-showcase">
            <!-- 左侧步骤列表 -->
            <div class="service-menu">
              <div 
                v-for="(step, index) in processSteps" 
                :key="index"
                class="service-item"
                :class="{ 'active': activeStep === index }"
                @mouseenter="activeStep = index"
              >
                <div class="item-number">0{{ index + 1 }}</div>
                <div class="item-content">
                  <h3 class="item-title">{{ step.title }}</h3>
                  <p class="item-subtitle">{{ step.subtitle }}</p>
                </div>
                <el-icon class="item-arrow"><ArrowRight /></el-icon>
              </div>
            </div>
            
            <!-- 右侧详情展示 -->
            <div class="service-detail">
              <div 
                v-for="(step, index) in processSteps" 
                :key="index"
                class="detail-card"
                :class="{ 'active': activeStep === index }"
              >
                <div class="detail-image">
                  <img :src="step.image" :alt="step.title" />
                </div>
                <div class="detail-content">
                  <div class="detail-step">步骤 {{ index + 1 }}</div>
                  <h3 class="detail-title">{{ step.title }}</h3>
                  <p class="detail-desc">{{ step.desc }}</p>
                  <ul class="detail-features">
                    <li v-for="(feature, fIndex) in step.features" :key="fIndex">
                      <el-icon><Check /></el-icon>
                      {{ feature }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>

    <!-- Advantages Section - 平台优势 -->
    <section class="advantages-section">
      <div class="section-container">
        <ScrollReveal>
          <div class="section-header">
            <h2 class="section-title">平台优势</h2>
            <span class="section-title-en">PLATFORM ADVANTAGES</span>
            <p class="section-desc">四大核心优势，引领低空配送新时代</p>
          </div>
        </ScrollReveal>
        <div class="advantages-grid">
          <ScrollReveal v-for="(adv, index) in advantages" :key="index" :delay="index + 1">
            <div class="advantage-item">
              <div class="advantage-glow"></div>
              <div class="advantage-icon-wrapper">
                <el-icon class="advantage-icon" :size="48" :color="adv.color">
                  <component :is="adv.icon" />
                </el-icon>
              </div>
              <h3>{{ adv.title }}</h3>
              <p>{{ adv.desc }}</p>
            </div>
          </ScrollReveal>
        </div>
        
        <!-- 平台优势下方文案 -->
        <ScrollReveal :delay="2">
          <div class="advantages-footer">
            <div class="advantages-quote">
              <div class="quote-line"></div>
              <p class="quote-text">
                <strong>低空经济 · 智启未来</strong> — 突破地面交通限制，实现城市空中物流配送，配送效率提升60%以上。降低物流运营成本，减少碳排放，推动绿色智慧物流发展。应急救援、医疗配送等场景中发挥关键作用，服务民生保障。促进低空经济发展，推动智慧城市建设，打造未来空中交通网络。
              </p>
              <div class="quote-line"></div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>

    <!-- CTA Section - 底部署名 -->
    <section class="cta-section-dark">
      <ScrollReveal>
        <div class="cta-content-dark">
          <div class="cta-logo">
            <el-icon :size="48" color="#00d4ff"><Position /></el-icon>
            <span>翼联智航</span>
          </div>
          <h2>低空经济 · 智启未来</h2>
          <div class="benefits-list">
            <div class="benefit-item">
              <el-icon :size="20" color="#00ff88"><Check /></el-icon>
              <span>突破地面交通限制，实现城市空中物流配送，配送效率提升60%以上</span>
            </div>
            <div class="benefit-item">
              <el-icon :size="20" color="#00ff88"><Check /></el-icon>
              <span>降低物流运营成本，减少碳排放，推动绿色智慧物流发展</span>
            </div>
            <div class="benefit-item">
              <el-icon :size="20" color="#00ff88"><Check /></el-icon>
              <span>应急救援、医疗配送等场景中发挥关键作用，服务民生保障</span>
            </div>
            <div class="benefit-item">
              <el-icon :size="20" color="#00ff88"><Check /></el-icon>
              <span>促进低空经济发展，推动智慧城市建设，打造未来空中交通网络</span>
            </div>
          </div>
          <p class="cta-footer">翼联智航致力于构建安全、高效、智能的无人机配送生态系统</p>
          <div class="cta-divider">
            <span></span>
            <el-icon :size="16" color="#00d4ff"><Position /></el-icon>
            <span></span>
          </div>
          <p class="cta-copyright">© 2024 WingLink Aviation. All Rights Reserved.</p>
        </div>
      </ScrollReveal>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import ScrollReveal from '@/components/ScrollReveal/index.vue'
import { 
  UserFilled, Timer, MapLocation, FirstAidKit, Place, 
  Document, SetUp, Coordinate, TrendCharts, Setting,
  EditPen, Check, ArrowRight, CaretRight, ArrowDown,
  Position, Flag, Upload
} from '@element-plus/icons-vue'

const router = useRouter()

const activeStep = ref(0)
const currentTime = ref('')
const droneSpeed = ref(12.5)
const batteryLevel = ref(87)
const remainingDistance = ref(420)
const batteryColor = ref('#00ff88')

// 更新时间
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 模拟无人机数据更新
const updateDroneData = () => {
  droneSpeed.value = (10 + Math.random() * 5).toFixed(1)
  batteryLevel.value = Math.max(0, batteryLevel.value - 0.1)
  remainingDistance.value = Math.max(0, remainingDistance.value - 2)
  
  if (batteryLevel.value > 50) {
    batteryColor.value = '#00ff88'
  } else if (batteryLevel.value > 20) {
    batteryColor.value = '#ffd93d'
  } else {
    batteryColor.value = '#ff6b6b'
  }
}

let timeInterval = null
let droneInterval = null

onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
  droneInterval = setInterval(updateDroneData, 2000)
})

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
  if (droneInterval) clearInterval(droneInterval)
})

const features = [
  {
    icon: 'Document',
    title: '订单管理',
    desc: '全面管理配送订单，支持订单创建、分配、追踪和完成全流程管理',
    color: '#00d4ff'
  },
  {
    icon: 'CaretRight',
    title: '无人机资源',
    desc: '实时管理无人机机队，监控电量、状态、位置，智能调度资源',
    color: '#00ff88'
  },
  {
    icon: 'MapLocation',
    title: '航线与空域',
    desc: '智能规划航线，管理空域资源，自动避让禁飞区，确保安全高效',
    color: '#ff6b6b'
  },
  {
    icon: 'TrendCharts',
    title: '数据统计',
    desc: '多维度数据分析，订单趋势、收入报表、配送效率全面掌握',
    color: '#ffd93d'
  },
  {
    icon: 'Setting',
    title: '系统配置',
    desc: '灵活的系统参数配置，日志管理，权限控制，保障系统稳定运行',
    color: '#a855f7'
  },
  {
    icon: 'FirstAidKit',
    title: '安全保障',
    desc: '多重安全防护机制，确保货物和飞行安全，全程可追溯',
    color: '#00d4ff'
  }
]

const processSteps = [
  {
    icon: 'EditPen',
    title: '填写订单',
    subtitle: '快速创建配送订单',
    desc: '在系统中填写收发地址、货物信息和配送要求，系统自动计算最优配送方案和费用预估。',
    image: '/images/step1-order.svg',
    features: ['智能地址识别', '自动费用计算', '预计送达时间']
  },
  {
    icon: 'SetUp',
    title: '智能调度',
    subtitle: '系统自动分配资源',
    desc: '基于AI算法的智能调度系统，根据距离、载重、电量等多维度因素，自动匹配最优无人机。',
    image: '/images/step2-dispatch.svg',
    features: ['AI智能匹配', '实时资源监控', '最优路径规划']
  },
  {
    icon: 'MapLocation',
    title: '航线规划',
    subtitle: '安全高效的飞行路线',
    desc: '系统自动规划避开禁飞区、限飞区的安全航线，实时天气监控确保飞行安全。',
    image: '/images/step3-route.svg',
    features: ['自动避障规划', '实时天气监测', '航线风险评估']
  },
  {
    icon: 'Coordinate',
    title: '配送执行',
    subtitle: '全程自动化配送',
    desc: '无人机自动起飞、巡航、降落，全程GPS定位追踪，实时回传飞行状态和货物情况。',
    image: '/images/step4-deliver.svg',
    features: ['GPS精准定位', '实时状态回传', '自动避障飞行']
  },
  {
    icon: 'Check',
    title: '签收确认',
    subtitle: '安全交付完成闭环',
    desc: '收件人通过扫码或签名确认签收，系统自动更新订单状态，生成配送完成报告。',
    image: '/images/step5-complete.svg',
    features: ['电子签名确认', '拍照留底存档', '自动订单归档']
  }
]

const goToLogin = () => {
  router.push('/login')
}

const advantages = [
  {
    icon: 'Timer',
    title: '极速配送',
    desc: '平均配送时间缩短60%，满足紧急配送需求',
    color: '#00d4ff'
  },
  {
    icon: 'MapLocation',
    title: '覆盖广泛',
    desc: '覆盖城市主要区域，突破地面交通限制',
    color: '#00ff88'
  },
  {
    icon: 'FirstAidKit',
    title: '安全可靠',
    desc: '多重安全防护，百万级货物保险保障',
    color: '#ff6b6b'
  },
  {
    icon: 'Place',
    title: '精准送达',
    desc: 'GPS精准定位，误差小于2米',
    color: '#ffd93d'
  }
]
</script>

<style scoped lang="scss">
// 科技感配色变量
$bg-primary: #0a0a0f;
$bg-secondary: #12121a;
$bg-card: #1a1a24;
$accent-cyan: #00d4ff;
$accent-green: #00ff88;
$accent-purple: #a855f7;
$text-primary: #ffffff;
$text-secondary: rgba(255, 255, 255, 0.7);
$text-muted: rgba(255, 255, 255, 0.5);
$border-glow: rgba(0, 212, 255, 0.3);

.home-page {
  background: $bg-primary;
  color: $text-primary;
}

// Hero Section
.hero-section {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 60px 20px 120px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  
  .hero-bg-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: brightness(0.4);
  }
  
  .hero-bg-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      180deg,
      rgba(10, 10, 15, 0.3) 0%,
      rgba(10, 10, 15, 0.6) 50%,
      rgba(10, 10, 15, 0.95) 100%
    );
  }
  
  .hero-grid-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px);
    background-size: 50px 50px;
    animation: gridMove 20s linear infinite;
  }
}

@keyframes gridMove {
  0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
  100% { transform: perspective(500px) rotateX(60deg) translateY(50px); }
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-title {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  
  .title-main {
    font-size: 72px;
    font-weight: 800;
    background: linear-gradient(135deg, #fff 0%, $accent-cyan 50%, $accent-green 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 0 0 60px rgba(0, 212, 255, 0.5);
    letter-spacing: 8px;
  }
  
  .subtitle {
    font-size: 20px;
    font-weight: 300;
    color: $text-secondary;
    letter-spacing: 12px;
    text-transform: uppercase;
  }
}

.hero-subtitle-cn {
  font-size: 24px;
  color: $accent-cyan;
  margin-bottom: 15px;
  letter-spacing: 4px;
}

.hero-desc {
  font-size: 18px;
  color: $text-secondary;
  margin-bottom: 50px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  letter-spacing: 2px;
}

.hero-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
  
  .login-btn {
    padding: 20px 60px;
    font-size: 18px;
    background: linear-gradient(135deg, $accent-cyan 0%, $accent-green 100%);
    border: none;
    border-radius: 50px;
    box-shadow: 0 0 30px rgba(0, 212, 255, 0.4);
    transition: all 0.3s ease;
    color: #000;
    font-weight: 600;
    
    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 0 50px rgba(0, 212, 255, 0.6);
    }
    
    .btn-icon {
      margin-right: 8px;
      font-size: 20px;
    }
  }
}

.hero-stats {
  display: flex;
  gap: 100px;
  margin-top: 80px;
  position: relative;
  z-index: 1;
}

.stat-item {
  text-align: center;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 60px;
    background: radial-gradient(circle, rgba(0, 212, 255, 0.2) 0%, transparent 70%);
    border-radius: 50%;
  }
  
  .stat-value {
    font-size: 48px;
    font-weight: bold;
    background: linear-gradient(135deg, $accent-cyan 0%, $accent-green 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .stat-label {
    font-size: 14px;
    color: $text-secondary;
    margin-top: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
}

// 滚动提示
.scroll-hint {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: $text-muted;
  z-index: 2;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    color: $accent-cyan;
  }
  
  .hint-text {
    font-size: 12px;
    letter-spacing: 3px;
    text-transform: uppercase;
  }
  
  .hint-arrow {
    animation: bounce 2s infinite;
    color: $accent-cyan;
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

// Section Common
.section-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.section-header {
  text-align: center;
  margin-bottom: 60px;
  position: relative;
}

.section-title {
  font-size: 42px;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 8px;
  letter-spacing: 4px;
}

.section-title-en {
  display: block;
  font-size: 14px;
  letter-spacing: 8px;
  color: transparent;
  -webkit-text-stroke: 1px rgba(0, 212, 255, 0.3);
  text-transform: uppercase;
  margin-bottom: 16px;
  font-weight: 600;
}

.section-desc {
  font-size: 16px;
  color: $text-secondary;
}

// Features Section
.features-section {
  padding: 120px 0;
  background: linear-gradient(180deg, $bg-primary 0%, $bg-secondary 100%);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, $border-glow, transparent);
  }
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
}

.feature-card {
  background: $bg-card;
  padding: 40px 30px;
  border-radius: 16px;
  text-align: center;
  transition: all 0.4s ease;
  border: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-8px);
    border-color: $border-glow;
    box-shadow: 0 20px 60px rgba(0, 212, 255, 0.15);
    
    .feature-glow {
      opacity: 1;
    }
    
    .feature-line {
      width: 100%;
    }
  }
  
  .feature-glow {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, $accent-cyan, transparent);
    opacity: 0;
    transition: opacity 0.4s;
  }
  
  .feature-icon {
    width: 80px;
    height: 80px;
    border-radius: 20px;
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 255, 136, 0.1) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
    border: 1px solid rgba(0, 212, 255, 0.2);
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: 22px;
      padding: 2px;
      background: linear-gradient(135deg, $accent-cyan, $accent-green);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      opacity: 0.5;
    }
  }
  
  .feature-title {
    font-size: 20px;
    margin-bottom: 12px;
    color: $text-primary;
    font-weight: 600;
  }
  
  .feature-desc {
    font-size: 14px;
    color: $text-secondary;
    line-height: 1.7;
  }
  
  .feature-line {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    width: 0;
    background: linear-gradient(90deg, $accent-cyan, $accent-green);
    transition: width 0.4s ease;
  }
}

// Device Section - 虚拟设备展示
.device-section {
  padding: 120px 0;
  background: linear-gradient(180deg, $bg-secondary 0%, $bg-primary 100%);
  position: relative;
}

.device-showcase {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 80px;
}

// 虚拟平板设备
.device-tablet {
  position: relative;
  perspective: 1000px;
}

.device-frame {
  width: 380px;
  height: 500px;
  background: linear-gradient(145deg, #2a2a35 0%, #1a1a24 100%);
  border-radius: 30px;
  padding: 15px;
  box-shadow: 
    0 50px 100px rgba(0, 0, 0, 0.5),
    0 0 0 2px rgba(255, 255, 255, 0.1),
    inset 0 0 30px rgba(0, 0, 0, 0.5);
  position: relative;
  transform: rotateY(-5deg) rotateX(5deg);
  animation: deviceFloat 6s ease-in-out infinite;
}

@keyframes deviceFloat {
  0%, 100% { transform: rotateY(-5deg) rotateX(5deg) translateY(0); }
  50% { transform: rotateY(-5deg) rotateX(5deg) translateY(-10px); }
}

.device-camera {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  background: #333;
  border-radius: 50%;
  box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.5);
}

.device-screen {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #0d1117 0%, #161b22 100%);
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.screen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: rgba(0, 212, 255, 0.05);
  border-bottom: 1px solid rgba(0, 212, 255, 0.1);
  
  .screen-title {
    font-size: 14px;
    font-weight: 600;
    color: $accent-cyan;
  }
  
  .screen-time {
    font-size: 12px;
    color: $text-muted;
    font-family: 'Courier New', monospace;
  }
}

.screen-map {
  flex: 1;
  position: relative;
  background: linear-gradient(135deg, #0a1628 0%, #1a2744 100%);
  overflow: hidden;
  
  .map-grid {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    
    .grid-line {
      position: absolute;
      background: rgba(0, 212, 255, 0.05);
      
      &:nth-child(odd) {
        width: 100%;
        height: 1px;
        animation: gridScan 3s linear infinite;
      }
      
      &:nth-child(even) {
        width: 1px;
        height: 100%;
        animation: gridScanVertical 4s linear infinite;
      }
    }
  }
}

@keyframes gridScan {
  0% { transform: translateY(-100%); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateY(100vh); opacity: 0; }
}

@keyframes gridScanVertical {
  0% { transform: translateX(-100%); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateX(100vw); opacity: 0; }
}

.route-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.route-path {
  animation: dash 3s linear infinite;
}

@keyframes dash {
  to {
    stroke-dashoffset: -24;
  }
}

.drone-marker {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .marker-pulse {
    position: absolute;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    animation: pulse 2s ease-out infinite;
  }
}

.marker-start {
  left: 30px;
  bottom: 50px;
  
  .marker-pulse {
    background: rgba(0, 255, 136, 0.3);
  }
}

.marker-end {
  right: 30px;
  top: 60px;
  
  .marker-pulse {
    background: rgba(0, 212, 255, 0.3);
  }
}

.marker-drone {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  animation: droneMove 4s ease-in-out infinite;
  
  .drone-body {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, $accent-cyan, $accent-green);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
    animation: droneRotate 2s linear infinite;
  }
}

@keyframes droneMove {
  0%, 100% { left: 20%; top: 70%; }
  25% { left: 40%; top: 40%; }
  50% { left: 60%; top: 50%; }
  75% { left: 80%; top: 30%; }
}

@keyframes droneRotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0% { transform: scale(0.5); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}

.screen-info {
  display: flex;
  justify-content: space-around;
  padding: 15px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(0, 212, 255, 0.1);
  
  .info-item {
    text-align: center;
    
    .info-label {
      display: block;
      font-size: 10px;
      color: $text-muted;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    
    .info-value {
      font-size: 16px;
      font-weight: 600;
      color: $text-primary;
      font-family: 'Courier New', monospace;
    }
  }
}

.device-home-btn {
  position: absolute;
  bottom: -25px;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.device-reflection {
  position: absolute;
  bottom: -100px;
  left: 50%;
  transform: translateX(-50%) scaleY(-1);
  width: 380px;
  height: 100px;
  background: linear-gradient(180deg, rgba(0, 212, 255, 0.1) 0%, transparent 100%);
  filter: blur(20px);
  border-radius: 50%;
}

// 设备功能说明
.device-features {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.device-feature-item {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 25px 30px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s;
  
  &:hover {
    background: rgba(0, 212, 255, 0.05);
    border-color: rgba(0, 212, 255, 0.2);
    transform: translateX(10px);
  }
  
  .feature-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 5px;
    box-shadow: 0 0 10px currentColor;
  }
  
  .feature-text {
    h4 {
      font-size: 18px;
      color: $text-primary;
      margin-bottom: 8px;
    }
    
    p {
      font-size: 14px;
      color: $text-secondary;
      line-height: 1.6;
    }
  }
}

// Process Section
.process-section {
  padding: 120px 0;
  background: linear-gradient(180deg, $bg-primary 0%, $bg-secondary 100%);
}

.service-showcase {
  display: flex;
  gap: 40px;
  align-items: flex-start;
}

// 左侧菜单
.service-menu {
  flex: 0 0 380px;
  background: $bg-card;
  border-radius: 20px;
  padding: 25px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.service-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 10px;
  border: 1px solid transparent;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &:hover,
  &.active {
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 255, 136, 0.1) 100%);
    border-color: $border-glow;
    
    .item-number {
      color: $accent-cyan;
      text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
    }
    
    .item-title {
      color: $text-primary;
    }
    
    .item-subtitle {
      color: $text-secondary;
    }
    
    .item-arrow {
      color: $accent-cyan;
      opacity: 1;
      transform: translateX(4px);
    }
  }
  
  .item-number {
    font-size: 24px;
    font-weight: bold;
    color: $text-muted;
    font-family: 'Courier New', monospace;
    transition: all 0.3s;
  }
  
  .item-content {
    flex: 1;
    
    .item-title {
      font-size: 18px;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: 4px;
      transition: all 0.3s;
    }
    
    .item-subtitle {
      font-size: 13px;
      color: $text-muted;
      transition: all 0.3s;
    }
  }
  
  .item-arrow {
    font-size: 20px;
    color: $text-muted;
    opacity: 0;
    transition: all 0.3s;
  }
}

// 右侧详情
.service-detail {
  flex: 1;
  position: relative;
  min-height: 520px;
}

.detail-card {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  background: $bg-card;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
  opacity: 0;
  visibility: hidden;
  transform: translateX(20px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  
  &.active {
    opacity: 1;
    visibility: visible;
    transform: translateX(0);
  }
  
  .detail-image {
    height: 240px;
    overflow: hidden;
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 255, 136, 0.1) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    
    img {
      width: 60%;
      height: 60%;
      object-fit: contain;
      transition: transform 0.5s ease;
    }
    
    &:hover img {
      transform: scale(1.05);
    }
  }
  
  .detail-content {
    padding: 32px;
    
    .detail-step {
      display: inline-block;
      background: linear-gradient(135deg, $accent-cyan 0%, $accent-green 100%);
      color: #000;
      padding: 4px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 16px;
      letter-spacing: 1px;
    }
    
    .detail-title {
      font-size: 28px;
      font-weight: bold;
      color: $text-primary;
      margin-bottom: 12px;
    }
    
    .detail-desc {
      font-size: 15px;
      color: $text-secondary;
      line-height: 1.8;
      margin-bottom: 24px;
    }
    
    .detail-features {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      
      li {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(0, 212, 255, 0.1);
        padding: 10px 16px;
        border-radius: 8px;
        font-size: 14px;
        color: $text-primary;
        border: 1px solid rgba(0, 212, 255, 0.2);
        
        .el-icon {
          color: $accent-green;
          font-size: 16px;
        }
      }
    }
  }
}

// Advantages Section
.advantages-section {
  padding: 120px 0;
  background: linear-gradient(180deg, $bg-secondary 0%, $bg-primary 100%);
}

.advantages-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30px;
}

.advantage-item {
  text-align: center;
  padding: 40px 25px;
  background: $bg-card;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
  overflow: hidden;
  transition: all 0.4s;
  
  &:hover {
    transform: translateY(-10px);
    border-color: $border-glow;
    box-shadow: 0 20px 50px rgba(0, 212, 255, 0.1);
    
    .advantage-glow {
      opacity: 1;
    }
  }
  
  .advantage-glow {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 100px;
    background: radial-gradient(circle, rgba(0, 212, 255, 0.3) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.4s;
  }
  
  .advantage-icon-wrapper {
    width: 90px;
    height: 90px;
    margin: 0 auto 25px;
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 255, 136, 0.1) 100%);
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(0, 212, 255, 0.2);
  }
  
  .advantage-icon {
    filter: drop-shadow(0 0 10px currentColor);
  }
  
  h3 {
    font-size: 20px;
    margin-bottom: 12px;
    color: $text-primary;
    font-weight: 600;
  }
  
  p {
    font-size: 14px;
    color: $text-secondary;
    line-height: 1.7;
  }
}

// 平台优势下方文案
.advantages-footer {
  margin-top: 80px;
  
  .advantages-quote {
    max-width: 900px;
    margin: 0 auto;
    text-align: center;
    
    .quote-line {
      height: 1px;
      background: linear-gradient(90deg, transparent, $border-glow, transparent);
      margin: 30px 0;
    }
    
    .quote-text {
      font-size: 16px;
      line-height: 2;
      color: $text-secondary;
      
      strong {
        color: $accent-cyan;
        font-size: 18px;
        letter-spacing: 2px;
      }
    }
  }
}

// CTA Section
.cta-section-dark {
  padding: 100px 0 60px;
  background: linear-gradient(180deg, $bg-primary 0%, #050508 100%);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, $border-glow, transparent);
  }
}

.cta-content-dark {
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
  
  .cta-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    margin-bottom: 30px;
    
    span {
      font-size: 28px;
      font-weight: 700;
      background: linear-gradient(135deg, $accent-cyan 0%, $accent-green 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: 4px;
    }
  }
  
  h2 {
    font-size: 36px;
    font-weight: 700;
    margin-bottom: 50px;
    background: linear-gradient(135deg, #fff 0%, $accent-cyan 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: 4px;
  }
  
  .benefits-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 50px;
    text-align: left;
    max-width: 750px;
    margin-left: auto;
    margin-right: auto;
  }
  
  .benefit-item {
    display: flex;
    align-items: flex-start;
    gap: 15px;
    padding: 18px 25px;
    background: rgba(0, 212, 255, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(0, 212, 255, 0.1);
    transition: all 0.3s;
    
    &:hover {
      background: rgba(0, 212, 255, 0.1);
      border-color: rgba(0, 212, 255, 0.3);
      transform: translateX(10px);
    }
    
    span {
      font-size: 15px;
      line-height: 1.6;
      color: $text-secondary;
    }
    
    .el-icon {
      flex-shrink: 0;
      margin-top: 2px;
    }
  }
  
  .cta-footer {
    font-size: 16px;
    color: $accent-cyan;
    letter-spacing: 3px;
    margin-bottom: 40px;
    font-weight: 500;
  }
  
  .cta-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    margin-bottom: 30px;
    
    span {
      width: 80px;
      height: 1px;
      background: linear-gradient(90deg, transparent, $border-glow, transparent);
    }
  }
  
  .cta-copyright {
    font-size: 13px;
    color: $text-muted;
    letter-spacing: 1px;
  }
}

// Responsive
@media (max-width: 992px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .advantages-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .service-showcase {
    flex-direction: column;
  }
  
  .service-menu {
    flex: none;
    width: 100%;
  }
  
  .service-detail {
    min-height: 450px;
  }
  
  .device-showcase {
    flex-direction: column;
    gap: 50px;
  }
  
  .device-frame {
    width: 320px;
    height: 420px;
  }
  
  .cta-content-dark {
    h2 {
      font-size: 28px;
    }
  }
  
  .hero-title .title-main {
    font-size: 48px;
  }
  
  .hero-stats {
    gap: 50px;
  }
}

@media (max-width: 768px) {
  .hero-title .title-main {
    font-size: 36px;
    letter-spacing: 4px;
  }
  
  .hero-title .subtitle {
    font-size: 14px;
    letter-spacing: 6px;
  }
  
  .hero-desc {
    font-size: 14px;
  }
  
  .hero-actions .login-btn {
    padding: 16px 40px;
    font-size: 16px;
  }
  
  .hero-stats {
    flex-direction: column;
    gap: 30px;
    margin-top: 60px;
  }
  
  .stat-item .stat-value {
    font-size: 36px;
  }
  
  .features-grid,
  .advantages-grid {
    grid-template-columns: 1fr;
  }
  
  .section-title {
    font-size: 28px;
  }
  
  .detail-card .detail-content {
    padding: 24px;
    
    .detail-title {
      font-size: 22px;
    }
  }
  
  .cta-content-dark {
    h2 {
      font-size: 24px;
    }
    
    .benefits-list {
      gap: 12px;
    }
    
    .benefit-item {
      padding: 14px 18px;
      
      span {
        font-size: 13px;
      }
    }
  }
  
  .device-frame {
    width: 280px;
    height: 380px;
  }
}
</style>
