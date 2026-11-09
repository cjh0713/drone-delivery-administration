<template>
  <div class="login-page">
    <!-- 背景图 -->
    <div class="login-bg">
      <img src="/images/login-bg.png" alt="背景" class="login-bg-img" />
      <div class="login-bg-overlay"></div>
    </div>
    
    <!-- 顶部系统名称 -->
    <div class="login-header">
      <h1 class="system-title">翼联智航无人机管理系统</h1>
    </div>
    
    <!-- 主内容区 -->
    <div class="login-container">
      <!-- 左侧：注意事项浮窗 -->
      <div class="notice-panel">
        <div class="notice-header">
          <el-icon :size="24" color="#00d4ff"><Warning /></el-icon>
          <h3>注意事项</h3>
        </div>
        <div class="notice-content">
          <div class="notice-item">
            <div class="notice-item-title">
              <span class="notice-dot"></span>
              账号安全
            </div>
            <p>请妥善保管您的账号密码，切勿将密码告知他人或在不安全的网络环境下登录。建议每90天更换一次密码，使用包含大小写字母、数字和特殊符号的强密码组合，避免使用生日、电话等易被猜测的信息作为密码。如发现账号异常，请立即修改密码并联系管理员。</p>
          </div>
          
          <div class="notice-item">
            <div class="notice-item-title">
              <span class="notice-dot"></span>
              操作规范
            </div>
            <p>在进行无人机调度、航线规划、订单管理等关键操作时，请务必仔细核对相关信息，确认无误后再提交。操作完成后请及时点击"退出登录"按钮安全退出系统，避免在公共设备上保存登录状态，防止他人冒用您的账号进行非法操作。</p>
          </div>
          
          <div class="notice-item">
            <div class="notice-item-title">
              <span class="notice-dot"></span>
              飞行安全
            </div>
            <p>使用本系统进行无人机配送任务时，请严格遵守《中华人民共和国民用航空法》及相关法规，密切关注禁飞区、限飞区、临时管制区等空域限制信息。飞行前请检查天气状况、无人机电量和货物装载情况，确保飞行安全。如遇紧急情况，请立即启动应急预案。</p>
          </div>
          
          <div class="notice-item">
            <div class="notice-item-title">
              <span class="notice-dot"></span>
              数据备份
            </div>
            <p>重要业务数据请及时备份导出。虽然系统会每日凌晨自动进行数据备份，但建议您对关键订单信息、客户资料、飞行记录等重要数据进行本地额外备份。备份文件请妥善保管，建议采用加密存储方式，并定期检查备份数据的完整性。</p>
          </div>
          
          <div class="notice-item">
            <div class="notice-item-title">
              <span class="notice-dot"></span>
              技术支持
            </div>
            <p>如遇系统故障、操作疑问或功能建议，请联系技术支持团队获取帮助。服务热线工作时间：周一至周五 9:00-18:00。如遇无人机紧急故障、空域冲突等紧急情况，请拨打24小时应急热线。您也可以通过系统内的"在线反馈"功能提交问题。</p>
          </div>
          
          <div class="notice-item">
            <div class="notice-item-title">
              <span class="notice-dot"></span>
              浏览器要求
            </div>
            <p>为获得最佳使用体验和完整的系统功能支持，强烈建议使用 Google Chrome 90+、Mozilla Firefox 88+、Microsoft Edge 90+ 等现代浏览器访问本系统。请保持浏览器版本为最新，并启用 JavaScript 和 Cookie。不建议使用 IE 浏览器或版本过旧的浏览器。</p>
          </div>
          
          <div class="notice-item">
            <div class="notice-item-title">
              <span class="notice-dot"></span>
              网络环境
            </div>
            <p>请确保网络连接稳定可靠。无人机实时监控、地图加载、视频回传等功能对网络带宽和延迟有一定要求，建议使用有线网络或信号稳定的 5GHz Wi-Fi 连接。避免在网络状况不佳的环境下进行关键业务操作，以免影响数据传输的准确性和实时性。</p>
          </div>
          
          <div class="notice-item">
            <div class="notice-item-title">
              <span class="notice-dot"></span>
              隐私保护
            </div>
            <p>本系统严格遵守《个人信息保护法》等相关法律法规，采用业界领先的加密技术和安全措施保护用户隐私数据。您的个人信息、业务数据、操作日志等均受到严格保护，不会以任何形式泄露给第三方或用于未经授权的用途。我们承诺为您提供安全可信的服务环境。</p>
          </div>
        </div>
      </div>
      
      <!-- 右侧：登录表单 -->
      <div class="login-box">
        <div class="login-box-header">
          <h2 class="login-title">系统登录</h2>
          <p class="login-subtitle">欢迎进入翼联智航无人机管理平台</p>
        </div>
        
        <!-- 登录表单 -->
        <el-form 
          ref="formRef"
          :model="form"
          :rules="rules"
          class="login-form"
        >
          <el-form-item prop="username">
            <el-input 
              v-model="form.username"
              placeholder="请输入用户名"
              size="large"
              :prefix-icon="User"
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input 
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              :prefix-icon="Lock"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          
          <div class="form-options">
            <el-checkbox v-model="rememberMe">记住密码</el-checkbox>
            <a href="#" class="forgot-link">忘记密码?</a>
          </div>
          
          <el-button 
            type="primary" 
            size="large" 
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form>
        
        <div class="back-link">
          <el-button text @click="$router.push('/')">
            <el-icon><ArrowLeft /></el-icon>
            返回首页
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, ArrowLeft, Warning } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

