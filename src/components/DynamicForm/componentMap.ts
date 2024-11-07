import type FormOne from '@/components/DynamicForm/Forms/FormOne.vue'
import type FormTwo from '@/components/DynamicForm/Forms/FormTwo.vue'

const COMPONENT_MAP = {
    'FormOne': () => import('@/components/DynamicForm/Forms/FormOne.vue'),
    'FormTwo': () => import('@/components/DynamicForm/Forms/FormTwo.vue'),
}

export type ComponentInstance = InstanceType<typeof FormOne | typeof FormTwo>

export default COMPONENT_MAP