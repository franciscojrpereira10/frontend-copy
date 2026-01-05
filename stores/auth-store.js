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
        // Adapte aqui se o seu backend devolver { token: "..." } ou string direta
        this.token = response.token || response
        this.user = { username: response.username || username }

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

    logout() {
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
    }
  }
})