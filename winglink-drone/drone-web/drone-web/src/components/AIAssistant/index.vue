<template>
  <div class="ai-assistant">
    <!-- 触发气泡 -->
    <div
      class="ai-bubble"
      :class="{ 'active': isOpen, 'dragging': isDragging }"
      :style="bubbleStyle"
      @mousedown="onMouseDown"
      @touchstart.prevent="onTouchStart"
      @click="handleBubbleClick"
    >
      <img src="/images/ai-assistant.png" alt="AI助手" draggable="false" />
      <div class="pulse-ring"></div>
    </div>

    <!-- 聊天窗口 -->
    <transition name="chat-slide">
      <div
        v-show="isOpen"
        class="chat-window"
        :style="chatWindowStyle"
      >
        <div class="chat-header">
          <div class="header-info">
            <img src="/images/ai-assistant.png" alt="AI助手" />
            <div class="header-title">
              <span class="name">翼联智航 AI助手</span>
              <span class="status">
                <span class="status-dot"></span>
                在线
              </span>
            </div>
          </div>
          <el-icon class="close-btn" @click="toggleChat"><Close /></el-icon>
        </div>

        <div class="chat-body" ref="chatBodyRef">
          <div
            v-for="(msg, index) in messages"
            :key="index"
            class="message"
            :class="msg.role"
          >
            <div class="avatar">
              <img
                :src="msg.role === 'user' ? userAvatar : '/images/ai-assistant.png'"
                :alt="msg.role"
              />
            </div>
            <div class="content">
              <div class="bubble" v-html="formatContent(msg.content)"></div>
            </div>
          </div>

          <!-- 加载中 -->
          <div v-if="isLoading" class="message assistant">
            <div class="avatar">
              <img src="/images/ai-assistant.png" alt="AI助手" />
            </div>
            <div class="content">
              <div class="bubble loading">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-footer">
          <div class="input-area">
            <el-input
              v-model="inputMessage"
              type="textarea"
              :rows="2"
              placeholder="请输入您的问题..."
              resize="none"
              @keydown.enter.prevent="handleSend"
            />
            <el-button
              type="primary"
              :loading="isLoading"
              :disabled="!inputMessage.trim() || isLoading"
              @click="handleSend"
            >
              <el-icon><Promotion /></el-icon>
            </el-button>
          </div>
          <div class="tip">AI 生成内容仅供参考</div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, nextTick, computed, onMounted, onUnmounted } from 'vue'
import { Close, Promotion } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'

const isOpen = ref(false)
const inputMessage = ref('')
const isLoading = ref(false)
const chatBodyRef = ref(null)
const messages = ref([
  {
    role: 'assistant',
    content: '您好！我是翼联智航的 AI 智能助手，有任何关于无人机配送的问题都可以问我哦~'
  }
])

const userStore = useUserStore()
const userAvatar = computed(() => {
  return userStore.userInfo?.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
})

// 拖拽状态
const pos = ref({ left: 40, top: window.innerHeight - 230 })
const isDragging = ref(false)
const hasDragged = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const startPos = ref({ x: 0, y: 0 })
const MOVE_THRESHOLD = 3 // 移动阈值，超过则认为是拖拽意图

const bubbleStyle = computed(() => ({
  left: pos.value.left + 'px',
  top: pos.value.top + 'px'
}))

const chatWindowStyle = computed(() => {
  if (typeof window !== 'undefined' && window.innerWidth <= 768) {
    return {}
  }
  return {
    left: (pos.value.left + 70) + 'px',
    top: (pos.value.top - 720) + 'px',
    width: '570px',
    height: '780px'
  }
})

const startDrag = (clientX, clientY) => {
  startPos.value = { x: clientX, y: clientY }
  hasDragged.value = false
  isDragging.value = true
  dragOffset.value = {
    x: clientX - pos.value.left,
    y: clientY - pos.value.top
  }
}

const updateDragPosition = (clientX, clientY) => {
  if (!isDragging.value) return
  const dx = Math.abs(clientX - startPos.value.x)
  const dy = Math.abs(clientY - startPos.value.y)
  if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
    hasDragged.value = true
  }
  pos.value.left = clientX - dragOffset.value.x
  pos.value.top = clientY - dragOffset.value.y
}

const endDrag = () => {
  isDragging.value = false
}

// 鼠标拖拽
const onMouseDown = (e) => {
  e.preventDefault()
  startDrag(e.clientX, e.clientY)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

const onMouseMove = (e) => {
  if (!isDragging.value) return
  updateDragPosition(e.clientX, e.clientY)
}

const onMouseUp = () => {
  endDrag()
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}

// 触摸拖拽
const onTouchStart = (e) => {
  const touch = e.touches[0]
  startDrag(touch.clientX, touch.clientY)
  window.addEventListener('touchmove', onTouchMove, { passive: false })
  window.addEventListener('touchend', onTouchEnd)
  window.addEventListener('touchcancel', onTouchEnd)
}

const onTouchMove = (e) => {
  if (!isDragging.value) return
  const touch = e.touches[0]
  updateDragPosition(touch.clientX, touch.clientY)
}

const onTouchEnd = () => {
  endDrag()
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onTouchEnd)
  window.removeEventListener('touchcancel', onTouchEnd)
}

// 安全停止：窗口失焦时强制停止
const safeEndDrag = () => {
  endDrag()
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onTouchEnd)
  window.removeEventListener('touchcancel', onTouchEnd)
}

onMounted(() => {
  window.addEventListener('blur', safeEndDrag)
})

