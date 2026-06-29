import React, { useState, useEffect } from 'react';
import { Stethoscope, ChevronLeft, ChevronDown, AlertTriangle, Loader, Plus, Trash2 } from 'lucide-react';
import { consultasService, censoService, inventarioService } from '../services/api';

// ── Estilo base compartido ────────────────────────────────────────────────────
const CLS_INPUT =
  'w-full px-4 py-3 rounded-xl bg-white/80 border border-gray-200 text-sm text-gray-800 ' +
  'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 ' +
  'focus:border-[#765A05] focus:bg-white transition-all duration-200';

// ── Etiqueta de campo ─────────────────────────────────────────────────────────
function Campo({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Select con flecha personalizada ──────────────────────────────────────────
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

// ─── ESTADO INICIAL — nombres coinciden con columnas de Medical_Records ──────
const FORMULARIO_VACIO = {
  id_animal:           '',   // Paciente seleccionado (Animal_Census)
  consultation_reason: '',   // Motivo de la consulta
  diagnosis:           '',   // Diagnóstico clínico
  treatment:           '',   // Tratamiento y suministros recetados
  weight_kg:           '',   // Peso del paciente en la consulta
  temperature:         '',   // Temperatura corporal del paciente
  appointment_date:    '',   // Fecha de la atención
};

// Fila vacía para una nueva línea de insumo utilizado
const FILA_INSUMO_VACIA = { id_supply: '', used_quantity: 1 };

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────
export default function FormularioConsultaMedica({ setVistaActual }) {
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [animales,   setAnimales]   = useState([]);
  const [cargandoAnimales, setCargandoAnimales] = useState(true);
  const [guardando,  setGuardando]  = useState(false);
  const [errorForm,  setErrorForm]  = useState('');

  // Inventario disponible (para el selector de insumos) y filas dinámicas
  const [inventario,        setInventario]        = useState([]);
  const [cargandoInventario, setCargandoInventario] = useState(true);
  const [suministrosUsados, setSuministrosUsados]  = useState([]);

  // Cargar lista de animales del Censo Animal para el selector de paciente
  useEffect(() => {
    const cargarAnimales = async () => {
      try {
        setCargandoAnimales(true);
        // limit alto: este selector necesita el censo completo, no una página.
        const respuesta = await censoService.getAll({ limit: 1000 });
        const datos = respuesta.data?.data || [];
        setAnimales(Array.isArray(datos) ? datos : []);
      } catch (err) {
        setErrorForm('No se pudo cargar el listado de animales del Censo: ' + (err.response?.data?.message || err.message));
        console.error('Error:', err);
        setAnimales([]);
      } finally {
        setCargandoAnimales(false);
      }
    };
    cargarAnimales();
  }, []);

  // Cargar inventario disponible (GET /api/supply-stock) para el selector de insumos
  useEffect(() => {
    const cargarInventario = async () => {
      try {
        setCargandoInventario(true);
        const respuesta = await inventarioService.getAll({ limit: 1000 }); // selector necesita el inventario completo
        const datos = respuesta.data?.data || [];
        setInventario(Array.isArray(datos) ? datos : []);
      } catch (err) {
        console.error('Error al cargar inventario:', err);
        setInventario([]);
      } finally {
        setCargandoInventario(false);
      }
    };
    cargarInventario();
  }, []);

  const manejarCambio = ({ target: { name, value } }) => {
    setFormulario(prev => ({ ...prev, [name]: value }));
  };

  // ── Manejo de filas dinámicas de insumos utilizados ───────────────────────

  const agregarFilaInsumo = () => {
    setSuministrosUsados(prev => [...prev, { ...FILA_INSUMO_VACIA }]);
  };

  const eliminarFilaInsumo = (indice) => {
    setSuministrosUsados(prev => prev.filter((_, i) => i !== indice));
  };

  const actualizarFilaInsumo = (indice, campo, valor) => {
    setSuministrosUsados(prev =>
      prev.map((fila, i) => i === indice ? { ...fila, [campo]: valor } : fila)
    );
  };

  const cancelar = () => setVistaActual('medica');

  const guardar = async (e) => {
    e.preventDefault();
    if (!formulario.id_animal) {
      setErrorForm('Debe seleccionar un paciente registrado en el Censo Animal.');
      return;
    }

    try {
      setGuardando(true);
      setErrorForm('');

      // Combina los datos generales de la consulta con los insumos utilizados.
      // Se descartan las filas sin insumo seleccionado.
      const insumosValidos = suministrosUsados
        .filter(fila => fila.id_supply !== '')
        .map(fila => ({
          id_supply:     Number(fila.id_supply),
          used_quantity: Number(fila.used_quantity) || 1,
        }));

      await consultasService.create({
        id_animal:           formulario.id_animal,
        consultation_reason: formulario.consultation_reason,
        diagnosis:           formulario.diagnosis,
        treatment:           formulario.treatment,
        weight_kg:           formulario.weight_kg   !== '' ? Number(formulario.weight_kg)   : null,
        temperature:         formulario.temperature !== '' ? Number(formulario.temperature) : null,
        appointment_date:    formulario.appointment_date,
        used_supplies:       insumosValidos,
      });
      setFormulario(FORMULARIO_VACIO);
      setSuministrosUsados([]);
      setVistaActual('medica');
    } catch (err) {
      setErrorForm('Error al registrar la consulta: ' + (err.response?.data?.message || err.message));
      console.error('Error:', err);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">

      {/* ── Navegación de retorno ──────────────────────────────── */}
      <button
        type="button"
        onClick={cancelar}
        className="flex items-center gap-1.5 text-sm text-[#765A05]/65 hover:text-[#765A05] transition-colors font-medium cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
        Volver a Consultas Médicas
      </button>

      {/* ── Encabezado del módulo ──────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#765A05]/10 border border-[#765A05]/20 rounded-xl flex items-center justify-center shrink-0">
          <Stethoscope className="w-5 h-5 text-[#765A05]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
            Registrar Nueva Consulta Veterinaria
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Complete la ficha clínica del paciente atendido en la jornada.
          </p>
        </div>
      </div>

      {/* ── Tarjeta del formulario ─────────────────────────────── */}
      <div className="bg-white/60 backdrop-blur-md border border-white/60 shadow-xl shadow-[#765A05]/5 rounded-3xl overflow-hidden">

        {/* Banda institucional */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#765A05] via-[#FFDF96] to-[#765A05]/40" />

        <form onSubmit={guardar} className="p-7 space-y-7">

          {/* ── SECCIÓN 1: Datos del Paciente ─────────────────── */}
          <div>
            <p className="text-xs font-bold text-[#765A05]/70 uppercase tracking-[0.18em] mb-4">
              Datos del Paciente
            </p>

            <div className="grid grid-cols-2 gap-5">

              {/* Paciente → id_animal (Censo Animal, carga dinámica) */}
              <Campo label="Paciente">
                <SelectCampo
                  name="id_animal"
                  value={formulario.id_animal}
                  onChange={manejarCambio}
                  placeholder={cargandoAnimales ? 'Cargando animales del censo...' : 'Seleccione el animal censado...'}
                  disabled={cargandoAnimales}
                >
                  {animales.map(a => (
                    <option key={a.id_animal} value={a.id_animal}>
                      {a.animal_name || `Animal #${a.id_animal}`}
                      {a.Owners?.full_name ? ` — ${a.Owners.full_name}` : ''}
                    </option>
                  ))}
                </SelectCampo>
              </Campo>

              {/* Fecha de la Consulta → appointment_date */}
              <Campo label="Fecha de la Consulta">
                <input
                  type="date"
                  name="appointment_date"
                  value={formulario.appointment_date}
                  onChange={manejarCambio}
                  required
                  className={CLS_INPUT}
                />
              </Campo>
            </div>
          </div>

          {/* ── SECCIÓN 2: Motivo de la Visita ────────────────── */}
          <div>
            <p className="text-xs font-bold text-[#765A05]/70 uppercase tracking-[0.18em] mb-4">
              Motivo de la Visita
            </p>

            <SelectCampo
              name="consultation_reason"
              value={formulario.consultation_reason}
              onChange={manejarCambio}
              placeholder="Seleccione el motivo principal de la consulta..."
            >
              <option value="Vacunación">💉 Vacunación</option>
              <option value="Enfermedad">🤒 Enfermedad</option>
              <option value="Control">🔍 Control General</option>
              <option value="Emergencia">🚨 Emergencia</option>
            </SelectCampo>
          </div>

          {/* ── SECCIÓN 3: Registro Clínico ───────────────────── */}
          <div>
            <p className="text-xs font-bold text-[#765A05]/70 uppercase tracking-[0.18em] mb-4">
              Registro Clínico
            </p>

            <div className="space-y-4">

              {/* Diagnóstico → diagnosis */}
              <Campo label="Diagnóstico Clínico">
                <textarea
                  name="diagnosis"
                  value={formulario.diagnosis}
                  onChange={manejarCambio}
                  rows={3}
                  placeholder="Describa el diagnóstico clínico del paciente: síntomas observados, hallazgos del examen físico, conclusión diagnóstica..."
                  required
                  className={`${CLS_INPUT} resize-none leading-relaxed`}
                />
              </Campo>

              {/* Tratamiento → treatment */}
              <Campo label="Tratamiento y Suministros Recetados">
                <textarea
                  name="treatment"
                  value={formulario.treatment}
                  onChange={manejarCambio}
                  rows={3}
                  placeholder="Indique el tratamiento prescrito, suministros médicos administrados, dosis, frecuencia y observaciones de seguimiento..."
                  className={`${CLS_INPUT} resize-none leading-relaxed`}
                />
              </Campo>

              {/* Peso y Temperatura → weight_kg, temperature */}
              <div className="grid grid-cols-2 gap-5">
                <Campo label="Peso del Paciente">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    name="weight_kg"
                    value={formulario.weight_kg}
                    onChange={manejarCambio}
                    placeholder="Ej: 8.5"
                    className={CLS_INPUT}
                  />
                </Campo>

                <Campo label="Temperatura Corporal">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    name="temperature"
                    value={formulario.temperature}
                    onChange={manejarCambio}
                    placeholder="Ej: 38.5"
                    className={CLS_INPUT}
                  />
                </Campo>
              </div>
            </div>
          </div>

          {/* ── SECCIÓN 4: Suministros Utilizados (filas dinámicas) ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-[#765A05]/70 uppercase tracking-[0.18em]">
                Suministros Utilizados
              </p>
              <span className="text-[10px] text-gray-400">
                {cargandoInventario ? 'Cargando inventario...' : `${inventario.length} en almacén`}
              </span>
            </div>

            <div className="space-y-3">
              {suministrosUsados.map((fila, indice) => (
                <div key={indice} className="flex items-center gap-3">
                  <div className="flex-1">
                    <SelectCampo
                      name={`id_supply_${indice}`}
                      value={fila.id_supply}
                      onChange={e => actualizarFilaInsumo(indice, 'id_supply', e.target.value)}
                      placeholder="Seleccione un insumo del almacén..."
                      disabled={cargandoInventario}
                      required
                    >
                      {inventario.map(insumo => (
                        <option key={insumo.id_supply} value={insumo.id_supply}>
                          {insumo.material_name} ({insumo.measurement_unit})
                        </option>
                      ))}
                    </SelectCampo>
                  </div>

                  <div className="w-28">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={fila.used_quantity}
                      onChange={e => actualizarFilaInsumo(indice, 'used_quantity', e.target.value)}
                      placeholder="Cant."
                      required
                      className={CLS_INPUT}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => eliminarFilaInsumo(indice)}
                    title="Eliminar insumo"
                    className="p-2.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={agregarFilaInsumo}
                disabled={cargandoInventario}
                className="flex items-center gap-2 text-sm font-medium text-[#765A05] hover:text-[#5a4304] hover:bg-[#FFDF96]/15 border border-dashed border-[#765A05]/30 hover:border-[#765A05]/50 rounded-xl px-4 py-2.5 transition-all disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Agregar Insumo Médico
              </button>
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
              onClick={cancelar}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-xl transition-all"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={guardando}
              className="flex items-center gap-2.5 px-6 py-2.5 bg-[#765A05] hover:bg-[#5a4304] active:bg-[#3d2d02] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-[#765A05]/25 hover:scale-[1.01]"
            >
              {guardando ? <Loader className="w-4 h-4 animate-spin" /> : <Stethoscope className="w-4 h-4" />}
              {guardando ? 'Guardando...' : 'Registrar Consulta'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
