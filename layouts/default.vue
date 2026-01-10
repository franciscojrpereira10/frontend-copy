<template>
  <div class="app-container">
    <header class="navbar">
      <div class="nav-content">
        
        <div class="nav-left">
          <NuxtLink to="/" class="brand">
            <span class="brand-icon">🎓</span>
            <span class="brand-text">Centro XYZ</span>
          </NuxtLink>
        </div>

        <div class="nav-center">
          <template v-if="authStore.isAuthenticated">
            <NuxtLink to="/publications" class="nav-link" active-class="active-link">
              Publicações
            </NuxtLink>
            <NuxtLink to="/tags" class="nav-link" active-class="active-link">
              Tags
            </NuxtLink>
            <NuxtLink to="/statistics" class="nav-link" active-class="active-link">
              Estatísticas
            </NuxtLink>
            
            <NuxtLink to="/publications/create" class="nav-link create-btn" active-class="active-create">
              <span class="plus-icon">+</span> Novo Artigo
            </NuxtLink>

            <NuxtLink 
              v-if="authStore.userRole === 'ADMIN'" 
              to="/admin/users" 
              class="nav-link" 
              active-class="active-link"
            >
              Gestão de Utilizadores
            </NuxtLink>
          </template>
        </div>

        <div class="nav-right">
          <template v-if="!authStore.isAuthenticated">
            <NuxtLink to="/login" class="nav-link" style="margin-right: 12px">
              Entrar
            </NuxtLink>
            <NuxtLink to="/signup" class="login-btn">
              Criar Conta
            </NuxtLink>
          </template>

          <template v-else>
            <!-- Notifications -->
            <div class="notification-wrapper" ref="notifWrapper">
              <button class="icon-btn" @click="toggleNotifications">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                <span v-if="notifStore.unreadCount > 0" class="badge-count">{{ notifStore.unreadCount }}</span>
              </button>

              <!-- Dropdown -->
              <div v-if="showNotifications" class="notif-dropdown">
                <div class="notif-header">
                  <h3>Notificações</h3>
                  <button v-if="notifStore.unreadCount > 0" @click="markAllRead" class="mark-read-btn">
                    Marcar todas como lidas
                  </button>
                </div>

                <div v-if="notifStore.loading" class="spinner-container">
                  <svg class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                </div>
                
                <div v-else-if="notifStore.notifications.length === 0" class="empty-state">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="empty-icon"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                  <span>Sem notificações recentes</span>
                </div>

                <ul v-else class="notif-list">
                  <li v-for="notif in notifStore.notifications" :key="notif.id" 
                      :class="['notif-item', { unread: !notif.readFlag }]"
                      @click="handleNotificationClick(notif)">
                    
                    <div class="notif-icon-placeholder">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 12H16c-.7 2-2 3-4 3s-3.3-1-4-3H2.5"/><path d="M5.5 5.1L2 12v6c0 1.1.9 2 2 2h16a2 2 0 002-2v-6l-3.5-6.9A2 2 0 0016.5 3h-9a2 2 0 00-1.8 1.1z"/></svg>
                    </div>

                    <div class="notif-content">
                        <p class="notif-msg">{{ notif.message }}</p>
                        <span class="notif-time">{{ formatDate(notif.createdAt) }}</span>
                    </div>
                    
                    <div v-if="!notif.readFlag" class="unread-dot"></div>
                  </li>
                </ul>
              </div>
            </div>

            <!-- User Menu -->
            <div class="user-menu" @click="toggleDropdown" ref="userDropdown">
               <span class="username">{{ authStore.user?.name || authStore.user?.username }}</span>
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
               
               <div v-if="showDropdown" class="dropdown-menu">
                 <NuxtLink to="/profile" class="dropdown-item">Perfil</NuxtLink>
                 
                 <button 
                    v-if="(authStore.userRole === 'ADMIN' || authStore.userRole === 'MANAGER') && !authStore.isImpersonating"
                    @click="enterViewMode" 
                    class="dropdown-item"
                 >
                    Ver como Utilizador
                 </button>

                 <button 
                    v-if="authStore.isImpersonating"
                    @click="exitViewMode" 
                    class="dropdown-item highlight"
                 >
                    Voltar a Admin
                 </button>

                 <button @click="logout" class="dropdown-item logout">Sair</button>
               </div>
            </div>
          </template>
        </div>
      </div>
      </header>
      
      <!-- Page Content -->
      <main class="container">
        <slot />
      </main>
  
    </div>
  </template>
  
  <script setup>
  import { useAuthStore } from '~/stores/auth-store'
  import { useNotificationStore } from '~/stores/notification-store'
  import { useRouter } from 'vue-router'
  import { ref, onMounted, onUnmounted } from 'vue'
  
  const authStore = useAuthStore()
  const notifStore = useNotificationStore()
  const router = useRouter()
  const showDropdown = ref(false)
  const showNotifications = ref(false)
  
  const toggleDropdown = () => {
      showDropdown.value = !showDropdown.value
      if (showDropdown.value) showNotifications.value = false
  }
  
  const toggleNotifications = () => {
      showNotifications.value = !showNotifications.value
      if (showNotifications.value) {
          showDropdown.value = false
          notifStore.fetchNotifications()
      }
  }
  
  const markAllRead = async () => {
      await notifStore.markAllAsRead()
  }
  
  const handleNotificationClick = async (notif) => {
      if (!notif.readFlag) {
          await notifStore.markAsRead(notif.id)
      }
      // Opcional: navegar para o recurso
      // if (notif.relatedEntityType === 'Publication') {
      //     router.push(`/publications/${notif.relatedEntityId}`)
      // }
  }
  
  const logout = () => {
    authStore.logout()
    router.push('/auth/login')
  }

  const enterViewMode = () => {
      authStore.impersonateUser()
      showDropdown.value = false
      router.push('/')
  }

  const exitViewMode = () => {
      authStore.stopImpersonation()
      showDropdown.value = false
      router.push('/')
  }
  
  const handleClickOutside = (event) => {
      // Fechar dropdowns ao clicar fora
      if (!event.target.closest('.user-menu') && showDropdown.value) {
          showDropdown.value = false
      }
      if (!event.target.closest('.notification-wrapper') && showNotifications.value) {
          showNotifications.value = false
      }
  }
  
  const formatDate = (dateString) => {
      if (!dateString) return ''
      return new Date(dateString).toLocaleDateString('pt-PT', { 
          day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' 
      })
  }
  
  onMounted(() => {
      document.addEventListener('click', handleClickOutside)
      if (authStore.isAuthenticated) {
          notifStore.fetchNotifications()
      }
  })
  
  onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
  })
  </script>
  
  <style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
  background-color: #f8fafc;
  color: #334155;
}

