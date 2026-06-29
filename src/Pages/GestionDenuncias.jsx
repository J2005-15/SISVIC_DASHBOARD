import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, Plus, Search, Pencil, Trash2, ChevronLeft, ChevronDown,
  Eye, Archive, Users, CheckCircle, MapPin, Loader, Save
} from 'lucide-react';
import { complaintsService, sectoresService } from '../services/api';
import PaginadorPremium from '../components/PaginadorPremium';
import FiltrosPills from '../components/FiltrosPills';

const ESTILOS_URGENCIA = {
  Baja:    'bg-green-100 text-green-700 border border-green-200',
  Media:   'bg-amber-100 text-amber-700 border border-amber-200',
  Alta:    'bg-red-100 text-red-700 border border-red-200',
  Urgente: 'bg-purple-100 text-purple-700 border border-purple-200',
};

const ESTILOS_ESTADO = {
  Recibida:          'bg-red-100 text-red-700 border border-red-200',
  En_Investigación:  'bg-blue-100 text-blue-700 border border-blue-200',
  Resuelta:          'bg-green-100 text-green-700 border border-green-200',
  Desestimada:       'bg-gray-100 text-gray-600 border border-gray-200',
};

const ESTADO_LABEL = {
  Recibida:         'Recibida',
  En_Investigación: 'En Investigación',
  Resuelta:         'Resuelta',
  Desestimada:      'Desestimada',
};

// Pills de estado — value vacío ('Todos') no envía filtro status al backend.
// Mapea 1:1 al ENUM real de Complaints.status en el backend.
const CATEGORIAS_ESTADO = [
  { label: 'Todos',           value: '' },
  { label: 'Recibida',        value: 'Recibida' },
  { label: 'En Investigación', value: 'En_Investigación' },
  { label: 'Resuelta',        value: 'Resuelta' },
  { label: 'Desestimada',     value: 'Desestimada' },
];

function BadgeUrgencia({ urgencia }) {
  if (urgencia === 'Urgente' || urgencia === 'Alta') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${ESTILOS_URGENCIA[urgencia]}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
        {urgencia}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${ESTILOS_URGENCIA[urgencia] ?? 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
      {urgencia}
    </span>
  );
}

function BadgeEstado({ estado }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${ESTILOS_ESTADO[estado] ?? 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
      {ESTADO_LABEL[estado] ?? estado}
    </span>
  );
}

