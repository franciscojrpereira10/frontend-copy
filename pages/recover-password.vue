<template>
  <div class="login-page">
    <div class="login-card">
      <div class="card-header">
        <div class="icon-wrapper">
          🔑
        </div>
        <h1>Recuperar Password</h1>
        <p>Insere o teu email para receberes instruções</p>
      </div>

      <form @submit.prevent="handleRecover" class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <div class="input-wrapper">
            <input 
              id="email"
              v-model="email" 
              type="email" 
              required 
              placeholder="exemplo@email.com"
              class="form-input" 
              :disabled="loading"
            />
          </div>
        </div>

        <button type="submit" :disabled="loading" class="submit-btn">
          <span v-if="loading" class="spinner"></span>
          <span v-else>Recuperar Password</span>
        </button>

        <div class="back-link">
          <NuxtLink to="/login">Voltar ao Login</NuxtLink>
        </div>
      </form>

      <transition name="fade">
        <div v-if="message" :class="['alert', isError ? 'error-alert' : 'success-alert']">
          <span class="icon">{{ isError ? '⚠️' : '✅' }}</span>
          {{ message }}
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth-store'

const email = ref('')
const message = ref('')
const isError = ref(false)
const loading = ref(false)

const authStore = useAuthStore()

async function handleRecover() {
  loading.value = true
  message.value = ''
  isError.value = false
  
  try {
    await authStore.recoverPassword(email.value)
    message.value = 'Email de recuperação enviado! Verifica a tua caixa de entrada.'
    email.value = '' // Limpar campo
  } catch (err) {
    isError.value = true
    if (err.response && err.response._data) {
        message.value = typeof err.response._data === 'string' ? err.response._data : 'Erro ao enviar email.'
    } else {
        message.value = 'Erro ao processar pedido. Tenta novamente.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Reutilizando estilos do login.vue para consistência */
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 140px); 
  width: 100%;
  overflow: hidden;
}

.login-card {
  background: white;
  width: 100%;
  max-width: 420px;
  padding: 40px;
  border-radius: 24px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(226, 232, 240, 0.8);
  margin-bottom: 25vh; 
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.card-header { text-align: center; margin-bottom: 32px; }
.icon-wrapper {
  background: #eff6ff; width: 60px; height: 60px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 2rem;
  margin: 0 auto 16px; border: 1px solid #dbeafe;
}
.card-header h1 { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0 0 8px; }
.card-header p { color: #64748b; font-size: 0.95rem; margin: 0; }

.form-group { margin-bottom: 24px; }
label { display: block; font-size: 0.9rem; font-weight: 600; color: #334155; margin-bottom: 8px; }
.form-input {
  width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid #cbd5e1;
  font-size: 1rem; color: #1e293b; background-color: #f8fafc; outline: none; box-sizing: border-box;
}
.form-input:focus { background-color: white; border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }

.submit-btn {
  width: 100%; padding: 14px; background-color: #2563eb; color: white; border: none;
  border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; margin-top: 8px;
  display: flex; justify-content: center; align-items: center;
}
.submit-btn:hover { background-color: #1d4ed8; }
.submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

.back-link { text-align: center; margin-top: 20px; }
.back-link a { color: #64748b; text-decoration: none; font-size: 0.9rem; }
.back-link a:hover { color: #2563eb; text-decoration: underline; }

.spinner {
  width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3);
  border-radius: 50%; border-top-color: white; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.alert {
  margin-top: 24px; padding: 12px 16px; border-radius: 12px;
  font-size: 0.9rem; display: flex; align-items: center; gap: 8px;
}
.error-alert { background-color: #fef2f2; border: 1px solid #fecaca; color: #ef4444; }
.success-alert { background-color: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
