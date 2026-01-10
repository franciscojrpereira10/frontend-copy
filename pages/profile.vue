<template>
  <div class="profile-page">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>A carregar perfil...</p>
    </div>

    <div v-else class="content-wrapper">
      <!-- Header / Hero Section -->
      <div class="profile-header">
        <div class="header-content">
          <div class="avatar-section">
            <div class="relative group cursor-pointer" @click="showPhotoModal = true">
              <div class="avatar-circle overflow-hidden relative">
                <img v-if="profile.profilePictureFilename" 
                     :src="`${config.public.apiBase}/users/${profile.username}/picture?t=${profileImageTs}`"  
                     alt="Profile" 
                     class="avatar-img" />
                <span v-else>{{ userInitials }}</span>
                
                <!-- Overlay -->
                <div class="absolute inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
              </div>
              <input type="file" ref="fileInput" style="display: none" accept="image/*" @change="handleProfilePictureUpload" />
            </div>

            <div class="user-info">
              <h1>{{ profile.username }}</h1>
              <span class="role-badge">{{ profile.role }}</span>
            </div>
          </div>
          
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-value">{{ profile.statistics?.publicationsSubmitted || 0 }}</span>
              <span class="stat-label">Publicações</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ profile.statistics?.commentsPosted || 0 }}</span>
              <span class="stat-label">Comentários</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ profile.statistics?.subscribedTags || 0 }}</span>
              <span class="stat-label">Tags Seguidas</span>
            </div>
          </div>
        </div>
      </div>

      <div class="main-grid">
        <!-- Sidebar Navigation -->
        <aside class="settings-nav">
          <nav>
            <button 
              v-for="tab in tabs" 
              :key="tab.id"
              @click="currentTab = tab.id"
              :class="['nav-item', { active: currentTab === tab.id }]"
            >
              <span class="nav-icon" v-html="tab.icon"></span>
              {{ tab.label }}
            </button>
          </nav>
        </aside>

        <!-- Main Content Area -->
        <main class="settings-content">
          
          <!-- Tab: Personal Data -->
          <section v-if="currentTab === 'personal'" class="settings-card">
            <div class="card-header">
              <h2>Dados Pessoais</h2>
              <p>Gerencie as suas informações de perfil e preferências.</p>
            </div>
            
            <form @submit.prevent="updateProfile">
              <div class="form-group">
                <label>Nome de Utilizador</label>
                <input type="text" :value="profile.username" disabled class="input-disabled">
                <span class="help-text">O nome de utilizador não pode ser alterado.</span>
              </div>

              <div class="form-group">
                <label>Email</label>
                <input v-model="form.email" type="email" required placeholder="seu.email@exemplo.com">
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Idioma Preferido</label>
                  <select v-model="form.preferences.language">
                    <option value="PT">Português</option>
                    <option value="EN">English</option>
                  </select>
                </div>
              </div>

              <div class="form-group checkbox-group">
                <label class="switch">
                  <input type="checkbox" v-model="form.preferences.emailNotifications">
                  <span class="slider round"></span>
                </label>
                <span class="checkbox-label">Receber notificações por email</span>
              </div>

              <div class="form-actions">
                <button type="submit" class="btn-primary" :disabled="saving">
                  {{ saving ? 'A Guardar...' : 'Guardar Alterações' }}
                </button>
              </div>
            </form>
          </section>

          <!-- Tab: Security -->
          <section v-if="currentTab === 'security'" class="settings-card">
            <div class="card-header">
              <h2>Segurança</h2>
              <p>Atualize a sua palavra-passe.</p>
            </div>

            <form @submit.prevent="changePassword">
              <div class="form-group">
                <label>Palavra-passe Atual</label>
                <input v-model="passwordForm.oldPassword" type="password" required>
              </div>

              <div class="form-group">
                <label>Nova Palavra-passe</label>
                <input v-model="passwordForm.newPassword" type="password" required minlength="4">
              </div>

              <div class="form-group">
                <label>Confirmar Nova Palavra-passe</label>
                <input v-model="passwordForm.confirmPassword" type="password" required minlength="4">
              </div>

              <div v-if="passwordError" class="error-message">
                {{ passwordError }}
              </div>

              <div class="form-actions">
                <button type="submit" class="btn-primary" :disabled="savingPassword">
                  {{ savingPassword ? 'A Alterar...' : 'Alterar Palavra-passe' }}
                </button>
              </div>
            </form>
          </section>

          <!-- Tab: Activity History -->
          <section v-if="currentTab === 'history'" class="settings-card">
            <div class="card-header">
              <h2>Histórico de Atividade</h2>
              <p>As suas últimas ações na plataforma.</p>
            </div>

            <div v-if="loadingHistory" class="loading-history">
              A carregar histórico...
            </div>

            <div v-else-if="activities.length === 0" class="empty-state">
              <p>Ainda não existe atividade registada.</p>
            </div>

            <div v-else class="activity-timeline space-y-4">
              <div v-for="activity in activities" :key="activity.id" class="activity-item group p-4 rounded-xl hover:bg-slate-50 transition-all duration-200 border border-transparent hover:border-slate-100">
                <div class="activity-icon shadow-sm" :class="getActivityTypeClass(activity.type)">
                  {{ getActivityIcon(activity.type) }}
                </div>
                <div class="activity-content">
                  <p class="text-slate-700 font-medium text-sm leading-relaxed">{{ activity.description }}</p>
                  <span class="text-xs text-slate-400 mt-1 block font-medium">{{ formatDate(activity.timestamp) }}</span>
                </div>
              </div>

              <!-- Pagination Controls -->
              <div class="pagination-wrapper" v-if="pagination.page > 1 || pagination.hasMore">
                <button 
                  @click="changePage(-1)" 
                  :disabled="pagination.page === 1 || loadingHistory"
                  class="pagination-btn"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                  <span>Anterior</span>
                </button>
                
                <span class="page-indicator">
                  Página {{ pagination.page }}
                </span>
                
                <button 
                  @click="changePage(1)" 
                  :disabled="!pagination.hasMore || loadingHistory"
                  class="pagination-btn"
                >
                  <span>Próxima</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>

    <!-- Photo Modal with Teleport and Custom CSS -->
    <Teleport to="body">
      <div v-if="showPhotoModal" class="modal-overlay" @click.self="showPhotoModal = false">
        <div class="modal-container animate-scale-in">
          <div class="modal-header">
            <h3>Alterar foto de perfil</h3>
          </div>
          
          <div class="modal-actions">
            <button @click="triggerFileInput(); showPhotoModal = false" class="modal-btn btn-blue">
              Carregar Fotografia
            </button>
            
            <button @click="handleRemovePhoto" class="modal-btn btn-red">
              Remover foto atual
            </button>
            
            <button @click="showPhotoModal = false" class="modal-btn btn-cancel">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// definePageMeta({
