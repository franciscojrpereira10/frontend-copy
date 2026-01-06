<script setup>
import { useAuthStore } from '~/stores/auth-store'

definePageMeta({
  middleware: ['auth']
})

const config = useRuntimeConfig()
const api = config.public.apiBase
const authStore = useAuthStore()
const router = useRouter()

const users = ref([])
const loading = ref(false)
const error = ref('')
const sortDirection = ref('asc') // 'asc' | 'desc'

const sortedUsers = computed(() => {
  return [...users.value].sort((a, b) => {
    return sortDirection.value === 'asc' ? a.id - b.id : b.id - a.id
  })
})

function toggleSort() {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
}

async function loadUsers() {
  if (authStore.userRole !== 'ADMIN') {
    router.push('/')
    return
  }

  loading.value = true
  error.value = ''
  try {
    const res = await $fetch(`${api}/users`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    // O backend retorna { users: [], totalUsers: N }
    users.value = res.users || []
  } catch (e) {
    console.error(e)
    error.value = 'Erro ao carregar utilizadores. Verifique se tem permissões.'
  } finally {
    loading.value = false
  }
}

async function toggleBlock(user) {
  if (!confirm(`Tem a certeza que deseja ${user.status === 'ACTIVE' ? 'bloquear' : 'desbloquear'} este utilizador?`)) return

  // Backend espera SUSPENDED para bloqueado
  const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
  try {
    await $fetch(`${api}/users/${user.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${authStore.token}`, 'Content-Type': 'application/json' },
      body: { status: newStatus }
    })
    user.status = newStatus
  } catch (e) {
    console.error('Erro ao bloquear user:', e)
    alert('Erro ao alterar estado do utilizador: ' + (e.message || 'Erro desconhecido'))
  }
}

