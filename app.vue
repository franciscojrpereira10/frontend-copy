<script setup>
import { useAuthStore } from '~/stores/auth-store.js';

const authStore = useAuthStore();
try {
    authStore.loadUserFromStorage();
} catch (e) {
    console.log("Sessão não iniciada");
}

// Auto Logout
const router = useRouter()
let inactivityTimer = null

const INACTIVITY_LIMIT = 60000 // 60 segundos (1 minuto)

function resetTimer() {
    if (!authStore.isAuthenticated) return

    if (inactivityTimer) clearTimeout(inactivityTimer)
    
    inactivityTimer = setTimeout(async () => {
        if (authStore.isAuthenticated) {
            console.log("Auto logout due to inactivity")
            await authStore.logout()
            // Router push is handled in store
            alert("Sessão expirada por inatividade.")
        }
    }, INACTIVITY_LIMIT)
}

onMounted(() => {
    // Eventos que resetam o timer
    window.addEventListener('mousemove', resetTimer)
    window.addEventListener('keydown', resetTimer)
    window.addEventListener('click', resetTimer)
    window.addEventListener('scroll', resetTimer)
    
    // Inicia o timer
    resetTimer()
})

onUnmounted(() => {
    window.removeEventListener('mousemove', resetTimer)
    window.removeEventListener('keydown', resetTimer)
    window.removeEventListener('click', resetTimer)
    window.removeEventListener('scroll', resetTimer)
    if (inactivityTimer) clearTimeout(inactivityTimer)
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>