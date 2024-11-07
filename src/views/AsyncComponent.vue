<template>
  <div>
    <ElRadioGroup v-model="activeComponentKey" @change="handleRadioChange">
      <ElRadio v-for="item in COMPONENT_LIST" :key="item" :value="item">{{ item }}</ElRadio>
    </ElRadioGroup>
    <component ref="componentRef" :is="activeComponent" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent, nextTick } from 'vue';
import { ElRadioGroup, ElRadio } from 'element-plus';

import COMPONENT_MAP, { type ComponentInstance } from '@/components/Forms/componentMap'

const COMPONENT_LIST = [...COMPONENT_MAP.keys()];

const componentRef = ref<ComponentInstance | null>(null)
const activeComponentKey = ref(COMPONENT_LIST[0])
const activeComponent = computed(() => {
  const componentImporter = COMPONENT_MAP.get(activeComponentKey.value)

  if (!componentImporter) return null

  return defineAsyncComponent(componentImporter)
})

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