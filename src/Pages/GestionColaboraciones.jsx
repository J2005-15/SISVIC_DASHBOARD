import React, { useState, useEffect } from 'react';
import { Banknote, ShieldCheck, XCircle, Search, Loader, AlertTriangle, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { donationsService } from '../services/api';
import PaginadorPremium from '../components/PaginadorPremium';
import FiltrosPills from '../components/FiltrosPills';

// El modelo Donations no tiene un campo "tipo de colaboración" — no existe
// esa categoría en el esquema real. El filtro práctico equivalente es el
// estado de verificación del aporte, que es lo que sí persiste en Neon.
const CATEGORIAS_ESTADO = [
  { label: 'Todos',         value: '' },
  { label: 'Por Verificar', value: 'Por Verificar' },
  { label: 'Confirmadas',   value: 'verified' },
  { label: 'Inválidas',     value: 'invalid' },
];

const ESTILOS_COLABORACION = {
  'Por Verificar': 'bg-amber-100 text-amber-700 border border-amber-200',
  verified:        'bg-green-100 text-green-700 border border-green-200',
  invalid:         'bg-red-100 text-red-600 border border-red-200',
};

const ESTADO_LABEL = {
  'Por Verificar': 'Por Verificar',
  verified:        'Confirmado',
  invalid:         'Inválido',
};

function BadgeColaboracion({ estado }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${ESTILOS_COLABORACION[estado] ?? 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
      {ESTADO_LABEL[estado] ?? estado}
    </span>
  );
}

function formatearFecha(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const COLUMNAS = ['Fecha Registro', 'Colaborador', 'Teléfono', 'Monto (Bs.)', 'Nro. Referencia', 'Fecha del Pago', 'Estado', 'Acciones'];

const REGISTROS_POR_PAGINA = 10;

export default function GestionColaboraciones() {
  const [colaboraciones, setColaboraciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error,    setError]    = useState(null);

  // Totales globales (no derivados del array paginado) para las tarjetas
  const [estadisticas, setEstadisticas] = useState({
    totalRecaudado: 0,
    porVerificar: 0,
    confirmadas: 0,
    invalidas: 0,
  });

  // ── Búsqueda, categoría y paginación en servidor ──────────────────────────
  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);

  // Se recarga cada vez que cambia la página, la búsqueda aplicada o el estado
  useEffect(() => {
    cargarColaboraciones();
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

  const cargarColaboraciones = async () => {
    try {
      setCargando(true);
      setError(null);

      const respuesta = await donationsService.getAll({
        page: pagina,
        limit: REGISTROS_POR_PAGINA,
        search: busquedaAplicada,
        status: categoriaActiva,
      });

      const cuerpo = respuesta.data || {};
      setColaboraciones(cuerpo.data || []);
      setTotalPaginas(cuerpo.metadata?.totalPages || 1);
      setTotalRegistros(cuerpo.metadata?.totalRecords || 0);
    } catch (err) {
      setError('Error al cargar colaboraciones: ' + (err.response?.data?.message || err.message));
      console.error('Error:', err);
      setColaboraciones([]);
    } finally {
      setCargando(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const respuesta = await donationsService.getStats();
      setEstadisticas({
        totalRecaudado: respuesta.data?.totalRecaudado ?? 0,
        porVerificar:   respuesta.data?.porVerificar ?? 0,
        confirmadas:    respuesta.data?.confirmadas ?? 0,
        invalidas:      respuesta.data?.invalidas ?? 0,
      });
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  };

  const cambiarEstado = async (id, nuevoEstadoDb) => {
    try {
      setCargando(true);
      await donationsService.updateStatus(id, nuevoEstadoDb);
      await cargarColaboraciones();
      await cargarEstadisticas();
    } catch (err) {
      setError('Error al actualizar el estado: ' + (err.response?.data?.message || err.message));
      console.error('Error:', err);
    } finally {
      setCargando(false);
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
        <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center shrink-0">
          <Banknote className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Control y Auditoría de Colaboraciones</h2>
          <p className="text-sm text-gray-400 mt-0.5">Registro y validación de pagos reportados por colaboradores</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Tarjetas de resumen — totales globales reales de Neon, no del
          array paginado. Se refrescan tras cada cambio de estado. ──────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#765A05] to-[#5a4304] rounded-2xl shadow-md p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold text-green-200 uppercase tracking-wider">Total Recaudado</p>
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-white leading-tight">Bs. {parseFloat(estadisticas.totalRecaudado).toFixed(2)}</p>
            <p className="text-xs text-green-200 mt-1">Solo colaboraciones confirmadas</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Por Verificar</p>
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{estadisticas.porVerificar}</p>
          <p className="text-xs text-gray-400 mt-1">Pagos en revisión</p>
        </div>

        <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Confirmadas</p>
            <div className="w-8 h-8 bg-[#FFDF96]/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{estadisticas.confirmadas}</p>
          <p className="text-xs text-gray-400 mt-1">Pagos validados</p>
        </div>

        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Inválidas</p>
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{estadisticas.invalidas}</p>
          <p className="text-xs text-gray-400 mt-1">Pagos rechazados</p>
        </div>
      </div>

      {/* ── Tabla ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">

        <div className="px-5 py-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por colaborador..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 focus:border-[#765A05] transition-all"
            />
          </div>
        </div>

        <div className="px-5 py-4 border-b border-gray-100">
          <FiltrosPills opciones={CATEGORIAS_ESTADO} activo={categoriaActiva} onCambio={seleccionarCategoria} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {COLUMNAS.map((col, i) => (
                  <th key={col} className={`text-[11px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3 whitespace-nowrap ${i === COLUMNAS.length - 1 ? 'text-right' : 'text-left'}`}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={COLUMNAS.length} className="py-20 text-center">
                    <Loader className="w-8 h-8 text-teal-400/60 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-400 font-medium">Cargando colaboraciones...</p>
                  </td>
                </tr>
              ) : colaboraciones.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNAS.length} className="py-20 text-center">
                    <Banknote className="w-9 h-9 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 font-medium">
                      {busquedaAplicada || categoriaActiva ? 'No se encontraron coincidencias' : 'No hay colaboraciones registradas aún'}
                    </p>
                    <p className="text-xs text-gray-300 mt-1">Las colaboraciones del formulario público aparecerán aquí</p>
                  </td>
                </tr>
              ) : (
                colaboraciones.map(c => (
                  <tr key={c.id_donation} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <p className="text-sm text-gray-600 font-medium">{formatearFecha(c.created_at)}</p>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <p className="text-sm font-semibold text-gray-900">{c.visitor_name}</p>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <p className="text-sm text-gray-600 font-mono tracking-wide">{c.visitor_phone}</p>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <p className="text-sm font-bold text-gray-900">Bs. {parseFloat(c.amount).toFixed(2)}</p>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <code className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded-md tracking-wider border border-gray-200">
                        {c.payment_reference}
                      </code>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <p className="text-sm text-gray-600">{formatearFecha(c.payment_date)}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <BadgeColaboracion estado={c.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {c.status !== 'verified' && (
                          <button
                            onClick={() => cambiarEstado(c.id_donation, 'verified')}
                            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#765A05] hover:bg-[#FFDF96]/20 border border-gray-200 hover:border-[#FFDF96]/40 px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Verificar
                          </button>
                        )}
                        {c.status !== 'invalid' && (
                          <button
                            onClick={() => cambiarEstado(c.id_donation, 'invalid')}
                            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Rechazar
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
