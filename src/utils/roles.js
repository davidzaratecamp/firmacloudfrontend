export const FIRMA_ROLES = ['admin', 'agent', 'firma_datos'];
export const CORREO_ROLES = ['admin', 'agent', 'correo_datos'];
export const HR_ROLES = ['admin', 'agent', 'rrhh'];
export const RECLUTAMIENTO_ROLES = ['admin', 'agent', 'reclutamiento'];
export const BEEMO_ROLES = ['admin', 'beemo']; // sin 'agent': módulo nuevo, sin legado

export function defaultRouteForRole(role) {
  if (role === 'correo_datos') return '/oleadas';
  if (role === 'rrhh') return '/rrhh/contratos';
  if (role === 'reclutamiento') return '/reclutamiento/candidatos';
  if (role === 'beemo') return '/beemo/documentos';
  return '/dashboard';
}
