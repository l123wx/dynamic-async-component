<template>
    <div v-show="!isLoadingDelaying && isComponentLoading" style="padding: 16px">
        <ElSkeleton />
    </div>
    <component ref="componentRef" v-bind="$attrs" :is="FormComponent" />
</template>

<script setup lang="ts">
import { defineAsyncComponent, h, ref, shallowRef, getCurrentInstance, watch, type Component } from 'vue';
import { ElSkeleton, ElResult } from 'element-plus';

import COMPONENT_MAP from './componentMap'

type FormName = keyof typeof COMPONENT_MAP

const props = withDefaults(
    defineProps<{
        name: FormName,
        /**
         * loading 展示的延迟时间，避免短时间加载时的闪烁问题，默认 200 毫秒
         */
        loadingDelay?: number
    }>(),
    {
        loadingDelay: 200
    }
)

let componentLoadPromise = new Promise(() => { });
let componentLoadResolve: (value: unknown) => void

const componentRef = ref(null)
const FormComponent = shallowRef<Component | null>(null)
const isComponentLoading = ref(true)
const isLoadingDelaying = ref(true)

let setupTime: number
const checkDelay = (time?: number) => {
    if (time) {
        if (!setupTime) setupTime = time

        if (time - setupTime >= props.loadingDelay) {
            isLoadingDelaying.value = false
            return
        }
    }

    window.requestAnimationFrame(checkDelay)
}
checkDelay()


const createFormAsyncComponent = (componentName: FormName) => {
    isComponentLoading.value = true
    componentLoadPromise = new Promise(resolve => {
        componentLoadResolve = resolve;
    })

    return defineAsyncComponent({
        loader: async () => {
            try {
                if (!COMPONENT_MAP[componentName]) {
                    throw new Error(`Can not find Component named ${componentName}.`)
                }
                const component = await COMPONENT_MAP[componentName]()

                isComponentLoading.value = false
                setTimeout(componentLoadResolve) // 确保 componentLoadResolve 回调时 componentRef 已经初始化了
                return component
            } catch (error) {
                throw error
            }
        },
        errorComponent: h(ElResult, {
            icon: 'info',
            title: "表单组件加载失败"
        })
    })
}

// props.name 改变时更新组件内容
watch(() => props.name, () => {
    if (!props.name) return

    FormComponent.value = createFormAsyncComponent(props.name)
}, {
    immediate: true
})

const instance = getCurrentInstance()
instance && (instance.exposeProxy = new Proxy({}, {
    get: (_, name) => {
        return async (...args: unknown[]) => {
            await componentLoadPromise
            const property = Reflect.get(componentRef.value || {}, name)
            if (!property) {
                throw new Error(`There is no property named ${String(name)} on component ${props.name}.`)
            }

            if (typeof property === 'function') {
                return property(...args)
            }

            return property
        }
    }
}))
</script>