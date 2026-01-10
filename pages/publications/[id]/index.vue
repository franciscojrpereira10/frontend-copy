<script setup>
import { useAuthStore } from '~/stores/auth-store'

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const api = config.public.apiBase
const authStore = useAuthStore()

// --- CORREÇÃO 1: Ler token direto da cookie para ser mais rápido que a Store ---
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
  userRating: 0 // Voto do utilizador atual
})

// ---- 1. CARREGAR DADOS DA PUBLICAÇÃO ----
const { data: publication, pending, refresh } = await useFetch(`${api}/publications/${pubId}`, {
  headers: tokenCookie.value ? { Authorization: `Bearer ${tokenCookie.value}` } : {}
})

// ---- 2. CARREGAR ESTATÍSTICAS DE RATING (CORRIGIDO) ----
async function fetchRatingStats() {
  try {
    // Tenta obter o token da store OU diretamente da cookie (essencial para F5)
    const token = authStore.token || tokenCookie.value
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    const data = await $fetch(`${api}/publications/${pubId}/ratings`, {
      headers: headers
    })
    
    // Atualiza a média e contagem
    ratingStats.value.average = data.average || 0
    ratingStats.value.count = data.count || 0
    
    // --- CORREÇÃO: Atualiza o voto do user ---
    // O backend devolve 'userRating'. Se vier preenchido, guardamos.
    if (data.userRating && data.userRating > 0) {
      ratingStats.value.userRating = data.userRating
    } else {
      ratingStats.value.userRating = 0
    }
  } catch (e) {
    console.error("Erro ao carregar ratings", e)
  }
}

// Carregar assim que monta a página
onMounted(() => {
  fetchRatingStats()
})

// --- CORREÇÃO 2: Watcher para recarregar se o login entrar depois ---
watch(() => authStore.token, (newToken) => {
  if (newToken) {
    fetchRatingStats()
  }
})

// ---- 3. CARREGAR COMENTÁRIOS ----
const { data: commentsData, refresh: refreshComments } = await useFetch(`${api}/publications/${pubId}/comments`, {
  headers: tokenCookie.value ? { Authorization: `Bearer ${tokenCookie.value}` } : {},
  query: { includeHidden: 'true' }, // Backend valida permissões (apenas Manager/Admin recebe ocultos)
  lazy: true 
})

const comments = computed(() => {
  return commentsData.value || []
})

// ---- 4. ENVIAR RATING ----
async function submitRating(stars) {
  const token = authStore.token || tokenCookie.value
  if (!token) return router.push('/login')
  
  // Atualização Otimista (feedback instantâneo)
  const previousRating = ratingStats.value.userRating
  ratingStats.value.userRating = stars
  
  submittingRating.value = true
  
  try {
    const response = await $fetch(`${api}/publications/${pubId}/ratings`, {
      method: 'POST',
      body: { stars: stars }, 
      headers: { Authorization: `Bearer ${token}` }
    })
    
    // Se o backend devolver o rating atualizado, usamos esse
    if (response && response.stars) {
      ratingStats.value.userRating = response.stars
    }

    // Atualiza as médias gerais
    await fetchRatingStats()
    
  } catch (e) {
    console.error(e)
    alert('Erro ao avaliar. Tenta novamente.')
    ratingStats.value.userRating = previousRating
  } finally {
    submittingRating.value = false
  }
}

// ---- 5. ENVIAR COMENTÁRIO ----
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
    console.error(e)
    alert('Erro ao enviar comentário.')
  } finally {
    submittingComment.value = false
  }
}

// ---- 6. DOWNLOAD (COM INCREMENTO VISUAL) ----
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

    // Atualiza o contador no ecrã instantaneamente
    if (publication.value) {
      const currentCount = Number(publication.value.downloadCount) || 0
      publication.value.downloadCount = currentCount + 1
    }

  } catch (e) {
    console.error(e)
    alert('Erro ao descarregar. Verifica se tens permissão.')
  } finally {
    isDownloading.value = false
  }
}

