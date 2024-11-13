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

这两种方式其实大差不差，而且都会导致父组件需要编写很多额外的代码：

1.用于记录加载状态的变量

```ts
const isLoaded = ref(false)
```

2.在调用方法前的判断

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