export default defineNuxtRouteMiddleware((to, from) => {
    const authStore = useAuthStore()

    // Whitelist de páginas públicas (não precisam de login)
    const publicRoutes = ['/', '/login', '/signup', '/auth/login', '/auth/signup']

    // Se a rota for pública, deixa passar
    if (publicRoutes.includes(to.path)) {
        return
    }

    // Lista de publicações e Detalhes são públicas, mas Create não.
    if (to.path.startsWith('/publications/')) {
        if (to.path === '/publications/create' && !authStore.token) {
            return navigateTo('/login')
        }
        // Deixa ver detalhes pública
        return
    }

    // Se não for pública e não tiver token -> login
    if (!authStore.token) {
        return navigateTo('/login')
    }

    // Se for admin, verificar role extra? (opcional)
    if (to.path.startsWith('/admin') && authStore.userRole !== 'ADMIN') {
        return navigateTo('/')
    }
})
