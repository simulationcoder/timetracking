const API_BASE = import.meta.env.VITE_API_URL || '/api'

export async function apiFetch(path, options = {}) {
  const { headers, body, ...rest } = options
  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {})
    },
    ...rest,
  }

  if (body !== undefined) {
    config.body = typeof body === 'string' ? body : JSON.stringify(body)
  }

  const response = await fetch(`${API_BASE}${path}`, config)

  let data = null
  const text = await response.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!response.ok) {
    const error = new Error(
      (data && (data.detail || data.message)) || response.statusText
    )
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}
