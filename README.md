# 使用异步组件时，expose 方法调用时机

假设以下需求：

一个动态表单页面，在页面初始化的时候需要请求后端接口获取 `formType` 和 `formData`，根据 `formType` 动态渲染对应的表单组件，然后调用对应组件导出的 `setData` 方法初始数据

```ts
type formType: 'FormA' | 'FormB'
```

## 只考虑实现需求的话

1.全局注册所有表单组件

2.动态渲染组件

```vue
<component ref="componentRef" :is="formType" />
```

3.设置表单数据

```ts
componentRef.value.setData()
```

_详细代码查看 `./src/views/GlobalRegister.vue`_

这种是最简单粗暴的实现方式，但是存在很明显的问题：由于全局注册了所有的表单组件，当表单类型变多后，页面加载时间会变得非常长

所以我们需要考虑使用异步加载组件的方式

## 异步加载组件

异步组件实现起来也不困难，只需要去掉全局注册的代码，然后使用 defineAsyncComponent 定义组件

```vue
<component ref="componentRef" :is="activeComponent" />
```

```ts
const COMPONENT_MAP = new map([
    ['FormA', () => import('@/components/Forms/FormA.vue')],
    ['FormB', () => import('@/components/Forms/FormB.vue')],
])

const activeComponent = computed(() => defineAsyncComponent(COMPONENT_MAP[formType]))
```

_详细代码查看 `./src/views/AsyncComponent.vue`_

这样就能解决组件注册过多导致页面加载缓慢的问题，但是会引出一个新的问题，就是标题中提出的问题：**在使用异步组件时，如何判断 expose 可以调用的时机？**

## 异步组件 expose 方法可以调用了吗？

回顾前面的流程：

1. 请求接口获取 `formType` 和 `formData`

2. 通过 `formType` 确定展示的组件

3. 等组件挂载完成后，通过 `componentRef.value.setData()` 初始化组件数据

由于使用了异步组件，没办法通过 `onMounted` 确保组件挂载好了，所以我们得想办法让异步组件在挂载好的时候通知一下父组件，有以下几个方案：

1.提供一个双向绑定的 isLoaded prop

```vue
<template>
    <component ref="componentRef" v-model:isLoaded="isLoaded" :is="activeComponent" />
</template>
```

2.提供 loaded 事件

```vue
<template>
    <component ref="componentRef" :is="activeComponent" @loaded="handleComponentLoaded" />
</template>
```

这两种方式大差不差，都会导致父组件需要编写很多额外的代码：

1.用于记录加载状态的变量

```ts
const isLoaded = ref(false)
```

2.每次调用方法前的判断

```ts
...
// 请求接口获取 formType
fetchFormData().then(res => {
    formType.value = res.formType
    nextTick(() => {
        if (isLoaded.value) {
            componentRef.value.setFormData(formData)
        }
    })
})
...
```

有没有什么办法能在保持原有调用方式的前提下，解决异步组件的调用时机问题呢？

### 目前的最佳实践

经过一段时间的探索，最终确定了一种方案，尽量保持了原有的调用方式，并且用户调用的时候不需要再考虑调用时机

```vue
<template>
    <DynamicForm :name="formType" />
</template>

<script setup lang="ts">
import { useDynamicForm } from '@/components/DynamicForm';

const [DynamicForm, componentRef] = useDynamicForm()

fetchFormData().then(res => {
    formType.value = res.formType
    componentRef.value.setFormData(res.formData)
})
</script>
```

`DynamicForm` 本身是一个同步的组件，只要在 onMounted 之后即可立即调用 `componentRef.value` 上的方法，`componentRef.value` 是一个 Proxy，会把调用的方法替换成一个 Promise，当异步组件加载完之后再去实际调用对应组件上的方法

### 实现的几个关键

#### Promise

> https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise

1. 只要 `resolve/reject` 方法没被调用，就会一直处于 `pending` 状态

2. 当 `Promise` 状态变为 `fulfilled` 或 `rejected` 后，`Promise` 仍然是可以使用的

每次开始加载异步组件前，通过 `componentLoadPromise`、`componentLoadResolve` 两个变量存储 一个 `Promise` 和它对应的 `resolve` 方法。在组件加载完成后，调用 `resolve` 方法，让 `Promise` 变为 `fulfilled` 状态

通过 componentLoadPromise 让异步组件方法调用延迟到组件加载完成后，并且多次调用也不受影响：

```ts
const setFormData = async () => {
    await componentLoadPromise

    componentRef.value.setFormData()
}
```

#### Proxy

为了让用户在调用 expose 方法时的写法与同步组件保持一致，通过 `Proxy` 来实现这一点。将 `DynamicForm` 的 ref 替换成一个 `Proxy`，通过 `get handle` 将获取的方法替换为包装过的 Promise 方法

```ts
new Proxy({}, {
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
})
```

#### 怎么替换 component ref?

一开始想的是直接将 vue 组件上的 exposeProxy 替换成自己的 Proxy，也算是一种歪门邪道了：

```ts
import { getCurrentInstance } from 'vue'

const instance = getCurrentInstance()
instance.exposeProxy = new Proxy(...)
```

然而这种写法只在开发环境生效，打包之后就不起作用了

后面想到 vben 中 hook 组件的写法：通过 return 一个 register 方法，再让传给组件的 @register 事件

```vue
<template>
    <DynamicForm @register="register" />
</template>

<script setup lang="ts">
    const { register, componentRef, DynamicForm } = useDynamicForm()
</script>
```

DynamicForm.vue
```vue
<template>
    <component ref="componentRef" :is="activeComponent" />
</template>

<script setup lang="ts">
    const componentRef = ref()

    const emit = defineEmit(['register'])
    
    ...

    emit('register', new Proxy({}, {
        get: () => {
            ...
        }
    }))
</script>
```

useDynamicForm.ts
```ts
const useDynamicForm = () => {
    const componentRef = ref()

    const register = (customRef) => {
        componentRef.value = customRef
    }

    return {
        ...
    }
}
```

通过这样将 hook 返回的 componentRef 替换成 Proxy，模拟原生的 component ref

但是我觉得这样还不够，每次使用时都要写 `@register="register"`，能不能把这个也省略了呢？

于是最后在 hook 里面再定义了一个组件将原来的 DynamicForm 包了一遍：

```ts
const useDynamicForm = () => {
    const componentRef = ref()

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

    return [DynamicComponent, componentRef]
}
```