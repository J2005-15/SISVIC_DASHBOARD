import React, { useState, useEffect } from 'react';
import {
  Stethoscope, Plus, Eye, Pencil, Search,
  Clock, CheckCircle, AlertTriangle, X, Save, Printer, Loader
} from 'lucide-react';
import RecipeTemplate from './RecipeTemplate';
import { consultasService } from '../services/api';
import PaginadorPremium from '../components/PaginadorPremium';
import FiltrosPills from '../components/FiltrosPills';

// Deriva el estado visual a partir de la fecha de la cita
function derivarEstado(appointmentDate) {
  if (!appointmentDate) return 'Pendiente';
  const hoy   = new Date();
  const fecha = new Date(appointmentDate);
  hoy.setHours(0, 0, 0, 0);
  fecha.setHours(0, 0, 0, 0);
  return fecha <= hoy ? 'Atendido' : 'Pendiente';
}

const ESTILOS_CONSULTA = {
  Atendido:  'bg-green-100 text-green-700 border border-green-200',
  Pendiente: 'bg-amber-100 text-amber-700 border border-amber-200',
};

function BadgeConsulta({ estado }) {
  if (estado === 'Emergencia') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
        Emergencia
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${ESTILOS_CONSULTA[estado] ?? 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
      {estado}
    </span>
  );
}

// ─── Overlay reutilizable ────────────────────────────────────────────────────

function ModalOverlay({ onClose, children, maxWidth = 'max-w-xl' }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`bg-white/95 backdrop-blur-md rounded-2xl border border-white/60 shadow-2xl shadow-[#765A05]/20 w-full ${maxWidth}`}>
        {children}
      </div>
    </div>
  );
}

const COLUMNAS = [
  'Fecha', 'Paciente', 'Propietario', 'Motivo de Consulta',
  'Diagnóstico Preliminar', 'Veterinario de Guardia', 'Estado', 'Acciones',
];

// Pills de motivo de consulta — value vacío ('Todos') no envía filtro al
// backend. Mapea 1:1 al dropdown fijo de FormularioConsultaMedica.jsx.
const CATEGORIAS_MOTIVO = [
  { label: 'Todos',           value: '' },
  { label: 'Vacunación',      value: 'Vacunación' },
  { label: 'Enfermedad',      value: 'Enfermedad' },
  { label: 'Control General', value: 'Control' },
  { label: 'Emergencia',      value: 'Emergencia' },
];

const REGISTROS_POR_PAGINA = 4;

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────

