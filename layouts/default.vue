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
            <div class="user-menu">
              <span class="username-display">
                {{ authStore.user?.username }}
              </span>
            </div>

            <button @click="authStore.logout()" class="logout-btn" title="Terminar Sessão">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          </template>
        </div>

      </div>
    </header>

    <main class="page-container">
      <slot />
    </main>

  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth-store'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
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

.user-menu { display: flex; flex-direction: column; align-items: flex-end; line-height: 1.2; }
.username-display { font-size: 0.95rem; font-weight: 600; color: #334155; }

.admin-badge {
  font-size: 0.7rem; text-transform: uppercase; background-color: #fef3c7;
  color: #d97706; padding: 2px 8px; border-radius: 4px; font-weight: 700;
  text-decoration: none; margin-top: 2px; letter-spacing: 0.5px;
}
.admin-badge:hover { background-color: #fde68a; }

.logout-btn {
  background: white; border: 1px solid #e2e8f0; color: #ef4444;
  width: 40px; height: 40px; border-radius: 50%; display: flex;
  align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;
}
.logout-btn:hover {
  background-color: #fef2f2; border-color: #fecaca; transform: rotate(90deg);
}

.page-container {
  flex: 1; width: 100%; max-width: 1200px; margin: 0 auto;
  /* Espaçamento superior reduzido para 20px */
  padding: 20px 24px 40px; 
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
</style>