const formatDate = (d) => d ? new Date(d).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

// --- CORREÇÃO 3: Estado de Permissões ---
const canEdit = computed(() => {
  if (!publication.value || !authStore.user) return false
  const isOwner = publication.value.uploadedByName === authStore.user.username || publication.value.username === authStore.user.username
  const isAdminOrManager = ['ADMIN', 'MANAGER'].includes(authStore.userRole)
  return isOwner || isAdminOrManager
})

const canManageVisibility = computed(() => {
  if (!authStore.user) return false
  return ['ADMIN', 'MANAGER'].includes(authStore.userRole)
})


async function handleDelete() {
  if (!confirm('Tem a certeza que deseja apagar esta publicação? Esta ação é irreversível.')) return
  
  try {
    const token = authStore.token || tokenCookie.value
    await $fetch(`${api}/publications/${pubId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    
    alert('Publicação apagada com sucesso.')
    router.push('/publications')
    
  } catch (e) {
    console.error(e)
    alert('Erro ao apagar publicação.')
  }
}

const showRatingsModal = ref(false)
const ratingsList = ref([])

// ---- HISTÓRICO DE VERSÕES ----
const showHistoryModal = ref(false)
const historyData = ref([])
const loadingHistory = ref(false)

async function fetchHistory() {
  const token = authStore.token || tokenCookie.value
  if (!token) return
  
  loadingHistory.value = true
  try {
    const data = await $fetch(`${api}/publications/${pubId}/history`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    // data = { publicationId:..., editHistory: [...], totalEdits: ... }
    historyData.value = data.editHistory || []
    showHistoryModal.value = true
  } catch (e) {
    console.error("Erro ao carregar histórico", e)
    alert("Erro ao carregar histórico de edições.")
  } finally {
    loadingHistory.value = false
  }
}

// ---- GESTÃO DE COMENTÁRIOS ----
async function handleDeleteComment(commentId) {
  if (!confirm('Tem a certeza que deseja apagar este comentário?')) return
  
  const token = authStore.token || tokenCookie.value
  try {
    await $fetch(`${api}/comments/${commentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    // Remove da lista localmente
    commentsData.value = commentsData.value.filter(c => c.id !== commentId)
    // Se estiver a usar lazy fetch, forçar refresh pode ser util, mas filtro manual é mais rapido visualmente
  } catch (e) {
    console.error(e)
    alert('Erro ao apagar comentário.')
  }
}

// ---- GESTÃO DE RATINGS ----
async function openRatingsModal() {
  const token = authStore.token || tokenCookie.value
  if (!token) return

  try {
    const data = await $fetch(`${api}/publications/${pubId}/ratings/list`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    ratingsList.value = data
    showRatingsModal.value = true
  } catch (e) {
    console.error(e)
    alert('Erro ao carregar lista de avaliações. (Verifica permissões)')
  }
}

async function handleDeleteRating(ratingId) {
  if (!confirm('Apagar esta avaliação?')) return
  const token = authStore.token || tokenCookie.value
  
  try {
    await $fetch(`${api}/publications/${pubId}/ratings/${ratingId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    
    // Remove da lista
    ratingsList.value = ratingsList.value.filter(r => r.id !== ratingId)
    // Atualiza estatísticas gerais
    await fetchRatingStats()
  } catch (e) {
    console.error(e)
    alert('Erro ao apagar avaliação.')
  }
}

async function handleDeleteAllRatings() {
  if (!confirm('ATENÇÃO: Deseja apagar TODAS as avaliações desta publicação?')) return
  const token = authStore.token || tokenCookie.value
  
  try {
    await $fetch(`${api}/publications/${pubId}/ratings/all`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    
    ratingsList.value = []
    showRatingsModal.value = false
    await fetchRatingStats()
    alert('Todas as avaliações foram apagadas.')
  } catch (e) {
    console.error(e)
    alert('Erro ao apagar avaliações.')
  }
}

// ---- GESTÃO DE VISIBILIDADE E TAGS (MANAGER) ----

async function togglePublicationVisibility() {
  const token = authStore.token || tokenCookie.value
  const newStatus = !publication.value.visible
  const action = newStatus ? 'mostrar' : 'ocultar'
  
  if (!confirm(`Deseja ${action} esta publicação?`)) return

  try {
    const updatedPub = await $fetch(`${api}/publications/${pubId}/visibility`, {
      method: 'PATCH',
      body: { visible: newStatus },
      headers: { Authorization: `Bearer ${token}` }
    })
    
    // publication.value.visible = updatedPub.visible
    await refresh()
  } catch (e) {
    console.error(e)
    alert('Erro ao alterar visibilidade.')
  }
}

async function toggleCommentVisibility(comment) {
  const token = authStore.token || tokenCookie.value
  // Nota: o backend não retorna o estado "visible" no CommentDTO list normal se estiver oculto?
  // Assumindo que o DTO tem "visible". Se n tiver, teremos de ver.
  const newStatus = !comment.visible
  const action = newStatus ? 'mostrar' : 'ocultar'

  if (!confirm(`Tem a certeza que deseja ${action} este comentário?`)) return
  
  try {
    const updatedComment = await $fetch(`${api}/comments/${comment.id}/visibility`, {
      method: 'PATCH',
      body: { visible: newStatus },
      headers: { Authorization: `Bearer ${token}` }
    })
    
    // Atualiza localmente
    // comment.visible = updatedComment.visible <-- abordagem anterior
    await refreshComments() // Força recarregar a lista do backend
  } catch (e) {
    console.error(e)
    alert('Erro ao alterar visibilidade do comentário.')
  }
}

async function removeTag(tagToRemove) {
  if (!confirm(`Remover a tag #${tagToRemove.name}?`)) return
  
  const token = authStore.token || tokenCookie.value
  
  // 1. Filtrar a lista atual
  const currentTags = publication.value.tags || []
  const newTags = currentTags.filter(t => t.id !== tagToRemove.id)
  
  // 2. Construir corpo para PUT
  const body = {
    title: publication.value.title,
    summary: publication.value.summary,
    scientificArea: publication.value.scientificArea,
    authors: publication.value.authors,
    tags: newTags
  }
  
  try {
    await $fetch(`${api}/publications/${pubId}`, {
      method: 'PUT',
      body: body,
      headers: { Authorization: `Bearer ${token}` }
    })
    
    // Atualiza dados da publicação (incluindo tags)
    await refresh()
  } catch (e) {
    console.error(e)
    alert('Erro ao remover tag.')
  }
}

// Pagination
const currentPage = ref(1)
const itemsPerPage = 5

const paginatedHistory = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return historyData.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() => {
  return Math.ceil(historyData.value.length / itemsPerPage)
})

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}

function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}

// Reset page when opening modal
watch(showHistoryModal, (val) => {
  if (val) currentPage.value = 1
})

// Helpers
const translateField = (field) => {
  const map = {
    'title': 'Título',
    'summary': 'Resumo',
    'authors': 'Autores',
    'scientificArea': 'Área Científica',
    'filename': 'Ficheiro',
    'fileType': 'Tipo de Ficheiro',
    'tags': 'Tags'
  }
  return map[field] || field
}
</script>

<template>
  <div class="page-container">
    
    <div v-if="pending" class="loading-state">
      <div class="spinner"></div>
      <p>A carregar detalhes...</p>
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
            <span v-if="!publication.visible" class="hidden-badge">OCULTA</span>
          </div>
          
          <div class="header-row">
            <h1 class="pub-title">{{ publication.title }}</h1>
            
            <div class="admin-actions">
              <!-- Botão Visibilidade (Olho) -->
              <button 
                v-if="canManageVisibility"
                @click="togglePublicationVisibility" 
                class="icon-btn" 
                :class="publication.visible ? 'visible' : 'hidden'"
                :title="publication.visible ? 'Ocultar Publicação' : 'Mostar Publicação'"
              >
                {{ publication.visible ? '👁️' : '🔒' }}
              </button>

              <!-- Botão Histórico -->
              <button 
                 v-if="canEdit" 
                 @click="fetchHistory" 
                 class="icon-btn history" 
                 title="Ver Histórico de Edições"
              >
                🕒
              </button>

              <NuxtLink v-if="canEdit" :to="`/publications/${pubId}/edit`" class="icon-btn edit" title="Editar">
                ✏️
              </NuxtLink>
              <button v-if="canEdit" @click="handleDelete" class="icon-btn delete" title="Apagar">
                🗑️
              </button>
            </div>
          </div>
          
          <div class="authors">
            <strong>Autores:</strong> {{ publication.authors }}
          </div>

          <div v-if="publication.tags && publication.tags.length" class="tags-list">
            <span v-for="tag in publication.tags" :key="tag.id" class="tag">
              #{{ tag.name }}
              <button v-if="canManageVisibility" @click="removeTag(tag)" class="remove-tag-btn">×</button>
            </span>
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
                <span v-if="!comment.visible" class="hidden-badge">OCULTA</span>
                
                <!-- Botões de Ação Comentário -->
                <div class="comment-actions">
                    <button 
                      v-if="canManageVisibility"
                      @click="toggleCommentVisibility(comment)" 
                      class="icon-btn small" 
                      :title="comment.visible !== false ? 'Ocultar Comentário' : 'Mostrar Comentário'"
                    >
                      {{ comment.visible !== false ? '👁️' : '🔒' }}
                    </button>
                    
                    <button 
                      v-if="canEdit || (authStore.user && authStore.user.username === comment.username)"
                      @click="handleDeleteComment(comment.id)" 
                      class="icon-btn delete-small" 
                      title="Apagar Comentário"
                    >
                      🗑️
                    </button>
                </div>
              </div>
              <p class="comment-text">{{ comment.content }}</p>
            </div>
          </div>
          <p v-else class="no-comments">Ainda não há comentários. Sê o primeiro!</p>

          <div class="add-comment">
            <textarea 
              v-model="newComment" 
              placeholder="Escreve a tua análise ou comentário..." 
              rows="3"
              :disabled="!tokenCookie"
            ></textarea>
            <div class="form-footer">
              <span v-if="!tokenCookie" class="login-hint">Faz <NuxtLink to="/login">login</NuxtLink> para comentar</span>
              <button 
                v-if="tokenCookie" 
                @click="submitComment" 
                class="btn primary"
                :disabled="submittingComment || !newComment"
              >
                {{ submittingComment ? 'A enviar...' : 'Publicar Comentário' }}
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
            <div class="rating-header">
              <h4>Classificação</h4>
              <!-- Botão de Gerir Ratings (Admin/Manager) -->
              <button v-if="canManageVisibility" @click="openRatingsModal" class="icon-btn manage-ratings" title="Gerir Avaliações">
                ⚙️
              </button>
            </div>
            
            <div class="big-rating">
              <span class="star-icon">★</span> 
              <span>{{ ratingStats.average ? ratingStats.average.toFixed(1) : '-' }}</span>
              <span class="total">/ 5</span>
            </div>
            <p class="vote-count" v-if="ratingStats.count > 0">
              ({{ ratingStats.count }} {{ ratingStats.count === 1 ? 'voto' : 'votos' }})
            </p>
            
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
                  :title="'Dar ' + i + ' estrelas'"
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
              <span>{{ publication.uploadedByName || publication.username || 'Sistema' }}</span>
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

      <!-- MODAL DE RATINGS -->
      <div v-if="showRatingsModal" class="modal-overlay" @click.self="showRatingsModal = false">
        <div class="modal-window">
          <header class="modal-header">
            <h3>Gerir Avaliações</h3>
            <button @click="showRatingsModal = false" class="close-btn">×</button>
          </header>
          
          <div class="modal-content">
            <div class="modal-actions">
              <button @click="handleDeleteAllRatings" class="btn danger full">Apagar Todas as Avaliações</button>
            </div>
            
            <ul class="ratings-list-modal" v-if="ratingsList.length">
              <li v-for="rating in ratingsList" :key="rating.id">
                <div class="rating-info">
                  <strong>{{ rating.username }}</strong>
                  <span class="stars">{{ rating.stars }} ★</span>
                  <small>{{ formatDate(rating.createdAt) }}</small>
                </div>
                <button @click="handleDeleteRating(rating.id)" class="icon-btn delete-small">🗑️</button>
              </li>
            </ul>
            <p v-else class="empty-list">Nenhuma avaliação encontrada.</p>
          </div>
        </div>
      </div>

      <!-- MODAL DE HISTÓRICO -->
      <div v-if="showHistoryModal" class="modal-overlay" @click.self="showHistoryModal = false">
        <div class="modal-window history-modal">
          <header class="modal-header">
            <h3>Histórico de Edições</h3>
            <button @click="showHistoryModal = false" class="close-btn">×</button>
          </header>
          
          <div class="modal-content">
            <div v-if="historyData.length">
              <ul class="history-list">
                <li v-for="(edit, index) in paginatedHistory" :key="index" class="history-item">
                  <div class="history-meta">
                     <span class="history-date">{{ formatDate(edit.timestamp) }}</span>
                     <span class="history-user">por {{ edit.username || 'Sistema' }}</span>
                  </div>
                  <div class="history-changes">
                     <p class="change-detail">
                       <strong>{{ translateField(edit.fieldChanged) }}:</strong>
                     </p>
                     
                     <div class="diff-box">
                       <div v-if="edit.oldValue" class="old-val">
                         <span class="label">Antes:</span> "{{ edit.oldValue }}"
                       </div>
                       <div class="new-val">
                         <span class="label">Depois:</span> "{{ edit.newValue }}"
                       </div>
                     </div>
                  </div>
                </li>
              </ul>

              <!-- Controles de Paginação -->
              <div v-if="totalPages > 1" class="pagination-controls">
                <button v-if="currentPage > 1" @click="prevPage" class="btn secondary small">Anterior</button>
                <span class="page-info">Página {{ currentPage }} de {{ totalPages }}</span>
                <button v-if="currentPage < totalPages" @click="nextPage" class="btn secondary small">Seguinte</button>
              </div>
            </div>
            
            <p v-else class="empty-list">Não existem edições registadas.</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Layout */
.page-container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; font-family: 'Inter', sans-serif; }
.content-grid { display: grid; grid-template-columns: 1fr 320px; gap: 40px; }

/* Header e Conteúdo */
.back-link { display: inline-block; margin-bottom: 20px; color: #6b7280; text-decoration: none; font-size: 0.9rem; font-weight: 500; }
.back-link:hover { color: #4f46e5; }

.pub-header { margin-bottom: 30px; }
.badges { display: flex; gap: 10px; margin-bottom: 12px; }
.badge { padding: 4px 12px; border-radius: 99px; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; }
.badge.area { background: #eff6ff; color: #4f46e5; }
.badge.date { background: #f3f4f6; color: #6b7280; }

.pub-title { font-size: 2.2rem; color: #111827; margin: 0; line-height: 1.2; font-weight: 800; }

.header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 16px; }

.admin-actions { display: flex; gap: 8px; }
.icon-btn { 
  background: white; border: 1px solid #e5e7eb; border-radius: 6px; 
  cursor: pointer; font-size: 1rem; transition: all 0.2s; display: flex; align-items: center; justify-content: center;
  text-decoration: none; width: 32px; height: 32px; padding: 0;
}
.icon-btn:hover { background: #f9fafb; transform: translateY(-2px); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.icon-btn.delete:hover { border-color: #fecaca; background: #fef2f2; }
.icon-btn.edit:hover { border-color: #bfdbfe; background: #eff6ff; }
.delete-small { border: none; background: transparent; color: #ef4444; margin-left: auto; width: auto; height: auto; }
.delete-small:hover { background: #fee2e2; border-radius: 4px; }
.authors { font-size: 1.1rem; color: #4b5563; }

.icon-btn.hidden { background: #fff1f2; border-color: #fda4af; color: #be123c; }
.hidden-badge { background: #fecaca; color: #991b1b; padding: 2px 8px; border-radius: 99px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-left: 10px; vertical-align: middle; }

.tags-list { margin-top: 16px; display: flex; gap: 8px; flex-wrap: wrap; }
.tag { background: #f3f4f6; color: #4b5563; padding: 4px 10px; border-radius: 6px; font-size: 0.85rem; font-weight: 500; display: flex; align-items: center; gap: 6px; }
.remove-tag-btn { background: none; border: none; cursor: pointer; color: #9ca3af; font-size: 1.1rem; line-height: 0.5; padding: 0; display: flex; align-items: center; }
.remove-tag-btn:hover { color: #ef4444; }

.pub-summary { background: white; padding: 30px; border-radius: 12px; border: 1px solid #e5e7eb; margin-bottom: 40px; line-height: 1.7; color: #374151; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.pub-summary h3 { margin-top: 0; color: #111827; margin-bottom: 16px; }

/* Sidebar */
.card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
.card h3 { margin-top: 0; font-size: 1.1rem; color: #111827; margin-bottom: 16px; border-bottom: 1px solid #f3f4f6; padding-bottom: 12px; }

.download-btn { background: #4f46e5; color: white; width: 100%; justify-content: center; margin-bottom: 16px; padding: 12px; }
.download-btn:hover { background: #4338ca; }
.download-btn:disabled { opacity: 0.7; cursor: not-allowed; }

.divider { border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0; }

/* Rating */
.rating-block { text-align: center; }
.rating-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f3f4f6; padding-bottom: 12px; margin-bottom: 16px; }
.rating-header h4 { margin: 0; font-size: 1.1rem; color: #111827; }
.manage-ratings { width: 28px; height: 28px; font-size: 0.9rem; }

.big-rating { font-size: 2.5rem; font-weight: 800; color: #1f2937; display: flex; align-items: center; justify-content: center; gap: 8px; }
.star-icon { color: #fbbf24; }
.total { font-size: 1rem; color: #9ca3af; font-weight: 400; align-self: flex-end; margin-bottom: 8px; }
.vote-count { color: #6b7280; font-size: 0.9rem; margin-top: -5px; margin-bottom: 15px; }

.vote-label { font-size: 0.9rem; color: #4b5563; margin-bottom: 4px; }

/* ESTRELAS */
.stars-input { display: flex; justify-content: center; gap: 4px; }
.stars-input button { 
  background: none; 
  border: none; 
  font-size: 1.8rem; 
  color: #e5e7eb; /* Cor da estrela vazia */
  cursor: pointer; 
  transition: transform 0.1s, color 0.2s; 
  padding: 0; 
  line-height: 1;
}

/* Cor da estrela cheia (.active) e no hover */
.stars-input button.active,
.stars-input button:hover,
.stars-input:hover button:hover ~ button { color: #e5e7eb; } 
.stars-input:hover button { color: #fbbf24; }
.stars-input button:hover ~ button { color: #e5e7eb; }

/* Para manter simples e funcional sem truques complexos de CSS hover: */
.stars-input button.active { color: #fbbf24; }

/* Info List */
.info-list { list-style: none; padding: 0; margin: 0; }
.info-list li { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 0.95rem; }
.info-list li:last-child { border-bottom: none; }
.file-tag { background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 700; }

.comments-section h3 { font-size: 1.5rem; color: #111827; margin-bottom: 20px; }
.comments-list { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
.comment-card { background: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #f3f4f6; transition: background 0.2s; }
.comment-card:has(.icon-btn:hover) { background: #f9fafb; } /* Evitar highlight no card todo */
.comment-card:has(button:contains('🔒')) { opacity: 0.7; background: #fff1f2; border-color: #fecaca; }

.comment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 0.9rem; }
.username { font-weight: 700; color: #1f2937; margin-right: 12px; }
.timestamp { color: #9ca3af; margin-right: auto; }

.comment-actions { display: flex; gap: 6px; }
.icon-btn.small { width: 24px; height: 24px; font-size: 0.8rem; }

.comment-text { margin: 0; color: #4b5563; line-height: 1.5; }
.no-comments { color: #6b7280; font-style: italic; background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; }

.add-comment textarea { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; margin-bottom: 12px; font-family: inherit; resize: vertical; font-size: 0.95rem; }
.add-comment textarea:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
.form-footer { display: flex; justify-content: flex-end; align-items: center; }
.login-hint { font-size: 0.9rem; color: #6b7280; margin-right: auto; }
.login-hint a { color: #4f46e5; text-decoration: underline; }

/* Utils */
.btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; text-decoration: none; font-size: 0.95rem; transition: background 0.2s; }
.btn.primary { background: #4f46e5; color: white; }
.btn.primary:hover { background: #4338ca; }
.btn.secondary { background: white; border: 1px solid #d1d5db; color: #374151; }
.btn.secondary:hover { background: #f3f4f6; }
.btn.danger { background: #fee2e2; color: #991b1b; }
.btn.danger:hover { background: #fecaca; }
.btn.full { width: 100%; justify-content: center; }
.loading-state, .error-state { text-align: center; padding: 80px 0; color: #6b7280; }
.spinner { border: 3px solid #f3f3f3; border-top: 3px solid #4f46e5; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 16px; }

/* Responsividade */
@media (max-width: 900px) {
  .content-grid { grid-template-columns: 1fr; }
  .sidebar { order: -1; }
}

/* MODAL STYLES */
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;
  backdrop-filter: blur(2px);
}
.modal-window {
  background: white; width: 90%; max-width: 500px; max-height: 80vh; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex; flex-direction: column;
}
.modal-header {
  padding: 16px 24px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;
}
.modal-header h3 { margin: 0; color: #111827; }
.close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #6b7280; padding: 0; line-height: 1; }
.modal-content { padding: 24px; overflow-y: auto; }
.modal-actions { margin-bottom: 20px; }

.ratings-list-modal { list-style: none; padding: 0; margin: 0; }
.ratings-list-modal li { display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #f3f4f6; }
.ratings-list-modal li:last-child { border-bottom: none; }
.rating-info { display: flex; flex-direction: column; gap: 2px; }
.rating-info strong { color: #1f2937; }
.rating-info .stars { color: #fbbf24; font-weight: 700; }
.rating-info small { color: #9ca3af; font-size: 0.8rem; }
.empty-list { text-align: center; color: #6b7280; font-style: italic; }

/* HISTORY MODAL */
.history-modal { max-width: 700px; }
.history-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 16px; }
.history-item { border-bottom: 1px solid #e5e7eb; padding-bottom: 16px; }
.history-item:last-child { border-bottom: none; }

.history-meta { display: flex; justify-content: space-between; font-size: 0.85rem; color: #6b7280; margin-bottom: 8px; background: #f9fafb; padding: 6px 10px; border-radius: 6px; }
.history-date { font-weight: 600; color: #374151; }

.change-detail strong { color: #4f46e5; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px; }
.diff-box { margin-top: 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; font-size: 0.95rem; }
.old-val { color: #ef4444; text-decoration: line-through; margin-bottom: 4px; opacity: 0.8; font-size: 0.9rem; }
.new-val { color: #16a34a; font-weight: 500; }
.label { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; margin-right: 4px; text-decoration: none; font-weight: 600; }

.pagination-controls { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 20px; padding-top: 10px; border-top: 1px solid #f3f4f6; }
.pagination-controls .btn { margin: 0; }
.page-info { font-size: 0.9rem; color: #6b7280; font-weight: 500; }

.empty-list { text-align: center; color: #6b7280; font-style: italic; padding: 20px; }
</style>

