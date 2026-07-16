import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  PawPrint,
  Stethoscope,
  AlertTriangle,
  Package,
  Users,
  HandHeart,
  Heart,
  Loader,
  ClipboardList,
  CheckCircle2,
} from 'lucide-react';

import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { dashboardService } from '../services/api';

import CensoAnimal         from './CensoAnimal';
import CarteleraAdopcion   from './CarteleraAdopcion';
import SolicitudesAdopcion from './SolicitudesAdopcion';
import GestionColaboraciones from './GestionColaboraciones';
import ConsultaMedica      from './ConsultaMedica';
import GestionDenuncias    from './GestionDenuncias';
import LogisticaInventario           from './LogisticaInventario';
import FormularioCarteleraAdopcion   from './FormularioCarteleraAdopcion';
import FormularioConsultaMedica      from './FormularioConsultaMedica';
import GestionPropietarios           from './GestionPropietarios';
import FormularioTramiteAdopcion     from './FormularioTramiteAdopcion';
import MiPerfil                      from './MiPerfil';
import Configuracion                 from './Configuracion';
import GestionUsuarios               from './GestionUsuarios';
import GestionPersonal               from './GestionPersonal';
import GestionVoluntarios            from './GestionVoluntarios';
import Bitacora                      from './Bitacora';

// ── Control de acceso por roles (RBAC) ──────────────────────────────────────
// El rol se obtiene del AuthContext (usuario.rol) según las credenciales del login.

// ─── LAYOUT RAÍZ ────────────────────────────────────────────────────────────