const rememberMe = ref(false)
const loading = ref(false)
const formRef = ref(null)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  
  loading.value = true
  try {
    // 模拟登录
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const mockUser = {
      id: 1,
      username: form.username,
      role: 'ADMIN',
      avatar: ''
    }
    
    userStore.setToken('mock_token_' + Date.now())
    userStore.setUserInfo(mockUser)
    
    ElMessage.success('登录成功，欢迎进入翼联智航管理系统')
    
    // 登录后跳转到后台管理首页
    router.push('/admin')
  } catch (error) {
    ElMessage.error('登录失败：' + error.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
// 科技感配色变量
$bg-primary: #0a0a0f;
$accent-cyan: #00d4ff;
$accent-green: #00ff88;
$text-primary: #ffffff;
$text-secondary: rgba(255, 255, 255, 0.7);
$text-muted: rgba(255, 255, 255, 0.5);
$border-glow: rgba(0, 212, 255, 0.3);

.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

// 背景图
.login-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  
  .login-bg-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .login-bg-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(10, 10, 15, 0.85) 0%,
      rgba(10, 10, 15, 0.7) 50%,
      rgba(10, 10, 15, 0.85) 100%
    );
  }
}

// 顶部系统标题
.login-header {
  position: relative;
  z-index: 10;
  padding: 30px 50px;
  
  .system-title {
    font-size: 28px;
    font-weight: 700;
    color: $text-primary;
    letter-spacing: 6px;
    background: linear-gradient(135deg, #fff 0%, $accent-cyan 50%, $accent-green 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 0 0 30px rgba(0, 212, 255, 0.3);
    margin: 0;
  }
}

// 主内容容器
.login-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 150px;
  padding: 20px 80px 50px;
  position: relative;
  z-index: 1;
}

// 左侧：注意事项面板
.notice-panel {
  width: 600px;
  height: 420px;
  background: rgba(15, 15, 22, 0.92);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(0, 212, 255, 0.15);
  box-shadow: 
    0 25px 80px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(0, 212, 255, 0.05) inset;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.notice-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 25px 25px 20px;
  border-bottom: 1px solid rgba(0, 212, 255, 0.1);
  background: linear-gradient(180deg, rgba(0, 212, 255, 0.05) 0%, transparent 100%);
  
  h3 {
    font-size: 20px;
    color: $text-primary;
    margin: 0;
    font-weight: 600;
  }
}

.notice-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 30px 25px;
  
  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 212, 255, 0.3);
    border-radius: 3px;
    
    &:hover {
      background: rgba(0, 212, 255, 0.5);
    }
  }
}

