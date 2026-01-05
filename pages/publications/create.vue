<template>
  <div class="create-page">
    <div class="create-card">
      
      <div class="card-header">
        <h1>Nova Publicação</h1>
        <p>Partilha o teu conhecimento com a comunidade</p>
      </div>

      <form @submit.prevent="handleSubmit" class="create-form">
        
        <div class="form-section">
          <h3>Informação Base</h3>
          
          <div class="form-group">
            <label for="title">Título da Publicação *</label>
            <input 
              id="title" v-model="form.title" type="text" required 
              placeholder="Ex: Análise de Dados em Estruturas Metálicas"
              class="form-input"
            />
          </div>

          <div class="form-row">
            <div class="form-group half">
              <label for="area">Área Científica *</label>
              <select id="area" v-model="form.scientificArea" required class="form-input">
                <option value="" disabled>Seleciona uma área</option>
                <option value="Ciência de Dados">Ciência de Dados</option>
                <option value="Ciência dos Materiais">Ciência dos Materiais</option>
                <option value="Engenharia de Software">Engenharia de Software</option>
                <option value="Inteligência Artificial">Inteligência Artificial</option>
                <option value="Outra">Outra</option>
              </select>
            </div>

            <div class="form-group half">
              <label for="authors">Autores *</label>
              <input 
                id="authors" v-model="form.authors" type="text" required 
                placeholder="Ex: João Silva, Maria Santos"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="summary">Resumo *</label>
            <textarea 
              id="summary" v-model="form.summary" rows="4" required
              placeholder="Descreve brevemente o conteúdo do documento..."
              class="form-input"
            ></textarea>
          </div>
        </div>

        <hr class="divider" />

        <div class="form-section">
          <h3>Ficheiro do Artigo</h3>
          <p class="section-desc">Formatos aceites: PDF ou ZIP (Máx. 50MB)</p>

          <div 
            class="file-dropzone" 
            :class="{ 'dragging': isDragging, 'has-file': file }"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
            @click="triggerFileInput"
          >
            <input 
              type="file" ref="fileInput" 
              accept=".pdf,.zip" 
              class="hidden-input"
              @change="handleFileSelect"
            />
            
            <div v-if="!file" class="upload-placeholder">
              <span class="upload-icon">☁️</span>
              <span>Arrasta o ficheiro para aqui ou <span class="link-text">clica para procurar</span></span>
            </div>

            <div v-else class="file-preview">
              <span class="file-icon">📄</span>
              <div class="file-info">
                <span class="file-name">{{ file.name }}</span>
                <span class="file-size">{{ formatSize(file.size) }}</span>
              </div>
              <button @click.stop="removeFile" class="remove-btn" title="Remover ficheiro">✕</button>
            </div>
          </div>
        </div>

        <hr class="divider" />

        <div class="form-section">
          <h3>Tags</h3>
          <div class="form-group">
            <label for="tags">Tags (separadas por vírgula)</label>
            <input 
              id="tags" v-model="tagsInput" type="text" 
              placeholder="Ex: machine-learning, tese, 2024"
              class="form-input"
            />
          </div>
        </div>

        <div class="form-actions">
          <NuxtLink to="/publications" class="cancel-btn">Cancelar</NuxtLink>
          <button type="submit" :disabled="loading || !file" class="submit-btn">
            <span v-if="loading" class="spinner"></span>
            <span v-else>{{ loading ? 'A enviar...' : 'Publicar Artigo' }}</span>
          </button>
        </div>

        <div v-if="error" class="alert error-alert">
          ⚠️ {{ error }}
        </div>
      </form>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth-store'

const router = useRouter()
const authStore = useAuthStore()
const config = useRuntimeConfig()

// Estado do Formulário
const form = ref({
  title: '',
  scientificArea: '', // Aqui fica o valor em PT selecionado
  authors: '',
  summary: ''
})
const tagsInput = ref('')
const file = ref(null)

// Estados de UI
const loading = ref(false)
const error = ref('')
const isDragging = ref(false)
const fileInput = ref(null)

// --- MAPEAMENTO (PT -> EN) ---
// Traduz para Inglês antes de enviar ao Backend
const areaMapping = {
  'Ciência de Dados': 'Data Science',
  'Ciência dos Materiais': 'Materials Science',
  'Engenharia de Software': 'Software Engineering',
  'Inteligência Artificial': 'Artificial Intelligence'
}

// --- Gestão de Ficheiros ---
function triggerFileInput() {
  fileInput.value.click()
}

function handleFileSelect(event) {
  const selected = event.target.files[0]
  validateAndSetFile(selected)
}

function handleDrop(event) {
  isDragging.value = false
  const dropped = event.dataTransfer.files[0]
  validateAndSetFile(dropped)
}