onUnmounted(() => {
  window.removeEventListener('blur', safeEndDrag)
  safeEndDrag()
})

const toggleChat = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    nextTick(() => scrollToBottom())
  }
}

const handleBubbleClick = () => {
  if (hasDragged.value) return
  toggleChat()
}

const scrollToBottom = () => {
  if (chatBodyRef.value) {
    chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
  }
}

const formatContent = (content) => {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
}

const handleSend = async () => {
  const text = inputMessage.value.trim()
  if (!text || isLoading.value) return

  messages.value.push({ role: 'user', content: text })
  inputMessage.value = ''
  isLoading.value = true
  nextTick(() => scrollToBottom())

  try {
    const res = await fetch('/ai-api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: {
          prompt: text
        },
        parameters: {},
        debug: {}
      })
    })

    const data = await res.json()
    if (res.ok && data.output?.text) {
      messages.value.push({ role: 'assistant', content: data.output.text })
    } else {
      ElMessage.error(data.message || 'AI 响应失败，请稍后重试')
      messages.value.push({
        role: 'assistant',
        content: '抱歉，我暂时无法回答您的问题，请稍后再试。'
      })
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('网络错误，请检查网络连接')
    messages.value.push({
      role: 'assistant',
      content: '网络连接出现问题，请检查网络后重试。'
    })
  } finally {
    isLoading.value = false
    nextTick(() => scrollToBottom())
  }
}
</script>

<style scoped lang="scss">
.ai-assistant {
  position: fixed;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  z-index: 9999;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
}

.ai-bubble {
  position: fixed;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.4);
  user-select: none;
  touch-action: none;

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    position: relative;
    z-index: 2;
    border: 2px solid #fff;
    -webkit-user-drag: none;
    user-select: none;
    pointer-events: none;
  }

  .pulse-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px solid rgba(0, 212, 255, 0.6);
    animation: pulse 2s infinite;
    z-index: 1;
  }

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 30px rgba(0, 212, 255, 0.6);
  }

  &.active {
    transform: scale(0.9);
    .pulse-ring {
      animation: none;
      opacity: 0;
    }
  }

  &.dragging {
    transition: none;
    transform: scale(1.05);
    cursor: grabbing;
  }
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.6);
    opacity: 0;
  }
}

.chat-window {
  position: fixed;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  height: 60px;
  background: linear-gradient(135deg, #00d4ff 0%, #00ff88 100%);
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;

  .header-info {
    display: flex;
    align-items: center;
    gap: 10px;

    img {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 2px solid #fff;
      object-fit: cover;
    }

    .header-title {
      display: flex;
      flex-direction: column;

      .name {
        font-size: 15px;
        font-weight: 600;
        color: #1a1a2e;
      }

      .status {
        font-size: 12px;
        color: rgba(26, 26, 46, 0.8);
        display: flex;
        align-items: center;
        gap: 4px;

        .status-dot {
          width: 6px;
          height: 6px;
          background: #00c853;
          border-radius: 50%;
        }
      }
    }
  }

  .close-btn {
    font-size: 20px;
    color: #1a1a2e;
    cursor: pointer;
    transition: transform 0.2s;

    &:hover {
      transform: rotate(90deg);
    }
  }
}

.chat-body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background: #f8f9fa;
  min-height: 0;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 2px;
  }
}

.message {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;

  .avatar {
    width: 36px;
    height: 36px;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }
  }

  .content {
    max-width: calc(100% - 60px);

    .bubble {
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.6;
      word-break: break-word;
    }

    .loading {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 14px 16px;

      .dot {
        width: 6px;
        height: 6px;
        background: #999;
        border-radius: 50%;
        animation: bounce 1.4s infinite ease-in-out both;

        &:nth-child(1) {
          animation-delay: -0.32s;
        }

        &:nth-child(2) {
          animation-delay: -0.16s;
        }
      }
    }
  }

  &.user {
    flex-direction: row-reverse;

    .bubble {
      background: linear-gradient(135deg, #00d4ff 0%, #00ff88 100%);
      color: #1a1a2e;
      border-bottom-right-radius: 4px;
    }
  }

  &.assistant {
    .bubble {
      background: #fff;
      color: #333;
      border: 1px solid #e8e8e8;
      border-bottom-left-radius: 4px;
    }
  }
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.chat-footer {
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid #e8e8e8;
  flex-shrink: 0;

  .input-area {
    display: flex;
    gap: 8px;
    align-items: flex-end;

    :deep(.el-textarea__inner) {
      border-radius: 8px;
      resize: none;
      padding: 8px 12px;

      &:focus {
        box-shadow: 0 0 0 1px #00d4ff;
      }
    }

    .el-button {
      width: 40px;
      height: 40px;
      padding: 0;
      border-radius: 8px;
      background: linear-gradient(135deg, #00d4ff 0%, #00ff88 100%);
      border: none;
      color: #1a1a2e;
      flex-shrink: 0;

      &:hover {
        opacity: 0.9;
      }

      &.is-disabled {
        opacity: 0.5;
        background: linear-gradient(135deg, #00d4ff 0%, #00ff88 100%);
      }
    }
  }

  .tip {
    font-size: 12px;
    color: #999;
    text-align: center;
    margin-top: 6px;
  }
}

.chat-slide-enter-active,
.chat-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.chat-slide-enter-from,
.chat-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px) scale(0.95);
}

@media (max-width: 768px) {
  .chat-window {
    left: 10px !important;
    right: 10px !important;
    top: auto !important;
    bottom: 80px !important;
    width: auto !important;
    height: 60vh !important;
  }
}
</style>