function Campo({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

const CLS_INPUT =
  'w-full px-4 py-3 rounded-xl bg-white/80 border border-gray-200 text-sm text-gray-800 ' +
  'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 ' +
  'focus:border-[#765A05] focus:bg-white transition-all duration-200';

function SelectCampo({ name, value, onChange, placeholder, required = true, disabled = false, children }) {
  return (
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`${CLS_INPUT} appearance-none pr-10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <option value="" disabled>{placeholder}</option>
        {children}
      </select>
      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

const COLUMNAS = ['N° Expediente', 'Descripción', 'Sector', 'Urgencia', 'Estado', 'Acciones'];

const REGISTROS_POR_PAGINA = 10

// id_animal ya no se captura desde el formulario: la mayoría de las denuncias
// son sobre animales de la calle que aún no existen en el Censo. El animal
// se describe directamente en el relato (description); id_animal viaja
// siempre como null al backend.
const FORMULARIO_VACIO = {
  description: '',
  priority:    '',
  status:      'Recibida',
  id_sector:   '',
};

export default function GestionDenuncias() {
  // Controla cuál de las dos vistas se muestra: tabla (false) o formulario (true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [denuncias, setDenuncias] = useState([]);
  const [sectores,  setSectores]  = useState([]);
  const [cargando,  setCargando]  = useState(false);
  const [error,     setError]     = useState(null);

  // Totales globales (no derivados del array paginado) para las tarjetas
  const [estadisticas, setEstadisticas] = useState({
    recibidas: 0,
    enInvestigacion: 0,
    resueltas: 0,
    urgentesSinResolver: 0,
  });

  // ── Búsqueda, categoría y paginación en servidor ──────────────────────────
  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);

  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [editando,   setEditando]   = useState(null);
  const [errorForm,  setErrorForm]  = useState('');
  const [guardando,  setGuardando]  = useState(false);

  // Catálogo de sectores: se carga una sola vez. Separado de cargarDenuncias
  // a propósito — si la petición de denuncias fallaba, el select de sectores
  // se quedaba vacío para siempre aunque /api/sectors funcionara bien.
  useEffect(() => {
    cargarSectores();
    cargarEstadisticas();
  }, []);

  // Tabla de denuncias: se recarga cada vez que cambia la página, la
  // búsqueda aplicada o el estado seleccionado
  useEffect(() => {
    cargarDenuncias();
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

  const cargarDenuncias = async () => {
    try {
      setCargando(true);
      setError(null);

      const respuesta = await complaintsService.getAll({
        page: pagina,
        limit: REGISTROS_POR_PAGINA,
        search: busquedaAplicada,
        status: categoriaActiva,
      });

      const cuerpo = respuesta.data || {};
      setDenuncias(cuerpo.data || []);
      setTotalPaginas(cuerpo.metadata?.totalPages || 1);
      setTotalRegistros(cuerpo.metadata?.totalRecords || 0);
    } catch (err) {
      setError('Error al cargar denuncias: ' + (err.response?.data?.message || err.message));
      console.error('Error:', err);
      setDenuncias([]);
    } finally {
      setCargando(false);
    }
  };

  const cargarSectores = async () => {
    try {
      const respuesta = await sectoresService.getAll();
      setSectores(respuesta.data?.sectors || []);
    } catch (err) {
      console.error('Error al cargar sectores:', err);
      setSectores([]);
    }
  };

  // Totales globales de toda la base de datos — independientes de la
  // página/filtro actual de la tabla.
  const cargarEstadisticas = async () => {
    try {
      const respuesta = await complaintsService.getStats();
      setEstadisticas({
        recibidas:           respuesta.data?.recibidas ?? 0,
        enInvestigacion:      respuesta.data?.enInvestigacion ?? 0,
        resueltas:            respuesta.data?.resueltas ?? 0,
        urgentesSinResolver:  respuesta.data?.urgentesSinResolver ?? 0,
      });
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  };

  const manejarCambio = ({ target: { name, value } }) => {
    setFormulario(prev => ({ ...prev, [name]: value }));
  };

  const abrirNuevo = () => {
    setFormulario(FORMULARIO_VACIO);
    setEditando(null);
    setErrorForm('');
    setMostrarFormulario(true);
  };

  const abrirEditar = (d) => {
    setFormulario({
      description: d.description ?? '',
      priority:    d.priority ?? '',
      status:      d.status ?? 'Recibida',
      id_sector:   d.id_sector ?? '',
    });
    setEditando(d.id_complaint);
    setErrorForm('');
    setMostrarFormulario(true);
  };

  // Vuelve a la Vista 1 (tabla) sin guardar nada y limpiando los campos
  const cancelar = () => {
    setFormulario(FORMULARIO_VACIO);
    setEditando(null);
    setErrorForm('');
    setMostrarFormulario(false);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setErrorForm('');

    if (!formulario.description.trim() || !formulario.priority) {
      setErrorForm('La descripción y la prioridad son obligatorias.');
      return;
    }

    try {
      setGuardando(true);

      const payload = {
        description: formulario.description.trim(),
        priority:    formulario.priority,
        status:      formulario.status,
        id_sector:   formulario.id_sector ? Number(formulario.id_sector) : null,
        id_animal:   null,
      };

      if (editando) {
        await complaintsService.update(editando, payload);
      } else {
        await complaintsService.create(payload);
      }

      cancelar();
      await cargarDenuncias();
      await cargarEstadisticas();
    } catch (err) {
      setErrorForm('Error al guardar: ' + (err.response?.data?.message || err.message));
      console.error('Error:', err);
    } finally {
      setGuardando(false);
    }
  };

  // Acciones rápidas desde la tabla: cambian solo el estado, reutilizando
  // el mismo endpoint PUT con los datos actuales de la denuncia.
  const cambiarEstadoRapido = async (d, nuevoEstado) => {
    try {
      setCargando(true);
      await complaintsService.update(d.id_complaint, {
        description: d.description,
        priority:    d.priority,
        status:      nuevoEstado,
        id_sector:   d.id_sector,
        id_animal:   d.id_animal ?? null,
      });
      await cargarDenuncias();
      await cargarEstadisticas();
    } catch (err) {
      setError('Error al cambiar el estado: ' + (err.response?.data?.message || err.message));
      console.error('Error:', err);
    } finally {
      setCargando(false);
    }
  };

  const asignarEquipo = (d) => cambiarEstadoRapido(d, 'En_Investigación');
  const archivar = (d) => {
    if (window.confirm('¿Confirmar el cierre y archivo de este expediente?')) {
      cambiarEstadoRapido(d, 'Resuelta');
    }
  };

  const eliminar = async (d) => {
    if (!window.confirm(`¿Está seguro de que desea eliminar el expediente #${d.id_complaint}?`)) return;

    try {
      setCargando(true);
      await complaintsService.delete(d.id_complaint);
      await cargarDenuncias();
      await cargarEstadisticas();
    } catch (err) {
      setError('Error al eliminar: ' + (err.response?.data?.message || err.message));
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

  // ════════════════════════════════════════════════════════════════════════
  // VISTA 2 — FORMULARIO (registro o edición). Oculta la tabla por completo.
  // ════════════════════════════════════════════════════════════════════════
  if (mostrarFormulario) {
    return (
      <div className="space-y-5 max-w-3xl">

        <button
          type="button"
          onClick={cancelar}
          className="flex items-center gap-1.5 text-sm text-[#765A05]/65 hover:text-[#765A05] transition-colors font-medium cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver a Gestión de Denuncias
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 border border-orange-200 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
              {editando ? `Editar Expediente #${editando}` : 'Registrar Denuncia o Rescate Animal'}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Documente el caso reportado para asignar un equipo de respuesta.
            </p>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-md border border-white/60 shadow-xl shadow-[#765A05]/5 rounded-3xl overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-[#FFDF96] to-[#765A05]/40" />

          <form onSubmit={guardar} className="p-7 space-y-7">

            <div>
              <p className="text-xs font-bold text-[#765A05]/70 uppercase tracking-[0.18em] mb-4">
                Clasificación del Caso
              </p>
              <div className="grid grid-cols-2 gap-5">
                <Campo label="Nivel de Urgencia">
                  <SelectCampo name="priority" value={formulario.priority} onChange={manejarCambio} placeholder="Seleccionar...">
                    <option value="Urgente">🔴 Urgente — Acción inmediata</option>
                    <option value="Alta">🟠 Alta — Atención prioritaria</option>
                    <option value="Media">🟡 Media — Atención en 24 hrs</option>
                    <option value="Baja">🟢 Baja — Registro preventivo</option>
                  </SelectCampo>
                </Campo>

                <Campo label="Sector / Comunidad">
                  <SelectCampo name="id_sector" value={formulario.id_sector} onChange={manejarCambio} placeholder="Seleccionar sector..." required={false}>
                    {sectores.map(s => (
                      <option key={s.id_sector} value={s.id_sector}>
                        {s.community_name}{s.parish ? ` - ${s.parish}` : ''}
                      </option>
                    ))}
                  </SelectCampo>
                </Campo>
              </div>

              {editando && (
                <div className="mt-5">
                  <Campo label="Estado del Expediente">
                    <SelectCampo name="status" value={formulario.status} onChange={manejarCambio} placeholder="Seleccionar...">
                      <option value="Recibida">Recibida</option>
                      <option value="En_Investigación">En Investigación</option>
                      <option value="Resuelta">Resuelta</option>
                      <option value="Desestimada">Desestimada</option>
                    </SelectCampo>
                  </Campo>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-[#765A05]/70 uppercase tracking-[0.18em] mb-4">
                Descripción del Hecho
              </p>
              <Campo label="Relato Detallado del Caso">
                <textarea
                  name="description"
                  value={formulario.description}
                  onChange={manejarCambio}
                  rows={4}
                  placeholder="Describa con el mayor detalle posible el hecho reportado: tipo de animal, ubicación exacta, condición física, circunstancias del maltrato o abandono, testigos, información relevante para la inspección..."
                  required
                  className={`${CLS_INPUT} resize-none leading-relaxed`}
                />
              </Campo>
            </div>

            {errorForm && (
              <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {errorForm}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-100/80">
              <button
                type="button"
                onClick={cancelar}
                disabled={guardando}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-xl transition-all disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={guardando}
                className="flex items-center gap-2.5 px-6 py-2.5 bg-[#765A05] hover:bg-[#5a4304] active:bg-[#3d2d02] text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-[#765A05]/25 hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
              >
                {guardando ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {guardando ? 'Guardando...' : editando ? 'Guardar Cambios' : 'Registrar Denuncia'}
              </button>
            </div>

          </form>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // VISTA 1 — TABLA GENERAL (por defecto). Oculta el formulario por completo.
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 max-w-7xl">

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Denuncias y Rescates</h2>
            <p className="text-sm text-gray-400 mt-0.5">Reportes de maltrato y abandono animal — Misión Nevado</p>
          </div>
        </div>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 bg-[#765A05] hover:bg-[#5a4304] active:bg-[#3d2d02] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shrink-0 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          ⚠️ Registrar Denuncia
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Tarjetas de conteo — totales globales reales de Neon, no del
          array paginado. Se refrescan tras crear/editar/eliminar/cambiar
          estado para que nunca queden desincronizadas. ──────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Recibidas</p>
            <p className="text-3xl font-bold text-gray-900 mt-0.5">{estadisticas.recibidas}</p>
            <p className="text-xs text-gray-400 mt-0.5">sin equipo asignado</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
            <Eye className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">En Investigación</p>
            <p className="text-3xl font-bold text-gray-900 mt-0.5">{estadisticas.enInvestigacion}</p>
            <p className="text-xs text-gray-400 mt-0.5">equipo de campo activo</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Resueltas</p>
            <p className="text-3xl font-bold text-gray-900 mt-0.5">{estadisticas.resueltas}</p>
            <p className="text-xs text-gray-400 mt-0.5">expedientes cerrados</p>
          </div>
        </div>
      </div>

      {/* ── Tabla ────────────────────────────────────────────────── */}
      <div className="bg-white/70 backdrop-blur-md border border-white/50 shadow-xl shadow-[#765A05]/5 rounded-2xl">

        <div className="px-5 py-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por descripción..."
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
                    <Loader className="w-8 h-8 text-orange-400/60 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-400 font-medium">Cargando denuncias...</p>
                  </td>
                </tr>
              ) : denuncias.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNAS.length} className="py-20 text-center">
                    <AlertTriangle className="w-9 h-9 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 font-medium">
                      {busquedaAplicada || categoriaActiva ? 'No se encontraron expedientes' : 'No hay denuncias registradas aún'}
                    </p>
                  </td>
                </tr>
              ) : (
                denuncias.map(d => (
                  <tr key={d.id_complaint} className="border-b border-gray-50 last:border-0 hover:bg-[#FFDF96]/8 transition-colors">

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <code className="text-xs font-mono font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-md border border-gray-200 tracking-wider">
                        DEN-{String(d.id_complaint).padStart(4, '0')}
                      </code>
                    </td>

                    <td className="px-5 py-3.5 max-w-[260px]">
                      <p className="text-sm text-gray-700 truncate" title={d.description}>{d.description}</p>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <p className="text-sm text-gray-600">{d.Sector?.community_name ?? '—'}</p>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <BadgeUrgencia urgencia={d.priority} />
                    </td>

                    <td className="px-5 py-3.5">
                      <BadgeEstado estado={d.status} />
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {d.status === 'Recibida' && (
                          <button
                            onClick={() => asignarEquipo(d)}
                            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap"
                          >
                            <Users className="w-3.5 h-3.5" />
                            Asignar Equipo
                          </button>
                        )}
                        {d.status !== 'Resuelta' && d.status !== 'Desestimada' && (
                          <button
                            onClick={() => archivar(d)}
                            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-green-700 hover:bg-green-50 border border-gray-200 hover:border-green-200 px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap"
                          >
                            <Archive className="w-3.5 h-3.5" />
                            Archivar
                          </button>
                        )}
                        <button
                          onClick={() => abrirEditar(d)}
                          className="p-1.5 rounded-lg text-amber-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => eliminar(d)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {estadisticas.urgentesSinResolver > 0 && (
          <div className="px-5 py-3 border-t border-gray-50">
            <span className="flex items-center gap-1.5 text-xs text-red-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {estadisticas.urgentesSinResolver} caso{estadisticas.urgentesSinResolver !== 1 ? 's' : ''} de urgencia alta sin resolver (total Neon)
            </span>
          </div>
        )}

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