//   middleware: ['auth']
// }) REMOVIDO: Middleware auth.js foi apagado, usamos auth.global.ts


const config = useRuntimeConfig()
const { $toast } = useNuxtApp() 

// State
const loading = ref(true)
const saving = ref(false)
const savingPassword = ref(false)
const profile = ref({})
const currentTab = ref('personal')
const activities = ref([])
const loadingHistory = ref(false)
const pagination = ref({ 
  page: 1, 
  limit: 10,
  hasMore: false
})
const showPhotoModal = ref(false)
const fileInput = ref(null)
const profileImageTs = ref(Date.now())

// Computed
const userInitials = computed(() => {
  const name = profile.value.username || 'User'
  return name.substring(0, 2).toUpperCase()
})

// Fetch Data
const fetchProfile = async () => {
  try {
    const token = useCookie('token').value
    const data = await $fetch(`${config.public.apiBase}/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    profile.value = data
    
    // Init form
    form.value.email = data.email
    form.value.preferences = { ...data.preferences }
    
    fetchHistory(data.id)

  } catch (e) {
    console.error('Failed to load profile', e)
  } finally {
    loading.value = false
  }
}

const fetchHistory = async (userId) => {
  loadingHistory.value = true
  try {
    const token = useCookie('token').value
    const offset = (pagination.value.page - 1) * pagination.value.limit
    
    const data = await $fetch(`${config.public.apiBase}/activity/my`, {
      method: 'GET',
      headers: { 
        Authorization: `Bearer ${token}`,
        'x-user-id': userId 
      },
      query: { 
        limit: pagination.value.limit,
        offset: offset
      }
    })
    
    const newActivities = data.activities || []
    activities.value = newActivities
    
    pagination.value.hasMore = newActivities.length === pagination.value.limit
    
  } catch (e) {
    console.error('Failed to load history', e)
    activities.value = []
  } finally {
    loadingHistory.value = false
  }
}

const changePage = (delta) => {
    const newPage = pagination.value.page + delta
    if (newPage < 1) return
    pagination.value.page = newPage
    if (profile.value?.id) {
        fetchHistory(profile.value.id)
    }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleProfilePictureUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const formData = new FormData()
  formData.append('file', file)

  try {
    const token = useCookie('token').value
    const response = await $fetch(`${config.public.apiBase}/users/me/picture`, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${token}` 
      }
    })
    
    if (response && response.filename) {
        profile.value.profilePictureFilename = response.filename
        profileImageTs.value = Date.now()
        fetchHistory(profile.value.id)
    }
    
    alert('Foto de perfil atualizada!')
  } catch (error) {
    console.error(error)
    alert('Falha ao carregar a foto.')
  } finally {
    event.target.value = ''
  }
}

