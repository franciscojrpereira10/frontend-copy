<script setup>
import { useAuthStore } from '~/stores/auth-store'

const config = useRuntimeConfig()
const api = config.public.apiBase
const authStore = useAuthStore()

// ---- LISTA DE PUBLICAÇÕES ----
// Adicionei headers caso a tua API precise de token mesmo para listar (opcional)
const { data, pending, error } = await useFetch(`${api}/publications`, {
  headers: authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}
})

// Garante que é sempre um array, mesmo que a API falhe ou devolva estrutura diferente
const publications = computed(() => {
  return data.value?.items || data.value || []
})

// Função auxiliar para formatar datas (opcional, para ficar bonito no card)
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
      <div>
        <h1 class="page-title">Publicações</h1>
        <p class="subtitle">Explora os artigos e documentos científicos disponíveis.</p>
      </div>
    </div>

    <div v-if="pending" class="loading-state">
      <div class="spinner"></div>
      <p>A carregar biblioteca...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>Ocorreu um erro ao carregar as publicações.</p>
    </div>

    <div v-else-if="publications.length === 0" class="empty-state">
      <p>Não foram encontradas publicações.</p>
    </div>

    <ul v-else class="grid">
      <li
        v-for="pub in publications"
        :key="pub.id"
        class="card"
        @click="$router.push(`/publications/${pub.id}`)"
      >
        <div class="card-content">
          <div class="card-header">
            <span class="badge area">{{ pub.scientificArea || 'Geral' }}</span>
            <span class="date" v-if="pub.createdAt">{{ formatDate(pub.createdAt) }}</span>
          </div>
          
          <h3 class="card-title">{{ pub.title }}</h3>
          
          <div class="card-footer">
            <div class="author-info">
              <svg class="icon-user" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span class="author-name">{{ pub.authors || 'Vários autores' }}</span>
            </div>
            
            <div class="arrow-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </div>
          </div>
        </div>
      </li>
    </ul>
    
  </div>
</template>

<style scoped>
/* Variáveis de Cores (Consistente com o [id].vue) */
:root {
  --primary: #4f46e5;
  --bg-page: #f9fafb;
  --text-main: #111827;
  --text-muted: #6b7280;
  --border: #e5e7eb;
}

.page-container {
  max-width: 1200px; /* Mais largo para caberem bem os cards */
  margin: 0 auto;
  padding: 40px 20px;
  font-family: 'Inter', sans-serif;
  color: #1f2937;
}

/* Header */
.header-section {
  margin-bottom: 40px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 20px;
}

.page-title {
  font-size: 2rem;
  font-weight: 800;
  color: #111827;
  margin: 0 0 8px 0;
}

.subtitle {
  color: #6b7280;
  font-size: 1.1rem;
  margin: 0;
}

/* Grid Layout */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); /* Responsivo: cria colunas automáticas */
  gap: 24px;
  list-style: none;
  padding: 0;
  margin: 0;
}

/* Card Styles */
.card {
  background: white;
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  display: flex;
  flex-direction: column;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e1;
}

.card-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.badge.area {
  background: #eff6ff;
  color: #4f46e5;
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.date {
  font-size: 0.85rem;
  color: #9ca3af;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 24px 0;
  line-height: 1.4;
  flex-grow: 1; /* Empurra o footer para baixo */
}

/* Footer do Card */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f3f4f6;
  padding-top: 16px;
  margin-top: auto;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #4b5563;
  font-size: 0.9rem;
  font-weight: 500;
}

.icon-user {
  width: 16px;
  height: 16px;
  color: #9ca3af;
}

.arrow-icon svg {
  width: 20px;
  height: 20px;
  color: #d1d5db;
  transition: color 0.2s, transform 0.2s;
}

.card:hover .arrow-icon svg {
  color: #4f46e5;
  transform: translateX(4px);
}

/* States */
.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 60px 0;
  color: #6b7280;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4f46e5;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>