// stores/auth-store.js
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    originalRole: null // Armazena o role original durante imitação
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => state.user?.role || null,
    isImpersonating: (state) => !!state.originalRole
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
        this.originalRole = null // Reset impersonation on login

        this.user = {
          username: response.username || username,
          role: response.role || 'CONTRIBUTOR'
        }

        // Guarda nas cookies para não perder o login ao fazer F5
        const tokenCookie = useCookie('token')
        tokenCookie.value = this.token

        const userCookie = useCookie('user')
        userCookie.value = this.user

        // Garante que limpamos cookie de role original
        const originalRoleCookie = useCookie('original_role')
        originalRoleCookie.value = null

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
      this.originalRole = null

      const tokenCookie = useCookie('token')
      tokenCookie.value = null
      const userCookie = useCookie('user')
      userCookie.value = null
      const originalRoleCookie = useCookie('original_role')
      originalRoleCookie.value = null

      const router = useRouter()
      router.push('/login')
    },

    // --- ESTA É A FUNÇÃO QUE FALTAVA ---
    // O app.vue chama esta função ao arrancar. 
    // Ela recupera o token das cookies para manteres o login ativo.
    loadUserFromStorage() {
      const tokenCookie = useCookie('token')
      const userCookie = useCookie('user')
      const originalRoleCookie = useCookie('original_role')

      if (tokenCookie.value) {
        this.token = tokenCookie.value
      }
      if (userCookie.value) {
        this.user = userCookie.value
      }
      if (originalRoleCookie.value) {
        this.originalRole = originalRoleCookie.value
      }
    },

    impersonateUser() {
      if (!this.user || this.originalRole) return

      // Guarda o role atual
      this.originalRole = this.user.role

      // Muda para user normal (simulação)
      this.user.role = 'CONTRIBUTOR'

      // Persistência
      const originalRoleCookie = useCookie('original_role')
      originalRoleCookie.value = this.originalRole

      const userCookie = useCookie('user')
      userCookie.value = this.user
    },

    stopImpersonation() {
      if (!this.originalRole || !this.user) return

      // Restaura o role
      this.user.role = this.originalRole
      this.originalRole = null

      // Limpa cookies
      const originalRoleCookie = useCookie('original_role')
      originalRoleCookie.value = null

      const userCookie = useCookie('user')
      userCookie.value = this.user
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