const handleRemovePhoto = async () => {
    if (!confirm('Tem a certeza que deseja remover a sua foto de perfil?')) return

    try {
       const token = useCookie('token').value
       await $fetch(`${config.public.apiBase}/users/me/picture`, {
           method: 'DELETE',
           headers: { Authorization: `Bearer ${token}` }
       })
       
       profile.value.profilePictureFilename = null
       fetchHistory(profile.value.id)
       alert('Foto de perfil removida com sucesso.')
    } catch (error) {
       console.error(error)
       alert('Erro ao remover a foto.')
    } finally {
       showPhotoModal.value = false
    }
}

// Forms
const form = ref({
  email: '',
  preferences: {
    language: 'PT',
    emailNotifications: false
  }
})

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordError = ref('')

const tabs = [
  { 
    id: 'personal', 
    label: 'Dados Pessoais', 
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>' 
  },
  { 
    id: 'security', 
    label: 'Segurança', 
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>' 
  },
  { 
    id: 'history', 
    label: 'Histórico', 
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>' 
  }
]

// Actions
const updateProfile = async () => {
  saving.value = true
  try {
    const token = useCookie('token').value
    const body = {
      email: form.value.email,
      preferences: form.value.preferences
    }
    
    const updated = await $fetch(`${config.public.apiBase}/profile`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body
    })

    profile.value.email = updated.email
    profile.value.preferences = updated.preferences
    
    alert('Perfil atualizado com sucesso!')
  } catch (e) {
    console.error(e)
    alert('Erro ao atualizar perfil')
  } finally {
    saving.value = false
  }
}

const changePassword = async () => {
  passwordError.value = ''
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = 'As novas palavras-passe não coincidem.'
    return
  }

  savingPassword.value = true
  try {
    const token = useCookie('token').value
    await $fetch(`${config.public.apiBase}/auth/password`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        oldPassword: passwordForm.value.oldPassword,
        newPassword: passwordForm.value.newPassword
      }
    })

    alert('Palavra-passe alterada com sucesso!')
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  } catch (e) {
    if (e.response && e.response.status === 403) {
        passwordError.value = 'A palavra-passe atual está incorreta.'
    } else {
        passwordError.value = 'Erro ao alterar palavra-passe.'
    }
  } finally {
    savingPassword.value = false
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

const getInitials = (name) => {
  if (!name) return '?'
  return name.substring(0, 2).toUpperCase()
}

onMounted(() => {
  fetchProfile()
})
</script>

<style scoped>
.profile-page {
  padding: 20px 0;
  min-height: 80vh;
}

.loading-state {
  display: flex;
  flex-direction: column;
  items-align: center;
  justify-content: center;
  height: 300px;
  color: #64748b;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

/* Header */
.profile-header {
  background: white;
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-circle {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  font-size: 2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.user-info h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: #1e293b;
}

.role-badge {
  display: inline-block;
  margin-top: 6px;
  padding: 4px 12px;
  background-color: #f1f5f9;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 100px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stats-grid {
  display: flex;
  gap: 40px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
}

.stat-label {
  font-size: 0.85rem;
  color: #64748b;
}

/* Main Grid */
.main-grid {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 32px;
  align-items: start;
}

/* Sidebar Nav */
.settings-nav {
  background: white;
  border-radius: 12px;
  padding: 8px;
  border: 1px solid #e2e8f0;
}

.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  border-radius: 8px;
  color: #64748b;
  font-weight: 500;
  transition: all 0.2s;
  font-size: 0.95rem;
}

.nav-item:hover {
  background-color: #f8fafc;
  color: #334155;
}

.nav-item.active {
  background-color: #eff6ff;
  color: #2563eb;
  font-weight: 600;
}

/* Content Area */
.settings-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  border: 1px solid #e2e8f0;
  animation: fadeIn 0.3s ease-out;
}

.card-header {
  margin-bottom: 32px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 20px;
}

.card-header h2 {
  margin: 0 0 8px 0;
  font-size: 1.4rem;
  color: #0f172a;
}

.card-header p {
  margin: 0;
  color: #64748b;
  font-size: 0.95rem;
}

/* Forms */
.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: #334155;
  font-size: 0.9rem;
}

