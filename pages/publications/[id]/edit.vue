<template>
  <div class="edit-page">
    <div class="edit-card">
      <div class="card-header">
        <h1>Editar Publicação</h1>
        <p>Atualiza as informações do teu artigo</p>
      </div>

      <div v-if="loadingData" class="loading-state">
        <div class="spinner"></div>
        <p>A carregar dados...</p>
      </div>

      <form v-else @submit.prevent="handleUpdate" class="edit-form">
        
        <div class="form-section">
          <h3>Informação Base</h3>
          
          <div class="form-group">
            <label for="title">Título da Publicação *</label>
            <input 
              id="title" v-model="form.title" type="text" required 
              class="form-input"
            />
          </div>

          <div class="form-row">
            <div class="form-group half">
              <label for="area">Área Científica *</label>
              <select id="area" v-model="form.scientificArea" required class="form-input">
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
                class="form-input"
              />
            </div>
          </div>

      <div class="form-group">
            <div class="label-row">
              <label for="summary">Resumo *</label>
              <button type="button" @click="generateSummary" class="ai-btn" :disabled="generatingAI" title="Gerar resumo a partir do ficheiro atual">
                <span v-if="generatingAI">⏳ A gerar...</span>
                <span v-else>✨ Gerar com IA</span>
              </button>
            </div>
            <textarea 
              id="summary" v-model="form.summary" rows="6" required
              class="form-input"
            ></textarea>
          </div>
        </div>
<!-- ... -->


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

        <hr class="divider" />

        <div class="form-section">
          <h3>Ficheiro do Artigo</h3>
          <p class="section-desc">Formatos aceites: PDF ou ZIP (Máx. 50MB) - Substituirá o atual</p>

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

        <div class="form-actions">
          <NuxtLink :to="`/publications/${route.params.id}`" class="cancel-btn">Cancelar</NuxtLink>
          <button type="submit" :disabled="submitting" class="submit-btn">
            <span v-if="submitting" class="spinner-sm"></span>
            <span v-else>Guardar Alterações</span>
          </button>
        </div>

        <div v-if="error" class="alert error-alert">
          Made a mistake? {{ error }}
        </div>
      </form>
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
const config = useRuntimeConfig()
const api = config.public.apiBase

const loadingData = ref(true)
const submitting = ref(false)
const error = ref('')
const isDragging = ref(false)
const fileInput = ref(null)
const file = ref(null)

const form = ref({
  title: '',
  scientificArea: '',
  authors: '',
  summary: ''
})
const tagsInput = ref('')

// Mapeamento Inverso (EN -> PT)
const areaMappingReverse = {
  'Data Science': 'Ciência de Dados',
  'Materials Science': 'Ciência dos Materiais',
  'Software Engineering': 'Engenharia de Software',
  'Artificial Intelligence': 'Inteligência Artificial'
}

// Mapeamento (PT -> EN)
const areaMapping = {
  'Ciência de Dados': 'Data Science',
  'Ciência dos Materiais': 'Materials Science',
  'Engenharia de Software': 'Software Engineering',
  'Inteligência Artificial': 'Artificial Intelligence'
}

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  await loadPublication()
})

