import React, { useState, useEffect } from 'react';
import {
  Package, Plus, RefreshCw, Activity, Search, AlertTriangle,
  Gift, Boxes, X, Save, ArrowRight, ChevronLeft, ChevronDown, Loader
} from 'lucide-react';
import { inventarioService } from '../services/api';
import PaginadorPremium from '../components/PaginadorPremium';
import FiltrosPills from '../components/FiltrosPills';

const ESTILOS_STOCK = {
  Óptimo:  'bg-green-100 text-green-700 border border-green-200',
  Alerta:  'bg-amber-100 text-amber-700 border border-amber-200',
  Crítico: 'bg-red-100 text-red-700 border border-red-200',
};

function calcularEstado(supply) {
  const cant = supply.current_quantity ?? 0;
  if (cant === 0) return 'Crítico';
  const min = supply.min_stock ?? 0;
  if (min > 0) {
    if (cant <= min)       return 'Crítico';
    if (cant <= min * 1.5) return 'Alerta';
    return 'Óptimo';
  }
  return 'Óptimo';
}

function BadgeStock({ estado }) {
  if (estado === 'Crítico') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
        Crítico
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${ESTILOS_STOCK[estado] ?? 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
      {estado}
    </span>
  );
}

function calcularPct(cantidad, min) {
  if (!min || min === 0) return 60;
  return Math.min(100, Math.round((cantidad / (min * 2)) * 100));
}

function colorBarra(estado) {
  if (estado === 'Óptimo')  return 'bg-green-400';
  if (estado === 'Alerta')  return 'bg-amber-400';
  return 'bg-red-400';
}

// ─── Overlay reutilizable ────────────────────────────────────────────────────

function ModalOverlay({ onClose, children, maxWidth = 'max-w-md' }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`bg-white/95 backdrop-blur-md rounded-2xl border border-white/60 shadow-2xl shadow-[#765A05]/20 w-full ${maxWidth}`}>
        {children}
      </div>
    </div>
  );
}

// ─── Componentes auxiliares del formulario de registro ──────────────────────

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

