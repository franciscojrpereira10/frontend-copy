<template>
  <div class="home-wrapper">
    
    <section class="hero-section">
      <div class="hero-content">
        <div class="badge">Centro de Investigação e Desenvolvimento XYZ</div>
        
        <h1 class="hero-title">
          Gestão de Publicações <br />
          <span class="highlight">Científicas & Académicas</span>
        </h1>
        
        <p class="hero-description">
          Bem-vindo à plataforma oficial do Centro XYZ.
          Acede ao repositório de artigos, teses e relatórios técnicos nas áreas de 
          Ciência de Dados, Ciência dos Materiais e muito mais.
        </p>

        <div class="hero-actions">
          <template v-if="!authStore.isAuthenticated">
            <NuxtLink to="/login" class="btn btn-primary">
              <span class="icon">🔐</span> Aceder à Plataforma
            </NuxtLink>
            
            <NuxtLink to="/publications" class="btn btn-secondary">
              Consultar Acervo Público
            </NuxtLink>
          </template>

          <template v-else>
            <NuxtLink to="/publications" class="btn btn-primary">
              <span class="icon">📚</span> Explorar Publicações
            </NuxtLink>
            
            <NuxtLink to="/publications/create" class="btn btn-secondary">
              <span class="icon">+</span> Submeter Artigo
            </NuxtLink>
          </template>
        </div>
      </div>

      <div class="hero-visual">
        <div class="visual-card card-1">
          <div class="card-icon">📊</div>
          <div class="card-info">
            <strong>Ciência de Dados</strong>
            <span>Datasets e Modelos IA</span>
          </div>
        </div>

        <div class="visual-card card-2">
          <div class="card-icon">🧪</div>
          <div class="card-info">
            <strong>Ciência dos Materiais</strong>
            <span>Patentes e Relatórios</span>
          </div>
        </div>
      </div>
    </section>

    <section class="features-section">
      <div class="feature-card">
        <div class="feature-icon">🔍</div>
        <h3>Pesquisa Avançada</h3>
        <p>Encontra artigos por título, autor, data, área científica ou tags associadas.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">⭐</div>
        <h3>Revisão e Rating</h3>
        <p>Classifica as publicações, deixa comentários e participa na discussão científica.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">📂</div>
        <h3>Repositório Digital</h3>
        <p>Faz upload e download de documentos (PDF, ZIP) de forma segura e centralizada.</p>
      </div>
    </section>

  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth-store'

const authStore = useAuthStore()

useHead({
  title: 'Início | Centro de Investigação XYZ'
})
</script>

<style scoped>
.home-wrapper {
  max-width: 1200px; margin: 0 auto; padding: 0 24px;
  animation: fadeIn 0.8s ease-out;
}

.hero-section {
  display: flex; align-items: flex-start; /* Alinha tudo ao topo */
  justify-content: space-between;
  padding: 40px 0 60px; /* Padding de topo reduzido */
  gap: 40px; min-height: 50vh;
}

.hero-content { max-width: 600px; padding-top: 20px; }

.badge {
  display: inline-block; background-color: #eff6ff; color: #2563eb;
  font-weight: 600; font-size: 0.85rem; padding: 6px 12px;
  border-radius: 20px; margin-bottom: 24px; border: 1px solid #dbeafe;
}

.hero-title {
  font-size: 3.2rem; line-height: 1.1; color: #0f172a;
  margin: 0 0 24px; font-weight: 800; letter-spacing: -1px;
}
.highlight {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.hero-description {
  font-size: 1.1rem; color: #64748b; line-height: 1.6;
  margin-bottom: 40px; max-width: 540px;
}
.hero-actions { display: flex; gap: 16px; flex-wrap: wrap; }

.btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 14px 28px; border-radius: 12px; font-weight: 600; font-size: 1rem;
  text-decoration: none; transition: all 0.2s ease; cursor: pointer;
}
.btn-primary {
  background-color: #2563eb; color: white; border: 1px solid transparent;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
}
.btn-primary:hover {
  background-color: #1d4ed8; transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
}
.btn-secondary {
  background-color: white; color: #334155; border: 1px solid #cbd5e1;
}
.btn-secondary:hover {
  background-color: #f8fafc; border-color: #94a3b8; color: #0f172a;
  transform: translateY(-2px);
}
.icon { margin-right: 8px; }

.hero-visual {
  position: relative; width: 450px; height: 400px;
  display: flex; align-items: center; justify-content: center;
}
.hero-visual::before {
  content: ''; position: absolute; width: 350px; height: 350px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 50%; z-index: -1; opacity: 0.6;
}
.visual-card {
  position: absolute; background: white; padding: 20px;
  border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
  border: 1px solid rgba(255, 255, 255, 0.8);
  display: flex; align-items: center; gap: 16px; width: 240px;
  transition: transform 0.3s ease; animation: float 6s ease-in-out infinite;
}
.card-1 { top: 60px; left: 0; z-index: 2; }
.card-2 { bottom: 80px; right: 20px; z-index: 1; animation-delay: 3s; }

.card-icon {
  font-size: 2rem; background: #f1f5f9; width: 50px; height: 50px;
  display: flex; align-items: center; justify-content: center; border-radius: 12px;
}
.card-info strong { display: block; color: #0f172a; font-size: 1rem; }
.card-info span { color: #64748b; font-size: 0.85rem; }

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
  100% { transform: translateY(0px); }
}

.features-section {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px; padding: 60px 0 100px; border-top: 1px solid #e2e8f0;
}
.feature-card {
  background: white; padding: 30px; border-radius: 16px; border: 1px solid #f1f5f9;
  transition: all 0.2s ease;
}
.feature-card:hover {
  border-color: #e2e8f0; box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05);
  transform: translateY(-5px);
}
.feature-icon {
  font-size: 2rem; margin-bottom: 20px; background: #eff6ff; width: 60px; height: 60px;
  display: flex; align-items: center; justify-content: center; border-radius: 50%; color: #2563eb;
}
.feature-card h3 { margin: 0 0 12px; color: #0f172a; font-size: 1.25rem; }
.feature-card p { color: #64748b; line-height: 1.5; margin: 0; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

@media (max-width: 960px) {
  .hero-section { flex-direction: column; text-align: center; padding-top: 40px; }
  .hero-actions { justify-content: center; }
  .hero-description { margin-left: auto; margin-right: auto; }
  .hero-visual { width: 100%; height: 350px; margin-top: 40px; }
  .visual-card { position: relative; top: auto !important; left: auto !important; right: auto !important; bottom: auto !important; margin: 10px auto; }
}
</style>