async function loadPublication() {
  try {
    const pub = await $fetch(`${api}/publications/${route.params.id}`)
    
    // Verificar permissões
    const isOwner = pub.uploadedBy === authStore.user?.username || pub.uploadedByName === authStore.user?.username
    const isAdminOrManager = ['ADMIN', 'MANAGER'].includes(authStore.userRole)
    
    if (!isOwner && !isAdminOrManager) {
      alert('Não tens permissão para editar esta publicação.')
      router.push(`/publications/${route.params.id}`)
      return
    }

    form.value.title = pub.title
    form.value.authors = pub.authors
    form.value.summary = pub.summary
    form.value.scientificArea = areaMappingReverse[pub.scientificArea] || pub.scientificArea

    // Carregar tags
    if (pub.tags && pub.tags.length) {
      tagsInput.value = pub.tags.map(t => t.name).join(', ')
    }

  } catch (e) {
    console.error(e)
    error.value = 'Erro ao carregar publicação.'
  } finally {
    loadingData.value = false
  }
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
  if (fileInput.value) fileInput.value.value = '' 
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const generatingAI = ref(false)

// ...

// --- AI Summary Generation ---
async function generateSummary() {
  generatingAI.value = true
  error.value = ''

  try {
    const response = await $fetch(`${api}/publications/${route.params.id}/generate-summary`, {
      method: 'POST',
      body: {
        language: 'pt',
        maxLength: 500
      },
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    })

    if (response.summary) {
      form.value.summary = response.summary
    }

  } catch (err) {
    console.error(err)
    error.value = 'Erro ao gerar resumo IA. Verifica se o backend está ligado.'
  } finally {
    generatingAI.value = false
  }
}

async function handleUpdate() {
  submitting.value = true
  error.value = ''

  try {
     const areaToSend = areaMapping[form.value.scientificArea] || form.value.scientificArea
     const token = authStore.token

     // Preparar tags
     const tagsList = tagsInput.value
       .split(',')
       .map(t => t.trim())
       .filter(t => t.length > 0)
       .map(name => ({ name }))

     // 1. Atualizar Metadados
     await $fetch(`${api}/publications/${route.params.id}`, {
       method: 'PUT',
       headers: { Authorization: `Bearer ${token}` },
       body: {
         title: form.value.title,
         authors: form.value.authors,
         summary: form.value.summary,
         scientificArea: areaToSend,
         tags: tagsList
       }
     })

     // 2. Substituir Ficheiro (se selecionado)
     if (file.value) {
        const formData = new FormData()
        formData.append('file', file.value)
        
        await $fetch(`${api}/publications/${route.params.id}/file`, {
          method: 'POST',
          body: formData,
          headers: { Authorization: `Bearer ${token}` }
        })
     }

     router.push(`/publications/${route.params.id}`)

  } catch (e) {
    console.error(e)
    error.value = 'Erro ao atualizar publicação.'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.edit-page { display: flex; justify-content: center; padding: 40px 20px; }
.edit-card { background: white; width: 100%; max-width: 800px; padding: 40px; border-radius: 16px; border: 1px solid #e2e8f0; }

.card-header { margin-bottom: 30px; text-align: center; }
.card-header h1 { font-size: 1.8rem; color: #0f172a; margin: 0 0 8px; }
.card-header p { color: #64748b; margin: 0; }

.edit-form { display: flex; flex-direction: column; gap: 24px; }
.form-section h3 { font-size: 1.1rem; color: #334155; margin-bottom: 16px; border-left: 4px solid #3b82f6; padding-left: 10px; }
.section-desc { font-size: 0.85rem; color: #64748b; margin-top: -10px; margin-bottom: 16px; }

.form-row { display: flex; gap: 20px; }
.half { flex: 1; }
.form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
label { font-weight: 600; font-size: 0.9rem; color: #1e293b; }

.form-input { padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; background: #f8fafc; }
.form-input:focus { outline: none; border-color: #3b82f6; background: white; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
textarea.form-input { resize: vertical; min-height: 150px; }

.label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.ai-btn {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white; border: none; padding: 4px 12px; border-radius: 20px;
  font-size: 0.75rem; font-weight: 600; cursor: pointer;
  transition: transform 0.2s, opacity 0.2s;
}
.ai-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 2px 5px rgba(99, 102, 241, 0.3); }
.ai-btn:disabled { opacity: 0.6; cursor: not-allowed; filter: grayscale(0.5); }

/* Dropzone Styles (Matched to Create) */
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

.submit-btn { padding: 12px 32px; background-color: #2563eb; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.submit-btn:hover { background-color: #1d4ed8; }
.submit-btn:disabled { background-color: #94a3b8; cursor: not-allowed; }

.loading-state, .error-alert { text-align: center; padding: 40px; color: #64748b; }
.spinner { border: 3px solid #e2e8f0; border-top: 3px solid #4f46e5; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 16px; }
.spinner-sm { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }

.alert { padding: 12px; border-radius: 8px; margin-top: 20px; font-size: 0.9rem; }
.error-alert { background: #fef2f2; color: #ef4444; border: 1px solid #fecaca; }
</style>
