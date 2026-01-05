<script setup>
import { useAuthStore } from '~/stores/auth-store'

const router = useRouter()
const config = useRuntimeConfig()
const authStore = useAuthStore()

const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)
const error = ref('')

async function handleSignup() {
  if (form.value.password !== form.value.confirmPassword) {
    error.value = 'As passwords não coincidem.'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await $fetch(`${config.public.apiBase}/auth/signup`, {
      method: 'POST',
      body: {
        username: form.value.username,
        email: form.value.email,
        password: form.value.password
      }
    })

    // Sucesso - redireciona para login 
    // ou faz login automático se o backend devolvesse token
    router.push('/login?registered=true')
    
  } catch (e) {
    console.error(e)
    if (e.response && e.response.status === 409) {
      error.value = 'Este username já está em uso.'
    } else {
      error.value = 'Erro ao criar conta. Tenta novamente.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="signup-page">
    <div class="signup-card">
      <div class="header">
        <h1>Criar Conta</h1>
        <p>Junta-te à comunidade Academics</p>
      </div>

      <form @submit.prevent="handleSignup" class="signup-form">
        <div class="form-group">
          <label>Username</label>
          <input 
            v-model="form.username" 
            type="text" 
            required 
            placeholder="Escolhe um nome de utilizador"
          />
        </div>

        <div class="form-group">
          <label>Email</label>
          <input 
            v-model="form.email" 
            type="email" 
            required 
            placeholder="O teu email académico"
          />
        </div>

        <div class="form-group">
          <label>Password</label>
          <input 
            v-model="form.password" 
            type="password" 
            required 
            placeholder="Define uma password segura"
          />
        </div>

        <div class="form-group">
          <label>Confirmar Password</label>
          <input 
            v-model="form.confirmPassword" 
            type="password" 
            required 
            placeholder="Repete a password"
          />
        </div>

        <div v-if="error" class="error-msg">
          {{ error }}
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          <span v-if="loading">A criar conta...</span>
          <span v-else>Registar</span>
        </button>

        <div class="footer-links">
          Já tens conta? <NuxtLink to="/login">Entrar</NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.signup-page {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.signup-card {
  background: white;
  width: 100%;
  max-width: 450px;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
  border: 1px solid #e2e8f0;
}

.header { text-align: center; margin-bottom: 30px; }
.header h1 { font-size: 1.8rem; color: #0f172a; margin: 0 0 8px 0; font-weight: 800; }
.header p { color: #64748b; margin: 0; }

.signup-form { display: flex; flex-direction: column; gap: 20px; }

.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-group label { font-size: 0.9rem; font-weight: 600; color: #334155; }
.form-group input {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  font-size: 1rem;
  transition: all 0.2s;
}
.form-group input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.error-msg {
  background: #fef2f2; color: #ef4444; padding: 12px;
  border-radius: 8px; font-size: 0.9rem; text-align: center;
}

.submit-btn {
  background: #4f46e5; color: white;
  padding: 14px; border-radius: 8px;
  border: none; font-weight: 600; font-size: 1rem;
  cursor: pointer; transition: background 0.2s;
  margin-top: 10px;
}
.submit-btn:hover { background: #4338ca; }
.submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

.footer-links { text-align: center; font-size: 0.95rem; color: #64748b; margin-top: 10px; }
.footer-links a { color: #4f46e5; font-weight: 600; text-decoration: none; }
.footer-links a:hover { text-decoration: underline; }
</style>
