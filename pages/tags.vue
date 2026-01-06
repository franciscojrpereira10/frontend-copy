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

  const subscribed = tag.subscribed
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
    // "F5 Automático": Recarrega os dados do servidor para atualizar contadores e estado
    await loadTags()
  } catch (e) {
    console.error(e)
    alert('Erro ao atualizar subscrição da tag.')
  }
}

onMounted(() => {
  if (authStore.token) {
    loadTags()
  }
})

// Recarregar se fizer login entretanto
watch(() => authStore.token, (val) => {
  if (val) loadTags()
})
</script>

<template>
  <div class="tags-page">
    <header class="page-header">
      <h1>Tags & Tópicos</h1>
      <p>Explora e subscreve os temas que mais te interessam.</p>
    </header>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>A carregar tags...</p>
    </div>

    <div v-else-if="error" class="error-msg">{{ error }}</div>

    <div v-else-if="!tags.length" class="empty-state">
      <p>Não há tags disponíveis de momento.</p>
    </div>

    <div v-else class="tags-grid">
      <div v-for="t in tags" :key="t.id" class="tag-card" :class="{ subscribed: t.subscribed }">
        <div class="card-header">
          <span class="tag-icon">#</span>
          <h3>{{ t.name }}</h3>
        </div>
        
        <div class="metrics">
          <div class="metric">
            <strong>{{ t.publicationCount || 0 }}</strong>
            <span>Artigos</span>
          </div>
          <div class="metric">
            <strong>{{ t.subscriberCount || 0 }}</strong>
            <span>Seguidores</span>
          </div>
        </div>

        <button 
          class="action-btn"
          :class="t.subscribed ? 'btn-unsubscribe' : 'btn-subscribe'"
          @click="toggleSubscribe(t)"
          :disabled="!authStore.token"
          :title="!authStore.token ? 'Faz login para subscrever' : ''"
        >
          <span v-if="t.subscribed">Inscrito ✓</span>
          <span v-else>Subscrever</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tags-page { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }

.page-header { text-align: center; margin-bottom: 50px; }
.page-header h1 { font-size: 2.5rem; color: #0f172a; margin: 0 0 10px 0; font-weight: 800; }
.page-header p { color: #64748b; font-size: 1.1rem; }

.tags-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.tag-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.tag-card:hover { border-color: #cbd5e1; transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.06); }

/* Destaque para subscritas */
.tag-card.subscribed { border-color: #c7d2fe; background: #f5f3ff; }

.card-header { margin-bottom: 20px; }
.tag-icon { font-size: 1.5rem; color: #4f46e5; font-weight: 900; opacity: 0.3; display: block; margin-bottom: -5px; }
.tag-card h3 { font-size: 1.4rem; margin: 0; color: #1e293b; font-weight: 700; }

.metrics { display: flex; justify-content: space-around; width: 100%; margin-bottom: 24px; border-top: 1px solid rgba(0,0,0,0.05); border-bottom: 1px solid rgba(0,0,0,0.05); padding: 12px 0; }
.metric { display: flex; flex-direction: column; }
.metric strong { font-size: 1.1rem; color: #0f172a; }
.metric span { font-size: 0.8rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }

.action-btn { width: 100%; padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; font-size: 0.95rem; }
.btn-subscribe { background: #0f172a; color: white; }
.btn-subscribe:hover { background: #334155; }
.btn-unsubscribe { background: white; border: 1px solid #d1d5db; color: #4f46e5; }
.btn-unsubscribe:hover { background: #eef2ff; border-color: #818cf8; }
.action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.loading, .error-msg, .empty-state { text-align: center; padding: 60px; color: #64748b; font-size: 1.1rem; background: #f8fafc; border-radius: 12px; }
.spinner { border: 3px solid #e2e8f0; border-top: 3px solid #4f46e5; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 16px; }

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
