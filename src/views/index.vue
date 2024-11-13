<template>
  <div>
    <ElRadioGroup v-model="activeComponent" @change="handleRadioChange">
      <ElRadio v-for="item in COMPONENT_LIST" :key="item" :value="item">{{ item }}</ElRadio>
    </ElRadioGroup>
    <DynamicForm ref="componentRef" :name="activeComponent" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElRadioGroup, ElRadio } from 'element-plus'

import DynamicForm from '@/components/DynamicForm/index.vue'
import COMPONENT_MAP from '@/components/Forms/componentMap'

const COMPONENT_LIST = [...COMPONENT_MAP.keys()]

const componentRef = ref<InstanceType<typeof DynamicForm> | null>(null)
const activeComponent = ref(COMPONENT_LIST[0])

const handleRadioChange = () => {
  console.log(componentRef.value)
  componentRef.value!.call('hello')
}
</script>