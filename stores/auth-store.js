// stores/auth-store.js
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => state.user?.role || null
  },

  actions: {
    async login(username, password) {
      const config = useRuntimeConfig()

      try {
        const response = await $fetch(`${config.public.apiBase}/auth/login`, {
          method: 'POST',
          body: { username, password }
        })

        // Atualiza o estado com a resposta do backend
        this.token = response.token || response
        // GARANTIR QUE GUARDAMOS O ROLE
        // O backend retorna: { token: "...", username: "...", role: "..." } (dependendo da implementação no AuthResource)
        // Se o AuthResource.login retornar só token, temos de fazer fetch do user info de seguida.
        // Mas assumindo que o login devolve info extra ou que vamos buscar:

        // Simulação segura: se o response tiver role, usamos.
        this.user = {
          username: response.username || username,
          role: response.role || 'CONTRIBUTOR' // fallback
        }

        // Guarda nas cookies para não perder o login ao fazer F5
        const tokenCookie = useCookie('token')
        tokenCookie.value = this.token

        const userCookie = useCookie('user')
        userCookie.value = this.user

        return true
      } catch (error) {
        console.error('Erro no login:', error)
        throw error
      }
    },

    async logout() {
      const config = useRuntimeConfig()

      // Tenta avisar o backend para limpar o lastLogin
      if (this.token) {
        try {
          await $fetch(`${config.public.apiBase}/auth/logout`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.token}` }
          })
        } catch (e) {
          console.error('Erro no logout de backend:', e)
        }
      }

      this.token = null
      this.user = null

      const tokenCookie = useCookie('token')
      tokenCookie.value = null
      const userCookie = useCookie('user')
      userCookie.value = null

      const router = useRouter()
      router.push('/login')
    },

    // --- ESTA É A FUNÇÃO QUE FALTAVA ---
    // O app.vue chama esta função ao arrancar. 
    // Ela recupera o token das cookies para manteres o login ativo.
    loadUserFromStorage() {
      const tokenCookie = useCookie('token')
      const userCookie = useCookie('user')

      if (tokenCookie.value) {
        this.token = tokenCookie.value
      }
      if (userCookie.value) {
        this.user = userCookie.value
      }
    },

    async recoverPassword(email) {
      const config = useRuntimeConfig()
      try {
        const response = await $fetch(`${config.public.apiBase}/auth/recover`, {
          method: 'POST',
          body: { email }
        })
        return response
      } catch (error) {
        console.error('Erro ao recuperar password:', error)
        throw error
      }
    },

    async resetPassword(token, password) {
      const config = useRuntimeConfig()
      await $fetch(`${config.public.apiBase}/auth/reset-password`, {
        method: 'POST',
        body: { token, password }
      })
    }
  }
})