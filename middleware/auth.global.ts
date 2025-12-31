// middleware/auth.global.ts
import { useAuthStore } from '~/stores/auth-store'

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  // carregar estado das cookies (seguro, só lê)
  authStore.loadUserFromStorage()

  const publicRoutes = ['/login']

  if (!authStore.isAuthenticated && !publicRoutes.includes(to.path)) {
    return navigateTo('/login')
  }
})
