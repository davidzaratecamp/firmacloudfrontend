export const FIRMA_ROLES = ['admin', 'agent', 'firma_datos'];
export const CORREO_ROLES = ['admin', 'agent', 'correo_datos'];
export const HR_ROLES = ['admin', 'agent', 'rrhh'];
export const RECLUTAMIENTO_ROLES = ['admin', 'agent', 'reclutamiento'];
export const BEEMO_ROLES = ['admin', 'beemo']; // sin 'agent': módulo nuevo, sin legado

export const ALL_ROLES = ['admin', 'agent', 'firma_datos', 'correo_datos', 'rrhh', 'reclutamiento', 'beemo'];

export function defaultRouteForRole() {
  return '/dashboard';
}

// Qué secciones de módulo debe pedir/mostrar el Dashboard para un rol dado (admin ve todo).
// Firmas/Cartas/Oleadas/Actualizaciones/RRHH se derivan de los arrays de arriba porque ahí
// sí coinciden con el gate real del backend para 'agent'. Reclutamiento y Beemo NO: pese a
// que RECLUTAMIENTO_ROLES incluye 'agent' (se usa para el nav/rutas del módulo), el backend
// (`requireRole('reclutamiento')` / `requireRole('beemo')`) solo deja pasar admin + el rol
// dedicado — darle esas secciones a 'agent' aquí solo produciría un 403 en el dashboard.
export function dashboardModulesForRole(role) {
  const modules = [];
  if (FIRMA_ROLES.includes(role)) modules.push('firmas');
  if (CORREO_ROLES.includes(role)) modules.push('cartas', 'oleadas', 'actualizaciones');
  if (HR_ROLES.includes(role)) modules.push('rrhh');
  if (role === 'admin' || role === 'reclutamiento') modules.push('reclutamiento');
  if (role === 'admin' || role === 'beemo') modules.push('beemo');
  return modules;
}
