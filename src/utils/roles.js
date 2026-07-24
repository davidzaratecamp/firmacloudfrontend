export const FIRMA_ROLES = ['admin', 'agent', 'firma_datos'];
export const CORREO_ROLES = ['admin', 'agent', 'correo_datos'];
export const HR_ROLES = ['admin', 'agent', 'rrhh'];

export function defaultRouteForRole(role) {
  if (role === 'correo_datos') return '/oleadas';
  if (role === 'rrhh') return '/rrhh/contratos';
  return '/dashboard';
}
