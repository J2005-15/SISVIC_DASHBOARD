import React, { useState, useEffect } from 'react';
import { History, Search, AlertTriangle, Loader, Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { bitacoraService } from '../services/api';
import PaginadorPremium from '../components/PaginadorPremium';
import FiltrosPills from '../components/FiltrosPills';

const ESTILOS_ACCION = {
  crear:          'bg-green-100 text-green-700 border border-green-200',
  actualizar:     'bg-blue-100 text-blue-700 border border-blue-200',
  eliminar:       'bg-red-100 text-red-700 border border-red-200',
  cambio_estado:  'bg-amber-100 text-amber-700 border border-amber-200',
};

const ICONO_ACCION = {
  crear:         Plus,
  actualizar:    Pencil,
  eliminar:      Trash2,
  cambio_estado: RefreshCw,
};

// Pills de tipo de operación — value vacío ('Todos') no envía filtro action
// al backend. Mapea 1:1 al ENUM real de Bitacora.action.
const CATEGORIAS_ACCION = [
  { label: 'Todos',            value: '' },
  { label: 'Inserciones',      value: 'crear' },
  { label: 'Modificaciones',   value: 'actualizar' },
  { label: 'Eliminaciones',    value: 'eliminar' },
  { label: 'Cambios de Estado', value: 'cambio_estado' },
];

function BadgeAccion({ action }) {
  const Icono = ICONO_ACCION[action] ?? History;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${ESTILOS_ACCION[action] ?? 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
      <Icono className="w-3 h-3" />
      {action}
    </span>
  );
}

function formatearFecha(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-VE', { dateStyle: 'medium', timeStyle: 'short' });
}

const COLUMNAS = ['Fecha', 'Usuario', 'Acción', 'Módulo Afectado', 'Descripción'];

const REGISTROS_POR_PAGINA = 10;

// ─── VISTA DE SOLO LECTURA — sin botón de "Nuevo" ni acciones de Editar/Eliminar.
// Es una bitácora de auditoría: el administrador consulta, nunca modifica.
export default function Bitacora() {
  const [registros, setRegistros] = useState([]);
  const [cargando,  setCargando]  = useState(false);
  const [error,     setError]     = useState(null);

  // ── Búsqueda, categoría y paginación en servidor ──────────────────────────
  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);

  // Se recarga cada vez que cambia la página, la búsqueda aplicada o la acción
  useEffect(() => {
    cargarRegistros();
  }, [pagina, busquedaAplicada, categoriaActiva]);

  // Debounce: espera 400ms de inactividad antes de filtrar, y vuelve a la
  // página 1 (un filtro nuevo invalida la posición de paginación actual)
  useEffect(() => {
    const id = setTimeout(() => {
      setPagina(1);
      setBusquedaAplicada(busqueda);
    }, 400);
    return () => clearTimeout(id);
  }, [busqueda]);

  const cargarRegistros = async () => {
    try {
      setCargando(true);
      setError(null);

      const respuesta = await bitacoraService.getAll({
        page: pagina,
        limit: REGISTROS_POR_PAGINA,
        search: busquedaAplicada,
        action: categoriaActiva,
      });

      const cuerpo = respuesta.data || {};
      setRegistros(cuerpo.data || []);
      setTotalPaginas(cuerpo.metadata?.totalPages || 1);
      setTotalRegistros(cuerpo.metadata?.totalRecords || 0);
    } catch (err) {
      setError('Error al cargar la bitácora: ' + (err.response?.data?.message || err.message));
      console.error('Error:', err);
      setRegistros([]);
    } finally {
      setCargando(false);
    }
  };

  // Cambia la acción activa y vuelve a la página 1 — un filtro nuevo
  // invalida la posición de paginación que tenías antes
  const seleccionarCategoria = (valor) => {
    setPagina(1);
    setCategoriaActiva(valor);
  };

  return (
    <div className="space-y-6 max-w-7xl">

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#765A05]/10 border border-[#765A05]/20 rounded-xl flex items-center justify-center shrink-0">
          <History className="w-5 h-5 text-[#765A05]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Bitácora de Auditoría</h2>
          <p className="text-sm text-gray-400 mt-0.5">Historial de acciones realizadas por los usuarios del sistema</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white/70 backdrop-blur-md border border-white/50 shadow-xl shadow-[#765A05]/5 rounded-2xl">

        <div className="px-5 py-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por usuario o acción..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 focus:border-[#765A05] transition-all"
            />
          </div>
        </div>

        <div className="px-5 py-4 border-b border-gray-100">
          <FiltrosPills opciones={CATEGORIAS_ACCION} activo={categoriaActiva} onCambio={seleccionarCategoria} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {COLUMNAS.map((col) => (
                  <th key={col} className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={COLUMNAS.length} className="py-20 text-center">
                    <Loader className="w-8 h-8 text-[#765A05]/40 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-400 font-medium">Cargando bitácora...</p>
                  </td>
                </tr>
              ) : registros.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNAS.length} className="py-20 text-center">
                    <History className="w-9 h-9 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 font-medium">
                      {busquedaAplicada || categoriaActiva ? 'No se encontraron resultados' : 'Aún no hay registros de auditoría'}
                    </p>
                  </td>
                </tr>
              ) : (
                registros.map(r => (
                  <tr key={r.id_log} className="border-b border-gray-50 last:border-0 hover:bg-[#FFDF96]/8 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <p className="text-sm text-gray-600">{formatearFecha(r.created_at)}</p>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <p className="text-sm font-semibold text-gray-800">{r.Users?.full_name ?? `Usuario #${r.id_user ?? '—'}`}</p>
                      <p className="text-xs text-gray-400">{r.Users?.email ?? ''}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <BadgeAccion action={r.action} />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <code className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded-md border border-gray-200">
                        {r.table_affected}
                      </code>
                    </td>
                    <td className="px-5 py-3.5 max-w-[360px]">
                      <p className="text-sm text-gray-700 truncate" title={r.description}>{r.description ?? '—'}</p>
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
