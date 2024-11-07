<template>
  <img class="logo" src="/logo.gif" alt="logo" />
  <router-view v-slot="{ Component, route }">
    <transition name="fade-transform" mode="out-in">
      <keep-alive :include="cacheList">
        <component v-if="!route.meta.link" :is="Component" :key="route.path" />
      </keep-alive>
    </transition>
  </router-view>
</template>

<script setup lang="ts">
import { ref, KeepAlive } from 'vue';

const cacheList = ref<string[]>([])
</script>
