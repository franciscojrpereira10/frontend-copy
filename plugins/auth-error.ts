export default defineNuxtPlugin((nuxtApp) => {
    const authStore = useAuthStore()

    nuxtApp.hook('app:error', (error) => {
        // Se for erro de fetch com 401
        if (error?.statusCode === 401 || error?.response?.status === 401) {
            console.log('401 Recusado, logout forçado.')
            authStore.logout()
            navigateTo('/login') // ou router.push
        }
    })

    // Também podemos interceptar o $fetch se quisermos ser mais agressivos
    const originalFetch = globalThis.$fetch
    globalThis.$fetch = async (...args) => {
        try {
            return await originalFetch(...args)
        } catch (err: any) {
            if (err.response?.status === 401) {
                // Token inválido (bloqueado user status ou expirado)
                authStore.token = null
                authStore.user = null
                authStore.originalRole = null

                const route = useRoute()
                // Se estivermos na página de reset password, não redirecionar para login
                // Apenas limpamos a sessão para permitir que o reset continue
                if (route.path !== '/reset-password' && route.path !== '/recover-password') {
                    navigateTo('/login')
                }
            }
            throw err
        }
    }
})
