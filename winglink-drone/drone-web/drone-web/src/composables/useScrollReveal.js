import { ref, onMounted, onUnmounted } from 'vue'

export function useScrollReveal() {
  const revealElements = ref([])
  let observer = null

  const initObserver = () => {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
      }
    )
  }

  const observe = (element) => {
    if (observer && element) {
      observer.observe(element)
      revealElements.value.push(element)
    }
  }

  const observeAll = (selector) => {
    const elements = document.querySelectorAll(selector)
    elements.forEach((el) => observe(el))
  }

  onMounted(() => {
    initObserver()
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
    }
  })

  return {
    observe,
    observeAll
  }
}

// 数字动画
export function useCountUp(endValue, duration = 2000) {
  const currentValue = ref(0)
  
  const start = () => {
    const startTime = performance.now()
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // easeOutQuart
      const easeProgress = 1 - Math.pow(1 - progress, 4)
      currentValue.value = Math.round(endValue * easeProgress)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
  }
  
  return {
    currentValue,
    start
  }
}
