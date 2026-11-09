<template>
  <div class="portal-layout">
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-brand">
          <span class="logo">🚁</span>
          <span>翼联智航——无人机管理系统</span>
        </div>
        <div class="footer-links">
          <a href="#">关于我们</a>
          <a href="#">联系方式</a>
          <a href="#">隐私政策</a>
          <a href="#">服务条款</a>
        </div>
        <div class="footer-copyright">
          © 2026 翼联智航 版权所有
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.portal-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
}

.footer {
  background: #1a1a2e;
  color: #b8c5d6;
  padding: 40px 0 20px;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  text-align: center;
}

.footer-brand {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  
  .logo {
    font-size: 32px;
  }
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 20px;
  
  a {
    color: #b8c5d6;
    text-decoration: none;
    transition: color 0.3s;
    
    &:hover {
      color: #fff;
    }
  }
}

.footer-copyright {
  font-size: 14px;
  color: #6c757d;
}

// 页面切换动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