function validateAndSetFile(selectedFile) {
  if (!selectedFile) return
  
  const ext = selectedFile.name.split('.').pop().toLowerCase()
  if (!['pdf', 'zip'].includes(ext)) {
    error.value = 'Apenas ficheiros .pdf ou .zip são permitidos.'
    return
  }
  
  error.value = ''
  file.value = selectedFile
}

function removeFile() {
  file.value = null
  fileInput.value.value = '' 
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// --- Envio do Formulário ---
async function handleSubmit() {
  if (!file.value) {
    error.value = 'Por favor seleciona um ficheiro.'
    return
  }

  loading.value = true
  error.value = ''

  try {
    // 1. TRADUÇÃO: Converte "Ciência de Dados" para "Data Science"
    const areaToSend = areaMapping[form.value.scientificArea] || form.value.scientificArea

    // 2. Criar FormData
    const formData = new FormData()
    formData.append('title', form.value.title)
    
    // ATENÇÃO: Envia a versão traduzida (Inglês)
    formData.append('scientificArea', areaToSend) 
    
    formData.append('authors', form.value.authors)
    formData.append('summary', form.value.summary)
    formData.append('filename', file.value.name) 
    formData.append('file', file.value) 
    
    if (tagsInput.value) {
       formData.append('tags', tagsInput.value)
    }

    // 3. Enviar para o backend
    await $fetch(`${config.public.apiBase}/publications/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    })

    // Redireciona para a lista
    router.push('/publications')

  } catch (err) {
    console.error(err)
    const msg = err.data || err.message || 'Ocorreu um erro ao enviar.'
    error.value = msg
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.create-page {
  display: flex;
  justify-content: center;
  padding: 40px 20px;
}

.create-card {
  background: white;
  width: 100%;
  max-width: 800px;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

.card-header { margin-bottom: 30px; text-align: center; }
.card-header h1 { font-size: 1.8rem; color: #0f172a; margin: 0 0 8px; }
.card-header p { color: #64748b; margin: 0; }

.create-form { display: flex; flex-direction: column; gap: 24px; }

.form-section h3 { font-size: 1.1rem; color: #334155; margin-bottom: 16px; border-left: 4px solid #3b82f6; padding-left: 10px; }
.section-desc { font-size: 0.85rem; color: #64748b; margin-top: -10px; margin-bottom: 16px; }

.form-row { display: flex; gap: 20px; }
.half { flex: 1; }

.form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
label { font-weight: 600; font-size: 0.9rem; color: #1e293b; }

.form-input {
  padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem;
  transition: all 0.2s; background: #f8fafc;
}
.form-input:focus { outline: none; border-color: #3b82f6; background: white; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
textarea.form-input { resize: vertical; min-height: 100px; }

/* Dropzone */
.file-dropzone {
  border: 2px dashed #cbd5e1; border-radius: 12px; padding: 40px 20px;
  text-align: center; cursor: pointer; transition: all 0.2s; background: #f8fafc;
}
.file-dropzone:hover, .file-dropzone.dragging { border-color: #3b82f6; background: #eff6ff; }
.file-dropzone.has-file { border-style: solid; border-color: #3b82f6; background: #f0f9ff; }

.hidden-input { display: none; }
.upload-icon { font-size: 2rem; display: block; margin-bottom: 10px; }
.link-text { color: #2563eb; font-weight: 600; text-decoration: underline; }

.file-preview { display: flex; align-items: center; justify-content: center; gap: 15px; }
.file-icon { font-size: 1.5rem; }
.file-info { display: flex; flex-direction: column; text-align: left; }
.file-name { font-weight: 600; color: #0f172a; }
.file-size { font-size: 0.8rem; color: #64748b; }
.remove-btn { background: none; border: none; color: #ef4444; font-size: 1.2rem; cursor: pointer; padding: 5px; }
.remove-btn:hover { color: #b91c1c; }

.divider { border: 0; border-top: 1px solid #e2e8f0; margin: 10px 0; }

.form-actions { display: flex; justify-content: flex-end; gap: 16px; margin-top: 10px; }
.cancel-btn { padding: 12px 24px; color: #64748b; text-decoration: none; font-weight: 600; display: flex; align-items: center; }
.cancel-btn:hover { color: #0f172a; }

.submit-btn {
  padding: 12px 32px; background-color: #2563eb; color: white; border: none; border-radius: 8px;
  font-weight: 600; cursor: pointer; transition: background 0.2s; display: flex; align-items: center;
}
.submit-btn:hover { background-color: #1d4ed8; }
.submit-btn:disabled { background-color: #94a3b8; cursor: not-allowed; }

.spinner {
  width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-radius: 50%;
  border-top-color: white; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.alert { padding: 12px; border-radius: 8px; margin-top: 20px; font-size: 0.9rem; }
.error-alert { background: #fef2f2; color: #ef4444; border: 1px solid #fecaca; }

/* Responsividade */
@media (max-width: 600px) {
  .form-row { flex-direction: column; gap: 16px; }
}
</style>