function SelectCampo({ name, value, onChange, placeholder, required = true, children }) {
  return (
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={`${CLS_INPUT} appearance-none pr-10 cursor-pointer`}
      >
        <option value="" disabled>{placeholder}</option>
        {children}
      </select>
      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

const COLUMNAS = [
  'Código', 'Nombre del Insumo / Medicamento', 'Categoría',
  'Unidad de Medida', 'Cantidad Disponible', 'Stock Mínimo',
  'Estado del Stock', 'Acciones',
];

const FORMULARIO_VACIO = {
  material_name:    '',   // Nombre del suministro o medicamento
  category:         '',   // Categoría (ENUM en Supply_Stock)
  current_quantity: '',   // Cantidad disponible en almacén
  measurement_unit: '',   // Unidad de medida (ENUM en Supply_Stock)
  min_stock:        '',   // Umbral mínimo para disparar alertas
  batch_number:     '',   // Número de lote (opcional)
  expiration_date:  '',   // Fecha de vencimiento (opcional)
};

// Pills de "Estado del Stock" — no es una columna real en Supply_Stock, se
// deriva de current_quantity vs. min_stock (ver calcularEstado). El backend
// replica la misma regla vía CASE_ESTADO_STOCK para poder filtrar/contar.
const CATEGORIAS_ESTADO_STOCK = [
  { label: 'Todos',   value: '' },
  { label: 'Crítico', value: 'Crítico' },
  { label: 'Alerta',  value: 'Alerta' },
  { label: 'Óptimo',  value: 'Óptimo' },
];

const REGISTROS_POR_PAGINA = 4;

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────

export default function LogisticaInventario({ readOnly = false }) {
  // Controla cuál de las dos vistas se muestra: tabla (false) o formulario (true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [insumos,   setInsumos]   = useState([]);
  const [cargando,  setCargando]  = useState(false);
  const [error,     setError]     = useState(null);

  // Totales globales (no derivados del array paginado) para las tarjetas
  const [estadisticas, setEstadisticas] = useState({ total: 0, criticos: 0, alertas: 0, enAlerta: 0 });

  // ── Búsqueda, estado del stock y paginación en servidor ──────────────────
  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);

  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [guardando,  setGuardando]  = useState(false);
  const [errorForm,  setErrorForm]  = useState('');

  // Modal Ajustar Stock
  const [modalAjuste,   setModalAjuste]   = useState(null);
  const [nuevaCantidad, setNuevaCantidad] = useState('');
  const [motivoAjuste,  setMotivoAjuste]  = useState('');
  const [errorModal,    setErrorModal]    = useState('');
  const [ajustando,     setAjustando]     = useState(false);

  // Modal Historial — se consulta al backend (GET /supply-stock/history/:id)
  const [modalHistorial,       setModalHistorial]       = useState(null);
  const [movimientosHistorial, setMovimientosHistorial] = useState([]);
  const [cargandoHistorial,    setCargandoHistorial]    = useState(false);

  // Se recarga cada vez que cambia la página, la búsqueda aplicada o el estado
  useEffect(() => {
    cargarInsumos();
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

  const cargarInsumos = async () => {
    try {
      setCargando(true);
      setError(null);
      const respuesta = await inventarioService.getAll({
        page: pagina,
        limit: REGISTROS_POR_PAGINA,
        search: busquedaAplicada,
        estado: categoriaActiva,
      });
      const cuerpo = respuesta.data || {};
      setInsumos(cuerpo.data || []);
      setTotalPaginas(cuerpo.metadata?.totalPages || 1);
      setTotalRegistros(cuerpo.metadata?.totalRecords || 0);
    } catch (err) {
      setError('Error al cargar el inventario: ' + (err.response?.data?.message || err.message));
      console.error('Error:', err);
      setInsumos([]);
    } finally {
      setCargando(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const respuesta = await inventarioService.getStats();
      setEstadisticas({
        total:    respuesta.data?.total    ?? 0,
        criticos: respuesta.data?.criticos ?? 0,
        alertas:  respuesta.data?.alertas  ?? 0,
        enAlerta: respuesta.data?.enAlerta ?? 0,
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

  // ── Vista 2: Formulario de registro ───────────────────────────────────────

  const abrirNuevoRegistro = () => {
    setErrorForm('');
    setFormulario(FORMULARIO_VACIO);
    setMostrarFormulario(true);
  };

  const manejarCambioForm = ({ target: { name, value } }) => {
    setFormulario(prev => ({ ...prev, [name]: value }));
  };

  // Vuelve a la Vista 1 (tabla) sin guardar nada y limpiando los campos
  const cancelarFormulario = () => {
    setFormulario(FORMULARIO_VACIO);
    setErrorForm('');
    setMostrarFormulario(false);
  };

  const guardarInsumo = async (e) => {
    e.preventDefault();
    setErrorForm('');

    try {
      setGuardando(true);
      await inventarioService.create({
        material_name:    formulario.material_name.trim(),
        category:         formulario.category,
        current_quantity: Number(formulario.current_quantity),
        measurement_unit: formulario.measurement_unit,
        min_stock:        formulario.min_stock !== '' ? Number(formulario.min_stock) : null,
        batch_number:     formulario.batch_number || null,
        expiration_date:  formulario.expiration_date || null,
      });

      // Éxito: limpia el formulario, vuelve a la Vista 1 (tabla) y refresca el inventario
      setFormulario(FORMULARIO_VACIO);
      setMostrarFormulario(false);
      await cargarInsumos();
      await cargarEstadisticas();
    } catch (err) {
      setErrorForm('Error al registrar el suministro: ' + (err.response?.data?.message || err.message));
      console.error('Error:', err);
    } finally {
      setGuardando(false);
    }
  };

  // ── Modal Ajustar Stock ───────────────────────────────────────────────────

  const abrirAjuste = (insumo) => {
    setErrorModal('');
    setNuevaCantidad(String(insumo.current_quantity ?? 0));
    setMotivoAjuste('');
    setModalAjuste(insumo);
  };

  const confirmarAjuste = async () => {
    const cantidad = parseInt(nuevaCantidad, 10);
    if (isNaN(cantidad) || cantidad < 0) {
      setErrorModal('Ingresa un número entero válido mayor o igual a 0.');
      return;
    }

    try {
      setAjustando(true);
      await inventarioService.ajustarStock(
        modalAjuste.id_supply,
        cantidad,
        motivoAjuste.trim() || 'Ajuste manual desde panel'
      );
      setModalAjuste(null);
      await cargarInsumos();
      await cargarEstadisticas();
    } catch (err) {
      setErrorModal('Error al ajustar el stock: ' + (err.response?.data?.message || err.message));
      console.error('Error:', err);
    } finally {
      setAjustando(false);
    }
  };

  // ── Modal Historial ───────────────────────────────────────────────────────

  const abrirHistorial = async (insumo) => {
    setModalHistorial(insumo);
    setMovimientosHistorial([]);
    try {
      setCargandoHistorial(true);
      const respuesta = await inventarioService.getHistorial(insumo.id_supply);
      setMovimientosHistorial(respuesta.data?.movements || []);
    } catch (err) {
      console.error('Error al cargar historial:', err);
    } finally {
      setCargandoHistorial(false);
    }
  };

  // ── Estado visual por fila ────────────────────────────────────────────────

  const insumosConEstado = insumos.map(ins => ({
    ...ins,
    _estado: calcularEstado(ins),
  }));

  // ════════════════════════════════════════════════════════════════════════
  // VISTA 2 — FORMULARIO DE REGISTRO. Oculta la tabla por completo.
  // ════════════════════════════════════════════════════════════════════════
  if (mostrarFormulario) {
    return (
      <div className="space-y-5 max-w-3xl">

        {/* ── Navegación de retorno ──────────────────────────────── */}
        <button
          type="button"
          onClick={cancelarFormulario}
          className="flex items-center gap-1.5 text-sm text-[#765A05]/65 hover:text-[#765A05] transition-colors font-medium cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver a Logística e Inventario
        </button>

        {/* ── Encabezado del módulo ──────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#765A05]/10 border border-[#765A05]/20 rounded-xl flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-[#765A05]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
              Registrar Nuevo Suministro
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Registre el ingreso de medicamentos o suministros al almacén de la fundación.
            </p>
          </div>
        </div>

        {/* ── Tarjeta del formulario ─────────────────────────────── */}
        <div className="bg-white/60 backdrop-blur-md border border-white/60 shadow-xl shadow-[#765A05]/5 rounded-3xl overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#765A05] via-[#FFDF96] to-[#765A05]/40" />

          <form onSubmit={guardarInsumo} className="p-7 space-y-7">

            {/* ── SECCIÓN 1: Información del Suministro ─────────── */}
            <div>
              <p className="text-xs font-bold text-[#765A05]/70 uppercase tracking-[0.18em] mb-4">
                Información del Suministro
              </p>

              <div className="grid grid-cols-3 gap-5">
                <div className="col-span-2">
                  <Campo label="Nombre del Suministro / Medicamento">
                    <input
                      type="text"
                      name="material_name"
                      value={formulario.material_name}
                      onChange={manejarCambioForm}
                      placeholder="Ej: Vacuna Antirrábica, Suero Fisiológico 0.9%..."
                      required
                      className={CLS_INPUT}
                    />
                  </Campo>
                </div>

                <Campo label="Categoría">
                  <SelectCampo
                    name="category"
                    value={formulario.category}
                    onChange={manejarCambioForm}
                    placeholder="Seleccionar..."
                  >
                    <option value="Vacuna">💉 Vacuna</option>
                    <option value="Antibiótico">💊 Antibiótico</option>
                    <option value="Desparasitante">🪱 Desparasitante</option>
                    <option value="Material_Médico">🩺 Material Médico</option>
                    <option value="Otro">📦 Otro</option>
                  </SelectCampo>
                </Campo>
              </div>
            </div>

            {/* ── SECCIÓN 2: Control de Ingreso ─────────────────── */}
            <div>
              <p className="text-xs font-bold text-[#765A05]/70 uppercase tracking-[0.18em] mb-4">
                Control de Ingreso al Almacén
              </p>

              <div className="grid grid-cols-3 gap-5">
                <Campo label="Cantidad Disponible">
                  <input
                    type="number"
                    name="current_quantity"
                    value={formulario.current_quantity}
                    onChange={manejarCambioForm}
                    min="0"
                    placeholder="Ej: 50"
                    required
                    className={CLS_INPUT}
                  />
                </Campo>

                <Campo label="Unidad de Medida">
                  <SelectCampo
                    name="measurement_unit"
                    value={formulario.measurement_unit}
                    onChange={manejarCambioForm}
                    placeholder="Seleccionar..."
                  >
                    <option value="Unidad">Unidad</option>
                    <option value="ML">ML</option>
                    <option value="MG">MG</option>
                    <option value="Frasco">Frasco</option>
                    <option value="Caja">Caja</option>
                  </SelectCampo>
                </Campo>

                <Campo label="Stock Mínimo">
                  <input
                    type="number"
                    name="min_stock"
                    value={formulario.min_stock}
                    onChange={manejarCambioForm}
                    min="0"
                    placeholder="Ej: 20"
                    required={false}
                    className={CLS_INPUT}
                  />
                </Campo>
              </div>

              <div className="grid grid-cols-2 gap-5 mt-5">
                <Campo label="Número de Lote">
                  <input
                    type="text"
                    name="batch_number"
                    value={formulario.batch_number}
                    onChange={manejarCambioForm}
                    placeholder="Ej: VAC-001"
                    className={CLS_INPUT}
                  />
                </Campo>

                <Campo label="Fecha de Vencimiento">
                  <input
                    type="date"
                    name="expiration_date"
                    value={formulario.expiration_date}
                    onChange={manejarCambioForm}
                    className={CLS_INPUT}
                  />
                </Campo>
              </div>
            </div>

            {errorForm && (
              <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {errorForm}
              </div>
            )}

            {/* ── BOTONES DE ACCIÓN ─────────────────────────────── */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100/80">
              <button
                type="button"
                onClick={cancelarFormulario}
                disabled={guardando}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-xl transition-all disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={guardando}
                className="flex items-center gap-2.5 px-6 py-2.5 bg-[#765A05] hover:bg-[#5a4304] active:bg-[#3d2d02] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-[#765A05]/25 hover:scale-[1.01]"
              >
                {guardando ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {guardando ? 'Guardando...' : 'Registrar Entrada de Suministros'}
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
          <div className="w-10 h-10 bg-[#765A05]/10 border border-[#765A05]/20 backdrop-blur-md rounded-xl flex items-center justify-center shrink-0 shadow-xs">
            <Package className="w-5 h-5 text-[#765A05]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Logística y Control de Insumos Médicos</h2>
            <p className="text-sm text-gray-400 mt-0.5">Gestión del almacén veterinario — Misión Nevado</p>
          </div>
        </div>
        {!readOnly && (
          <button
            onClick={abrirNuevoRegistro}
            className="flex items-center gap-2 bg-[#765A05] hover:bg-[#5a4304] active:bg-[#3d2d02] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shrink-0 shadow-md shadow-[#765A05]/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            📦 Registrar Entrada de Insumos
          </button>
        )}
      </div>

      {/* ── Error de carga ── */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Tarjetas de resumen — totales globales reales de Neon, no del
          array paginado. Se refrescan tras cada ajuste/registro. ──────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-[#765A05] to-[#5a4304] rounded-2xl shadow-md p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <Boxes className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#FFDF96]/80 uppercase tracking-wider">Total Insumos Médicos</p>
            <p className="text-3xl font-bold text-white mt-0.5">{estadisticas.total}</p>
            <p className="text-xs text-[#FFDF96]/80 mt-0.5">referencias en almacén</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Medicamentos en Alerta</p>
            <p className="text-3xl font-bold text-gray-900 mt-0.5">{estadisticas.enAlerta}</p>
            <p className="text-xs text-gray-400 mt-0.5">{estadisticas.criticos} en estado crítico</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-teal-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5 text-teal-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Suministros Registrados</p>
            <p className="text-3xl font-bold text-gray-900 mt-0.5">{estadisticas.total}</p>
            <p className="text-xs text-gray-400 mt-0.5">en el sistema</p>
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
              placeholder="Buscar por nombre, categoría o lote..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 focus:border-[#765A05] transition-all"
            />
          </div>
          <span className="text-xs text-gray-500 font-medium bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded-lg shrink-0">
            {totalRegistros} suministro{totalRegistros !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="px-5 py-4 border-b border-gray-100">
          <FiltrosPills opciones={CATEGORIAS_ESTADO_STOCK} activo={categoriaActiva} onCambio={seleccionarCategoria} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {COLUMNAS.map((col, i) => (
                  <th
                    key={col}
                    className={`text-[11px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3 whitespace-nowrap ${i === COLUMNAS.length - 1 ? 'text-right' : 'text-left'}`}
                  >
                    {readOnly && col === 'Acciones' ? 'Consultar' : col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={COLUMNAS.length} className="py-20 text-center">
                    <Loader className="w-8 h-8 text-[#765A05]/40 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-400 font-medium">Cargando inventario...</p>
                  </td>
                </tr>
              ) : insumosConEstado.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNAS.length} className="py-20 text-center">
                    <Package className="w-9 h-9 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 font-medium">
                      {busquedaAplicada || categoriaActiva ? 'No se encontraron coincidencias' : 'No se encontraron suministros'}
                    </p>
                  </td>
                </tr>
              ) : (
                insumosConEstado.map(ins => {
                  const pct        = calcularPct(ins.current_quantity, ins.min_stock);
                  const barra      = colorBarra(ins._estado);
                  const cifraColor = ins._estado === 'Crítico'
                    ? 'text-red-600 font-bold'
                    : ins._estado === 'Alerta'
                      ? 'text-amber-600 font-semibold'
                      : 'text-gray-900 font-medium';

                  return (
                    <tr key={ins.id_supply} className="border-b border-gray-50 last:border-0 hover:bg-[#FFDF96]/10 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <code className="text-xs font-mono font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-md border border-gray-200">
                          {ins.batch_number ?? `ID-${ins.id_supply}`}
                        </code>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">{ins.material_name}</p>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md">
                          {ins.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <p className="text-sm text-gray-500">{ins.measurement_unit}</p>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col gap-1.5">
                          <span className={`text-sm ${cifraColor}`}>
                            {ins.current_quantity}{' '}
                            <span className="text-xs font-normal text-gray-400">{ins.measurement_unit}</span>
                          </span>
                          <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${barra} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <p className="text-sm text-gray-500">
                          {ins.min_stock ?? '—'}{' '}
                          {ins.min_stock && <span className="text-xs text-gray-400">{ins.measurement_unit}</span>}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <BadgeStock estado={ins._estado} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {!readOnly && (
                            <button
                              onClick={() => abrirAjuste(ins)}
                              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#765A05] hover:bg-[#FFDF96]/20 border border-gray-200 hover:border-[#FFDF96]/40 px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              Ajustar Stock
                            </button>
                          )}
                          <button
                            onClick={() => abrirHistorial(ins)}
                            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-teal-700 hover:bg-teal-50 border border-gray-200 hover:border-teal-200 px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap"
                          >
                            <Activity className="w-3.5 h-3.5" />
                            Historial
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3.5 border-t border-gray-50 flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-gray-400">
            {estadisticas.total} suministros registrados en el almacén
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-green-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
              {Math.max(0, estadisticas.total - estadisticas.enAlerta)} en nivel óptimo
            </span>
            <span className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              {estadisticas.alertas} en alerta
            </span>
            <span className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse inline-block" />
              {estadisticas.criticos} en estado crítico
            </span>
          </div>
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
          MODAL AJUSTAR STOCK — PATCH /api/supply-stock/:id
      ══════════════════════════════════════════════════════════════════ */}
      {modalAjuste && (
        <ModalOverlay onClose={() => setModalAjuste(null)}>
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-800">Ajustar Stock</h3>
              <p className="text-xs text-gray-400 mt-0.5">{modalAjuste.material_name}</p>
            </div>
            <button
              onClick={() => setModalAjuste(null)}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center gap-4 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Stock actual</p>
                <p className="text-2xl font-bold text-gray-800 mt-0.5">
                  {modalAjuste.current_quantity}
                  <span className="text-sm font-normal text-gray-400 ml-1.5">{modalAjuste.measurement_unit}</span>
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nueva cantidad</p>
                <p className="text-2xl font-bold text-[#765A05] mt-0.5">
                  {nuevaCantidad !== '' ? nuevaCantidad : '?'}
                  <span className="text-sm font-normal text-gray-400 ml-1.5">{modalAjuste.measurement_unit}</span>
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nueva cantidad disponible *</label>
              <input
                type="number"
                min="0"
                step="1"
                value={nuevaCantidad}
                onChange={e => setNuevaCantidad(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 focus:border-[#765A05] transition"
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Motivo del ajuste</label>
              <input
                type="text"
                value={motivoAjuste}
                onChange={e => setMotivoAjuste(e.target.value)}
                placeholder="Ej: Inventario físico, devolución, consumo médico..."
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 focus:border-[#765A05] transition"
              />
            </div>
          </div>

          {errorModal && (
            <div className="mx-6 mb-4 flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {errorModal}
            </div>
          )}

          <div className="px-6 pb-5 flex justify-end gap-2.5">
            <button
              onClick={() => setModalAjuste(null)}
              disabled={ajustando}
              className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={confirmarAjuste}
              disabled={ajustando}
              className="flex items-center gap-2 px-4 py-2 bg-[#765A05] hover:bg-[#5a4304] text-white text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {ajustando ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {ajustando ? 'Guardando...' : 'Confirmar ajuste'}
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL HISTORIAL — GET /api/supply-stock/history/:id
      ══════════════════════════════════════════════════════════════════ */}
      {modalHistorial && (
        <ModalOverlay onClose={() => setModalHistorial(null)} maxWidth="max-w-lg">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-800">Historial de Movimientos</h3>
              <p className="text-xs text-gray-400 mt-0.5">{modalHistorial.material_name}</p>
            </div>
            <button onClick={() => setModalHistorial(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-6 py-4 max-h-80 overflow-y-auto space-y-2.5">
            {cargandoHistorial ? (
              <div className="text-center py-10">
                <Loader className="w-8 h-8 text-[#765A05]/40 animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-400">Cargando historial...</p>
              </div>
            ) : movimientosHistorial.length === 0 ? (
              <div className="text-center py-10">
                <Activity className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Sin movimientos registrados aún.</p>
                <p className="text-xs text-gray-300 mt-1">Los ajustes de stock aparecerán aquí.</p>
              </div>
            ) : (
              movimientosHistorial.map((mov) => {
                const diff   = mov.new_quantity - mov.previous_quantity;
                const esAlza = diff >= 0;
                return (
                  <div key={mov.id_movement} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                    <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${esAlza ? 'bg-green-400' : 'bg-red-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-800">
                          {mov.previous_quantity}
                          <ArrowRight className="w-3.5 h-3.5 inline mx-1 text-gray-400" />
                          <span className={esAlza ? 'text-green-600' : 'text-red-600'}>{mov.new_quantity}</span>
                          <span className="text-xs font-normal text-gray-400 ml-1">{modalHistorial.measurement_unit}</span>
                        </p>
                        <span className={`text-xs font-bold ${esAlza ? 'text-green-600' : 'text-red-600'}`}>
                          {esAlza ? '+' : ''}{diff}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{mov.adjustment_reason}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {mov.createdAt ? new Date(mov.createdAt).toLocaleString('es-VE') : '—'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="px-6 pb-5 pt-2 flex justify-end border-t border-gray-50">
            <button onClick={() => setModalHistorial(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
              Cerrar
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
