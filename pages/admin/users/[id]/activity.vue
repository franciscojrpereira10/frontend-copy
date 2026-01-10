<script setup>
import { useAuthStore } from '~/stores/auth-store'

const config = useRuntimeConfig()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const userId = route.params.id
const activities = ref([])
const loading = ref(true)
const pagination = ref({ 
  page: 1, 
  limit: 10,
  totalItems: 0,
  totalPages: 0
})

onMounted(() => {
    if (authStore.userRole !== 'ADMIN') {
        router.push('/')
        return
    }
    fetchHistory()
})

const fetchHistory = async () => {
  loading.value = true
  try {
    const token = useCookie('token').value
    const offset = (pagination.value.page - 1) * pagination.value.limit
    
    const data = await $fetch(`${config.public.apiBase}/activity/user/${userId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      query: { 
        limit: pagination.value.limit,
        offset: offset
      }
    })
    
    activities.value = data.activities || []
    
    // Update pagination info
    pagination.value.totalItems = data.totalActivities || 0
    pagination.value.totalPages = Math.ceil(pagination.value.totalItems / pagination.value.limit)
    
  } catch (e) {
    console.error('Failed to load history', e)
    activities.value = []
  } finally {
    loading.value = false
  }
}

const nextPage = () => {
    if (pagination.value.page < pagination.value.totalPages) {
        pagination.value.page++
        fetchHistory()
    }
}

const prevPage = () => {
    if (pagination.value.page > 1) {
        pagination.value.page--
        fetchHistory()
    }
}

// Helpers
const formatDate = (isoString) => {
  if (!isoString) return ''
  return new Date(isoString).toLocaleString('pt-PT', { 
    day: '2-digit', month: '2-digit', year: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  })
}

const getActivityTypeClass = (type) => {
  const map = {
    'PUBLICATION': 'icon-blue',
    'UPLOAD': 'icon-blue',
    'EDIT': 'icon-orange',
    'COMMENT': 'icon-green',
    'RATING': 'icon-yellow',
    'ACCOUNT': 'icon-purple',
    'DELETE': 'icon-red',
    'VISIBILITY': 'icon-gray',
    'TAG_SUBSCRIBE': 'icon-green',
    'TAG_UNSUBSCRIBE': 'icon-gray'
  }
  return map[type] || 'icon-gray'
}

const getActivityIcon = (type) => {
  switch(type) {
    case 'PUBLICATION': return '📝'
    case 'UPLOAD': return '📤'
    case 'EDIT': return '✏️'
    case 'COMMENT': return '💬'
    case 'RATING': return '⭐'
    case 'ACCOUNT': return '🔐'
    case 'DELETE': return '🗑️'
    case 'VISIBILITY': return '👁️'
    case 'TAG_SUBSCRIBE': return '🏷️'
    case 'TAG_UNSUBSCRIBE': return '🚫'
    default: return '🔹'
  }
}
</script>

<template>
  <div class="page-container">
    <header class="page-header">
      <button @click="router.back()" class="back-btn">← Voltar</button>
      <h1>Atividade do Utilizador #{{ userId }}</h1>
    </header>

    <div class="activity-card">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>A carregar atividade...</p>
        </div>

        <div v-else-if="activities.length === 0" class="empty-state">
          <p>Não existe atividade registada para este utilizador.</p>
        </div>

        <div v-else class="activity-timeline">
          <div v-for="activity in activities" :key="activity.id" class="activity-item">
            <div class="activity-icon" :class="getActivityTypeClass(activity.type)">
              {{ getActivityIcon(activity.type) }}
            </div>
            <div class="activity-content">
              <p class="activity-desc">{{ activity.description }}</p>
              <span class="activity-date">{{ formatDate(activity.timestamp) }}</span>
            </div>
          </div>

          <!-- Pagination Controls -->
          <div v-if="pagination.totalPages > 1" class="pagination-controls">
            <button 
              v-if="pagination.page > 1" 
              @click="prevPage" 
              class="pagination-btn"
            >
              Anterior
            </button>
            
            <span class="page-info">Página {{ pagination.page }} de {{ pagination.totalPages }}</span>
            
            <button 
              v-if="pagination.page < pagination.totalPages" 
              @click="nextPage" 
              class="pagination-btn"
            >
              Seguinte
            </button>
          </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
.page-container { max-width: 800px; margin: 0 auto; padding: 40px 20px; font-family: 'Inter', sans-serif; }
.page-header { margin-bottom: 30px; }
.page-header h1 { font-size: 1.8rem; color: #0f172a; margin: 10px 0 0 0; }

.back-btn { background: none; border: none; font-size: 0.95rem; color: #64748b; cursor: pointer; padding: 0; font-weight: 500; }
.back-btn:hover { color: #3b82f6; text-decoration: underline; }

.activity-card {
  background: white; border-radius: 16px; padding: 32px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;
}

.loading-state, .empty-state { text-align: center; padding: 40px; color: #64748b; }
.spinner { border: 3px solid #f3f3f3; border-top: 3px solid #3b82f6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 16px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.activity-timeline { display: flex; flex-direction: column; gap: 0; }
.activity-item { display: flex; align-items: flex-start; gap: 16px; padding: 16px 0; border-bottom: 1px solid #f1f5f9; }
.activity-item:last-child { border-bottom: none; }

.activity-icon {
  width: 40px; height: 40px; border-radius: 50%; background-color: #f8fafc;
  display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0;
}

.activity-content { flex: 1; }
.activity-desc { margin: 0 0 4px 0; font-size: 0.95rem; color: #334155; line-height: 1.4; font-weight: 500; }
.activity-date { font-size: 0.8rem; color: #94a3b8; }

.icon-blue { background-color: #eff6ff; color: #2563eb; }
.icon-green { background-color: #f0fdf4; color: #16a34a; }
.icon-yellow { background-color: #fefce8; color: #ca8a04; }
.icon-purple { background-color: #faf5ff; color: #9333ea; }
.icon-red { background-color: #fef2f2; color: #dc2626; }
.icon-orange { background-color: #fff7ed; color: #ea580c; }
.icon-gray { background-color: #f8fafc; color: #64748b; }

/* Pagination Controls (Centered & Styled) */
.pagination-controls { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 20px; padding-top: 10px; border-top: 1px solid #f3f4f6; }
.pagination-btn { padding: 6px 14px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; color: #64748b; cursor: pointer; transition: all 0.2s; font-size: 0.9rem; }
.pagination-btn:hover { background-color: #f8fafc; color: #0f172a; border-color: #cbd5e1; }
.page-info { font-size: 0.9rem; color: #6b7280; font-weight: 500; }
</style>
