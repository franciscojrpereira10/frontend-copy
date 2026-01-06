<template>
  <div class="login-page">
    <div class="login-card">
      <div class="card-header">
        <div class="icon-wrapper">
          🔐
        </div>
        <h1>Nova Password</h1>
        <p>Define a tua nova palavra-passe</p>
      </div>

      <form @submit.prevent="handleReset" class="login-form">
        <div class="form-group">
          <label for="password">Nova Palavra-passe</label>
          <div class="input-wrapper">
            <input 
              id="password"
              v-model="password" 
              type="password" 
              required 
              placeholder="••••••••"
              class="form-input" 
              :disabled="loading"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirmar Palavra-passe</label>
          <div class="input-wrapper">
            <input 
              id="confirmPassword"
              v-model="confirmPassword" 
              type="password" 
              required 
              placeholder="••••••••"
              class="form-input" 
              :disabled="loading"
            />
          </div>
        </div>

        <button type="submit" :disabled="loading" class="submit-btn">
          <span v-if="loading" class="spinner"></span>
          <span v-else>Alterar Password</span>
        </button>
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
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth-store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const password = ref('')
const confirmPassword = ref('')
const message = ref('')
const isError = ref(false)
const loading = ref(false)
const token = ref('')

onMounted(() => {
  token.value = route.query.token
  if (!token.value) {
    isError.value = true
    message.value = 'Token inválido ou em falta.'
  }
})

async function handleReset() {
  if (password.value !== confirmPassword.value) {
    isError.value = true
    message.value = 'As passwords não coincidem.'
    return
  }

  if (!token.value) {
    isError.value = true
    message.value = 'Token inválido.'
    return
  }

  loading.value = true
  message.value = ''
  isError.value = false

  try {
    await authStore.resetPassword(token.value, password.value)
    message.value = 'Password alterada com sucesso! A redirecionar...'
    isError.value = false
    
    setTimeout(() => {
      router.push('/login')
    }, 2000)

  } catch (err) {
    isError.value = true
    const msg = err.response?._data || err.response?.data
    message.value = (typeof msg === 'string') ? msg : 'Erro ao alterar password. O token pode ter expirado.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Reutilizando estilos do login.vue */
.login-page {
  display: flex; align-items: center; justify-content: center;
  height: calc(100vh - 140px); width: 100%; overflow: hidden;
}
.login-card {
  background: white; width: 100%; max-width: 420px; padding: 40px;
  border-radius: 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(226, 232, 240, 0.8); margin-bottom: 25vh;
  animation: slideUp 0.6s ease-out;
}
@keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
.card-header { text-align: center; margin-bottom: 32px; }
.card-header h1 { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0 0 8px; }
.card-header p { color: #64748b; font-size: 0.95rem; margin: 0; }
.icon-wrapper {
  background: #eff6ff; width: 60px; height: 60px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 2rem;
  margin: 0 auto 16px; border: 1px solid #dbeafe;
}
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
