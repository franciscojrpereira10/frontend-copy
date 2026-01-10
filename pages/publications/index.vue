<script setup>
import { useAuthStore } from '~/stores/auth-store'

const config = useRuntimeConfig()
const api = config.public.apiBase
const authStore = useAuthStore()

// ---- ESTADOS ----
const showFilters = ref(false) // <--- ALTERADO: Começa escondido
const searchQuery = ref('')
const selectedArea = ref('')
const sortOption = ref('createdAt,desc')

// Filtros adicionais (Apenas Autor)
const authorQuery = ref('')

// ---- PAGINAÇÃO ----
const page = ref(0)
const pageSize = 10 
const hasMore = ref(false)

// ---- DADOS AUXILIARES ----
const areas = [
  'Ciência de Dados',
  'Ciência dos Materiais',
  'Engenharia de Software',
  'Inteligência Artificial'
]

// Mapeamento: Visual (PT) -> Backend (EN)
const areaMapping = {
  'Ciência de Dados': 'Data Science',
  'Ciência dos Materiais': 'Materials Science',
  'Engenharia de Software': 'Software Engineering',
  'Inteligência Artificial': 'Artificial Intelligence'
}

// ---- FETCH INTELIGENTE ----
const endpoint = computed(() => {
  if (searchQuery.value.trim() || selectedArea.value || authorQuery.value.trim()) {
    return `${api}/publications/search`
  }
  return `${api}/publications`
})

const queryParams = computed(() => {
  // Modo PESQUISA
  const isSearching = searchQuery.value.trim() || selectedArea.value || authorQuery.value.trim()

  if (isSearching) {
    const backendArea = areaMapping[selectedArea.value] || selectedArea.value

    return {
      title: searchQuery.value, 
      scientificArea: backendArea,
      authors: authorQuery.value
    }
  }
  
  // Modo LISTAGEM
  const [field, dir] = sortOption.value.split(',')
  return {
    page: page.value,
    size: pageSize, 
    sortBy: field,
    order: dir
  }
})

const { data, pending, error, refresh } = await useFetch(endpoint, {
  query: queryParams,
  headers: authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {},
  watch: [endpoint, queryParams, page]
})

// ---- FUNÇÕES ----
const resetFilters = () => {
  searchQuery.value = ''
  selectedArea.value = ''
  authorQuery.value = ''
  sortOption.value = 'createdAt,desc'
  page.value = 0
}

const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const nextPage = () => {
  if (hasMore.value) page.value++
}

const prevPage = () => {
  if (page.value > 0) page.value--
}

