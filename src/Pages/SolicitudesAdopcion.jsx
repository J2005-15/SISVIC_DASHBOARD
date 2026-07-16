import React, { useState, useEffect } from 'react';
import { Heart, Phone, CheckCircle, XCircle, Clock, User, Search, Loader, AlertTriangle } from 'lucide-react';
import { adoptionService } from '../services/api';
import PaginadorPremium from '../components/PaginadorPremium';
import FiltrosPills from '../components/FiltrosPills';

const ESTILOS_SOLICITUD = {
  Pendiente:   'bg-amber-100 text-amber-700 border border-amber-200',
  'En Proceso':'bg-blue-100 text-blue-700 border border-blue-200',
  Aprobada:    'bg-green-100 text-green-700 border border-green-200',
  Rechazada:   'bg-red-100 text-red-600 border border-red-200',
};

function BadgeSolicitud({ estado }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${ESTILOS_SOLICITUD[estado] ?? 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
      {estado}
    </span>
  );
}

// Convierte el valor de la BD al texto que muestra la UI
function mapearEstado(dbVal) {
  if (!dbVal || dbVal === 'pending') return 'Pendiente';
  return dbVal; // 'Aprobada', 'En Proceso', 'Rechazada' ya vienen correctos
}

// Formatea un timestamp ISO a "DD/MM/YYYY"
function formatearFecha(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const COLUMNAS = ['Fecha', 'Adoptante', 'Teléfono', 'Mascota Interesada', 'Estado de Solicitud', 'Acciones'];

// Pills de estado — valores reales de Adoption_status en la BD ('pending'
// es el default, 'Aprobada' y 'Rechazada' los asigna el endpoint de
// aprobación en app.js). 'Todos' no envía filtro al backend.
const CATEGORIAS_ESTADO = [
  { label: 'Todos',      value: '' },
  { label: 'Pendientes', value: 'pending' },
  { label: 'En Proceso', value: 'En Proceso' },
  { label: 'Aprobadas',  value: 'Aprobada' },
  { label: 'Rechazadas', value: 'Rechazada' },
];

const REGISTROS_POR_PAGINA = 10;

export default function SolicitudesAdopcion({ setVistaActual, setSolicitudSeleccionada }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando,    setCargando]    = useState(false);
  const [error,       setError]       = useState(null);

  // Totales globales (no derivados del array paginado) para las tarjetas
  const [estadisticas, setEstadisticas] = useState({ pendientes: 0, aprobadas: 0, rechazadas: 0 });

  // ── Búsqueda, estado y paginación en servidor ─────────────────────────────
  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);

  // Se recarga cada vez que cambia la página, la búsqueda aplicada o el estado
  useEffect(() => {
    cargar();
  }, [pagina, busquedaAplicada, categoriaActiva]);

  // Las estadísticas globales se cargan una sola vez al montar
  useEffect(() => {
    cargarEstadisticas();
  }, []);

  // Debounce: espera 400ms de inactividad antes de filtrar, y vuelve a la
  // página 1 (un filtro nuevo invalida la posición de paginación actual)
  useEffect(() => {
    const id = setTimeout(() => {
      setPagina(1);
      setBusquedaAplicada(busqueda);
    }, 400);
    return () => clearTimeout(id);
  }, [busqueda]);

  const cargar = async () => {
    try {
      setCargando(true);
      setError(null);
      const respuesta = await adoptionService.getAll({
        page: pagina,
        limit: REGISTROS_POR_PAGINA,
        search: busquedaAplicada,
        status: categoriaActiva,
      });
      const cuerpo = respuesta.data || {};
      const lista = (cuerpo.data ?? []).map(s => ({
        id:       s.id_Adoption,
        fecha:    formatearFecha(s.created_at),
        adoptante:s.visitor_name,
        telefono: s.visitor_phone,
        email:    s.visitor_email,
        mascota:  s.pet?.name ?? '(sin asignar)',
        estado:   mapearEstado(s.Adoption_status),
      }));
      setSolicitudes(lista);
      setTotalPaginas(cuerpo.metadata?.totalPages || 1);
      setTotalRegistros(cuerpo.metadata?.totalRecords || 0);
    } catch (err) {
      setError('Error al cargar las solicitudes: ' + (err.response?.data?.message || err.message));
      console.error('Error:', err);
      setSolicitudes([]);
    } finally {
      setCargando(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const respuesta = await adoptionService.getStats();
      setEstadisticas({
        pendientes: respuesta.data?.pendientes ?? 0,
        aprobadas:  respuesta.data?.aprobadas  ?? 0,
        rechazadas: respuesta.data?.rechazadas ?? 0,
      });
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  };

  // Cambia el estado activo y vuelve a la página 1 — un filtro nuevo
  // invalida la posición de paginación que tenías antes
  const seleccionarCategoria = (valor) => {
    setPagina(1);
    setCategoriaActiva(valor);
  };

  return (
    <div className="space-y-6 max-w-6xl">

      {/* ── Encabezado ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
          <Heart className="w-5 h-5 text-rose-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Solicitudes de Adopción Recibidas</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Formularios enviados desde la web pública de Misión Nevado
          </p>
        </div>
      </div>

      {/* ── Error de carga ── */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Tarjetas de conteo — totales globales reales de Neon, no del
          array paginado. ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pendientes</p>
            <p className="text-3xl font-bold text-gray-900 mt-0.5">{estadisticas.pendientes}</p>
            <p className="text-xs text-gray-400 mt-0.5">requieren atención</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-[#FFDF96]/30 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Aprobadas</p>
            <p className="text-3xl font-bold text-gray-900 mt-0.5">{estadisticas.aprobadas}</p>
            <p className="text-xs text-gray-400 mt-0.5">procesos en curso</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Rechazadas</p>
            <p className="text-3xl font-bold text-gray-900 mt-0.5">{estadisticas.rechazadas}</p>
            <p className="text-xs text-gray-400 mt-0.5">no procedieron</p>
          </div>
        </div>
      </div>

      {/* ── Tabla ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">

        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre del adoptante..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 focus:border-[#765A05] transition-all"
            />
          </div>
          <span className="text-xs text-gray-500 font-medium bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded-lg shrink-0">
            {totalRegistros} solicitud{totalRegistros !== 1 ? 'es' : ''}
          </span>
        </div>

        <div className="px-5 py-4 border-b border-gray-100">
          <FiltrosPills opciones={CATEGORIAS_ESTADO} activo={categoriaActiva} onCambio={seleccionarCategoria} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {COLUMNAS.map((col, i) => (
                  <th
                    key={col}
                    className={`text-[11px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3 whitespace-nowrap ${i === COLUMNAS.length - 1 ? 'text-right' : 'text-left'}`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={COLUMNAS.length} className="py-20 text-center">
                    <Loader className="w-8 h-8 text-rose-300 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-400 font-medium">Cargando solicitudes...</p>
                  </td>
                </tr>
              ) : solicitudes.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNAS.length} className="py-20 text-center">
                    <Heart className="w-9 h-9 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 font-medium">
                      {busquedaAplicada || categoriaActiva ? 'No se encontraron coincidencias' : 'No hay solicitudes registradas aún'}
                    </p>
                    <p className="text-xs text-gray-300 mt-1">Las solicitudes del formulario público aparecerán aquí</p>
                  </td>
                </tr>
              ) : (
                solicitudes.map(s => (
                  <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <p className="text-sm text-gray-600 font-medium">{s.fecha}</p>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">{s.adoptante}</p>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <p className="text-sm text-gray-600 font-mono tracking-wide">{s.telefono}</p>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                        <span>🐾</span>
                        {s.mascota}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <BadgeSolicitud estado={s.estado} />
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          Llamar / Procesar
                        </button>

                        {s.estado !== 'Aprobada' && s.estado !== 'Rechazada' && (
                          <button
                            onClick={() => {
                              setSolicitudSeleccionada(s);
                              setVistaActual('formulario-tramite');
                            }}
                            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#765A05] hover:bg-[#FFDF96]/20 border border-gray-200 hover:border-[#FFDF96]/40 px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Procesar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 pb-5">
          <PaginadorPremium
            paginaActual={pagina}
            totalPaginas={totalPaginas}
            totalRegistros={totalRegistros}
            cargando={cargando}
            onCambioPagina={setPagina}
          />
        </div>
      </div>
    </div>
  );
}
