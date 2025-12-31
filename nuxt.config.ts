export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',

  devtools: { enabled: true },

  modules: [
    '@pinia/nuxt'
  ],

  nitro: {
    routeRules: {
      '/api/**': {
        proxy: 'http://localhost:8080/academics/api/**'
      }
    }
  },

  runtimeConfig: {
    public: {
      apiBase: '/api'
    }
  }
})