// ---- PROCESSAMENTO DE DADOS ----
const publications = computed(() => {
  let items = data.value?.items || data.value || []
  
  // Define se há mais páginas para a frente
  hasMore.value = items.length === pageSize

  // Ordenação Cliente-Side
  if (items.length > 0) {
    const [field, dir] = sortOption.value.split(',')
    
    items = [...items].sort((a, b) => {
      let valA = a[field]
      let valB = b[field]

      if (valA == null) valA = ''
      if (valB == null) valB = ''
      
      if (field === 'createdAt') {
        valA = new Date(valA).getTime()
        valB = new Date(valB).getTime()
      } else if (field === 'rating') {
        valA = a.averageRating || 0
        valB = b.averageRating || 0
      } else if (field === 'comments') {
        valA = a.commentCount || 0
        valB = b.commentCount || 0
      } else if (field === 'ratingsCount') {
        valA = a.ratingsCount || 0
        valB = b.ratingsCount || 0
      } else {
        valA = valA.toString().toLowerCase()
        valB = valB.toString().toLowerCase()
      }

      if (valA < valB) return dir === 'asc' ? -1 : 1
      if (valA > valB) return dir === 'asc' ? 1 : -1
      return 0
    })
  }
  
  return items
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('pt-PT', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}
</script>

<template>
  <div class="page-container">
    
    <div class="header-section">
      <div class="title-block">
        <h1 class="page-title">Biblioteca</h1>
        <p class="subtitle">Explora, pesquisa e descobre conhecimento científico.</p>
      </div>
      
      <div class="header-actions">
        <button @click="toggleFilters" class="btn secondary icon-only-mobile" :title="showFilters ? 'Esconder Filtros' : 'Mostrar Filtros'">
          <svg v-if="showFilters" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          <span class="desktop-text">{{ showFilters ? 'Esconder' : 'Filtrar' }}</span>
        </button>

        <NuxtLink v-if="authStore.token" to="/publications/create" class="btn primary add-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span>Nova</span>
        </NuxtLink>
      </div>
    </div>

    <transition name="slide-fade">
      <div v-if="showFilters" class="toolbar card">
        
        <div class="filters-grid">
            <div class="search-box input-group">
                <label>Título</label>
                <div class="input-wrapper">
                    <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <input v-model.lazy="searchQuery" type="text" placeholder="Pesquisar título..." class="search-input"/>
                </div>
            </div>

            <div class="input-group">
                <label>Autor</label>
                <input v-model.lazy="authorQuery" type="text" placeholder="Nome do autor..." class="form-input"/>
            </div>

            <div class="input-group">
                <label>Área Científica</label>
                <select v-model="selectedArea" class="filter-select">
                    <option value="">Todas as Áreas</option>
                    <option v-for="area in areas" :key="area" :value="area">{{ area }}</option>
                </select>
            </div>

            <div class="input-group">
                <label>Ordenar</label>
                <select v-model="sortOption" class="filter-select">
                    <option value="createdAt,desc">Mais Recentes</option>
                    <option value="createdAt,asc">Mais Antigas</option>
                    <option value="title,asc">Título (A-Z)</option>
                    <option value="title,desc">Título (Z-A)</option>
                    <option value="rating,desc">Melhor Classificados</option>
                    <option value="rating,asc">Pior Classificados</option>
                    <option value="comments,desc">Mais Comentados</option>
                    <option value="ratingsCount,desc">Mais Avaliados</option>
                </select>
            </div>

            <div class="input-group action-group">
                <button 
                    v-if="searchQuery || selectedArea || authorQuery" 
                    @click="resetFilters" 
                    class="btn icon-btn reset-btn" 
                    title="Limpar Filtros">
                    Limpar
                </button>
            </div>
        </div>
      </div>
    </transition>

    <div v-if="pending" class="loading-state">
      <div class="spinner"></div>
      <p>A atualizar resultados...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>Não foi possível carregar as publicações.</p>
      <button @click="refresh" class="btn secondary">Tentar Novamente</button>
    </div>

    <div v-else-if="publications.length === 0" class="empty-state">
      <p>Nenhuma publicação encontrada.</p>
      <button @click="resetFilters" class="btn link">Limpar filtros</button>
    </div>

    <div v-else>
        <ul class="grid">
        <li
            v-for="pub in publications"
            :key="pub.id"
            class="card pub-card"
            @click="$router.push(`/publications/${pub.id}`)"
        >
            <div class="card-content">
            <div class="card-header">
                <span class="badge area">{{ pub.scientificArea || 'Geral' }}</span>
                <span v-if="!pub.visible" class="hidden-badge-card">OCULTA</span>
                <span class="date" v-if="pub.createdAt">{{ formatDate(pub.createdAt) }}</span>
            </div>
            
            <h3 class="card-title">{{ pub.title }}</h3>
            
            <div v-if="pub.tags && pub.tags.length" class="tags-row">
                <span v-for="tag in pub.tags.slice(0,3)" :key="tag.id" class="mini-tag">#{{ tag.name }}</span>
            </div>

            <div class="card-footer">
                <div class="author-info">
                <svg class="icon-user" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <span class="author-name truncate">{{ pub.authors || 'Vários autores' }}</span>
                </div>
            </div>
            </div>
        </li>
        </ul>

         <div 
          v-if="(!searchQuery && !authorQuery && !selectedArea) && (page > 0 || hasMore)" 
          class="pagination-controls"
        >
            <button 
              v-if="page > 0" 
              @click="prevPage" 
              class="btn secondary"
            >
              Anterior
            </button>
            
            <span class="page-info">Página {{ page + 1 }}</span>
            
            <button 
              v-if="hasMore" 
              @click="nextPage" 
              class="btn secondary"
            >
              Próximo
            </button>
        </div>
    </div>
    
  </div>
</template>

<style scoped>
/* RESET & VARS */
* { box-sizing: border-box; }

:root {
  --primary: #4f46e5;
  --bg-page: #f9fafb;
  --text-main: #111827;
  --border: #e5e7eb;
}

.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: 'Inter', sans-serif;
  color: #1f2937;
}

/* HEADER */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}
.title-block { flex: 1; }
.page-title { font-size: 2rem; font-weight: 800; color: #111827; margin: 0 0 8px 0; }
.subtitle { color: #6b7280; font-size: 1.1rem; margin: 0; }

.header-actions { display: flex; gap: 12px; }

/* TOOLBAR */
.toolbar {
  padding: 20px;
  margin-bottom: 30px;
  background: white;
  border-radius: 12px;
  border: 1px solid var(--border);
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
    align-items: end;
}

.input-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.input-group label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #4b5563;
}

.input-wrapper { position: relative; }

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #9ca3af;
}
.search-input {
  width: 100%;
  padding: 10px 10px 10px 36px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
}

