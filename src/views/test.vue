<template>
  <div>
    <ElRadioGroup v-model="activeComponentKey" @change="handleRadioChange">
      <ElRadioButton v-for="item in COMPONENT_LIST" :key="item" :value="item">{{ item }}</ElRadioButton>
    </ElRadioGroup>
    <component ref="componentRef" :is="activeComponent" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent, nextTick } from 'vue';
import { ElRadioGroup, ElRadioButton } from 'element-plus';

import COMPONENT_MAP, { type ComponentInstance } from '@/components/DynamicForm/componentMap'

const COMPONENT_LIST = Object.keys(COMPONENT_MAP) as (keyof typeof COMPONENT_MAP)[];

const componentRef = ref<ComponentInstance | null>(null)
const activeComponentKey = ref(COMPONENT_LIST[0])
const activeComponent = computed(() => defineAsyncComponent(COMPONENT_MAP[activeComponentKey.value]))

const handleRadioChange = () => {
  console.log(componentRef.value)

  nextTick(() => {
    console.log(componentRef.value)
  })

  setTimeout(() => {
    console.log(componentRef.value)
  })

  setTimeout(() => {
    console.log(componentRef.value)
  }, 1000)

  componentRef.value?.hello()
}
</script>