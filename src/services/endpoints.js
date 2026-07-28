import api from './api';

// Auth
export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// Usuarios
export const usuarioService = {
  listar: (params) => api.get('/usuarios', { params }),
  buscarPorId: (id) => api.get(`/usuarios/${id}`),
  crear: (data) => api.post('/usuarios', data),
  actualizar: (id, data) => api.put(`/usuarios/${id}`, data),
  cambiarEstado: (id) => api.patch(`/usuarios/${id}/estado`),
  asignarRol: (id, rolId) => api.patch(`/usuarios/${id}/rol/${rolId}`),
};

// Pacientes
export const pacienteService = {
  listar: (params) => api.get('/pacientes', { params }),
  buscarPorId: (id) => api.get(`/pacientes/${id}`),
  crear: (data) => api.post('/pacientes', data),
  actualizar: (id, data) => api.put(`/pacientes/${id}`, data),
  eliminar: (id) => api.delete(`/pacientes/${id}`),
  buscar: (termino) => api.get('/pacientes/buscar', { params: { termino } }),
};

// Citas
export const citaService = {
  listar: (params) => api.get('/citas', { params }),
  buscarPorId: (id) => api.get(`/citas/${id}`),
  crear: (data) => api.post('/citas', data),
  actualizar: (id, data) => api.put(`/citas/${id}`, data),
  cancelar: (id, data) => api.patch(`/citas/${id}/cancelar`, data),
  confirmar: (id) => api.patch(`/citas/${id}/confirmar`),
  reprogramar: (id, data) => api.patch(`/citas/${id}/reprogramar`, data),
  horariosDisponibles: (params) => api.get('/citas/horarios-disponibles', { params }),
};

// Historias Clínicas
export const historiaClinicaService = {
  listarPorPaciente: (pacienteId) => api.get(`/historias-clinicas/paciente/${pacienteId}`),
  buscarPorId: (id) => api.get(`/historias-clinicas/${id}`),
  crear: (data) => api.post('/historias-clinicas', data),
  actualizar: (id, data) => api.put(`/historias-clinicas/${id}`, data),
};

// Odontogramas
export const odontogramaService = {
  buscarPorPaciente: (pacienteId) => api.get(`/odontogramas/paciente/${pacienteId}`),
  buscarPorId: (id) => api.get(`/odontogramas/${id}`),
  crear: (data) => api.post('/odontogramas', data),
  actualizarEstadoPieza: (id, data) => api.put(`/odontogramas/${id}/detalles`, data),
};

// Diagnósticos
export const diagnosticoService = {
  listar: () => api.get('/diagnosticos'),
  buscarPorId: (id) => api.get(`/diagnosticos/${id}`),
  listarFrecuentes: () => api.get('/diagnosticos/frecuentes'),
  crear: (data) => api.post('/diagnosticos', data),
  actualizar: (id, data) => api.put(`/diagnosticos/${id}`, data),
};

// Tratamientos
export const tratamientoService = {
  listar: (params) => api.get('/tratamientos', { params }),
  buscarPorId: (id) => api.get(`/tratamientos/${id}`),
  crear: (data) => api.post('/tratamientos', data),
  actualizar: (id, data) => api.put(`/tratamientos/${id}`, data),
  actualizarEstado: (id, data) => api.patch(`/tratamientos/${id}/estado`, data),
};

// Planes de Tratamiento
export const planTratamientoService = {
  listar: (params) => api.get('/planes-tratamiento', { params }),
  listarPorPaciente: (pacienteId) => api.get('/planes-tratamiento', { params: { pacienteId } }),
  buscarPorId: (id) => api.get(`/planes-tratamiento/${id}`),
  crear: (data) => api.post('/planes-tratamiento', data),
  aceptar: (id) => api.patch(`/planes-tratamiento/${id}/aceptar`),
};

// Pagos
export const pagoService = {
  listar: (params) => api.get('/pagos', { params }),
  buscarPorId: (id) => api.get(`/pagos/${id}`),
  crear: (data) => api.post('/pagos', data),
  deudasPendientes: () => api.get('/pagos/deudas'),
  ingresosDia: () => api.get('/pagos/ingresos/dia'),
  ingresosMes: () => api.get('/pagos/ingresos/mes'),
  cajaDiaria: (fecha) => api.get('/pagos/caja-diaria', { params: { fecha } }),
};

// Recetas
export const recetaService = {
  listar: (params) => api.get('/recetas', { params }),
  buscarPorId: (id) => api.get(`/recetas/${id}`),
  crear: (data) => api.post('/recetas', data),
  actualizar: (id, data) => api.put(`/recetas/${id}`, data),
  aprobar: (id) => api.patch(`/recetas/${id}/aprobar`),
  descargarPDF: (id) => api.get(`/recetas/${id}/pdf`, { responseType: 'blob' }),
};

// Productos
export const productoService = {
  listar: (params) => api.get('/productos', { params }),
  buscarPorId: (id) => api.get(`/productos/${id}`),
  crear: (data) => api.post('/productos', data),
  actualizar: (id, data) => api.put(`/productos/${id}`, data),
  stockBajo: () => api.get('/productos/stock-bajo'),
  proximosVencer: (dias) => api.get('/productos/proximos-vencer', { params: { dias } }),
};

// Proveedores
export const proveedorService = {
  listar: () => api.get('/proveedores'),
  buscarPorId: (id) => api.get(`/proveedores/${id}`),
  crear: (data) => api.post('/proveedores', data),
  actualizar: (id, data) => api.put(`/proveedores/${id}`, data),
};

// Movimientos Inventario
export const movimientoInventarioService = {
  listarPorProducto: (productoId) => api.get(`/movimientos-inventario/producto/${productoId}`),
  registrar: (data) => api.post('/movimientos-inventario', data),
};

// Dashboard
export const dashboardService = {
  getDashboard: () => api.get('/dashboard'),
};

// Reportes
export const reporteService = {
  generate: (tipo, params) => api.get(`/reportes/${tipo}`, { params }),
  exportPdf: (tipo, params) => api.get(`/reportes/${tipo}/pdf`, { params, responseType: 'blob' }),
  exportExcel: (tipo, params) => api.get(`/reportes/${tipo}/excel`, { params, responseType: 'blob' }),
  exportCsv: (tipo, params) => api.get(`/reportes/${tipo}/csv`, { params, responseType: 'blob' }),
};

// Recordatorios
export const recordatorioService = {
  listarPorPaciente: (pacienteId) => api.get('/recordatorios', { params: { pacienteId } }),
  programar: (data) => api.post('/recordatorios', data),
};

// Notificaciones
export const notificacionService = {
  listarPorUsuario: () => api.get('/notificaciones'),
  marcarComoLeida: (id) => api.patch(`/notificaciones/${id}/leer`),
};

// Configuración
export const configuracionService = {
  get: () => api.get('/configuracion'),
  actualizar: (data) => api.put('/configuracion', data),
};