input[type="text"],
input[type="email"],
input[type="password"],
select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s;
}

input:focus, select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input-disabled {
  background-color: #f8fafc;
  color: #94a3b8;
  cursor: not-allowed;
}

.help-text {
  display: block;
  margin-top: 6px;
  font-size: 0.8rem;
  color: #94a3b8;
}

/* Switch Toggle */
.checkbox-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch input { opacity: 0; width: 0; height: 0; }

.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #2563eb;
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.checkbox-label {
  font-size: 0.95rem;
  color: #334155;
}

/* Actions */
.form-actions {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
}

.btn-primary {
  background-color: #2563eb;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background-color: #1d4ed8;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: wait;
}

.error-message {
  color: #ef4444;
  margin-bottom: 16px;
  font-size: 0.9rem;
  background-color: #fef2f2;
  padding: 10px;
  border-radius: 6px;
}

/* Activity Timeline */
.activity-timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.activity-text {
  margin: 0 0 4px 0;
  font-size: 0.95rem;
  color: #334155;
  line-height: 1.4;
}

.activity-date {
  font-size: 0.8rem;
  color: #94a3b8;
}

.icon-blue { background-color: #eff6ff; color: #2563eb; }
.icon-green { background-color: #f0fdf4; color: #16a34a; }
.icon-yellow { background-color: #fefce8; color: #ca8a04; }
.icon-purple { background-color: #faf5ff; color: #9333ea; }
.icon-red { background-color: #fef2f2; color: #dc2626; }
.icon-orange { background-color: #fff7ed; color: #ea580c; }
.icon-gray { background-color: #f8fafc; color: #64748b; }

/* Pagination */
.pagination-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #f1f5f9;
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #64748b;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.pagination-btn:hover:not(:disabled) {
  background-color: #f8fafc;
  color: #0f172a;
  border-color: #cbd5e1;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.page-indicator {
  font-size: 0.95rem;
  font-weight: 600;
  color: #334155;
  background-color: #f1f5f9;
  padding: 6px 16px;
  border-radius: 20px;
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.animate-scale-in {
  animation: scaleIn 0.2s ease-out;
}

@media (max-width: 768px) {
  .main-grid {
    grid-template-columns: 1fr;
  }
  
  .settings-nav nav {
    display: flex;
    overflow-x: auto;
    padding-bottom: 4px;
  }
  
  .nav-item {
    white-space: nowrap;
  }
  
  .profile-header {
    padding: 24px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .avatar-section {
    flex-direction: column;
    gap: 12px;
  }
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 100%;
  max-width: 400px;
  overflow: hidden;
  position: relative;
  z-index: 10000;
  font-family: sans-serif;
}

.modal-header {
  padding: 24px;
  text-align: center;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
}

.modal-actions {
  display: flex;
  flex-direction: column;
}

.modal-btn {
  width: 100%;
  padding: 16px;
  text-align: center;
  font-weight: 700;
  font-size: 0.9rem;
  border: none;
  border-bottom: 1px solid #e2e8f0;
  background: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

.modal-btn:last-child {
  border-bottom: none;
}

.modal-btn:hover {
  background-color: #f8fafc;
}

.btn-blue { color: #2563eb; }
.btn-red { color: #ef4444; }
.btn-cancel { color: #64748b; font-weight: 500; }
</style>
