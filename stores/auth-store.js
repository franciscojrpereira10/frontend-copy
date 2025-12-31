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

        // backend: { token: "...", username: "..." }
        this.token = response.token
        this.user = { username: response.username }

        const tokenCookie = useCookie('token')
        tokenCookie.value = response.token

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

    loadUserFromStorage() {
      const tokenCookie = useCookie('token')
      const userCookie = useCookie('user')

      if (tokenCookie.value) {
        this.token = tokenCookie.value
        this.user = userCookie.value
      }
    }
  }
})