export default function ConsultaMedica({ setVistaActual, readOnly = false }) {
  const [consultas,   setConsultas]   = useState([]);
  const [cargando,    setCargando]   = useState(false);
  const [error,       setError]      = useState(null);

  // Totales globales (no derivados del array paginado) para las tarjetas
  const [estadisticas, setEstadisticas] = useState({ pendientes: 0, atendidos: 0, emergencias: 0 });

  // ── Búsqueda, motivo y paginación en servidor ────────────────────────────
  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);

  // Modales
  const [modalHistoria,    setModalHistoria]    = useState(null);
  const [modalEditar,      setModalEditar]      = useState(null);
  const [errorModal,       setErrorModal]       = useState('');
  const [consultaImprimir, setConsultaImprimir] = useState(null);

  // Se recarga cada vez que cambia la página, la búsqueda aplicada o el motivo
  useEffect(() => {
    cargarConsultas()
  }, [pagina, busquedaAplicada, categoriaActiva])

  // Las estadísticas globales se cargan una sola vez al montar
  useEffect(() => {
    cargarEstadisticas()
  }, [])

  // Debounce: espera 400ms de inactividad antes de filtrar, y vuelve a la
  // página 1 (un filtro nuevo invalida la posición de paginación actual)
  useEffect(() => {
    const id = setTimeout(() => {
      setPagina(1);
      setBusquedaAplicada(busqueda);
    }, 400);
    return () => clearTimeout(id);
  }, [busqueda]);

  const cargarConsultas = async () => {
    try {
      setCargando(true)
      setError(null)
      const respuesta = await consultasService.getAll({
        page: pagina,
        limit: REGISTROS_POR_PAGINA,
        search: busquedaAplicada,
        motivo: categoriaActiva,
      })
      const cuerpo = respuesta.data || {}
      setConsultas(cuerpo.data || [])
      setTotalPaginas(cuerpo.metadata?.totalPages || 1)
      setTotalRegistros(cuerpo.metadata?.totalRecords || 0)
    } catch (err) {
      const mensaje = err.response?.data?.message || err.message || 'Error al conectar con el servidor'
      setError('Error al cargar consultas médicas: ' + mensaje)
      console.error('Error:', err)
      setConsultas([])
    } finally {
      setCargando(false)
    }
  }

  const cargarEstadisticas = async () => {
    try {
      const respuesta = await consultasService.getStats();
      setEstadisticas({
        pendientes:  respuesta.data?.pendientes  ?? 0,
        atendidos:   respuesta.data?.atendidos   ?? 0,
        emergencias: respuesta.data?.emergencias ?? 0,
      });
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  };

  // Cambia el motivo activo y vuelve a la página 1 — un filtro nuevo
  // invalida la posición de paginación que tenías antes
  const seleccionarCategoria = (valor) => {
    setPagina(1);
    setCategoriaActiva(valor);
  };

  // Dispara window.print() después de que React pinte el RecipeTemplate
  useEffect(() => {
    if (!consultaImprimir) return;
    const id = setTimeout(() => {
      window.print();
      setConsultaImprimir(null);
    }, 100);
    return () => clearTimeout(id);
  }, [consultaImprimir]);

  // Formulario edición
  const [form, setForm] = useState({
    consultation_reason: '',
    diagnosis:           '',
    treatment:           '',
    weight_kg:           '',
    temperature:         '',
    appointment_date:    '',
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const abrirHistoria = (c) => {
    setErrorModal('');
    setModalHistoria(c);
  };

  const abrirEditar = (c) => {
    setErrorModal('');
    const fecha = c.appointment_date
      ? new Date(c.appointment_date).toISOString().slice(0, 10)
      : '';
    setForm({
      consultation_reason: c.consultation_reason ?? '',
      diagnosis:           c.diagnosis           ?? '',
      treatment:           c.treatment           ?? '',
      weight_kg:           c.weight_kg            != null ? String(c.weight_kg)   : '',
      temperature:         c.temperature          != null ? String(c.temperature) : '',
      appointment_date:    fecha,
    });
    setModalEditar(c);
  };

  const confirmarEditar = async () => {
    if (!form.consultation_reason.trim()) {
      setErrorModal('El motivo de consulta no puede estar vacío.');
      return;
    }
    try {
      await consultasService.update(modalEditar.id_record, {
        consultation_reason: form.consultation_reason,
        diagnosis:           form.diagnosis,
        treatment:           form.treatment,
        weight_kg:           form.weight_kg   !== '' ? Number(form.weight_kg)   : null,
        temperature:         form.temperature !== '' ? Number(form.temperature) : null,
        appointment_date:    form.appointment_date || modalEditar.appointment_date,
      });
      setModalEditar(null);
      await cargarConsultas();
      await cargarEstadisticas();
    } catch (err) {
      setErrorModal('Error: ' + (err.response?.data?.message || err.message));
      console.error('Error:', err);
    }
  };

  const actualizarForm = (campo, valor) => setForm(prev => ({ ...prev, [campo]: valor }));

  // ── Estado visual por fila ────────────────────────────────────────────────

  const consultasConEstado = consultas.map(c => ({
    ...c,
    _estado: derivarEstado(c.appointment_date),
  }));

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-7xl">

      {/* ── Error de carga ── */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Encabezado ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#765A05]/10 rounded-xl flex items-center justify-center shrink-0">
            <Stethoscope className="w-5 h-5 text-[#765A05]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Control de Consultas Médicas</h2>
            <p className="text-sm text-gray-400 mt-0.5">Registro de atención veterinaria — Misión Nevado</p>
          </div>
        </div>
        {!readOnly && (
          <button
            onClick={() => setVistaActual('formulario-consulta')}
            className="flex items-center gap-2 bg-[#765A05] hover:bg-[#5a4304] active:bg-[#3d2d02] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            🩺 Registrar Nueva Consulta
          </button>
        )}
      </div>

      {/* ── Tarjetas de conteo — totales globales reales de Neon, no del
          array paginado. Se refrescan tras cada edición. ──────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pendientes</p>
            <p className="text-3xl font-bold text-gray-900 mt-0.5">{estadisticas.pendientes}</p>
            <p className="text-xs text-gray-400 mt-0.5">en espera de atención</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Atendidos</p>
            <p className="text-3xl font-bold text-gray-900 mt-0.5">{estadisticas.atendidos}</p>
            <p className="text-xs text-gray-400 mt-0.5">consultas completadas</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Emergencias</p>
            <p className="text-3xl font-bold text-gray-900 mt-0.5">{estadisticas.emergencias}</p>
            <p className="text-xs text-gray-400 mt-0.5">atención prioritaria</p>
          </div>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="bg-white/70 backdrop-blur-md border border-white/50 shadow-xl shadow-[#765A05]/5 rounded-2xl">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por paciente, veterinario o motivo..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 focus:border-[#765A05] transition-all"
            />
          </div>
          <span className="text-xs text-gray-500 font-medium bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded-lg shrink-0">
            {totalRegistros} registro{totalRegistros !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="px-5 py-4 border-b border-gray-100">
          <FiltrosPills opciones={CATEGORIAS_MOTIVO} activo={categoriaActiva} onCambio={seleccionarCategoria} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
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
                    <Loader className="w-8 h-8 text-[#765A05]/40 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-400 font-medium">Cargando consultas médicas...</p>
                  </td>
                </tr>
              ) : consultasConEstado.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNAS.length} className="py-20 text-center">
                    <Stethoscope className="w-9 h-9 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 font-medium">
                      {busquedaAplicada || categoriaActiva ? 'No se encontraron coincidencias' : 'No se encontraron consultas'}
                    </p>
                  </td>
                </tr>
              ) : (
                consultasConEstado.map(c => (
                  <tr key={c.id_record} className="border-b border-gray-50 last:border-0 hover:bg-[#FFDF96]/10 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <p className="text-sm text-gray-600 font-medium">
                        {c.appointment_date ? new Date(c.appointment_date).toLocaleDateString('es-VE') : '—'}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <p className="text-sm font-semibold text-gray-900">
                        {c.Animal_Census?.animal_name ?? `Consulta #${c.id_record}`}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <code className="text-xs font-mono text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                        {c.User?.full_name ?? '—'}
                      </code>
                    </td>
                    <td className="px-5 py-3.5 max-w-[200px]">
                      <p className="text-sm text-gray-700 truncate" title={c.consultation_reason}>{c.consultation_reason}</p>
                    </td>
                    <td className="px-5 py-3.5 max-w-[220px]">
                      <p className="text-sm text-gray-500 truncate" title={c.diagnosis}>{c.diagnosis}</p>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-800">{c.User?.full_name ?? '—'}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <BadgeConsulta estado={c._estado} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => abrirHistoria(c)}
                          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#765A05] hover:bg-[#FFDF96]/20 border border-gray-200 hover:border-[#FFDF96]/40 px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ver Historia
                        </button>
                        <button
                          onClick={() => setConsultaImprimir(c)}
                          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-purple-700 hover:bg-purple-50 border border-gray-200 hover:border-purple-200 px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Imprimir Récipe
                        </button>
                        {!readOnly && (
                          <button
                            onClick={() => abrirEditar(c)}
                            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-green-700 hover:bg-green-50 border border-gray-200 hover:border-green-200 px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Editar
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

      {/* ══════════════════════════════════════════════════════════════════
          MODAL VER HISTORIA — datos del array local
      ══════════════════════════════════════════════════════════════════ */}
      {modalHistoria && (
        <ModalOverlay onClose={() => setModalHistoria(null)} maxWidth="max-w-lg">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-800">
                Historia Clínica — {modalHistoria.Animal_Census?.animal_name ?? `Consulta #${modalHistoria.id_record}`}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {modalHistoria.appointment_date
                  ? new Date(modalHistoria.appointment_date).toLocaleDateString('es-VE', { dateStyle: 'long' })
                  : 'Sin fecha registrada'}
              </p>
            </div>
            <button onClick={() => setModalHistoria(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            {[
              { label: 'Motivo de Consulta',     value: modalHistoria.consultation_reason },
              { label: 'Diagnóstico',            value: modalHistoria.diagnosis           },
              { label: 'Tratamiento Indicado',   value: modalHistoria.treatment           },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-sm text-gray-800 bg-gray-50 rounded-xl px-3.5 py-2.5 border border-gray-100 leading-relaxed">
                  {value ?? '—'}
                </p>
              </div>
            ))}

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Peso (kg)',    value: modalHistoria.weight_kg   != null ? `${modalHistoria.weight_kg} kg`  : '—' },
                { label: 'Temperatura', value: modalHistoria.temperature  != null ? `${modalHistoria.temperature} °C` : '—' },
                { label: 'Veterinario', value: modalHistoria.User?.full_name ?? '—' },
                { label: 'Estado',      value: <BadgeConsulta estado={derivarEstado(modalHistoria.appointment_date)} /> },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                  <div className="text-sm font-semibold text-gray-800 mt-0.5">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 pb-5 flex justify-end">
            <button onClick={() => setModalHistoria(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
              Cerrar
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL EDITAR — Actualiza el registro vía PUT /api/medical-records/:id
      ══════════════════════════════════════════════════════════════════ */}
      {modalEditar && (
        <ModalOverlay onClose={() => setModalEditar(null)} maxWidth="max-w-lg">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-800">
              Editar Consulta — {modalEditar.Animal_Census?.animal_name ?? `#${modalEditar.id_record}`}
            </h3>
            <button
              onClick={() => setModalEditar(null)}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            {[
              { campo: 'consultation_reason', label: 'Motivo de Consulta' },
              { campo: 'diagnosis',           label: 'Diagnóstico'        },
              { campo: 'treatment',           label: 'Tratamiento'        },
            ].map(({ campo, label }) => (
              <div key={campo} className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>
                <textarea
                  rows={2}
                  value={form[campo]}
                  onChange={e => actualizarForm(campo, e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 focus:border-[#765A05] transition"
                />
              </div>
            ))}

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Peso (kg)</label>
                <input
                  type="number" step="0.1" min="0"
                  value={form.weight_kg}
                  onChange={e => actualizarForm('weight_kg', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 focus:border-[#765A05] transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Temp. (°C)</label>
                <input
                  type="number" step="0.1" min="0"
                  value={form.temperature}
                  onChange={e => actualizarForm('temperature', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 focus:border-[#765A05] transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fecha Cita</label>
                <input
                  type="date"
                  value={form.appointment_date}
                  onChange={e => actualizarForm('appointment_date', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 focus:border-[#765A05] transition"
                />
              </div>
            </div>
          </div>

          {errorModal && (
            <div className="mx-6 mb-4 flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {errorModal}
            </div>
          )}

          <div className="px-6 pb-5 flex justify-end gap-2.5">
            <button
              onClick={() => setModalEditar(null)}
              className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmarEditar}
              className="flex items-center gap-2 px-4 py-2 bg-[#765A05] hover:bg-[#5a4304] text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              Guardar cambios
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* Área de impresión — fuera de pantalla en UI, hoja completa al imprimir */}
      <div className="print-recipe-area">
        <RecipeTemplate consulta={consultaImprimir} />
      </div>
    </div>
  );
}