.form-input, .filter-select {
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background-color: white;
  font-size: 0.9rem;
  width: 100%;
}
.form-input:focus, .search-input:focus, .filter-select:focus { outline: none; border-color: #4f46e5; }

/* Reset Button */
.reset-btn {
  background: #fee2e2 !important;
  color: #ef4444 !important;
  border: 1px solid #fecaca !important;
  padding: 10px;
  justify-content: center;
}
.reset-btn:hover {
  background: #fecaca !important;
  color: #dc2626 !important;
}

/* Transição */
.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.3s ease;
  max-height: 400px;
  opacity: 1;
  overflow: hidden;
}
.slide-fade-enter-from, .slide-fade-leave-to {
  max-height: 0;
  opacity: 0;
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
  border: none;
}

/* GRID */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  list-style: none;
  padding: 0;
  margin: 0;
}

/* CARDS */
.pub-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.pub-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e1;
}

.card-content { padding: 24px; display: flex; flex-direction: column; height: 100%; }
.card-header { display: flex; justify-content: space-between; margin-bottom: 16px; align-items: center; }
.badge.area { background: #eff6ff; color: #4f46e5; padding: 4px 10px; border-radius: 99px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
.hidden-badge-card { background: #fecaca; color: #991b1b; padding: 2px 8px; border-radius: 99px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; margin-right: 8px; }
.date { font-size: 0.85rem; color: #9ca3af; }
.card-title { font-size: 1.25rem; font-weight: 700; color: #1f2937; margin: 0 0 20px 0; line-height: 1.4; flex-grow: 1; }
.card-footer { border-top: 1px solid #f3f4f6; padding-top: 16px; margin-top: auto; }
.author-info { display: flex; align-items: center; gap: 8px; color: #4b5563; font-size: 0.9rem; }
.truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px; }
.icon-user { width: 16px; height: 16px; color: #9ca3af; flex-shrink: 0; }
.tags-row { margin-bottom: 12px; }
.mini-tag { background: #f3f4f6; color: #6b7280; font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; margin-right: 4px; }

/* UTILS */
.btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; text-decoration: none; font-size: 0.95rem; }
.btn.primary { background: #4f46e5; color: white; }
.btn.primary:hover { background: #4338ca; }
.btn.secondary { background: #f3f4f6; color: #1f2937; }
.btn.secondary:hover { background: #e5e7eb; }
.btn.link { background: none; color: #4f46e5; padding: 0; text-decoration: underline; cursor: pointer; }

.pagination-controls { display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: 40px; }
.page-info { font-weight: 600; color: #374151; }

.loading-state, .error-state, .empty-state { text-align: center; padding: 60px 0; color: #6b7280; }
.spinner { border: 3px solid #f3f3f3; border-top: 3px solid #4f46e5; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto 16px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

@media (max-width: 640px) {
  .header-section { flex-direction: column; align-items: flex-start; }
  .header-actions { width: 100%; justify-content: space-between; }
  .desktop-text { display: none; }
}
</style>