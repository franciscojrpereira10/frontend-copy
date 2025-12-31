<script setup>
import { useAuthStore } from '~/stores/auth-store'

const config = useRuntimeConfig()
const api = config.public.apiBase
const authStore = useAuthStore()
const route = useRoute()
const id = route.params.id

// Formatação de data
const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('pt-PT', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

// ---- PUBLICAÇÃO ----
const { data, pending, error } = await useFetch(() => `${api}/publications/${id}`, {
  key: `pub-${id}`,
  headers: authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}
})

const publication = computed(() => data.value || null)

useHead({
  title: computed(() => publication.value?.title || 'Detalhes da Publicação')
})

// ---- COMENTÁRIOS ----
const comments = ref([])
const commentsError = ref('')
const loadingComments = ref(false)
const newComment = ref('')
const sendingComment = ref(false)
const sendError = ref('')

async function loadComments() {
  loadingComments.value = true
  commentsError.value = ''
  try {
    const res = await $fetch(`${api}/publications/${id}/comments`, {
      headers: authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}
    })
    comments.value = res || []
    
    // DEBUG: Mostra no console o que a API enviou para termos a certeza
    if (comments.value.length > 0) {
      console.log('Primeiro comentário:', comments.value[0])
    }
  } catch (e) {
    console.error(e)
    commentsError.value = 'Não foi possível carregar os comentários.'
  } finally {
    loadingComments.value = false
  }
}

await loadComments()

