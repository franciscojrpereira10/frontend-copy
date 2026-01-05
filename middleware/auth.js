export default defineNuxtRouteMiddleware((to, from) => {
    const authStore = useAuthStore()

    // Se não estiver autenticado, manda para login
    if (!authStore.isAuthenticated) {
        return navigateTo('/login')
    }
})
