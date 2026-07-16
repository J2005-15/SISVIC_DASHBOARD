import axios from 'axios'

// ─── CONFIGURACIÓN BASE DE API ──────────────────────────────────────────────

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// ─── INTERCEPTOR: INYECTAR TOKEN JWT EN HEADER ──────────────────────────────

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── INTERCEPTOR: MANEJO DE RESPUESTAS Y ERRORES ─────────────────────────────

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Cuando el body es FormData (subida de archivos), hay que anular el
// Content-Type fijo de la instancia para que el navegador agregue el
// boundary multipart automáticamente — si se deja 'application/json',
// el backend no puede parsear el archivo.
const formDataConfig = (data) =>
  data instanceof FormData ? { headers: { 'Content-Type': undefined } } : undefined

// ─── MÉTODOS DE AUTENTICACIÓN ──────────────────────────────────────────────

export const authService = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
  }
}

// ─── MÉTODOS DE CENSO ANIMAL ───────────────────────────────────────────────

export const censoService = {
  // params admite { page, limit, search } para paginación/filtro en servidor.
  // Sin params, el backend aplica sus valores por defecto (page=1, limit=10).
  getAll: (params = {}) =>
    api.get('/animal-census', { params }),

  getById: (id) =>
    api.get(`/animal-census/${id}`),

  // Si data es un FormData (incluye foto del paciente), se quita el
  // Content-Type por defecto ('application/json') para que el navegador
  // calcule el boundary multipart correcto al enviarlo.
  create: (data) =>
    api.post('/animal-census', data, formDataConfig(data)),

  update: (id, data) =>
    api.put(`/animal-census/${id}`, data, formDataConfig(data)),

  delete: (id) =>
    api.delete(`/animal-census/${id}`)
}

// ─── MÉTODOS DE PROPIETARIOS ───────────────────────────────────────────────

export const propietariosService = {
  // params admite { page, limit, search }
  getAll: (params = {}) =>
    api.get('/owners', { params }),

  getById: (id) =>
    api.get(`/owners/${id}`),

  create: (data) =>
    api.post('/owners', data),

  update: (id, data) =>
    api.put(`/owners/${id}`, data),

  delete: (id) =>
    api.delete(`/owners/${id}`)
}

// ─── MÉTODOS DE CONSULTAS MÉDICAS ──────────────────────────────────────────

export const consultasService = {
  // params admite { page, limit, search, motivo }
  getAll: (params = {}) =>
    api.get('/medical-records', { params }),

  // Totales globales (no del array paginado) para las tarjetas de conteo
  getStats: () =>
    api.get('/medical-records/stats'),

  getById: (id) =>
    api.get(`/medical-records/${id}`),

  create: (data) =>
    api.post('/medical-records', data),

  update: (id, data) =>
    api.put(`/medical-records/${id}`, data),

  delete: (id) =>
    api.delete(`/medical-records/${id}`)
}

// ─── MÉTODOS DE LOGÍSTICA E INVENTARIO ─────────────────────────────────────

export const inventarioService = {
  // params admite { page, limit, search, estado }
  getAll: (params = {}) =>
    api.get('/supply-stock', { params }),

  // Totales globales (no del array paginado) para las tarjetas de conteo
  getStats: () =>
    api.get('/supply-stock/stats'),

  getById: (id) =>
    api.get(`/supply-stock/${id}`),

  create: (data) =>
    api.post('/supply-stock', data),

  update: (id, data) =>
    api.put(`/supply-stock/${id}`, data),

  delete: (id) =>
    api.delete(`/supply-stock/${id}`),

  ajustarStock: (id, current_quantity, adjustment_reason) =>
    api.patch(`/supply-stock/${id}`, { current_quantity, adjustment_reason }),

  getHistorial: (id) =>
    api.get(`/supply-stock/history/${id}`)
}

// ─── MÉTODOS DE GESTIÓN DE USUARIOS ─────────────────────────────────────────

export const usersService = {
  // params admite { page, limit, search }
  getAll: (params = {}) =>
    api.get('/users', { params }),

  getById: (id) =>
    api.get(`/users/${id}`),

  create: (data) =>
    api.post('/users', data),

  update: (id, data) =>
    api.put(`/users/${id}`, data),

  delete: (id) =>
    api.delete(`/users/${id}`),

  changePassword: (current_password, new_password) =>
    api.put('/users/change-password', { current_password, new_password }),

  forgotPassword: (email) =>
    api.post('/users/forgot-password', { email }),

  resetPassword: (token, new_password) =>
    api.post('/users/reset-password', { token, new_password })
}

