<script setup>
import { useAuthStore } from '~/stores/auth-store'

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const api = config.public.apiBase
const authStore = useAuthStore()

// Tenta ler a cookie diretamente para ser mais rápido que a Store no F5
const tokenCookie = useCookie('token')

const pubId = route.params.id

// ---- ESTADOS ----
const newComment = ref('')
const isDownloading = ref(false)
const submittingComment = ref(false)
const submittingRating = ref(false)

// Estados de Rating
const ratingStats = ref({
  average: 0,
  count: 0,
  userRating: 0 // O meu voto
})

// ---- 1. CARREGAR DADOS DA PUBLICAÇÃO ----
const { data: publication, pending } = await useFetch(`${api}/publications/${pubId}`, {
  headers: tokenCookie.value ? { Authorization: `Bearer ${tokenCookie.value}` } : {}
})

// ---- 2. BUSCAR MÉDIA GERAL (Público) ----
async function fetchAverageStats() {
  try {
    const data = await $fetch(`${api}/publications/${pubId}/ratings`)
    ratingStats.value.average = data.average || 0
    ratingStats.value.count = data.count || 0
  } catch (e) {
    console.error("Erro stats", e)
  }
}

// ---- 3. BUSCAR O MEU VOTO (Privado) ----
async function fetchMyRating() {
  // Usa o token da Store OU da Cookie (para o F5)
  const token = authStore.token || tokenCookie.value
  
  // Se não houver token nenhum, não vale a pena pedir
  if (!token) return

  try {
    const data = await $fetch(`${api}/publications/${pubId}/ratings/my`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    // Se o servidor devolver valor, atualizamos
    if (data && data.stars !== undefined) {
      ratingStats.value.userRating = data.stars
    }
  } catch (e) {
    console.error("Erro ao buscar meu voto", e)
  }
}

// ---- INICIALIZAÇÃO ----
onMounted(() => {
  fetchAverageStats()
  fetchMyRating()
})

// ---- SOLUÇÃO DO F5 (Watcher) ----
// Se o token aparecer depois da página carregar (o que acontece no F5),
// executamos o fetchMyRating novamente.
watch(() => authStore.token, (newToken) => {
  if (newToken) {
    fetchMyRating()
  }
})

// ---- 4. CARREGAR COMENTÁRIOS ----
const { data: commentsData, refresh: refreshComments } = await useFetch(`${api}/publications/${pubId}/comments`, {
  headers: tokenCookie.value ? { Authorization: `Bearer ${tokenCookie.value}` } : {},
  lazy: true 
})

const comments = computed(() => commentsData.value || [])

// ---- 5. ENVIAR RATING ----
async function submitRating(stars) {
  const token = authStore.token || tokenCookie.value
  if (!token) {
    alert("Tens de fazer login para avaliar!")
    return router.push('/login')
  }
  
  // UI Otimista: Pinta logo as estrelas
  const previousRating = ratingStats.value.userRating
  ratingStats.value.userRating = stars
  
  submittingRating.value = true
  
  try {
    await $fetch(`${api}/publications/${pubId}/ratings`, {
      method: 'POST',
      body: { stars: stars }, 
      headers: { Authorization: `Bearer ${token}` }
    })
    
    // Atualiza a média global
    await fetchAverageStats()
    
  } catch (e) {
    console.error(e)
    alert('Erro ao avaliar.')
    ratingStats.value.userRating = previousRating // Reverte se der erro
  } finally {
    submittingRating.value = false
  }
}

// ---- 6. ENVIAR COMENTÁRIO ----
async function submitComment() {
  if (!newComment.value.trim()) return
  const token = authStore.token || tokenCookie.value
  if (!token) return router.push('/login')

  submittingComment.value = true
  try {
    await $fetch(`${api}/publications/${pubId}/comments`, {
      method: 'POST',
      body: { content: newComment.value }, 
      headers: { Authorization: `Bearer ${token}` }
    })
    newComment.value = ''
    refreshComments() 
  } catch (e) {
    alert('Erro ao enviar comentário.')
  } finally {
    submittingComment.value = false
  }
}

// ---- 7. DOWNLOAD (Com Contador) ----
async function downloadFile() {
  const token = authStore.token || tokenCookie.value
  if (!token) return router.push('/login')
  
  isDownloading.value = true
  try {
    const blob = await $fetch(`${api}/publications/${pubId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', publication.value?.filename || `artigo-${pubId}`)
    document.body.appendChild(link)
    link.click()
    link.remove()

    if (publication.value) {
      publication.value.downloadCount = (Number(publication.value.downloadCount) || 0) + 1
    }

  } catch (e) {
    alert('Erro ao descarregar.')
  } finally {
    isDownloading.value = false
  }
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-PT') : ''
</script>

<template>
  <div class="page-container">
    
    <div v-if="pending" class="loading-state">
      <div class="spinner"></div>
      <p>A carregar...</p>
    </div>

    <div v-else-if="!publication" class="error-state">
      <h1>Publicação não encontrada</h1>
      <NuxtLink to="/publications" class="btn secondary">Voltar à lista</NuxtLink>
    </div>

    <div v-else class="content-grid">
      
      <main class="main-content">
        <NuxtLink to="/publications" class="back-link">← Voltar à Biblioteca</NuxtLink>
        
        <header class="pub-header">
          <div class="badges">
            <span class="badge area">{{ publication.scientificArea }}</span>
            <span class="badge date">{{ formatDate(publication.createdAt) }}</span>
          </div>
          
          <h1 class="pub-title">{{ publication.title }}</h1>
          
          <div class="authors">
            <strong>Autores:</strong> {{ publication.authors }}
          </div>

          <div v-if="publication.tags && publication.tags.length" class="tags-list">
            <span v-for="tag in publication.tags" :key="tag.id" class="tag">#{{ tag.name }}</span>
          </div>
        </header>

        <section class="pub-summary">
          <h3>Resumo</h3>
          <p>{{ publication.summary }}</p>
        </section>

        <section class="comments-section">
          <h3>Comentários ({{ comments.length }})</h3>
          
          <div v-if="comments.length" class="comments-list">
            <div v-for="comment in comments" :key="comment.id" class="comment-card">
              <div class="comment-header">
                <span class="username">{{ comment.username || 'Utilizador' }}</span>
                <span class="timestamp">{{ formatDate(comment.createdAt) }}</span>
              </div>
              <p class="comment-text">{{ comment.content }}</p>
            </div>
          </div>
          <p v-else class="no-comments">Ainda não há comentários.</p>

          <div class="add-comment">
            <textarea 
              v-model="newComment" 
              placeholder="Escreve um comentário..." 
              rows="3"
              :disabled="!tokenCookie"
            ></textarea>
            <div class="form-footer">
              <button 
                v-if="tokenCookie" 
                @click="submitComment" 
                class="btn primary"
                :disabled="submittingComment || !newComment"
              >
                Publicar
              </button>
            </div>
          </div>
        </section>
      </main>

      <aside class="sidebar">
        
        <div class="action-card card">
          <button @click="downloadFile" class="btn full download-btn" :disabled="isDownloading">
            <span v-if="isDownloading">A descarregar...</span>
            <span v-else>📄 Descarregar Artigo</span>
          </button>

          <hr class="divider">

          <div class="rating-block">
            <h4>Classificação</h4>
            <div class="big-rating">
              <span class="star-icon">★</span> 
              <span>{{ ratingStats.average.toFixed(1) }}</span>
              <span class="total">/ 5</span>
            </div>
            <p class="vote-count">({{ ratingStats.count }} votos)</p>
            
            <div class="user-vote" v-if="tokenCookie">
              <p class="vote-label">A tua avaliação:</p>
              
              <div class="stars-input">
                <button 
                  v-for="i in 5" 
                  :key="i" 
                  @click="submitRating(i)" 
                  type="button"
                  :class="{ active: i <= ratingStats.userRating }"
                  :disabled="submittingRating"
                >★</button>
              </div>

            </div>
          </div>
        </div>

        <div class="info-card card">
          <h3>Info</h3>
          <ul class="info-list">
            <li>
              <strong>Enviado por:</strong> 
              <span>{{ publication.uploadedBy?.username || publication.username || 'Sistema' }}</span>
            </li>
            <li>
              <strong>Downloads:</strong> 
              <span>{{ publication.downloadCount || 0 }}</span>
            </li>
            <li>
              <strong>Ficheiro:</strong> 
              <span class="file-tag">{{ publication.filename?.split('.').pop().toUpperCase() || 'FILE' }}</span>
            </li>
          </ul>
        </div>

      </aside>

    </div>
  </div>
</template>

<style scoped>
.page-container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; font-family: 'Inter', sans-serif; }
.content-grid { display: grid; grid-template-columns: 1fr 320px; gap: 40px; }
.back-link { display: inline-block; margin-bottom: 20px; color: #6b7280; text-decoration: none; font-size: 0.9rem; font-weight: 500; }
.back-link:hover { color: #4f46e5; }
.pub-header { margin-bottom: 30px; }
.badges { display: flex; gap: 10px; margin-bottom: 12px; }
.badge { padding: 4px 12px; border-radius: 99px; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; }
.badge.area { background: #eff6ff; color: #4f46e5; }
.badge.date { background: #f3f4f6; color: #6b7280; }
.pub-title { font-size: 2.2rem; color: #111827; margin: 0 0 16px 0; line-height: 1.2; font-weight: 800; }
.authors { font-size: 1.1rem; color: #4b5563; }
.tags-list { margin-top: 16px; display: flex; gap: 8px; flex-wrap: wrap; }
.tag { background: #f3f4f6; color: #4b5563; padding: 4px 10px; border-radius: 6px; font-size: 0.85rem; font-weight: 500; }
.pub-summary { background: white; padding: 30px; border-radius: 12px; border: 1px solid #e5e7eb; margin-bottom: 40px; line-height: 1.7; color: #374151; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.pub-summary h3 { margin-top: 0; color: #111827; margin-bottom: 16px; }
.card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
.download-btn { background: #4f46e5; color: white; width: 100%; justify-content: center; margin-bottom: 16px; padding: 12px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; }
.download-btn:disabled { opacity: 0.7; }
.divider { border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0; }
.rating-block { text-align: center; }
.big-rating { font-size: 2.5rem; font-weight: 800; color: #1f2937; display: flex; align-items: center; justify-content: center; gap: 8px; }
.star-icon { color: #fbbf24; }
.total { font-size: 1rem; color: #9ca3af; font-weight: 400; align-self: flex-end; margin-bottom: 8px; }
.vote-count { color: #6b7280; font-size: 0.9rem; margin-top: -5px; margin-bottom: 15px; }
.vote-label { font-size: 0.9rem; color: #4b5563; margin-bottom: 4px; }
.stars-input { display: flex; justify-content: center; gap: 4px; }
.stars-input button { background: none; border: none; font-size: 1.8rem; color: #e5e7eb; cursor: pointer; transition: transform 0.1s, color 0.2s; padding: 0; line-height: 1; }
.stars-input button.active { color: #fbbf24; }
.info-list { list-style: none; padding: 0; margin: 0; }
.info-list li { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 0.95rem; }
.info-list li:last-child { border-bottom: none; }
.file-tag { background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 700; }
.comments-section h3 { font-size: 1.5rem; color: #111827; margin-bottom: 20px; }
.comments-list { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
.comment-card { background: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #f3f4f6; }
.comment-header { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem; }
.username { font-weight: 700; color: #1f2937; }
.timestamp { color: #9ca3af; }
.comment-text { margin: 0; color: #4b5563; line-height: 1.5; }
.no-comments { color: #6b7280; font-style: italic; background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; }
.add-comment textarea { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; margin-bottom: 12px; font-family: inherit; resize: vertical; font-size: 0.95rem; }
.add-comment textarea:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
.form-footer { display: flex; justify-content: flex-end; align-items: center; }
.btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; text-decoration: none; font-size: 0.95rem; transition: background 0.2s; }
.btn.primary { background: #4f46e5; color: white; }
.btn.primary:hover { background: #4338ca; }
.btn.secondary { background: white; border: 1px solid #d1d5db; color: #374151; }
.btn.secondary:hover { background: #f3f4f6; }
.loading-state, .error-state { text-align: center; padding: 80px 0; color: #6b7280; }
.spinner { border: 3px solid #f3f3f3; border-top: 3px solid #4f46e5; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 16px; }
@media (max-width: 900px) { .content-grid { grid-template-columns: 1fr; } .sidebar { order: -1; } }
</style>