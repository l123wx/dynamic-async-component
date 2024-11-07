# 动态加载组件时，expose 方法调用时机

假设以下需求：

一个动态表单页面，在页面初始化的时候需要请求后端 `/getFormInfo` 接口，获取 `formType` 和 `formData`，然后根据 `formType` 动态渲染对应的表单组件，随后调用组件导出的 `setData` 方法

```ts
type formType: 'FormA' | 'FormB'
```

## 只考虑实现需求的话

_详细代码查看 `./src/views/GlobalRegister.vue`_

1.全局注册所有表单组件

2.动态渲染组件

```vue
<component ref="componentRef" :is="formType" />
```

3.设置表单数据

```ts
componentRef.value.setData()
```

这种是最简单粗暴的实现方式，但是存在很明显的问题：由于全局注册了所有的表单组件，当表单类型变多后，页面加载时间会变得非常长

所以我们需要考虑使用异步加载组件的方式

## 异步加载组件

异步组件实现起来也不困难，只需要去掉全局注册的代码