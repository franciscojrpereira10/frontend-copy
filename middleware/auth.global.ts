// middleware/auth.global.ts
import { useAuthStore } from '~/stores/auth-store'

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  // carregar estado das cookies (seguro, só lê)
  authStore.loadUserFromStorage()

  const publicRoutes = ['/login', '/signup', '/recover-password', '/auth/reset-password']
  const guestOnlyRoutes = ['/login', '/signup', '/recover-password', '/auth/reset-password']

  // Normalizar path (remover trailing slash)
  const path = to.path.replace(/\/$/, '') || '/'

  // Permitir explicitamente a rota de reset password para garantir que não falha
  if (path === '/auth/reset-password') {
    if (authStore.isAuthenticated) {
      return navigateTo('/')
    }
    return // Deixa passar (é pública)
  }

  if (authStore.isAuthenticated && guestOnlyRoutes.includes(path)) {
    return navigateTo('/')
  }

  // Verifica se é rota pública ou se é a Home
  if (!authStore.isAuthenticated && !publicRoutes.includes(path) && path !== '/') {
    return navigateTo('/login')
  }
})
