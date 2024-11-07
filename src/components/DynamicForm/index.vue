<template>
    <div v-show="!isLoadingDelaying && isComponentLoading" style="padding: 16px 0; text-align: left">
        <ElSkeleton />
    </div>
    <component ref="componentRef" v-bind="$attrs" :is="FormComponent" />
</template>

<script setup lang="ts">
import { defineAsyncComponent, h, ref, computed, getCurrentInstance } from 'vue';
import { ElSkeleton, ElResult } from 'element-plus';

import COMPONENT_MAP from '../Forms/componentMap'

const props = withDefaults(
    defineProps<{
        name: string,
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
const isComponentLoading = ref(true)
const isLoadingDelaying = ref(true)

const FormComponent = computed(() => {
    if (!props.name) return null

    return createFormAsyncComponent(props.name)
})

let setupTime: number = 0
const checkDelay = (time?: number) => {
    isLoadingDelaying.value = true

    if (time) {
        if (!setupTime) setupTime = time

        if (time - setupTime >= props.loadingDelay) {
            console.log(time - setupTime)
            isLoadingDelaying.value = false
            setupTime = 0
            return
        }
    }

    window.requestAnimationFrame(checkDelay)
}

const createFormAsyncComponent = (componentName: string) => {
    isComponentLoading.value = true
    checkDelay()
    componentLoadPromise = new Promise(resolve => {
        componentLoadResolve = resolve;
    })

    return defineAsyncComponent({
        loader: async () => {
            try {
                const componentImporter = COMPONENT_MAP.get(componentName)
                if (!componentImporter) {
                    throw new Error(`Can not find Component named ${componentName}.`)
                }
                const component = await componentImporter()

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