import React from 'react'
import { useAuth } from '../context/AuthContext'
import { User, Menu } from 'lucide-react'

// onAbrirMenu abre el drawer del Sidebar en móvil/tablet (< md); el botón
// que lo dispara solo se muestra en esos anchos (md:hidden).
export default function Header({ vistaActual, setVistaActual, onAbrirMenu }) {
  const { usuario } = useAuth()

  const titulos = {
    inicio: 'Panel de Control Principal',
    usuarios: 'Gestión de Usuarios',
    personal: 'Gestión de Personal',
    voluntarios: 'Gestión de Voluntarios',
    propietarios: 'Registro de Propietarios',
    censo: 'Censo de Población Animal',
    medica: 'Consultas Médicas',
    denuncias: 'Gestión de Denuncias',
    logistica: 'Logística e Inventario',
    cartelera: 'Cartelera de Adopción',
    solicitudes: 'Solicitudes de Adopción',
    donaciones: 'Control de Colaboraciones',
    configuracion: 'Configuración del Sistema',
    perfil: 'Mi Perfil',
    actividades: 'Registro de Actividades',
    bitacora: 'Bitácora de Auditoría',
    'formulario-mascota': 'Nuevo Animal en Adopción',
    'formulario-consulta': 'Nueva Consulta Médica',
    'formulario-tramite': 'Nuevo Trámite de Adopción',
  }

  return (
    <header className="relative shrink-0 z-10 bg-white/60 backdrop-blur-lg border-b border-white/40 px-4 md:px-8 py-4 flex items-center justify-between gap-3 shadow-sm shadow-[#765A05]/5">

      {/* Título dinámico + botón hamburguesa (solo visible en móvil/tablet) */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onAbrirMenu}
          className="md:hidden p-1.5 -ml-1.5 rounded-lg text-[#765A05] hover:bg-[#765A05]/10 transition-colors shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="w-2.5 h-2.5 rounded-full bg-[#765A05] shadow-sm shadow-[#765A05]/60 shrink-0" />
        <h1 className="text-base font-bold text-gray-800 tracking-tight truncate">
          {titulos[vistaActual] ?? 'Panel Administrativo'}
        </h1>
      </div>

      {/* Usuario info - clickeable al perfil */}
      <button
        onClick={() => setVistaActual('perfil')}
        className="flex items-center gap-3 px-2 md:px-3 py-2 rounded-lg hover:bg-[#FFDF96]/20 transition-colors cursor-pointer shrink-0"
      >
        <div className="w-8 h-8 rounded-lg bg-[#765A05]/10 flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-[#765A05]" />
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-sm text-gray-700 font-semibold">
            {usuario?.nombre || usuario?.email}
          </span>
          <span className="text-xs text-gray-500 capitalize">
            {usuario?.rol}
          </span>
        </div>
      </button>
    </header>
  )
}
