// composables/useApiFetch.ts
import { useAuthStore } from '~/stores/auth-store'

export function useApiFetch() {
  const config = useRuntimeConfig()
  const api = config.public.apiBase
  const authStore = useAuthStore()

  return async (path: string, options: any = {}) => {
    const headers: any = {
      ...(options.headers || {}),
      Accept: 'application/json'
    }

    if (authStore.token) {
      headers.Authorization = `Bearer ${authStore.token}`
    }

    return await $fetch(`${api}${path}`, {
      ...options,
      headers
    })
  }
}
