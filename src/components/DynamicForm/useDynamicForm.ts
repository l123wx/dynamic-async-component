import { ref, defineComponent, h } from 'vue'

import { ComponentInstance } from '../Forms/componentMap'
import Dynamic from './index.vue'

const useDynamicComponent = () => {
  const componentRef = ref<ComponentInstance | null>(null)

  const DynamicComponent = defineComponent(() =>
    () => h(
      Dynamic,
      // @ts-ignore
      {
        onRegister: (customRef) => {
          componentRef.value = customRef
        }
      }
    )
  )

  return [DynamicComponent, componentRef] as const
}

export default useDynamicComponent