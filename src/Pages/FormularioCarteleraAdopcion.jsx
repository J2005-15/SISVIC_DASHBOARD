import React, { useState } from 'react';
import { PawPrint, ChevronLeft, X, ChevronDown } from 'lucide-react';
import { petsService } from '../services/api';

// ── Estilo base compartido para inputs y selects ─────────────────────────────
const CLS_INPUT =
  'w-full px-4 py-3 rounded-xl bg-white/80 border border-gray-200 text-sm text-gray-800 ' +
  'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 ' +
  'focus:border-[#765A05] focus:bg-white transition-all duration-200';

// ── Etiqueta de campo reutilizable ───────────────────────────────────────────
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

// ── Select con ícono de flecha personalizado ─────────────────────────────────
function SelectPersonalizado({ name, value, onChange, placeholder, children }) {
  return (
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        required
        className={`${CLS_INPUT} appearance-none pr-10 cursor-pointer`}
      >
        <option value="" disabled>{placeholder}</option>
        {children}
      </select>
      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────

const FORMULARIO_VACIO = {
  nombre:   '',
  especie:  '',
  raza:     '',
  sexo:     '',
  edad:     '',
  color:    '',
  energia:  '',
  estado:   '',
  historia: '',
  foto:     null,   // objeto File del input[type=file]
};

export default function FormularioCarteleraAdopcion({ setVistaActual }) {
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [preview,    setPreview]    = useState('');
  const [cargando,   setCargando]   = useState(false);
  const [errorMsg,   setErrorMsg]   = useState('');

  // ── Actualiza campos de texto/select ─────────────────────────────────────
  const manejarCambio = ({ target: { name, value } }) => {
    setFormulario(prev => ({ ...prev, [name]: value }));
  };

  // ── Guarda el archivo seleccionado y genera vista previa local ────────────
  const manejarFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormulario(prev => ({ ...prev, foto: file }));
    setPreview(URL.createObjectURL(file));
  };

  // ── Limpia el formulario y regresa a la vista de la tabla ─────────────────
  const cancelar = () => {
    setFormulario(FORMULARIO_VACIO);
    setPreview('');
    setVistaActual('cartelera');
  };

  // ── Envía los datos + archivo al backend usando FormData ──────────────────
  const publicar = async (e) => {
    e.preventDefault();
    setCargando(true);
    setErrorMsg('');

    try {
      const fd = new FormData();
      fd.append('nombre',   formulario.nombre);
      fd.append('especie',  formulario.especie);
      fd.append('raza',     formulario.raza);
      fd.append('sexo',     formulario.sexo);
      fd.append('edad',     formulario.edad);
      fd.append('color',    formulario.color);
      fd.append('energia',  formulario.energia);
      fd.append('estado',   formulario.estado);
      fd.append('historia', formulario.historia);
      if (formulario.foto) fd.append('foto', formulario.foto);

      // petsService.create usa la instancia centralizada de Axios: el
      // interceptor le inyecta el token JWT y formDataConfig le quita el
      // Content-Type fijo para que el navegador agregue el boundary multipart.
      await petsService.create(fd);
      setFormulario(FORMULARIO_VACIO);
      setPreview('');
      setVistaActual('cartelera');
    } catch (err) {
      setErrorMsg(err.response?.data?.message ?? 'Error al publicar. Intente nuevamente.');
    } finally {
      setCargando(false);
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
        Volver a Cartelera de Adopción
      </button>

      {/* ── Encabezado del módulo ──────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#765A05]/10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-[#765A05]/20 backdrop-blur-md">
          <PawPrint className="w-5 h-5 text-[#765A05]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
            Registrar Animal en Adopción
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Complete la ficha para publicar al animal en la web pública de la fundación.
          </p>
        </div>
      </div>

      {/* ── Tarjeta del formulario (Glassmorphism) ─────────────── */}
      <div className="bg-white/60 backdrop-blur-md border border-white/60 shadow-xl shadow-[#765A05]/5 rounded-3xl overflow-hidden">

        {/* Banda superior de color institucional */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#765A05] via-[#FFDF96] to-[#765A05]/40" />

        <form onSubmit={publicar} className="p-7 space-y-7">

          {/* ── SECCIÓN 1: Datos básicos de identificación ──────── */}
          <div>
            <p className="text-xs font-bold text-[#765A05]/70 uppercase tracking-[0.18em] mb-4">
              Identificación del Animal
            </p>

            <div className="grid grid-cols-3 gap-5">
              {/* Nombre del Animal — ocupa 2 columnas */}
              <div className="col-span-2">
                <Campo label="Nombre del Animal">
                  <input
                    type="text"
                    name="nombre"
                    value={formulario.nombre}
                    onChange={manejarCambio}
                    placeholder="Ej: Zeus, Luna, Max..."
                    required
                    className={CLS_INPUT}
                  />
                </Campo>
              </div>

              {/* Especie */}
              <Campo label="Especie">
                <SelectPersonalizado
                  name="especie"
                  value={formulario.especie}
                  onChange={manejarCambio}
                  placeholder="Seleccionar..."
                >
                  <option value="Canino">🐕 Canino (Perro)</option>
                  <option value="Felino">🐈 Felino (Gato)</option>
                </SelectPersonalizado>
              </Campo>
            </div>

            {/* Raza — fila separada, ancho completo */}
            <div className="mt-5">
              <Campo label="Raza">
                <SelectPersonalizado
                  name="raza"
                  value={formulario.raza}
                  onChange={manejarCambio}
                  placeholder="Seleccionar raza..."
                >
                  <optgroup label="── Caninos ──────────────────">
                    <option value="Canino - Mestizo (Cacri)">Mestizo (Cacri)</option>
                    <option value="Canino - Poodle"> Poodle</option>
                    <option value="Canino - Pinscher"> Pinscher</option>
                    <option value="Canino - Schnauzer"> Schnauzer</option>
                    <option value="Canino - Yorkshire Terrier"> Yorkshire Terrier</option>
                    <option value="Canino - Chihuahua"> Chihuahua</option>
                    <option value="Canino - Pitbull / Terrier"> Pitbull / Terrier</option>
                    <option value="Canino - Pastor Alemán"> Pastor Alemán</option>
                    <option value="Canino - Golden Retriever"> Golden Retriever</option>
                    <option value="Canino - Labrador"> Labrador</option>
                    <option value="Canino - Bulldog"> Bulldog</option>
                    <option value="Canino - Pug (Carlino)"> Pug (Carlino)</option>
                    <option value="Canino - Husky Siberiano"> Husky Siberiano</option>
                    <option value="Canino - Rottweiler"> Rottweiler</option>
                    <option value="Canino - Otra raza"> Otra raza</option>
                  </optgroup>
                  <optgroup label="── Felinos ───────────────────">
                    <option value="Felino - Mestizo"> Mestizo</option>
                    <option value="Felino - Siamés"> Siamés</option>
                    <option value="Felino - Persa"> Persa</option>
                    <option value="Felino - Angora"> Angora</option>
                    <option value="Felino - Bengalí"> Bengalí</option>
                    <option value="Felino - Maine Coon"> Maine Coon</option>
                    <option value="Felino - Azul Ruso"> Azul Ruso</option>
                    <option value="Felino - Otra raza"> Otra raza</option>
                  </optgroup>
                </SelectPersonalizado>
              </Campo>
            </div>
          </div>

          {/* ── SECCIÓN 2: Características Físicas ────────────── */}
          <div>
            <p className="text-xs font-bold text-[#765A05]/70 uppercase tracking-[0.18em] mb-4">
              Características Físicas
            </p>

            <div className="grid grid-cols-3 gap-5">
              {/* Sexo */}
              <Campo label="Sexo Biológico">
                <SelectPersonalizado
                  name="sexo"
                  value={formulario.sexo}
                  onChange={manejarCambio}
                  placeholder="Seleccionar..."
                >
                  <option value="Macho">Macho</option>
                  <option value="Hembra">Hembra</option>
                </SelectPersonalizado>
              </Campo>

              {/* Edad Estimada */}
              <Campo label="Edad Estimada">
                <input
                  type="text"
                  name="edad"
                  value={formulario.edad}
                  onChange={manejarCambio}
                  placeholder="Ej: 2 años, 6 meses"
                  required
                  className={CLS_INPUT}
                />
              </Campo>

              {/* Color */}
              <Campo label="Color Predominante">
                <SelectPersonalizado
                  name="color"
                  value={formulario.color}
                  onChange={manejarCambio}
                  placeholder="Seleccionar..."
                >
                  <option value="Negro">Negro</option>
                  <option value="Blanco">Blanco</option>
                  <option value="Marrón">Marrón</option>
                  <option value="Gris">Gris</option>
                  <option value="Amarillo/Crema">Amarillo / Crema</option>
                  <option value="Atigrado">Atigrado</option>
                  <option value="Manchado">Manchado</option>
                  <option value="Rojizo">Rojizo</option>
                </SelectPersonalizado>
              </Campo>
            </div>
          </div>

          {/* ── SECCIÓN 3: Conducta y Salud ───────────────────── */}
          <div>
            <p className="text-xs font-bold text-[#765A05]/70 uppercase tracking-[0.18em] mb-4">
              Conducta y Salud
            </p>

            <div className="grid grid-cols-2 gap-5">
              {/* Nivel de Energía */}
              <Campo label="Comportamiento">
                <SelectPersonalizado
                  name="energia"
                  value={formulario.energia}
                  onChange={manejarCambio}
                  placeholder="Seleccionar..."
                >
                  <option value="Tranquilo">😌 Tranquilo</option>
                  <option value="Juguetón">⚡ Juguetón</option>
                  <option value="Protector">🛡️ Protector</option>
                  <option value="Tímido">🌸 Tímido</option>
                </SelectPersonalizado>
              </Campo>

              {/* Estado de Salud */}
              <Campo label="Estado Clínico / Reproductivo">
                <SelectPersonalizado
                  name="estado"
                  value={formulario.estado}
                  onChange={manejarCambio}
                  placeholder="Seleccionar..."
                >
                  <option value="Sano/Entero">Sano (Entero/a)</option>
                  <option value="Castrado/Esterilizado">Castrado / Esterilizado</option>
                  <option value="En Tratamiento">En tratamiento médico</option>
                  <option value="Necesidad Especial">Con necesidades especiales</option>
                </SelectPersonalizado>
              </Campo>
            </div>
          </div>

          {/* ── SECCIÓN 4: Historia de rescate ──────────────────── */}
          <div>
            <p className="text-xs font-bold text-[#765A05]/70 uppercase tracking-[0.18em] mb-4">
              Historia y Descripción
            </p>

            <Campo label="Reseña para la Web">
              <textarea
                name="historia"
                value={formulario.historia}
                onChange={manejarCambio}
                rows={4}
                required
                placeholder="Cuente brevemente la historia de este animal: cómo fue rescatado, su personalidad, hábitos especiales, necesidades de cuidado..."
                className={`${CLS_INPUT} resize-none leading-relaxed`}
              />
            </Campo>
          </div>

          {/* ── SECCIÓN 5: Fotografía de Perfil ─────────────────── */}
          <div>
            <p className="text-xs font-bold text-[#765A05]/70 uppercase tracking-[0.18em] mb-4">
              Fotografía de Perfil
            </p>

            <Campo label="Subir Foto del Animal">
              <input
                type="file"
                accept="image/*"
                onChange={manejarFoto}
                className={CLS_INPUT + ' cursor-pointer file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#765A05]/10 file:text-[#765A05] hover:file:bg-[#765A05]/20'}
              />
            </Campo>

            {/* Vista previa del archivo seleccionado */}
            {preview && (
              <div className="mt-3 rounded-2xl overflow-hidden border border-[#765A05]/20 h-48">
                <img
                  src={preview}
                  alt="Vista previa"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* ── MENSAJE DE ERROR ──────────────────────────────────── */}
          {errorMsg && (
            <p className="text-red-600 text-sm font-medium bg-red-50 border border-red-200 rounded-xl px-4 py-2">
              {errorMsg}
            </p>
          )}

          {/* ── FILA DE BOTONES DE ACCIÓN ────────────────────────── */}
          <div className="flex items-center justify-between pt-4 border-t border-[#765A05]/10">

            {/* Botón secundario: Cancelar */}
            <button
              type="button"
              onClick={cancelar}
              disabled={cargando}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 border border-white hover:border-rose-100 rounded-xl transition-all cursor-pointer disabled:opacity-40"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>

            {/* Botón principal: Publicar en Cartelera */}
            <button
              type="submit"
              disabled={cargando}
              className="flex items-center gap-2.5 px-7 py-3 bg-[#765A05] hover:bg-[#5a4304] active:bg-[#3d2d02] text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-md shadow-[#765A05]/20 hover:shadow-lg hover:shadow-[#765A05]/30 hover:scale-[1.01] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <PawPrint className="w-4 h-4" />
              {cargando ? 'Publicando...' : 'Publicar en Cartelera'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}