import React, { useState, useEffect } from 'react';
import { Users, ChevronRight, ChevronLeft, Shield, Pencil, Trash2, Plus, Eye, EyeOff, AlertTriangle, Save, Loader, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usersService, rolesService } from '../services/api';
import PaginadorPremium from '../components/PaginadorPremium';
import FiltrosPills from '../components/FiltrosPills';

const COLORES_ESTADO = {
  activo:     'text-emerald-600',
  inactivo:   'text-gray-400',
  suspendido: 'text-rose-600',
};

const FORMULARIO_VACIO = { full_name: '', email: '', id_role: '', status: 'activo', password: '' };

const REGISTROS_POR_PAGINA = 4

// Pills de rol — el value vacío ('Todos') no envía filtro al backend.
const CATEGORIAS_ROL = [
  { label: 'Todos',         value: '' },
  { label: 'Administrador', value: 'administrador' },
  { label: 'Operador',      value: 'operador' },
]

export default function GestionUsuarios({ setVistaActual }) {
  const { usuario } = useAuth();

  // Controla cuál de las dos vistas se muestra: tabla (false) o formulario (true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [usuarios, setUsuarios] = useState([]);
  const [roles,    setRoles]    = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error,    setError]    = useState(null);

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
  const [verContrasena, setVerContrasena] = useState(false);
  const [guardando,  setGuardando]  = useState(false);

  // Catálogo de roles: se carga una sola vez
  useEffect(() => {
    cargarRoles();
  }, []);

  // Tabla de usuarios: se recarga cada vez que cambia la página, la búsqueda
  // aplicada o el rol seleccionado
  useEffect(() => {
    cargarUsuarios();
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

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      setError(null);

      const respuesta = await usersService.getAll({
        page: pagina,
        limit: REGISTROS_POR_PAGINA,
        search: busquedaAplicada,
        role: categoriaActiva,
      });

      const cuerpo = respuesta.data || {};
      setUsuarios(cuerpo.data || []);
      setTotalPaginas(cuerpo.metadata?.totalPages || 1);
      setTotalRegistros(cuerpo.metadata?.totalRecords || 0);
    } catch (err) {
      setError('Error al cargar usuarios: ' + (err.response?.data?.message || err.message));
      console.error('Error:', err);
      setUsuarios([]);
    } finally {
      setCargando(false);
    }
  };

  const cargarRoles = async () => {
    try {
      const respuesta = await rolesService.getAll();
      setRoles(respuesta.data?.roles || []);
    } catch (err) {
      console.error('Error al cargar roles:', err);
      setRoles([]);
    }
  };

  if (usuario?.rol !== 'administrador') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Shield className="w-12 h-12 text-[#765A05]/30 mb-4" />
        <p className="text-sm font-semibold text-gray-500">Acceso restringido</p>
        <p className="text-xs text-gray-400 mt-1">Esta sección requiere rol de administrador.</p>
      </div>
    );
  }

  const manejarCambio = (campo, valor) => setFormulario(prev => ({ ...prev, [campo]: valor }));

  const abrirNuevo = () => {
    setFormulario(FORMULARIO_VACIO);
    setEditando(null);
    setErrorForm('');
    setVerContrasena(false);
    setMostrarFormulario(true);
  };

  const abrirEditar = (u) => {
    setFormulario({
      full_name: u.full_name,
      email:     u.email,
      id_role:   u.id_role,
      status:    u.status,
      password:  '',
    });
    setEditando(u.id_user);
    setErrorForm('');
    setVerContrasena(false);
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

    if (!formulario.full_name.trim() || !formulario.email.trim() || !formulario.id_role) {
      setErrorForm('Nombre completo, correo y rol son obligatorios.');
      return;
    }
    // La contraseña es obligatoria solo al crear; al editar es opcional.
    if (!editando && !formulario.password.trim()) {
      setErrorForm('La contraseña es obligatoria al crear un usuario.');
      return;
    }

    try {
      setGuardando(true);

      // Copia del formulario para no mutar el estado directamente
      const payload = {
        full_name: formulario.full_name.trim(),
        email:     formulario.email.trim(),
        password:  formulario.password.trim(),
        id_role:   Number(formulario.id_role),
        status:    formulario.status,
      };

      // En edición, si la contraseña quedó en blanco (o solo espacios),
      // se elimina del payload para que ni siquiera viaje en el body —
      // así el backend nunca la valida ni la sobrescribe.
      if (editando && !payload.password) {
        delete payload.password;
      }

      if (editando) {
        await usersService.update(editando, payload);
      } else {
        await usersService.create(payload);
      }

      cancelar();
      await cargarUsuarios();
    } catch (err) {
      setErrorForm('Error al guardar: ' + (err.response?.data?.message || err.message));
      console.error('Error:', err);
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (u) => {
    if (!window.confirm(`¿Está seguro de que desea eliminar a ${u.full_name}?`)) return;

    try {
      setCargando(true);
      await usersService.delete(u.id_user);
      await cargarUsuarios();
    } catch (err) {
      setError('Error al eliminar: ' + (err.response?.data?.message || err.message));
      console.error('Error:', err);
    } finally {
      setCargando(false);
    }
  };

  // Cambia el rol activo y vuelve a la página 1 — un filtro nuevo invalida
  // la posición de paginación que tenías antes
  const seleccionarCategoria = (valor) => {
    setPagina(1);
    setCategoriaActiva(valor);
  };

  // ════════════════════════════════════════════════════════════════════════
  // VISTA 2 — FORMULARIO (registro o edición). Oculta la tabla por completo.
  // ════════════════════════════════════════════════════════════════════════
  if (mostrarFormulario) {
    return (
      <div className="space-y-5 max-w-2xl">

        <button
          type="button"
          onClick={cancelar}
          className="flex items-center gap-1.5 text-sm text-[#765A05]/65 hover:text-[#765A05] transition-colors font-medium cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver a Gestión de Usuarios
        </button>

        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
            {editando ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <p className="text-sm text-[#765A05]/60 mt-0.5">Administración de cuentas y roles del sistema</p>
        </div>

        <form onSubmit={guardar} className="bg-white/65 backdrop-blur-md rounded-2xl border border-white/60 shadow-xl shadow-[#765A05]/8 p-6 space-y-4">

          {/* Nombre */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nombre Completo</label>
            <input
              value={formulario.full_name}
              onChange={e => manejarCambio('full_name', e.target.value)}
              placeholder="Ej: Ana Rodríguez"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 focus:border-[#765A05] transition"
            />
          </div>

          {/* Correo */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Correo / Username</label>
            <input
              type="email"
              value={formulario.email}
              onChange={e => manejarCambio('email', e.target.value)}
              placeholder="usuario@sisvic.gov"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 focus:border-[#765A05] transition"
            />
          </div>

          {/* Rol y Estado (2 columnas) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rol del Sistema</label>
              <select
                value={formulario.id_role}
                onChange={e => manejarCambio('id_role', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 focus:border-[#765A05] transition bg-white"
              >
                <option value="">Seleccionar rol...</option>
                {roles.map(r => (
                  <option key={r.id_role} value={r.id_role}>{r.role_name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estado</label>
              <select
                value={formulario.status}
                onChange={e => manejarCambio('status', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 focus:border-[#765A05] transition bg-white"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="suspendido">Suspendido</option>
              </select>
            </div>
          </div>

          {/* Contraseña */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Contraseña {editando && <span className="text-gray-300">(dejar en blanco para no cambiarla)</span>}
            </label>
            <div className="relative">
              <input
                type={verContrasena ? 'text' : 'password'}
                value={formulario.password}
                onChange={e => manejarCambio('password', e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-3.5 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 focus:border-[#765A05] transition"
              />
              <button
                type="button"
                onClick={() => setVerContrasena(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#765A05] transition-colors cursor-pointer"
              >
                {verContrasena ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorForm && (
            <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {errorForm}
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={cancelar}
              disabled={guardando}
              className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex items-center gap-2 px-4 py-2 bg-[#765A05] hover:bg-[#5a4304] text-white text-sm font-semibold rounded-xl transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              {guardando ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // VISTA 1 — TABLA GENERAL (por defecto). Oculta el formulario por completo.
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-5 max-w-4xl">

      {/* Breadcrumb */}
      <button
        onClick={() => setVistaActual('inicio')}
        className="flex items-center gap-1.5 text-sm text-[#765A05]/65 hover:text-[#765A05] transition-colors font-medium cursor-pointer"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        Volver al panel
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Gestión de Usuarios</h2>
          <p className="text-sm text-[#765A05]/60 mt-0.5">Administración de cuentas y roles del sistema</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 px-4 py-2 bg-[#765A05] text-white text-sm font-semibold rounded-xl hover:bg-[#5a4304] transition-colors shadow-md shadow-[#765A05]/30 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nuevo usuario
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white/65 backdrop-blur-md rounded-2xl border border-white/60 shadow-xl shadow-[#765A05]/8 overflow-hidden">

        {/* Barra superior: buscador */}
        <div className="px-5 py-4 border-b border-[#765A05]/10 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o correo..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 focus:border-[#765A05] transition-all"
            />
          </div>
        </div>

        {/* Pills de rol */}
        <div className="px-5 py-4 border-b border-[#765A05]/10">
          <FiltrosPills opciones={CATEGORIAS_ROL} activo={categoriaActiva} onCambio={seleccionarCategoria} />
        </div>

        <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-[#765A05]/10 bg-[#FFDF96]/10">
              <th className="text-left px-5 py-3.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Usuario</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Correo</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rol</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estado</th>
              <th className="px-5 py-3.5 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#765A05]/5">
            {cargando ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <Loader className="w-7 h-7 text-[#765A05]/40 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Cargando usuarios...</p>
                </td>
              </tr>
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-sm text-gray-400">
                  {busquedaAplicada || categoriaActiva ? 'No se encontraron coincidencias' : 'No hay usuarios registrados'}
                </td>
              </tr>
            ) : (
              usuarios.map((u) => (
                <tr key={u.id_user} className="hover:bg-[#FFDF96]/10 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#FFDF96]/40 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 text-[#765A05]" />
                      </div>
                      <span className="font-semibold text-gray-800">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600">
                      {u.Role?.role_name ?? '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`flex items-center gap-1.5 text-xs font-semibold ${COLORES_ESTADO[u.status] ?? 'text-gray-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'activo' ? 'bg-emerald-500' : u.status === 'suspendido' ? 'bg-rose-500' : 'bg-gray-300'}`} />
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => abrirEditar(u)}
                        className="p-1.5 rounded-lg text-amber-500 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => eliminar(u)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
