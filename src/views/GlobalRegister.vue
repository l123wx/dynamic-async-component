<template>
  <div>
    <ElRadioGroup v-model="activeComponentKey" @change="handleRadioChange">
      <ElRadio v-for="item in COMPONENT_LIST" :key="item" :value="item">{{ item }}</ElRadio>
    </ElRadioGroup>
    <component ref="componentRef" :is="activeComponentKey" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElRadioGroup, ElRadio } from 'element-plus';

import FormA from '@/components/Forms/FormA.vue'
import FormB from '@/components/Forms/FormB.vue'
import COMPONENT_MAP, { type ComponentInstance } from '@/components/Forms/componentMap'

const COMPONENT_LIST = [...COMPONENT_MAP.keys()];
import Vue from '../main.ts'

Vue.component('FormA', FormA)
Vue.component('FormB', FormB)

const componentRef = ref<ComponentInstance | null>(null)
const activeComponentKey = ref(COMPONENT_LIST[0])

const handleRadioChange = () => {
  console.log(componentRef.value)
  componentRef.value?.hello()
}
</script>