.navbar {
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  position: sticky;
  top: 0;
  z-index: 1000;
  height: 60px; /* Altura reduzida para ser mais compacto */
  display: flex;
  align-items: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
}

.nav-content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand {
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: transform 0.2s;
}
.brand:hover { transform: scale(1.02); }

.brand-icon { font-size: 1.5rem; }
.brand-text {
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
}

.nav-center { display: flex; align-items: center; gap: 32px; }

.nav-link {
  text-decoration: none;
  color: #64748b;
  font-weight: 500;
  font-size: 0.95rem;
  transition: all 0.2s;
  padding: 8px 0;
  position: relative;
}
.nav-link:hover { color: #0f172a; }
.nav-link::after {
  content: ''; position: absolute; width: 0; height: 2px; bottom: 0; left: 0;
  background-color: #3b82f6; transition: width 0.3s;
}
.nav-link:hover::after, .active-link::after { width: 100%; }
.active-link { color: #0f172a; font-weight: 600; }

.create-btn {
  display: flex; align-items: center; gap: 6px;
  background-color: #eff6ff; color: #2563eb !important;
  padding: 8px 16px; border-radius: 999px; border: 1px solid #dbeafe;
  font-weight: 600; transition: all 0.2s ease;
}
.create-btn::after { display: none; }
.create-btn:hover {
  background-color: #2563eb; color: white !important; border-color: #2563eb;
  transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}
.plus-icon { font-size: 1.1rem; line-height: 1; }

.nav-right { display: flex; align-items: center; gap: 20px; }

.login-btn {
  background: #0f172a; color: white; text-decoration: none;
  padding: 10px 24px; border-radius: 8px; font-weight: 600; font-size: 0.9rem;
  transition: all 0.2s;
}
.login-btn:hover {
  background: #1e293b; transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 8px;
  transition: background-color 0.2s;
  position: relative;
}
.user-menu:hover { background-color: #f1f5f9; }

.username { 
  font-weight: 600; 
  color: #334155; 
  font-size: 0.9rem; 
}

.admin-badge {
  font-size: 0.7rem; text-transform: uppercase; background-color: #fef3c7;
  color: #d97706; padding: 2px 8px; border-radius: 4px; font-weight: 700;
  text-decoration: none; margin-top: 2px; letter-spacing: 0.5px;
}
.admin-badge:hover { background-color: #fde68a; }


.dropdown-menu {
  position: absolute; top: 100%; right: 0; margin-top: 8px;
  background: white; border: 1px solid #e2e8f0; border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); width: 160px; overflow: hidden;
  animation: fadeIn 0.1s ease-out;
}
.dropdown-item {
  display: block; width: 100%; padding: 10px 16px; text-align: left;
  background: none; border: none; font-size: 0.9rem; color: #334155;
  cursor: pointer; text-decoration: none; transition: background-color 0.2s;
}
.dropdown-item:hover { background-color: #f8fafc; color: #0f172a; }
.dropdown-item.logout { color: #ef4444; border-top: 1px solid #f1f5f9; }
.dropdown-item.logout:hover { background-color: #fef2f2; }
.dropdown-item.highlight { color: #2563eb; font-weight: 600; background-color: #eff6ff; }
.dropdown-item.highlight:hover { background-color: #dbeafe; }

.logout-btn {
  background: white; border: 1px solid #e2e8f0; color: #ef4444;
  width: 40px; height: 40px; border-radius: 50%; display: flex;
  align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;
}
.logout-btn:hover {
  background-color: #fef2f2; border-color: #fecaca; transform: rotate(90deg);
}


.container {
  flex: 1; width: 100%; max-width: 1200px; margin: 0 auto;
  padding: 2.5rem 24px 40px; 
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .nav-center { display: none; }
  .nav-content { justify-content: space-between; }
}

/* Notifications */
.notification-wrapper { position: relative; }
.icon-btn {
    background: none; border: none; cursor: pointer; color: #64748b;
    padding: 10px; border-radius: 50%; position: relative; display: flex;
    transition: background-color 0.2s, color 0.2s;
}
.icon-btn:hover { background-color: #f1f5f9; color: #0f172a; }
.icon-btn:active { transform: scale(0.95); }

.badge-count {
    position: absolute; top: 0px; right: 0px;
    background-color: #ef4444; color: white;
    font-size: 0.65rem; font-weight: 700;
    min-width: 18px; height: 18px; border-radius: 99px;
    display: flex; align-items: center; justify-content: center;
    border: 2px solid #fff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Modern "Window" Design */
.notif-dropdown {
    position: absolute; 
    top: calc(100% + 12px); 
    right: -10px;
    width: 380px; 
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px);
    border-radius: 16px; 
    border: 1px solid rgba(226, 232, 240, 0.8);
    box-shadow: 
        0 4px 6px -1px rgba(0, 0, 0, 0.05),
        0 20px 25px -5px rgba(0, 0, 0, 0.1);
    z-index: 1005; 
    overflow: hidden;
    transform-origin: top right;
    animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95) translateY(-5px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
}

.notif-header {
    padding: 16px 20px; 
    border-bottom: 1px solid #f1f5f9;
    display: flex; justify-content: space-between; align-items: center;
    background-color: rgba(248, 250, 252, 0.8);
}
.notif-header h3 { 
    margin: 0; font-size: 1rem; font-weight: 700; color: #1e293b; 
    letter-spacing: -0.3px;
}
.mark-read-btn {
    font-size: 0.8rem; font-weight: 600; color: #3b82f6; 
    background: none; border: none; cursor: pointer;
    padding: 4px 8px; border-radius: 6px;
    transition: all 0.2s;
}
.mark-read-btn:hover { background-color: #eff6ff; }

.notif-list { 
    list-style: none; padding: 0; margin: 0; 
    max-height: 400px; overflow-y: auto; 
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
}
.notif-list::-webkit-scrollbar { width: 6px; }
.notif-list::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 3px; }

.notif-item {
    padding: 16px 20px; 
    border-bottom: 1px solid #f8fafc;
    cursor: pointer; display: flex; gap: 12px; align-items: flex-start;
    transition: background-color 0.2s;
    position: relative;
}
.notif-item:hover { background-color: #f8fafc; }
.notif-item.unread { background-color: #f0f9ff; }
.notif-item:last-child { border-bottom: none; }

.notif-icon-placeholder {
    width: 36px; height: 36px; background-color: #e2e8f0; border-radius: 50%;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    color: #64748b;
}
.notif-item.unread .notif-icon-placeholder {
    background-color: #dbeafe; color: #2563eb;
}

.notif-content { flex: 1; }
.notif-msg { margin: 0 0 6px 0; font-size: 0.9rem; color: #475569; line-height: 1.5; }
.notif-item.unread .notif-msg { font-weight: 600; color: #0f172a; }
.notif-time { font-size: 0.75rem; color: #94a3b8; display: block; font-weight: 500; }

.unread-dot {
    position: absolute; top: 18px; right: 16px;
    width: 8px; height: 8px; background-color: #3b82f6;
    border-radius: 50%; box-shadow: 0 0 0 2px white;
}

.empty-state {
    padding: 40px 20px; text-align: center; color: #94a3b8;
    display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.empty-icon { opacity: 0.5; }

/* Loading Spinner */
.spinner-container {
    padding: 24px; text-align: center; display: flex; justify-content: center;
}
.spinner {
    width: 24px; height: 24px; color: #64748b;
    animation: spin 1s linear infinite;
}
.opacity-25 { opacity: 0.25; }
.opacity-75 { opacity: 0.75; }

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
</style>