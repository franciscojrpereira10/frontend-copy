<script setup>
definePageMeta({
  middleware: ['auth']
})

const router = useRouter()
const authStore = useAuthStore()

onMounted(() => {
  if (authStore.userRole !== 'ADMIN') {
    router.push('/')
  } else {
    router.push('/admin/users')
  }
})
</script>

<template>
  <div class="loading">
    <div class="spinner"></div>
    <p>A redirecionar para gestão de utilizadores...</p>
  </div>
</template>

<style scoped>
.loading { text-align: center; padding: 50px; }
.spinner { border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
