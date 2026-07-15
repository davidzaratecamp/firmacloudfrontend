export const FIRMA_ROLES = ['admin', 'agent', 'firma_datos'];
export const CORREO_ROLES = ['admin', 'agent', 'correo_datos'];

export function defaultRouteForRole(role) {
  if (role === 'correo_datos') return '/oleadas';
  return '/dashboard';
}
