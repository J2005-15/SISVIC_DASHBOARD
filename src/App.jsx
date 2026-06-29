import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './Pages/Login'
import PanelPrincipal from './Pages/PanelPrincipal'
import OlvidoPassword from './Pages/OlvidoPassword'
import ResetPassword from './Pages/ResetPassword'

function App() {
  const { usuario } = useAuth()

  return (
    <Routes>
      {/* LOGIN */}
      <Route
        path="/login"
        element={usuario ? <Navigate to="/panel/inicio" replace /> : <Login />}
      />

      {/* Recuperación de contraseña — públicas, no requieren sesión */}
      <Route path="/forgot-password" element={<OlvidoPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* PANEL PRINCIPAL - Ruta única parametrizada */}
      {/* Todas las navegaciones internas usan /panel/:modulo */}
      {/* PanelPrincipal usa useParams() para leer el módulo y renderizar la vista correspondiente */}
      <Route
        path="/panel/:modulo"
        element={usuario ? <PanelPrincipal /> : <Navigate to="/login" replace />}
      />

      {/* Ruta de inicio (sin módulo especificado, redirige a inicio) */}
      <Route
        path="/panel"
        element={usuario ? <Navigate to="/panel/inicio" replace /> : <Navigate to="/login" replace />}
      />

      {/* Ruta raíz */}
      <Route
        path="/"
        element={<Navigate to={usuario ? '/panel/inicio' : '/login'} replace />}
      />

      {/* Ruta por defecto (404) */}
      <Route
        path="*"
        element={<Navigate to={usuario ? '/panel/inicio' : '/login'} replace />}
      />
    </Routes>
  )
}

export default App
