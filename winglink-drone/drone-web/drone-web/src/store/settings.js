import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const SETTINGS_KEY = 'system_settings_v2'

// 默认配置
const defaultSettings = {
  // 通知屏蔽配置（true = 屏蔽不弹出）
  notifySuppress: {
    newOrder: false,        // 新订单提醒（ElNotification）
    orderAssigned: false,   // 订单分配提示（ElMessage）
    orderCompleted: false,  // 订单完成提示（ElMessage/ElNotification）
    orderCancelled: false,  // 订单取消提示（ElMessage）
    lowBattery: false,      // 低电量告警
    system: false           // 系统通用消息
  },
  // 维护配置
  maintain: {
    logLevel: 'info',
    logRetention: 30,
    autoCheckUpdate: true,
    dataPersistence: true
  }
}

export const useSettingsStore = defineStore('settings', () => {
  // State
  const settings = ref(JSON.parse(JSON.stringify(defaultSettings)))
  const isLoading = ref(false)
  const lastSaveTime = ref(null)

  // Getters - 计算属性
  const notifySuppress = computed(() => settings.value.notifySuppress || defaultSettings.notifySuppress)
  const maintain = computed(() => settings.value.maintain || defaultSettings.maintain)

  // 判断某类通知/弹窗是否应该显示
  const shouldShowNotification = (type) => {
    const suppressMap = settings.value.notifySuppress || {}
    return !suppressMap[type]
  }

  // Actions - 加载配置
  const loadSettings = () => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        settings.value = { ...defaultSettings, ...parsed }
        return true
      }
    } catch (e) {
      console.error('加载配置失败:', e)
    }
    return false
  }

  // Actions - 保存配置
  const saveSettings = (newSettings) => {
    try {
      settings.value = { ...settings.value, ...newSettings }
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.value))
      lastSaveTime.value = new Date().toISOString()
      return true
    } catch (e) {
      console.error('保存配置失败:', e)
      return false
    }
  }

  // Actions - 更新通知屏蔽配置
  const updateNotifySuppress = (notifySuppress) => {
    settings.value.notifySuppress = { ...settings.value.notifySuppress, ...notifySuppress }
    saveSettings(settings.value)
  }

  // Actions - 更新维护配置
  const updateMaintainSettings = (maintain) => {
    settings.value.maintain = { ...settings.value.maintain, ...maintain }
    saveSettings(settings.value)
  }

  // Actions - 重置为默认
  const resetSettings = () => {
    settings.value = JSON.parse(JSON.stringify(defaultSettings))
    localStorage.removeItem(SETTINGS_KEY)
    lastSaveTime.value = null
  }

  // Actions - 刷新缓存
  const refreshCache = async () => {
    isLoading.value = true
    
    // 模拟刷新操作
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 重新加载配置
    loadSettings()
    
    isLoading.value = false
    return true
  }

  // 初始化加载
  loadSettings()

  return {
    // State
    settings,
    isLoading,
    lastSaveTime,
    // Getters
    notifySuppress,
    maintain,
    // Methods
    shouldShowNotification,
    loadSettings,
    saveSettings,
    updateNotifySuppress,
    updateMaintainSettings,
    resetSettings,
    refreshCache
  }
})
