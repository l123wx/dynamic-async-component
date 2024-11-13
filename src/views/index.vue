<template>
  <div>
    <ElRadioGroup v-model="activeComponent" @change="handleRadioChange">
      <ElRadio v-for="item in COMPONENT_LIST" :key="item" :value="item">{{ item }}</ElRadio>
    </ElRadioGroup>
    <div>
      <DynamicForm :name="activeComponent" :loading-delay="0" />
      <ElButton @click="handleBtnClick">Say Hello</ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElRadioGroup, ElRadio, ElButton } from 'element-plus'

import COMPONENT_MAP from '@/components/Forms/componentMap'
import useDynamicForm from '@/components/DynamicForm/useDynamicForm';

const [DynamicForm, componentRef] = useDynamicForm()

const COMPONENT_LIST = [...COMPONENT_MAP.keys()]
const activeComponent = ref(COMPONENT_LIST[0])

const handleBtnClick = () => {
  componentRef.value?.hello()
}

const handleRadioChange = () => {
  console.log(componentRef.value)
  componentRef.value?.hello()
}
</script>