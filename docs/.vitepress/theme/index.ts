import DefaultTheme from 'vitepress/theme'
import { watch } from 'vue'
import { useRoute } from 'vitepress'

export default {
  ...DefaultTheme,
  setup() {
    const route = useRoute()
    watch(
      () => route.path,
      (path) => {
        fetch('https://docs.chuxiao.top/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path })
        }).catch(() => {})
      },
      { immediate: true }
    )
  }
}