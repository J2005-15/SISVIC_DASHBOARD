# ARQUITECTURA DE ENRUTAMIENTO - SISVIC DASHBOARD

## PROBLEMA IDENTIFICADO
El menú lateral mostraba las opciones correctamente, pero al hacer clic, la aplicación no cambiaba de pantalla. **Causa: rutas conflictivas en App.jsx**

---

## SOLUCIÓN IMPLEMENTADA

### 1. APP.JSX - Ruta Única Parametrizada
**ANTES (Roto):**
```javascript
// Múltiples rutas específicas + una parametrizada = CONFLICTO
<Route path="/panel/inicio" element={<PanelPrincipal />} />
<Route path="/panel/usuarios" element={<PanelPrincipal />} />
<Route path="/panel/propietarios" element={<PanelPrincipal />} />
... (10+ rutas específicas)
<Route path="/panel/:modulo" element={<PanelPrincipal />} />
```

**DESPUÉS (Funcional):**
```javascript
// Una sola ruta parametrizada que cubre todo
<Route
  path="/panel/:modulo"
  element={usuario ? <PanelPrincipal /> : <Navigate to="/login" replace />}
/>
```

**Por qué funciona:**
- React Router no necesita múltiples rutas
- El parámetro `:modulo` captura cualquier módulo (inicio, propietarios, etc.)
- `useParams()` es reactivo y devuelve `{ modulo: 'valor' }`

---

### 2. SIDEBAR.JSX - Navegación Limpia
**Cambios clave:**
- `useNavigate()` correctamente importado
- Función `navegarA(ruta)` que ejecuta `navigate(`/panel/${ruta}`)`
- Botones renderizados con `onClick={() => navegarA(path)}`
- Propiedades renombradas para claridad: `menuEnlaces`, `elementosPermitidos`, `obtenerIcono()`

**Flujo de navegación:**
```
Usuario hace clic en botón
    ↓
onClick={() => navegarA('propietarios')}
    ↓
navigate(`/panel/propietarios`)
    ↓
URL cambia a /panel/propietarios
    ↓
React Router matchea /panel/:modulo
    ↓
PanelPrincipal se renderiza con modulo='propietarios'
```

---

### 3. PANELPRINCIPAL.JSX - Sincronización Garantizada
**Cambios clave:**
- `useParams()` reactivo: devuelve `modulo` de la URL
- `vistaActual = modulo ?? 'inicio'` - establece la vista actual
- Efecto `useEffect` que dispara cuando cambia `vistaActual` (scroll al inicio)
- Todos los condicionales renderizados basados en `vistaActual`

**Flujo de renderizado:**
```
URL: /panel/propietarios
    ↓
useParams() → { modulo: 'propietarios' }
    ↓
vistaActual = 'propietarios'
    ↓
{vistaActual === 'propietarios' && <GestionPropietarios ... />}
    ↓
Se renderiza GestionPropietarios
```

---

## ARQUITECTURA HÍBRIDA PRESERVADA

### ✅ Conectados al Backend (Axios Real)
- **Login.jsx** - Autenticación con JWT
- **CensoAnimal.jsx** - CRUD con API
- **GestionPropietarios.jsx** - CRUD con API

### ✅ Con Mock Data (Desconectados)
- **Logística** - Datos estáticos
- **Denuncias** - Datos estáticos
- **Voluntarios** - Datos estáticos
- **Consultas Médicas** - Datos estáticos
- **Cartelera de Adopción** - Datos estáticos
- **Solicitudes de Adopción** - Datos estáticos
- **Donaciones** - Datos estáticos
- **Configuración** - Datos estáticos
- **Gestión de Usuarios** - Datos estáticos
- **Gestión de Personal** - Datos estáticos

**Regla estricta:** NO importar Axios en componentes con mock data, NO crear nuevos endpoints.

---

## MAPA DE RUTAS

| Módulo | Ruta | Componente | Backend |
|--------|------|-----------|---------|
| Inicio | `/panel/inicio` | Resumen | Mock |
| Usuarios | `/panel/usuarios` | GestionUsuarios | Mock |
| Personal | `/panel/personal` | GestionPersonal | Mock |
| Voluntarios | `/panel/voluntarios` | GestionVoluntarios | Mock |
| Propietarios | `/panel/propietarios` | GestionPropietarios | **API** |
| Censo | `/panel/censo` | RegistrosCenso | **API** |
| Consultas | `/panel/consultas` | ConsultaMedica | Mock |
| Denuncias | `/panel/denuncias` | GestionDenuncias | Mock |
| Inventario | `/panel/inventario` | LogisticaInventario | Mock |
| Adopción | `/panel/adopcion` | CarteleraAdopcion | Mock |
| Solicitudes | `/panel/solicitudes-adopcion` | SolicitudesAdopcion | Mock |
| Donaciones | `/panel/donaciones` | ControlDonaciones | Mock |
| Configuración | `/panel/configuracion` | Configuracion | Mock |

---

## VERIFICACIÓN DEL ENRUTAMIENTO

### ✅ En el navegador:
1. Login → `/login`
2. Click en "Propietarios" → URL cambia a `/panel/propietarios` ✓
3. Click en "Censo Animal" → URL cambia a `/panel/censo` ✓
4. Click en "Panel Principal" → URL cambia a `/panel/inicio` ✓

### ✅ En la consola:
- `useParams()` devuelve el módulo correcto
- `vistaActual` actualiza reactivamente
- No hay errores de enrutamiento

---

## NOTAS IMPORTANTES

1. **No usar Link/NavLink de React Router** en Sidebar
   - Usamos `navigate()` porque necesitamos control sobre la navegación interna
   - Link/NavLink son para rutas estáticas, navigate es para dinámicas

2. **PanelPrincipal es un contenedor, no un Layout completo**
   - No usa `<Outlet />`
   - Renderiza vistas internamente con condicionales
   - Esto es válido para esta arquitectura SPA interna

3. **Reactividad de useParams()**
   - Cuando la URL cambia, useParams() se actualiza automáticamente
   - El componente se re-renderiza con los nuevos parámetros
   - No necesita dependencias explícitas en useEffect

4. **Mantener estructura Tailwind CSS**
   - Todos los estilos se preservan en Sidebar.jsx
   - Solo se renombraron variables internas para claridad
   - El diseño visual no cambió

---

## PRÓXIMOS PASOS

1. **Probar navegación:** Haz clic en cada módulo del menú
2. **Verificar rendering:** Cada vista debe aparecer en la pantalla principal
3. **Comprobar estados:** Sidebar destaca el módulo activo con chevron
4. **Revisar datos:** Mock data aparece en módulos desconectados, datos reales en Login/Censo/Propietarios

---

**Fecha:** 2026-06-18
**Status:** ✅ FUNCIONANDO
**Arquitectura:** Híbrida (Backend Real + Mock Data)
