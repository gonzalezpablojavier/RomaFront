import AusentesCalendar from '../pages/Apps/AusentesCalendar';
import { hasTenantPermission } from '../services/tenantRbacService';

export enum Route {
  Home = '/',
  PermisoTemporal = '/PermisoTemporal',
  HowAreYou = '/how-are-you',
  PanelPermisosTemporales = '/PanelPermisosTemporales',
  PanelCertificados = '/PanelCertificados',
  PanelAdminVacaciones = '/PanelAdminVacaciones',
  PanelPresentismo = '/PanelPresentismo',
  PanelColaboradores = '/PanelColaboradoresList',
  PanelAdminIdeas = '/panelAdminIdeas',
  PanelDesempeno = '/PanelDesempeno',
  ManageMoods = '/ManageMoods',
  Registro = '/registro',
  Presentismo = '/presentismo',
  Vacaciones = '/Vacaciones',
  MiDesempeno = '/MiDesempeno',
  Login = '/login',
  FeedbackColaborador = '/FeedbackColaborador',
  PanelFeedBack = '/panelFeedback',
  Unauthorized = '/unauthorized',
  Reconocemos = '/Reconocemos',
  MisDatos = '/Registro',
  Certificados = '/Certificados',
  Calendario = '/Calendar',
  AusentesCalendar = '/CalendarAusentes',
  PlatformAdmin = '/platform-admin',
}

/** Mapeo ruta → permiso atómico definido en el backend (tenant_role_permission). */
export const ROUTE_PERMISSION_CODE: Record<Route, string | null> = {
  [Route.Home]: 'route.home',
  [Route.PermisoTemporal]: 'route.permiso_temporal',
  [Route.HowAreYou]: 'route.how_are_you',
  [Route.PanelPermisosTemporales]: 'route.panel.permisos_temporales',
  [Route.PanelAdminVacaciones]: 'route.panel.admin_vacaciones',
  [Route.PanelFeedBack]: 'route.panel.feedback',
  [Route.PanelPresentismo]: 'route.panel.presentismo',
  [Route.PanelAdminIdeas]: 'route.panel.admin_ideas',
  [Route.PanelColaboradores]: 'route.panel.colaboradores',
  [Route.PanelCertificados]: 'route.panel.certificados',
  [Route.PanelDesempeno]: 'route.panel.desempeno',
  [Route.Calendario]: 'route.calendario',
  [Route.AusentesCalendar]: 'route.calendario.ausentes',
  [Route.ManageMoods]: 'route.manage_moods',
  [Route.Registro]: 'route.registro',
  [Route.Presentismo]: 'route.presentismo',
  [Route.Vacaciones]: 'route.vacaciones',
  [Route.MiDesempeno]: 'route.mi_desempeno',
  [Route.Login]: null,
  [Route.Unauthorized]: null,
  [Route.FeedbackColaborador]: 'route.feedback_colaborador',
  [Route.Reconocemos]: 'route.reconocemos',
  [Route.Certificados]: 'route.certificados',
  [Route.MisDatos]: 'route.mis_datos',
  [Route.PlatformAdmin]: 'platform.admin',
};

export const hasPermission = (
  _colaboradorID: string,
  route: Route,
  _empresaId: string,
): boolean => {
  const code = ROUTE_PERMISSION_CODE[route];
  if (code === null) return true;
  return hasTenantPermission(code);
};
