import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  // Restaurar sesión desde localStorage al montar
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario')
    const tokenGuardado = localStorage.getItem('token')

    if (usuarioGuardado && usuarioGuardado !== 'undefined' && tokenGuardado && tokenGuardado !== 'undefined') {
      try {
        setUsuario(JSON.parse(usuarioGuardado))
      } catch (error) {
        console.error('Error al restaurar sesión:', error)
        localStorage.removeItem('usuario')
        localStorage.removeItem('token')
      }
    }

    setCargando(false)
  }, [])

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password)
      const { token, usuario: usuarioData } = response.data

      // Mapear la estructura del backend a la del frontend
      const usuarioFormateado = {
        id_user: usuarioData.id_user,
        id_role: usuarioData.id_role,
        nombre: usuarioData.nombre || usuarioData.full_name,
        email: usuarioData.email,
        rol: usuarioData.rol
      }

      // Guardar token y usuario en localStorage
      localStorage.setItem('token', token)
      localStorage.setItem('usuario', JSON.stringify(usuarioFormateado))

      setUsuario(usuarioFormateado)
      return { success: true, usuario: usuarioFormateado }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al iniciar sesión'
      return { success: false, error: errorMessage }
    }
  }

  const logout = () => {
    authService.logout()
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, cargando }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