async function changeRole(user) {
  // Toggle: Se for ADMIN passa a CONTRIBUTOR, senão vira ADMIN
  const currentRole = user.role || 'CONTRIBUTOR'
  const newRole = currentRole === 'ADMIN' ? 'CONTRIBUTOR' : 'ADMIN'
  
  const displayRole = newRole === 'ADMIN' ? 'Administrador' : 'Contribuinte (Normal)'
  if (!confirm(`Mudar role de ${user.username} para ${displayRole}?`)) return

  try {
    await $fetch(`${api}/users/${user.id}/role`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${authStore.token}`, 'Content-Type': 'application/json' },
      body: { role: newRole }
    })
    user.role = newRole
  } catch (e) {
    console.error('Erro ao mudar role:', e)
    alert('Erro ao alterar role: ' + (e.message || 'Erro desconhecido'))
  }
}

async function softDeleteUser(user) {
  if (!confirm(`Tem a certeza que deseja eliminar o utilizador ${user.username}? Esta ação é irreversível (soft delete).`)) return

  try {
    await $fetch(`${api}/users/${user.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    // Removemos da lista localmente para refletir a mudança imediata
    users.value = users.value.filter(u => u.id !== user.id)
    alert('Utilizador eliminado com sucesso.')
  } catch (e) {
    console.error('Erro ao eliminar user:', e)
    alert('Erro ao eliminar utilizador: ' + (e.message || 'Erro desconhecido'))
  }
}

const fileInput = ref(null)

async function triggerImport() {
  fileInput.value.click()
}

async function handleImport(event) {
  const file = event.target.files[0]
  if (!file) return

  const formData = new FormData()
  formData.append('file', file)

  loading.value = true
  try {
    const res = await $fetch(`${api}/users/import`, {
      method: 'POST',
      body: formData,
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    alert(`Importação concluída!\nProcessados: ${res.processed}\nCriados: ${res.created}\nFalhados: ${res.failed}`)
    loadUsers()
  } catch (e) {
    console.error(e)
    alert('Erro ao importar utilizadores.')
  } finally {
    loading.value = false
    event.target.value = '' // Reset input
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<template>
  <div class="admin-page">
    <header class="page-header">
      <div class="header-content">
        <div>
          <h1>Gestão de Utilizadores</h1>
          <p>Gerir acessos e permissões da plataforma.</p>
        </div>
        
        <div class="header-actions">
          <input 
            type="file" 
            ref="fileInput" 
            accept=".csv" 
            style="display: none" 
            @change="handleImport"
          >
          <button @click="triggerImport" class="import-btn">
            <span class="import-icon">📂</span> Imporar CSV
          </button>
        </div>
      </div>
    </header>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>A carregar utilizadores...</p>
    </div>

    <div v-else-if="error" class="error-msg">
      {{ error }}
      <button @click="loadUsers" class="retry-btn">Tentar Novamente</button>
    </div>

    <div v-else class="users-table-container">
      <table class="users-table">
        <thead>
          <tr>
            <th @click="toggleSort" class="sortable-header" title="Ordenar por ID">
              ID {{ sortDirection === 'asc' ? '▲' : '▼' }}
            </th>
            <th>Utilizador</th>
            <th>Email</th>
            <th>Role</th>
            <th>Estado</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in sortedUsers" :key="user.id">
            <td>#{{ user.id }}</td>
            <td>
              <div class="user-info">
                <span class="user-avatar">{{ user.username.charAt(0).toUpperCase() }}</span>
                <strong>{{ user.username }}</strong>
              </div>
            </td>
            <td>{{ user.email }}</td>
            <td>
              <span class="role-badge" :class="user.role.toLowerCase()">
                {{ user.role }}
              </span>
            </td>
            <td>
              <span class="status-badge" :class="user.status.toLowerCase()">
                {{ user.status }}
              </span>
            </td>
            <td class="actions">
              <button 
                @click="changeRole(user)" 
                class="btn-icon" 
                title="Mudar Role"
                :disabled="user.username === authStore.user?.username"
              >
                👑
              </button>
              <button 
                @click="toggleBlock(user)"
                class="btn-icon"
                :title="user.status === 'ACTIVE' ? 'Bloquear' : 'Desbloquear'"
                :class="user.status === 'ACTIVE' ? 'blocked' : 'active'"
                :disabled="user.username === authStore.user?.username"
              >
                {{ user.status === 'ACTIVE' ? '🔒' : '🔓' }}
              </button>
              <button 
                @click="softDeleteUser(user)"
                class="btn-icon delete-btn"
                title="Eliminar Utilizador"
                :disabled="user.username === authStore.user?.username"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.admin-page { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
.page-header { margin-bottom: 40px; }
.page-header h1 { font-size: 2rem; color: #0f172a; margin: 0 0 8px 0; }
.page-header p { color: #64748b; }

.users-table-container {
  background: white; border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  overflow-x: auto;
  border: 1px solid #e2e8f0;
}

.users-table { width: 100%; border-collapse: collapse; text-align: left; }
.users-table th {
  background: #f8fafc; padding: 16px; font-weight: 600; color: #475569;
  border-bottom: 1px solid #e2e8f0; font-size: 0.85rem; text-transform: uppercase;
}
.sortable-header { cursor: pointer; user-select: none; }
.sortable-header:hover { background: #f1f5f9; color: #334155; }
.users-table td { padding: 16px; border-bottom: 1px solid #e2e8f0; color: #334155; }
.users-table tr:last-child td { border-bottom: none; }
.users-table tr:hover { background: #f8fafc; }

.user-info { display: flex; align-items: center; gap: 12px; }
.user-avatar {
  width: 32px; height: 32px; background: #eff6ff; color: #3b82f6;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 0.9rem;
}

.role-badge {
  padding: 4px 10px; border-radius: 99px; font-size: 0.75rem; font-weight: 600;
}
.role-badge.admin { background: #fef3c7; color: #b45309; }
.role-badge.contributor { background: #e0f2fe; color: #0369a1; }

.status-badge {
  padding: 4px 10px; border-radius: 99px; font-size: 0.75rem; font-weight: 600;
}
.status-badge.active { background: #dcfce7; color: #15803d; }
.status-badge.suspended, .status-badge.blocked { background: #fee2e2; color: #b91c1c; }

.actions { display: flex; gap: 8px; }
.btn-icon {
  background: white; border: 1px solid #e2e8f0; width: 32px; height: 32px;
  border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem; transition: all 0.2s;
}
.btn-icon:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.delete-btn:hover:not(:disabled) { background-color: #fef2f2; border-color: #fca5a5; color: #ef4444; }
.btn-icon:disabled { opacity: 0.3; cursor: not-allowed; }

/* Botões de Ação na Header */
.header-actions {
  display: flex;
  gap: 12px;
}

.import-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #0f172a;
  color: white;
  padding: 10px 20px;
  border-radius: 99px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -1px rgba(15, 23, 42, 0.06);
}

.import-btn:hover {
  background-color: #1e293b;
  transform: translateY(-1px);
  box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -2px rgba(15, 23, 42, 0.05);
}

.import-btn:active {
  transform: translateY(0);
}

.import-icon {
  font-size: 1.1rem;
}

/* Spinner e Loading */
.loading, .error-msg { text-align: center; padding: 60px; color: #64748b; }
.spinner { border: 3px solid #e2e8f0; border-top: 3px solid #4f46e5; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 16px; }
.retry-btn { margin-top: 10px; padding: 8px 16px; background: #0f172a; color: white; border: none; border-radius: 6px; cursor: pointer; }

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