async function submitComment() {
  if (!newComment.value.trim()) return

  sendingComment.value = true
  sendError.value = ''
  try {
    await $fetch(`${api}/publications/${id}/comments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      },
      body: { content: newComment.value }
    })
    newComment.value = ''
    await loadComments()
  } catch (e) {
    console.error(e)
    sendError.value = 'Erro ao enviar comentário.'
  } finally {
    sendingComment.value = false
  }
}

// ---- DOWNLOAD ----
const downloading = ref(false)

async function downloadFile() {
  downloading.value = true
  try {
    const blob = await $fetch(`${api}/publications/${id}/download`, {
      responseType: 'blob',
      headers: authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `publicacao_${id}.pdf`) 
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (e) {
    console.error('Erro no download:', e)
    alert('Erro ao baixar o ficheiro. Verifica permissões.')
  } finally {
    downloading.value = false
  }
}

// ---- FUNÇÃO DE RESGATE DO NOME ----
// Esta função procura o nome em todos os cantos possíveis da resposta da API
function getDisplayName(c) {
  const name = c.authorName 
            || c.authorUsername 
            || c.user?.name 
            || c.User?.name 
            || c.author?.name 
            || c.username 
            || c.User?.username;
  
  // Se não encontrar nada, retorna "Utilizador" em vez de deixar vazio
  return name || 'Utilizador';
}
</script>

<template>
  <div class="page-container">
    
    <div v-if="pending" class="loading-state">
      <div class="spinner"></div>
      <p>A carregar publicação...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <h3>Ops! Algo correu mal.</h3>
      <NuxtLink to="/" class="btn secondary">Voltar ao início</NuxtLink>
    </div>

    <div v-else-if="publication" class="content-wrapper">
      
      <header class="pub-header card">
        <div class="header-top">
          <span class="badge area">{{ publication.scientificArea || 'Área Geral' }}</span>
          <div class="rating" v-if="publication.averageRating">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#FBBF24" stroke="#FBBF24" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            <span>{{ publication.averageRating.toFixed(1) }}</span>
          </div>
        </div>

        <h1 class="title">{{ publication.title }}</h1>
        
        <div class="meta-info">
          <div class="meta-item">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            <span class="authors">{{ publication.authors || 'Autor Desconhecido' }}</span>
          </div>
          <div class="meta-item" v-if="publication.createdAt">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span>{{ formatDate(publication.createdAt) }}</span>
          </div>
        </div>

        <div class="actions">
          <button class="btn primary download-btn" @click="downloadFile" :disabled="downloading">
            <svg v-if="!downloading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            <span v-if="downloading" class="mini-spinner"></span>
            {{ downloading ? 'A baixar...' : 'Baixar Documento' }}
          </button>
        </div>
      </header>

      <div class="main-grid">
        <section class="comments-section card">
          <div class="comments-header">
            <h3>Comentários <span class="count">({{ comments.length }})</span></h3>
          </div>

          <div v-if="authStore.token" class="comment-input-area">
            <textarea
              v-model="newComment"
              placeholder="Escreve a tua opinião sobre esta publicação..."
              rows="3"
            ></textarea>
            
            <div class="form-actions">
              <span v-if="sendError" class="error-msg">{{ sendError }}</span>
              <button
                class="btn primary small"
                @click="submitComment"
                :disabled="sendingComment || !newComment.trim()"
              >
                {{ sendingComment ? 'A enviar...' : 'Publicar' }}
              </button>
            </div>
          </div>
          
          <div v-else class="login-prompt">
            <p>Faz <NuxtLink to="/login" class="link">login</NuxtLink> para comentares.</p>
          </div>

          <div v-if="loadingComments" class="skeleton-loader">A carregar...</div>
          <ul v-else-if="comments.length" class="comment-list">
            <li v-for="c in comments" :key="c.id" class="comment-item">
              <div class="avatar-placeholder">
                {{ getDisplayName(c)[0].toUpperCase() }}
              </div>
              <div class="comment-body">
                <div class="comment-meta">
                  <strong>{{ getDisplayName(c) }}</strong>
                  <span class="date">{{ formatDate(c.createdAt) }}</span>
                </div>
                <p class="comment-text">{{ c.content }}</p>
              </div>
            </li>
          </ul>
          <div v-else class="empty-state">
            <p>Ainda não há comentários.</p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Variáveis */
:root {
  --primary: #4f46e5;
  --bg-page: #f9fafb;
  --text-main: #111827;
  --border: #e5e7eb;
}

.page-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: 'Inter', sans-serif;
  color: #1f2937;
}

.card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  padding: 32px;
  border: 1px solid var(--border);
  margin-bottom: 24px;
}

/* Header */
.header-top { display: flex; justify-content: space-between; margin-bottom: 16px; }
.badge.area { background: #eff6ff; color: #2563eb; padding: 4px 12px; border-radius: 99px; font-weight: 600; font-size: 0.85rem; text-transform: uppercase; }
.rating { display: flex; align-items: center; gap: 4px; font-weight: bold; }
.title { font-size: 2rem; font-weight: 800; margin: 0 0 16px 0; color: #111827; }
.meta-info { display: flex; gap: 24px; color: #6b7280; font-size: 0.95rem; margin-bottom: 24px; }
.meta-item { display: flex; align-items: center; gap: 8px; }
.icon { width: 18px; height: 18px; opacity: 0.7; }
.actions { border-top: 1px solid var(--border); padding-top: 24px; }

/* Comentários */
.comments-header { margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 10px; }
.comments-header h3 { font-size: 1.25rem; margin: 0; }
.count { color: #6b7280; font-weight: normal; font-size: 1rem; }

/* INPUT E BOTÃO */
.comment-input-area {
  margin-bottom: 48px; /* Espaçamento grande */
  padding-bottom: 24px;
  border-bottom: 1px solid #f3f4f6;
}

textarea {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #d1d5db;
  min-height: 80px;
  font-family: inherit;
  resize: vertical;
}
textarea:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px; 
}

/* Lista de Comentários */
.comment-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 24px; }
.comment-item { display: flex; gap: 16px; }
.avatar-placeholder { width: 40px; height: 40px; background: #e0e7ff; color: #4f46e5; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; }
.comment-body { flex: 1; }
.comment-meta { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 0.9rem; }
.date { color: #9ca3af; font-size: 0.8rem; }
.comment-text { color: #4b5563; line-height: 1.5; margin: 0; }

.empty-state { text-align: center; color: #9ca3af; padding: 20px; font-style: italic; }
.login-prompt { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 40px; }
.link { color: #4f46e5; font-weight: 600; text-decoration: none; }

/* BOTÕES */
.btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 24px; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; text-decoration: none; font-size: 0.95rem; }

.btn.primary { background: #4f46e5; color: white; }
.btn.primary:hover { background: #4338ca; transform: translateY(-1px); }
.btn.primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.btn.secondary { background: #f3f4f6; color: #1f2937; }
.btn.secondary:hover { background: #e5e7eb; }

/* Utils */
.download-btn svg { width: 20px; height: 20px; }
.mini-spinner { width: 16px; height: 16px; border: 2px solid #ffffff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; }
.spinner { border: 4px solid #f3f3f3; border-top: 4px solid #4f46e5; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 16px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.loading-state, .error-state { text-align: center; padding: 60px 0; }
.error-msg { color: #dc2626; font-size: 0.85rem; align-self: center; }

@media (max-width: 640px) {
  .card { padding: 20px; }
  .title { font-size: 1.5rem; }
  .meta-info { flex-direction: column; gap: 8px; }
}
</style>