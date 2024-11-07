import type FormA from './FormA.vue'
import type FormB from './FormB.vue'
import type FormC from './FormC.vue'

export type ComponentType = typeof FormA | typeof FormB | typeof FormC
export type ComponentInstance = InstanceType<ComponentType>

const COMPONENT_MAP = new Map([
    ['FormA', () => import('./FormA.vue')],
    ['FormB', () => import('./FormB.vue')],
    ['FormC', () => new Promise<typeof import('./FormC.vue')>(resolve => {
        setTimeout(() => {
            resolve(import('./FormC.vue'))
        }, 2000);
    })],
])

export default COMPONENT_MAP