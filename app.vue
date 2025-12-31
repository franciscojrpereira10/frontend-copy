<script setup>
import { useAuthStore } from '~/stores/auth-store.js';

const authStore = useAuthStore();
try {
    authStore.loadUserFromStorage();
} catch (e) {
    console.log("Sessão não iniciada");
}
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>