export default function PanelPrincipal() {
  const { modulo }    = useParams();
  const navigate      = useNavigate();
  const { logout, usuario } = useAuth();

  // vistaActual se lee desde la URL (/panel/:modulo) — React Router reactivo
  const vistaActual = modulo ?? 'inicio';

  // Función para navegar a un módulo diferente
  const setVistaActual = (vista) => navigate(`/panel/${vista}`);

  // Logout con limpieza
  const onLogout = () => {
    logout();
    navigate('/login');
  };

  // Control de acceso por rol (RBAC)
  const rolActivo = (usuario?.rol?.toLowerCase() || 'operador')
  const esAdministrador = usuario?.id_role === 1 || rolActivo === 'administrador'
  const esVeterinario = usuario?.id_role === 2 || rolActivo === 'veterinario'
  const esOperador = usuario?.id_role === 3 || rolActivo === 'operador'

  // Estado local para elementos específicos
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);

  // Controla el drawer del Sidebar en móvil/tablet (< md). En escritorio
  // el Sidebar es estático y este estado no tiene efecto visual.
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  // Sincronizar cuando cambia el módulo (garantiza reactividad)
  useEffect(() => {
    // Scroll al inicio cuando cambia de módulo
    document.documentElement.scrollTop = 0;
    // Cierra el drawer móvil al navegar a un nuevo módulo
    setSidebarAbierto(false);
  }, [vistaActual]);

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#FFFBF0] font-sans">

      {/* ── Blobs decorativos de fondo — dan profundidad al efecto cristal ── */}
      <div className="absolute -top-40 -left-20 w-[560px] h-[560px] rounded-full bg-[#FFDF96]/25 blur-[110px] pointer-events-none z-0" />
      <div className="absolute -bottom-44 -right-20 w-[480px] h-[480px] rounded-full bg-[#FFDF96]/20 blur-[100px] pointer-events-none z-0" />
      <div className="absolute top-[35%] right-[25%] w-[340px] h-[340px] rounded-full bg-[#765A05]/6 blur-[85px] pointer-events-none z-0" />
      <div className="absolute top-[5%] right-[8%] w-[220px] h-[220px] rounded-full bg-[#FFDF96]/15 blur-[65px] pointer-events-none z-0" />

      {/* Fondo oscuro tras el drawer móvil — solo visible cuando el Sidebar
          está abierto en pantallas < md; en escritorio nunca se renderiza. */}
      {sidebarAbierto && (
        <div
          onClick={() => setSidebarAbierto(false)}
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
        />
      )}

      {/* Barra Lateral */}
      <Sidebar
        vistaActual={vistaActual}
        onLogout={onLogout}
        abierto={sidebarAbierto}
        onCerrar={() => setSidebarAbierto(false)}
      />

      {/* Columna principal: header + contenido */}
      <div className="relative flex flex-col flex-1 overflow-hidden z-10">
        <Header
          vistaActual={vistaActual}
          setVistaActual={setVistaActual}
          onAbrirMenu={() => setSidebarAbierto(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">

            {/* ── Vistas principales de módulos ─────────────────────── */}
            {vistaActual === 'inicio' && (
              <Resumen setVistaActual={setVistaActual} esAdmin={esAdministrador} />
            )}

            {/* Menú -> Componente Real: un solo paso. CensoAnimal ya maneja
                internamente su propio Vista1 (tabla) / Vista2 (formulario). */}
            {vistaActual === 'censo' && (
              <CensoAnimal />
            )}

            {vistaActual === 'propietarios' && (
              <GestionPropietarios
                setVistaActual={setVistaActual}
                readOnly={false}
                canDelete={esAdministrador}
              />
            )}

            {(vistaActual === 'adopcion' || vistaActual === 'cartelera') && (
              <CarteleraAdopcion
                setVistaActual={setVistaActual}
                canDelete={esAdministrador}
              />
            )}

            {(vistaActual === 'solicitudes-adopcion' || vistaActual === 'solicitudes') && (
              <SolicitudesAdopcion
                setVistaActual={setVistaActual}
                setSolicitudSeleccionada={setSolicitudSeleccionada}
                canDelete={esAdministrador}
              />
            )}

            {vistaActual === 'formulario-tramite' && (
              <FormularioTramiteAdopcion
                setVistaActual={setVistaActual}
                solicitudSeleccionada={solicitudSeleccionada}
              />
            )}

            {vistaActual === 'donaciones'  && (
              <GestionColaboraciones />
            )}

            {(vistaActual === 'consultas' || vistaActual === 'medica') && !esOperador && (
              <ConsultaMedica
                setVistaActual={setVistaActual}
                readOnly={esAdministrador}
                canDelete={esAdministrador}
              />
            )}

            {/* Menú -> Componente Real: un solo paso. GestionDenuncias ya maneja
                internamente su propio Vista1 (tabla) / Vista2 (formulario).
                Visible para administrador y operador, igual que en Sidebar.jsx. */}
            {vistaActual === 'denuncias' && (
              <GestionDenuncias />
            )}

            {/* Menú -> Componente Real: un solo paso. LogisticaInventario ya maneja
                internamente su propio Vista1 (tabla) / Vista2 (formulario). */}
            {(vistaActual === 'inventario' || vistaActual === 'logistica') && (
              <LogisticaInventario readOnly={esVeterinario} />
            )}

            {/* ── Sub-pantallas: formularios de registro ────────────── */}
            {vistaActual === 'formulario-mascota' && (
              <FormularioCarteleraAdopcion setVistaActual={setVistaActual} />
            )}
            {vistaActual === 'formulario-consulta' && !esAdministrador && !esOperador && (
              <FormularioConsultaMedica setVistaActual={setVistaActual} />
            )}

            {/* ── Vistas de perfil y administración ────────────── */}
            {vistaActual === 'perfil'           && <MiPerfil setVistaActual={setVistaActual} />}
{vistaActual === 'configuracion' && esAdministrador && <Configuracion setVistaActual={setVistaActual} />}
            {vistaActual === 'usuarios' && esAdministrador && <GestionUsuarios setVistaActual={setVistaActual} />}
            {vistaActual === 'personal' && esAdministrador && <GestionPersonal setVistaActual={setVistaActual} />}
            {vistaActual === 'voluntarios' && esAdministrador && <GestionVoluntarios setVistaActual={setVistaActual} />}
            {vistaActual === 'bitacora' && esAdministrador && <Bitacora />}

          </div>
        </main>
      </div>
    </div>
  );
}

// ─── PANTALLA RESUMEN / DASHBOARD ────────────────────────────────────────────

const ESTILOS_ESTADO_ADOPCION = {
  Pendiente:  'bg-amber-100 text-amber-700 border border-amber-200',
  Disponible: 'bg-green-100 text-green-700 border border-green-200',
  Adoptado:   'bg-blue-100 text-blue-700 border border-blue-200',
};

// Porcentaje de la barra: qué tan cerca está la cantidad actual del doble
// del mínimo (mismo criterio visual que LogisticaInventario.jsx).
function calcularPctStock(cantidad, minimo) {
  if (!minimo || minimo === 0) return 60;
  return Math.min(100, Math.round((cantidad / (minimo * 2)) * 100));
}

