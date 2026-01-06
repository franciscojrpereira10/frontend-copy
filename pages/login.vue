<template>
  <div class="login-page">
    <div class="login-card">
      
      <div class="card-header">
        <div class="icon-wrapper">
          🎓
        </div>
        <h1>Bem-vindo</h1>
        <p>Acede à tua conta do Centro XYZ</p>
      </div>

      <div v-if="view === 'login'">
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="username">Nome de Utilizador</label>
            <div class="input-wrapper">
              <input 
                id="username"
                v-model="username" 
                type="text" 
                required 
                placeholder="Ex: admin"
                class="form-input" 
                :disabled="loading"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="password">Palavra-passe</label>
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

            <div class="forgot-password">
              <a href="#" @click.prevent="view = 'recover'">Esqueceste-te da password?</a>
            </div>
          </div>

          <button type="submit" :disabled="loading" class="submit-btn">
            <span v-if="loading" class="spinner"></span>
            <span v-else>Entrar na Plataforma</span>
          </button>
        </form>
      </div>

      <div v-else-if="view === 'recover'">
        <div class="recover-header">
           <p>Insere o teu email para recuperar a password.</p>
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
            <span v-else>Enviar Email</span>
          </button>

          <div class="back-link">
             <a href="#" @click.prevent="view = 'login'">Voltar ao Login</a>
          </div>
        </form>
      </div>

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
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth-store'

const view = ref('login') // 'login' | 'recover'

// Login Data
const username = ref('')
const password = ref('')

// Recover Data
const email = ref('')

// Shared Data
const message = ref('') // Usado para erros de login e sucesso de recover
const isError = ref(false)
const loading = ref(false)

const router = useRouter()
const authStore = useAuthStore()

async function handleLogin() {
  loading.value = true
  message.value = ''
  isError.value = true // Login msg são erros por defeito
  
  try {
    await authStore.login(username.value, password.value)
    router.push('/') 
  } catch (err) {
    if (err.response && err.response.status === 409) {
        message.value = '⚠️ Esta conta já tem uma sessão ativa noutro dispositivo.'
        return
    }
    const msg = err.response?._data || err.response?.data
    if (msg) {
        message.value = (typeof msg === 'string') ? msg : (msg.message || JSON.stringify(msg))
    } else {
        message.value = 'Credenciais inválidas ou erro de servidor.'
    }
  } finally {
    loading.value = false
  }
}

async function handleRecover() {
  loading.value = true
  message.value = ''
  isError.value = false
  
  try {
    await authStore.recoverPassword(email.value)
    message.value = 'Email enviado! Verifica o teu email.'
    isError.value = false
    email.value = ''
  } catch (err) {
    isError.value = true
    const msg = err.response?._data || err.response?.data
    if (msg) {
        if (typeof msg === 'string') {
            message.value = msg
        } else if (msg.message) {
            message.value = msg.message
        } else {
            message.value = JSON.stringify(msg)
        }
    } else {
        message.value = 'Erro ao enviar email.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Contentor da Página - Sem Scroll e Formulário para Cima */
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  /* Altura exata para evitar scroll */
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
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
  border: 1px solid rgba(226, 232, 240, 0.8);
  
  /* Margem Inferior Grande para "empurrar" o cartão para a metade superior */
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
.card-header h1 {
  font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0 0 8px; letter-spacing: -0.5px;
}
.card-header p { color: #64748b; font-size: 0.95rem; margin: 0; }

.form-group { margin-bottom: 24px; }
label {
  display: block; font-size: 0.9rem; font-weight: 600; color: #334155; margin-bottom: 8px;
}
.form-input {
  width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid #cbd5e1;
  font-size: 1rem; color: #1e293b; transition: all 0.2s; background-color: #f8fafc;
  outline: none; box-sizing: border-box;
}
.form-input:focus {
  background-color: white; border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}
.form-input::placeholder { color: #94a3b8; }

.submit-btn {
  width: 100%; padding: 14px; background-color: #2563eb; color: white; border: none;
  border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
  display: flex; justify-content: center; align-items: center; margin-top: 8px;
}
.submit-btn:hover {
  background-color: #1d4ed8; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}
.submit-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

.spinner {
  width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3);
  border-radius: 50%; border-top-color: white; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.error-alert { background-color: #fef2f2; border: 1px solid #fecaca; color: #ef4444; }
.success-alert { background-color: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a; }

.alert {
  margin-top: 24px; padding: 12px 16px; border-radius: 12px;
  font-size: 0.9rem; display: flex; align-items: center; gap: 8px;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.forgot-password {
  text-align: right; margin-top: 8px;
}
.forgot-password a, .back-link a {
  font-size: 0.85rem; color: #2563eb; text-decoration: none; font-weight: 500;
}
.forgot-password a:hover, .back-link a:hover {
  text-decoration: underline; color: #1d4ed8;
}

.back-link { text-align: center; margin-top: 20px; }
.recover-header { text-align: center; margin-bottom: 20px; color: #64748b; font-size: 0.95rem; }
</style>