// ─── MÉTODOS DE ROLES (catálogo de solo lectura) ───────────────────────────

export const rolesService = {
  getAll: () =>
    api.get('/roles')
}

// ─── MÉTODOS DE GESTIÓN DE PERSONAL ─────────────────────────────────────────

export const staffService = {
  // params admite { page, limit, search }
  getAll: (params = {}) =>
    api.get('/staff', { params }),

  getById: (id) =>
    api.get(`/staff/${id}`),

  create: (data) =>
    api.post('/staff', data),

  update: (id, data) =>
    api.put(`/staff/${id}`, data),

  delete: (id) =>
    api.delete(`/staff/${id}`)
}

// ─── MÉTODOS DE GESTIÓN DE VOLUNTARIOS ──────────────────────────────────────

export const volunteersService = {
  // params admite { page, limit, search }
  getAll: (params = {}) =>
    api.get('/volunteers', { params }),

  getById: (id) =>
    api.get(`/volunteers/${id}`),

  create: (data) =>
    api.post('/volunteers', data),

  update: (id, data) =>
    api.put(`/volunteers/${id}`, data),

  delete: (id) =>
    api.delete(`/volunteers/${id}`)
}

// ─── MÉTODOS DE GESTIÓN DE DENUNCIAS ────────────────────────────────────────

export const complaintsService = {
  // params admite { page, limit, search }
  getAll: (params = {}) =>
    api.get('/complaints', { params }),

  // Totales globales (no del array paginado) para las tarjetas de conteo
  getStats: () =>
    api.get('/complaints/stats'),

  getById: (id) =>
    api.get(`/complaints/${id}`),

  create: (data) =>
    api.post('/complaints', data),

  update: (id, data) =>
    api.put(`/complaints/${id}`, data),

  delete: (id) =>
    api.delete(`/complaints/${id}`)
}

// ─── MÉTODOS DE SECTORES (catálogo de solo lectura) ─────────────────────────

export const sectoresService = {
  getAll: () =>
    api.get('/sectors')
}

// ─── MÉTODOS DE BITÁCORA (solo lectura) ─────────────────────────────────────

export const bitacoraService = {
  // params admite { page, limit, search, action }
  getAll: (params = {}) =>
    api.get('/bitacora', { params })
}

// ─── MÉTODOS DE ADOPCIONES (Cartelera — endpoint admin, no el público) ──────

export const petsService = {
  // params admite { page, limit, search, status, species }
  getAll: (params = {}) =>
    api.get('/pets', { params }),

  // data es FormData (incluye la foto): formDataConfig quita el Content-Type
  // fijo para que el navegador agregue el boundary multipart correcto.
  create: (data) =>
    api.post('/pets', data, formDataConfig(data)),

  update: (id, data) =>
    api.put(`/pets/${id}`, data, formDataConfig(data)),

  delete: (id) =>
    api.delete(`/pets/${id}`)
}

// ─── MÉTODOS DE SOLICITUDES DE ADOPCIÓN ─────────────────────────────────────

export const adoptionService = {
  // params admite { page, limit, search, status }
  getAll: (params = {}) =>
    api.get('/adoption-requests', { params }),

  // Totales globales (no del array paginado) para las tarjetas de conteo
  getStats: () =>
    api.get('/adoption-requests/stats'),

  aprobarRechazar: (id, data) =>
    api.patch(`/adoption-approve/${id}`, data)
}

// ─── MÉTODOS DE COLABORACIONES ──────────────────────────────────────────────

export const donationsService = {
  // params admite { page, limit, search, status }
  getAll: (params = {}) =>
    api.get('/donations', { params }),

  // Totales globales (no del array paginado) para las tarjetas de conteo
  getStats: () =>
    api.get('/donations/stats'),

  // Reutiliza el endpoint PATCH legacy (src/app.js) que ya envía la
  // notificación por email/SMS al colaborador — no se duplicó esa lógica.
  updateStatus: (id, status) =>
    api.patch(`/donations/${id}`, { status })
}

// ─── MÉTODOS DEL PANEL PRINCIPAL ─────────────────────────────────────────────

export const dashboardService = {
  // Totales reales de todo el sistema (Usuarios, Mascotas, Censo,
  // Colaboraciones, Consultas, Denuncias, Inventario, Propietarios)
  getStats: () =>
    api.get('/dashboard/stats')
}

export default api
