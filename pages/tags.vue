<script setup>
import { useAuthStore } from '~/stores/auth-store'

const config = useRuntimeConfig()
const api = config.public.apiBase
const authStore = useAuthStore()

const tags = ref([])
const loading = ref(false)
const error = ref('')

async function loadTags() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch(`${api}/tags`, {
      headers: authStore.token
        ? { Authorization: `Bearer ${authStore.token}` }
        : {}
    })
    tags.value = res || []
  } catch (e) {
    console.error(e)
    error.value = 'Erro ao carregar tags.'
  } finally {
    loading.value = false
  }
}

async function toggleSubscribe(tag) {
  if (!authStore.token) return

  const subscribed = tag.subscribed // ou outro campo que tenham no DTO
  const method = subscribed ? 'DELETE' : 'POST'
  const url = `${api}/tags/${tag.id}/${subscribed ? 'unsubscribe' : 'subscribe'}`

  try {
    await $fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    })
    tag.subscribed = !subscribed
  } catch (e) {
    console.error(e)
    alert('Erro ao atualizar subscrição da tag.')
  }
}

await loadTags()
</script>

<template>
  <div class="container mt-5">
    <h2>Tags</h2>
    <p>Lista de tags disponíveis e subscrições do utilizador.</p>

    <div v-if="loading">A carregar tags...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="!tags.length">Não há tags disponíveis.</div>
    <table v-else class="table">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Publicações</th>
          <th>Subscrita</th>
          <th>Ação</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="t in tags" :key="t.id">
          <td>{{ t.name }}</td>
          <td>{{ t.publicationsCount ?? '—' }}</td>
          <td>{{ t.subscribed ? 'Sim' : 'Não' }}</td>
          <td>
            <button
              class="btn btn-sm"
              :class="t.subscribed ? 'btn-danger' : 'btn-primary'"
              @click="toggleSubscribe(t)"
              :disabled="!authStore.token"
            >
              {{ t.subscribed ? 'Cancelar' : 'Subscrever' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
