<script setup>
import { useAuthStore } from '~/stores/auth-store'

const config = useRuntimeConfig()
const api = config.public.apiBase
const authStore = useAuthStore()
const router = useRouter()

const personalStats = ref(null)
const globalStats = ref(null)
const subscriptions = ref([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  try {
    loading.value = true
    
    // Fetch Personal Stats (Available to all authenticated users)
    const [pStats, subs] = await Promise.all([
      $fetch(`${api}/statistics/personal`, { headers: { Authorization: `Bearer ${authStore.token}` } }),
      $fetch(`${api}/tags/subscriptions`, { headers: { Authorization: `Bearer ${authStore.token}` } })
    ])
    
    personalStats.value = pStats
    subscriptions.value = subs.subscriptions || []

    // Fetch Global Stats (Only for ADMINs)
    if (authStore.userRole === 'ADMIN') {
      globalStats.value = await $fetch(`${api}/statistics/global`, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      })
    }

  } catch (e) {
    console.error(e)
    error.value = 'Erro ao carregar estatísticas.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="stats-page">
    <header class="page-header">
      <h1>Painel de Estatísticas</h1>
      <p>Acompanha o teu progresso e a atividade da plataforma.</p>
    </header>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>A carregar dados...</p>
    </div>

    <div v-else-if="error" class="error-msg">
      {{ error }}
    </div>

    <div v-else class="dashboard">
      
      <!-- Personal Statistics -->
      <section class="stats-section">
        <h2>📊 A Minha Atividade</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon bg-blue">📝</div>
            <div class="stat-info">
              <span class="value">{{ personalStats?.publicationsSubmitted || 0 }}</span>
              <span class="label">Artigos Submetidos</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon bg-green">💬</div>
            <div class="stat-info">
              <span class="value">{{ personalStats?.commentsPosted || 0 }}</span>
              <span class="label">Comentários</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon bg-yellow">⭐</div>
            <div class="stat-info">
              <span class="value">{{ personalStats?.ratingsGiven || 0 }}</span>
              <span class="label">Avaliações Dadas</span>
            </div>
          </div>
        </div>

        <!-- Subscribed Tags Section -->
        <div class="subscribed-tags-section" v-if="subscriptions && subscriptions.length > 0">
          <h3>📌 Tags que sigo</h3>
          <div class="tags-list">
            <span v-for="sub in subscriptions" :key="sub.id" class="tag-chip">
              #{{ sub.name }}
            </span>
          </div>
        </div>
        <div v-else class="subscribed-tags-section empty">
          <p>Ainda não subscreves nenhuma tag.</p>
          <NuxtLink to="/tags" class="link">Explorar Tags</NuxtLink>
        </div>
      </section>

      <!-- Global Statistics (Admin Only) -->
      <section v-if="globalStats" class="stats-section">
        <h2>🌍 Estatísticas Globais</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon bg-indigo">👥</div>
            <div class="stat-info">
              <span class="value">{{ globalStats.totalUsers }}</span>
              <span class="label">Utilizadores Totais</span>
              <span class="sub-label">({{ globalStats.activeUsers }} ativos)</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon bg-purple">📚</div>
            <div class="stat-info">
              <span class="value">{{ globalStats.totalPublications }}</span>
              <span class="label">Publicações Totais</span>
              <span class="sub-label">({{ globalStats.visiblePublications }} públicas)</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon bg-red">🚫</div>
            <div class="stat-info">
              <span class="value">{{ globalStats.suspendedUsers }}</span>
              <span class="label">Contas Suspensas</span>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon bg-teal">💬</div>
            <div class="stat-info">
              <span class="value">{{ globalStats.totalComments }}</span>
              <span class="label">Total Comentários</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon bg-orange">⭐</div>
            <div class="stat-info">
              <span class="value">{{ globalStats.totalRatings }}</span>
              <span class="label">Total Avaliações</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon bg-pink">🏷️</div>
            <div class="stat-info">
              <span class="value">{{ globalStats.totalTags }}</span>
              <span class="label">Total Tags</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<style scoped>
.stats-page { max-width: 1000px; margin: 0 auto; padding: 20px; }

.page-header { text-align: center; margin-bottom: 40px; }
.page-header h1 { font-size: 2rem; color: #0f172a; margin: 0 0 8px; font-weight: 800; }
.page-header p { color: #64748b; font-size: 1rem; }

.stats-section { margin-bottom: 50px; }
.stats-section h2 { 
  font-size: 1.2rem; color: #334155; margin-bottom: 20px; 
  border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.stat-card {
  background: white; padding: 24px; border-radius: 16px;
  border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 20px;
  transition: transform 0.2s;
}
.stat-card:hover { transform: translateY(-4px); box-shadow: 0 10px 20px -5px rgba(0,0,0,0.05); }

.stat-icon {
  width: 60px; height: 60px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.8rem; flex-shrink: 0;
}

.bg-blue { background: #eff6ff; color: #2563eb; }
.bg-green { background: #f0fdf4; color: #16a34a; }
.bg-yellow { background: #fefce8; color: #ca8a04; }
.bg-indigo { background: #eef2ff; color: #4f46e5; }
.bg-purple { background: #faf5ff; color: #9333ea; }
.bg-red { background: #fef2f2; color: #ef4444; }
.bg-teal { background: #f0fdfa; color: #14b8a6; }
.bg-orange { background: #fff7ed; color: #ea580c; }
.bg-pink { background: #fdf2f8; color: #db2777; }

.stat-info { display: flex; flex-direction: column; }
.value { font-size: 2rem; font-weight: 800; color: #0f172a; line-height: 1; margin-bottom: 4px; }
.label { font-size: 0.9rem; color: #64748b; font-weight: 600; }
.sub-label { font-size: 0.8rem; color: #94a3b8; margin-top: 2px; }

.loading-state, .error-msg { text-align: center; padding: 60px; color: #64748b; }
.spinner { border: 3px solid #e2e8f0; border-top: 3px solid #4f46e5; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 16px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

/* Subscribed Tags Styles */
.subscribed-tags-section { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
.subscribed-tags-section h3 { font-size: 1rem; color: #64748b; margin-bottom: 15px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.tags-list { display: flex; flex-wrap: wrap; gap: 10px; }
.tag-chip { background: #eef2ff; color: #4f46e5; padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 0.9rem; border: 1px solid #c7d2fe; transition: all 0.2s; }
.tag-chip:hover { background: #4f46e5; color: white; transform: translateY(-2px); }
.subscribed-tags-section.empty { text-align: center; color: #94a3b8; font-style: italic; }
.link { color: #2563eb; text-decoration: none; font-weight: 600; font-style: normal; margin-left: 5px; }
.link:hover { text-decoration: underline; }
</style>