.notice-item {
  margin-bottom: 18px;
  padding: 15px 18px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s;
  
  &:hover {
    background: rgba(0, 212, 255, 0.08);
    border-color: rgba(0, 212, 255, 0.2);
  }
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .notice-item-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 15px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 8px;
    letter-spacing: 1px;
  }
  
  .notice-dot {
    width: 8px;
    height: 8px;
    background: linear-gradient(135deg, $accent-cyan, $accent-green);
    border-radius: 50%;
    box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
    flex-shrink: 0;
  }
  
  p {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.85);
    line-height: 1.8;
    margin: 0;
    padding-left: 18px;
  }
}

// 右侧：登录表单
.login-box {
  width: 420px;
  background: rgba(26, 26, 36, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 40px;
  border: 1px solid rgba(0, 212, 255, 0.2);
  box-shadow: 
    0 25px 80px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(0, 212, 255, 0.1) inset,
    0 0 40px rgba(0, 212, 255, 0.1) inset;
}

.login-box-header {
  text-align: center;
  margin-bottom: 35px;
  
  .login-title {
    font-size: 28px;
    color: $text-primary;
    margin-bottom: 10px;
    font-weight: 600;
  }
  
  .login-subtitle {
    font-size: 14px;
    color: $text-secondary;
    margin: 0;
  }
}

.login-form {
  :deep(.el-input__wrapper) {
    padding: 10px 15px;
    background: rgba(255, 255, 255, 0.05);
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
    border-radius: 10px;
    
    &:hover, &:focus, &.is-focus {
      box-shadow: 0 0 0 1px $accent-cyan inset;
      background: rgba(0, 212, 255, 0.05);
    }
  }
  
  :deep(.el-input__inner) {
    font-size: 15px;
    color: $text-primary;
    
    &::placeholder {
      color: $text-muted;
    }
  }
  
  :deep(.el-input__icon) {
    color: $text-muted;
  }
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  
  :deep(.el-checkbox__label) {
    color: $text-secondary;
  }
  
  :deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
    color: $accent-cyan;
  }
  
  :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
    background-color: $accent-cyan;
    border-color: $accent-cyan;
  }
  
  .forgot-link {
    color: $accent-cyan;
    text-decoration: none;
    font-size: 14px;
    transition: all 0.3s;
    
    &:hover {
      color: $accent-green;
      text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
    }
  }
}

.login-btn {
  width: 100%;
  padding: 16px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, $accent-cyan 0%, $accent-green 100%);
  border: none;
  border-radius: 10px;
  color: #000;
  letter-spacing: 4px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(0, 212, 255, 0.4);
  }
}

.back-link {
  text-align: center;
  margin-top: 25px;
  
  .el-button {
    color: $text-muted;
    
    &:hover {
      color: $accent-cyan;
    }
    
    .el-icon {
      margin-right: 5px;
    }
  }
}

// 响应式适配
@media (max-width: 1200px) {
  .login-container {
    gap: 100px;
    padding: 20px 50px 50px;
  }
}

@media (max-width: 992px) {
  .login-header {
    padding: 20px 30px;
    
    .system-title {
      font-size: 22px;
      letter-spacing: 3px;
    }
  }
  
  .login-container {
    flex-direction: column;
    gap: 40px;
    padding: 20px 30px 40px;
  }
  
  .notice-panel {
    width: 100%;
    max-width: 600px;
    height: 380px;
    order: 2;
  }
  
  .login-box {
    width: 100%;
    max-width: 450px;
    order: 1;
  }
}

@media (max-width: 576px) {
  .login-header {
    padding: 15px 20px;
    text-align: center;
    
    .system-title {
      font-size: 18px;
      letter-spacing: 2px;
    }
  }
  
  .login-container {
    padding: 15px 20px 30px;
  }
  
  .notice-panel,
  .login-box {
    padding: 25px 20px;
  }
  
  .notice-header {
    padding: 20px 20px 15px;
    
    h3 {
      font-size: 18px;
    }
  }
  
  .notice-content {
    padding: 15px 20px 20px;
  }
  
  .login-box-header {
    .login-title {
      font-size: 24px;
    }
  }
}
</style>
