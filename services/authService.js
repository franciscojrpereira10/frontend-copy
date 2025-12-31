import axios from 'axios'

export async function loginUser(email, password) {
  const resp = await axios.post('/api/auth/login', { email, password })
  localStorage.setItem('jwt', resp.data.token)
}

axios.interceptors.request.use(config => {
  const token = localStorage.getItem('jwt')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})