function Resumen({ setVistaActual, esAdmin }) {
  const [estadisticas, setEstadisticas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setCargando(true);
      setError(null);
      const respuesta = await dashboardService.getStats();
      setEstadisticas(respuesta.data || {});
    } catch (err) {
      setError('Error al cargar las estadísticas del panel: ' + (err.response?.data?.message || err.message));
      console.error('Error:', err);
      setEstadisticas({});
    } finally {
      setCargando(false);
    }
  };

  // Totales reales desde GET /api/dashboard/stats — sin datos ficticios.
  const totalUsuarios            = estadisticas?.usuariosActivos          ?? 0;
  const totalMascotas            = estadisticas?.totalMascotas           ?? 0;
  const totalCensados            = estadisticas?.totalCensados           ?? 0;
  const totalColaboraciones      = estadisticas?.totalColaboraciones     ?? 0;
  const totalConsultas           = estadisticas?.totalConsultas          ?? 0;
  const denunciasActivas         = estadisticas?.denunciasActivas        ?? 0;
  const insumosAlerta            = estadisticas?.insumosAlerta           ?? 0;
  const propietariosRegistrados  = estadisticas?.propietariosRegistrados ?? 0;
  const insumosCriticos          = estadisticas?.insumosCriticos         ?? [];
  const ultimasAdopciones        = estadisticas?.ultimasAdopciones       ?? [];

  const indicadoresBase = [
    {
      id:         'censo',
      titulo:     'Total Censados',
      valor:      totalCensados,
      icono:      PawPrint,
      iconoBg:    'bg-[#765A05]/10',
      iconoColor: 'text-[#765A05]',
      sombra:     'shadow-[#765A05]/10',
    },
    {
      id:         'medica',
      titulo:     'Consultas Médicas',
      valor:      totalConsultas,
      icono:      Stethoscope,
      iconoBg:    'bg-[#FFDF96]/40',
      iconoColor: 'text-amber-700',
      sombra:     'shadow-amber-300/20',
    },
    {
      id:         'denuncias',
      titulo:     'Denuncias Activas',
      valor:      denunciasActivas,
      icono:      AlertTriangle,
      iconoBg:    'bg-orange-100',
      iconoColor: 'text-orange-600',
      sombra:     'shadow-orange-300/15',
    },
    {
      id:         'logistica',
      titulo:     'Insumos en Alerta',
      valor:      insumosAlerta,
      icono:      Package,
      iconoBg:    'bg-rose-100',
      iconoColor: 'text-rose-600',
      sombra:     'shadow-rose-300/15',
    },
  ];

  // Solo el administrador ve el panorama completo del sistema, incluyendo
  // Colaboraciones, Mascotas en adopción, Usuarios y Propietarios.
  const indicadores = esAdmin ? [
    ...indicadoresBase,
    {
      id:         'adopcion',
      titulo:     'Mascotas en Adopción',
      valor:      totalMascotas,
      icono:      Heart,
      iconoBg:    'bg-rose-50',
      iconoColor: 'text-rose-500',
      sombra:     'shadow-rose-300/15',
    },
    {
      id:         'donaciones',
      titulo:     'Colaboraciones Registradas',
      valor:      totalColaboraciones,
      icono:      HandHeart,
      iconoBg:    'bg-teal-100',
      iconoColor: 'text-teal-600',
      sombra:     'shadow-teal-300/15',
    },
    {
      id:         'usuarios',
      titulo:     'Usuarios Activos',
      valor:      totalUsuarios,
      icono:      Users,
      iconoBg:    'bg-blue-100',
      iconoColor: 'text-blue-600',
      sombra:     'shadow-blue-300/15',
    },
    {
      id:         'propietarios',
      titulo:     'Propietarios Registrados',
      valor:      propietariosRegistrados,
      icono:      Users,
      iconoBg:    'bg-green-100',
      iconoColor: 'text-green-600',
      sombra:     'shadow-green-300/15',
    },
  ] : indicadoresBase;

  return (
    <div className="space-y-6">

      {/* ── Bienvenida ──────────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
          Balance de Operaciones
        </h2>
        <p className="text-sm text-[#765A05]/60 mt-0.5">
          Estado actual de la infraestructura — SISVIC · Misión Nevado
        </p>
      </div>

      {/* ── Error de carga ── */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Tarjetas de métricas con efecto cristal cálido — totales
          reales de Neon, no datos de muestra. ────────────────────── */}
      {cargando ? (
        <div className="py-16 text-center">
          <Loader className="w-8 h-8 text-[#765A05]/40 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400 font-medium">Cargando estadísticas del sistema...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {indicadores.map(({ id, titulo, valor, icono: Icono, iconoBg, iconoColor, sombra }) => (
            <button
              key={id}
              onClick={() => setVistaActual(id)}
              className={`group bg-white/65 backdrop-blur-md rounded-2xl border border-white/60 shadow-xl ${sombra} p-5 flex items-center justify-between text-left transition-all duration-300 hover:bg-white/85 hover:shadow-2xl hover:scale-[1.025] cursor-pointer`}
            >
              <div>
                <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase leading-tight">
                  {titulo}
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-1.5 leading-none">{valor}</p>
              </div>
              <div className={`w-11 h-11 ${iconoBg} rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm shrink-0`}>
                <Icono className={`w-5 h-5 ${iconoColor}`} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Grilla secundaria — datos 100% reales de Neon, sin contenido
          de muestra. Se oculta mientras carga junto con las tarjetas. ── */}
      {!cargando && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Panel Izquierdo: Insumos Críticos */}
          <div className="bg-white/65 backdrop-blur-md rounded-2xl border border-white/60 shadow-xl shadow-[#765A05]/8 p-5">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-9 h-9 bg-orange-100 border border-orange-200/60 rounded-xl flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">
                  Insumos Críticos
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Suministros que alcanzaron su stock mínimo
                </p>
              </div>
            </div>

            {insumosCriticos.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-green-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400 font-medium">Stock de insumos en niveles óptimos</p>
              </div>
            ) : (
              <div className="space-y-4">
                {insumosCriticos.map(({ nombre, cantidad, minimo }) => {
                  const pct = calcularPctStock(cantidad, minimo);
                  const esCritico = cantidad === 0 || (minimo > 0 && cantidad <= minimo);
                  return (
                    <div key={nombre} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-gray-700">{nombre}</span>
                        <span className="text-gray-400 font-medium">
                          Existencia:{' '}
                          <span className={`font-bold ${esCritico ? 'text-red-600' : 'text-orange-600'}`}>{cantidad}</span>
                        </span>
                      </div>
                      <div className="h-1.5 bg-[#765A05]/8 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${esCritico ? 'bg-red-400' : 'bg-amber-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Panel Derecho: Gestión de Adopciones */}
          <div className="bg-white/65 backdrop-blur-md rounded-2xl border border-white/60 shadow-xl shadow-[#765A05]/8 p-5">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-[#FFDF96]/40 border border-[#FFDF96]/40 rounded-xl flex items-center justify-center shrink-0">
                  <PawPrint className="w-4 h-4 text-[#765A05]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Gestión de Adopciones</p>
                  <p className="text-xs text-gray-400 mt-0.5">Últimas solicitudes y mascotas en cartelera</p>
                </div>
              </div>
              <button
                onClick={() => setVistaActual('solicitudes-adopcion')}
                className="text-[#765A05]/60 hover:text-[#765A05] transition-colors shrink-0"
                title="Ver Solicitudes de Adopción"
              >
                <ClipboardList className="w-4 h-4" />
              </button>
            </div>

            {ultimasAdopciones.length === 0 ? (
              <div className="py-8 text-center">
                <PawPrint className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400 font-medium">No hay solicitudes recientes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {ultimasAdopciones.map(({ nombre, estado }, i) => (
                  <div
                    key={`${nombre}-${i}`}
                    className="flex items-center justify-between gap-3 bg-[#FFDF96]/10 rounded-xl p-3 border border-[#FFDF96]/20"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white/70 border border-[#FFDF96]/30 flex items-center justify-center shrink-0">
                        <PawPrint className="w-4 h-4 text-[#765A05]/70" />
                      </div>
                      <p className="text-sm font-semibold text-gray-800 truncate">{nombre}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg shrink-0 ${ESTILOS_ESTADO_ADOPCION[estado] ?? 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                      {estado}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// ─── PLACEHOLDER PARA SUB-PANTALLAS DE FORMULARIOS ──────────────────────────
// Componente provisional hasta que se implementen los formularios reales.
// Recibe el nombre del formulario, su ícono representativo y la vista de retorno.

function PlaceholderFormulario({ tipo, icono: Icono, setVistaActual, retorno }) {
  return (
    <div className="space-y-5 max-w-2xl">

      {/* Breadcrumb de navegación */}
      <button
        onClick={() => setVistaActual(retorno)}
        className="flex items-center gap-1.5 text-sm text-[#765A05]/65 hover:text-[#765A05] transition-colors font-medium"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        Volver al módulo anterior
      </button>

      {/* Tarjeta principal del formulario */}
      <div className="bg-white/65 backdrop-blur-md rounded-2xl border border-white/60 shadow-xl shadow-[#765A05]/8 px-8 py-12 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-[#FFDF96]/30 border border-[#FFDF96]/40 rounded-2xl flex items-center justify-center mb-5">
          <Icono className="w-8 h-8 text-[#765A05]" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">{tipo}</h2>
        <p className="text-sm text-gray-400 mt-2 max-w-sm leading-relaxed">
          Este formulario está preparado para recibir datos. La implementación
          completa se conectará al backend del sistema SISCVI.
        </p>
        <div className="mt-6 flex items-center gap-1.5 text-xs text-[#765A05]/50 font-medium bg-[#FFDF96]/15 border border-[#FFDF96]/20 px-3.5 py-2 rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-[#765A05]/40 inline-block" />
          Formulario en construcción — disponible próximamente
        </div>
      </div>
    </div>
  );
}
