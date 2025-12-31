import axios from 'axios'

export async function getPublications() {
  const resp = await axios.get('/api/publications')
  return resp.data
}
