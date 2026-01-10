import { useAuthStore } from '~/stores/auth-store'

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  authStore.loadUserFromStorage()

  const publicRoutes = [
    '/',
    '/login',
    '/signup',
    '/recover-password',
    '/reset-password' // Rota correta usada no ficheiro reset-password.vue
  ]
  const guestOnlyRoutes = ['/login', '/signup', '/recover-password']

  // Normalizar path (remover trailing slash)
  const path = to.path.replace(/\/$/, '') || '/'

  // Se o utilizador já está logado e tenta aceder a rotas de convidado (login, signup, reset), manda para a home
  // Exceção: Se for fazer reset pode querer fazer logout, mas por norma assumimos que se está logado não precisa de resetar via link externo
  if (authStore.isAuthenticated && guestOnlyRoutes.includes(path)) {
    return navigateTo('/')
  }

  // Verifica se é rota pública
  // Se path começa com /publications/ também é semi-publico (detalhes e lista), mas create é protegido?
  // O middleware antigo tinha logica complexa. Vamos simplificar.
  // SE NÃO ESTÁ AUTENTICADO
  if (!authStore.isAuthenticated) {
    // Se for rota pública exata -> OK
    if (publicRoutes.includes(path)) {
      return
    }

    // Se for publicações (lista e detalhes) -> OK. 
    // MAS /publications/create TEM de ser bloqueado.
    // Publicações agoras são privadas? O user diz "grande erro de segurança".
    // Então removemos a exceção para /publications
    // if (path.startsWith('/publications')) { ... } REMOVIDO

    // Se for Tags ou Statistics (parece que eram publicas no default layout?)
    // Navbar diz: Auth required for Tags, Statistics.
    // Então bloqueia.

    return navigateTo('/login')
  }

  // SE ESTÁ AUTENTICADO
  // Verifica Admin routes
  if (path.startsWith('/admin') && authStore.userRole !== 'ADMIN') {
    return navigateTo('/')
  }
})
