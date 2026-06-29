import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  Users,
  PawPrint,
  Stethoscope,
  AlertTriangle,
  Package,
  Heart,
  ClipboardList,
  HandHeart,
  Settings,
  History,
  LogOut,
  ChevronRight,
  X,
} from 'lucide-react'
import Logo from '../assets/Logo.png'

// abierto/onCerrar controlan el drawer en móvil/tablet (< md): en escritorio
// (md:) el sidebar siempre está fijo y estas props no tienen efecto visual.
export default function Sidebar({ vistaActual, onLogout, abierto = false, onCerrar }) {
  const navigate = useNavigate()
  const { usuario } = useAuth()

  // ─── MENÚ AGRUPADO POR BLOQUES LÓGICOS ───────────────────────────────────
  const gruposMenu = [
    {
      titulo: 'Principal',
      enlaces: [
        { name: 'Panel Principal', path: 'inicio', allowed: [1, 2, 3, 'administrador', 'veterinario', 'operador'] },
      ],
    },
    {
      titulo: 'Equipo y Usuarios',
      enlaces: [
        { name: 'Gestión de Usuarios', path: 'usuarios', allowed: [1, 'administrador'] },
        { name: 'Gestión de Personal', path: 'personal', allowed: [1, 'administrador'] },
        { name: 'Gestión de Voluntarios', path: 'voluntarios', allowed: [1, 'administrador'] },
      ],
    },
    {
      titulo: 'Control Operativo',
      enlaces: [
        { name: 'Propietarios', path: 'propietarios', allowed: [1, 2, 3, 'administrador', 'veterinario', 'operador'] },
        { name: 'Censo Animal', path: 'censo', allowed: [1, 2, 3, 'administrador', 'veterinario', 'operador'] },
        { name: 'Consultas Médicas', path: 'consultas', allowed: [1, 2, 'administrador', 'veterinario'] },
        { name: 'Gestión de Denuncias', path: 'denuncias', allowed: [1, 3, 'administrador', 'operador'] },
      ],
    },
    {
      titulo: 'Manejo Web',
      enlaces: [
        { name: 'Cartelera de Adopción', path: 'adopcion', allowed: [1, 3, 'administrador', 'operador'] },
        { name: 'Solicitudes de Adopción', path: 'solicitudes-adopcion', allowed: [1, 3, 'administrador', 'operador'] },
        { name: 'Control de Colaboraciones', path: 'donaciones', allowed: [1, 3, 'administrador', 'operador'] },
      ],
    },
    {
      titulo: 'Administración',
      enlaces: [
        { name: 'Logística e Inventario', path: 'inventario', allowed: [1, 2, 3, 'administrador', 'veterinario', 'operador'] },
        { name: 'Configuración', path: 'configuracion', allowed: [1, 'administrador'] },
        { name: 'Bitácora de Auditoría', path: 'bitacora', allowed: [1, 'administrador'] },
      ],
    },
  ];

  // Función para determinar si el usuario puede ver un módulo
  const puedeAcceder = (allowed) => {
    if (!usuario) return false;
    return allowed.includes(usuario.id_role) || allowed.includes(usuario.rol);
  };

  // Grupos con sus enlaces ya filtrados por rol; se descartan los grupos
  // que quedan vacíos para no mostrar un subtítulo sin opciones debajo.
  const gruposVisibles = gruposMenu
    .map(grupo => ({
      ...grupo,
      enlaces: grupo.enlaces.filter(enlace => puedeAcceder(enlace.allowed)),
    }))
    .filter(grupo => grupo.enlaces.length > 0);

  // Navegar a un módulo específico — en móvil, cierra el drawer al elegir
  // un módulo para no tapar el contenido recién cargado.
  const navegarA = (ruta) => {
    navigate(`/panel/${ruta}`)
    onCerrar?.()
  };

  // Verificar si una ruta es la activa
  const esActiva = (ruta) => vistaActual === ruta;

  // Mapa de iconos para cada módulo
  const obtenerIcono = (ruta) => {
    const mapa = {
      'inicio': LayoutDashboard,
      'usuarios': Users,
      'personal': Users,
      'voluntarios': Users,
      'propietarios': Users,
      'censo': PawPrint,
      'consultas': Stethoscope,
      'denuncias': AlertTriangle,
      'inventario': Package,
      'bitacora': History,
      'adopcion': Heart,
      'solicitudes-adopcion': ClipboardList,
      'donaciones': HandHeart,
      'configuracion': Settings,
    };
    return mapa[ruta] || LayoutDashboard;
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 md:static w-64 flex flex-col shrink-0 z-30 bg-[#765A05] shadow-2xl shadow-[#765A05]/40 print:hidden transform transition-transform duration-300 md:translate-x-0 ${
        abierto ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Reflejo superior sutil */}
      <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

      {/* Botón cerrar — solo visible en el drawer móvil/tablet (< md) */}
      <button
        type="button"
        onClick={onCerrar}
        className="md:hidden absolute top-3 right-3 z-10 p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* ── Identidad institucional ─────────────────────────────── */}
      <div className="relative px-5 pt-5 pb-4 border-b border-white/10 flex flex-col items-center">
        <img
          src={Logo}
          alt="Logo Misión Nevado"
          className="h-14 w-auto object-contain drop-shadow-lg"
        />
        <div className="mt-2.5 text-center">
          <span className="text-lg font-bold text-[#FFDF96] tracking-[0.22em] uppercase">
            SISVIC
          </span>
          <p className="text-[9px] text-[#FFDF96]/50 uppercase tracking-[0.18em] mt-0.5">
            Sistema de Control
          </p>
        </div>
      </div>

      {/* ── Menú de Navegación, agrupado por bloques ────────────── */}
      <div className="relative flex-1 overflow-y-auto px-3 py-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
        {gruposVisibles.map((grupo, i) => (
          <div key={grupo.titulo}>
            {/* Subtítulo visual del grupo */}
            <p className={`text-xs uppercase font-bold text-[#FFDF96]/40 tracking-[0.15em] px-2.5 mb-2 ${i === 0 ? 'mt-1' : 'mt-4'}`}>
              {grupo.titulo}
            </p>

            <ul className="space-y-0.5">
              {grupo.enlaces.map(({ name, path }) => {
                const Icono = obtenerIcono(path);
                return (
                  <li key={path}>
                    <button
                      onClick={() => navegarA(path)}
                      type="button"
                      className={`w-full flex items-center justify-between pl-2.5 pr-3 py-2.5 rounded-xl text-sm transition-all duration-200 text-left border-l-2 ${
                        esActiva(path)
                          ? 'bg-[#FFDF96]/15 text-white font-semibold border-[#FFDF96]'
                          : 'text-white/60 hover:bg-white/10 hover:text-white/90 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icono className={`w-4 h-4 shrink-0 transition-colors ${esActiva(path) ? 'text-[#FFDF96]' : 'text-white/55'}`} />
                        <span>{name}</span>
                      </div>
                      {esActiva(path) && <ChevronRight className="w-3.5 h-3.5 text-[#FFDF96]/70 shrink-0" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* ── Pie: Cerrar Sesión + Estado ────────────────────────── */}
      <div className="relative px-3 pb-4 space-y-2.5">

        <button
          onClick={onLogout}
          type="button"
          className="group w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-white/60 hover:bg-white/10 hover:text-[#FFDF96] transition-all duration-200 border border-white/10 hover:border-[#FFDF96]/25"
        >
          <LogOut className="w-4 h-4 shrink-0 transition-colors group-hover:text-[#FFDF96]" />
          <span>Cerrar Sesión</span>
        </button>

        {/* Estado del servidor */}
        <div className="bg-white/8 rounded-xl px-3.5 py-3 border border-white/10">
          <p className="text-xs font-semibold text-white/75">Estado del Sistema</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
            <p className="text-xs text-green-300/80 font-medium">Conectado</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
