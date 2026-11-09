<template>
  <div 
    ref="revealRef"
    class="scroll-reveal"
    :class="{ 'visible': isVisible }"
    :style="customStyle"
  >
    <slot />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  delay: {
    type: Number,
    default: 0
  },
  direction: {
    type: String,
    default: 'up'
  },
  distance: {
    type: Number,
    default: 30
  },
  duration: {
    type: Number,
    default: 600
  },
  threshold: {
    type: Number,
    default: 0.1
  }
})

const isVisible = ref(false)
const revealRef = ref(null)
let observer = null

const getInitialTransform = () => {
  switch (props.direction) {
    case 'up': return `translateY(${props.distance}px)`
    case 'down': return `translateY(-${props.distance}px)`
    case 'left': return `translateX(${props.distance}px)`
    case 'right': return `translateX(-${props.distance}px)`
    default: return `translateY(${props.distance}px)`
  }
}

const customStyle = ref({
  transform: getInitialTransform(),
  opacity: 0,
  transition: `all ${props.duration}ms cubic-bezier(0.4, 0, 0.2, 1) ${props.delay * 100}ms`
})

onMounted(() => {
  if (!revealRef.value) return
  
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isVisible.value = true
          customStyle.value = {
            transform: 'translate(0)',
            opacity: 1,
            transition: `all ${props.duration}ms cubic-bezier(0.4, 0, 0.2, 1) ${props.delay * 100}ms`
          }
          observer.unobserve(entry.target)
        }
      })
    },
    {
      threshold: props.threshold,
      rootMargin: '0px 0px -30px 0px'
    }
  )
  
  observer.observe(revealRef.value)
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style scoped lang="scss">
.scroll-reveal {
  will-change: transform, opacity;
}
</style>
