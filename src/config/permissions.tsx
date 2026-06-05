import { empresaConfig } from '../config/empresaConfig';
import AusentesCalendar from '../pages/Apps/AusentesCalendar';
import { getManagerIdsForEmpresa } from '../services/empresaService';

export enum Route {
  Home = '/',
  PermisoTemporal = '/PermisoTemporal',
  HowAreYou = '/how-are-you',
  PanelPermisosTemporales = '/PanelPermisosTemporales',
  PanelCertificados = '/PanelCertificados',    
  PanelAdminVacaciones = '/PanelAdminVacaciones',
  PanelPresentismo = '/panelPresentismo',
  PanelColaboradores = '/panelColaboradoresList',
  PanelAdminIdeas = '/panelAdminIdeas',
  PanelDesempeno = '/PanelDesempeno',
  ManageMoods = '/ManageMoods',
  Registro = '/registro',
  Presentismo = '/presentismo',
  Vacaciones = '/Vacaciones',
  MiDesempeno = '/MiDesempeno',
  Login = '/login',
  FeedbackColaborador = '/FeedbackColaborador',
  PanelFeedBack = '/Panelfeedback',
  Unauthorized = '/unauthorized',
  Reconocemos = '/Reconocemos',
  MisDatos = '/Registro',
  Certificados = '/Certificados',
  Calendario = '/Calendar',
  AusentesCalendar = '/CalendarAusentes'
  
}

// Blindaje temporal pre-MVP: líderes habilitados para ver Feedback.
// El panel además valida managerIds por empresa, así que esto no saltea el scope operativo.
const PRE_MVP_FEEDBACK_IDS = [
  '4',
  '7',
  '8',
  '16',
  '110',
  '118',
  '134',
  '147',
  '148',
  '149',
  '150',
  '151',
  '162',
  '215',
  '236',
  '239',
  '251',
  '262',
  '328',
  '371',
  '373',
  '1',
  '9998',
  '9999',
  '10003',
] as const;

/** Líderes de sucursal depósito: acceso colaborador + único panel admin `PanelDesempeno` (Feedback). */
export const DEPO_SUCURSAL_LEADER_COLAB_IDS = new Set(['251', '215', '328', '262']);

const DEPO_SUCURSAL_LEADER_BLOCKED_PANEL_ROUTES: ReadonlySet<Route> = new Set([
  Route.Calendario,
  Route.AusentesCalendar,
  Route.PanelCertificados,
  Route.PanelAdminIdeas,
  Route.PanelPermisosTemporales,
  Route.PanelAdminVacaciones,
  Route.PanelFeedBack,
  Route.ManageMoods,
  Route.PanelPresentismo,
  Route.PanelColaboradores,
]);

interface EmpresaConfig {
  ADMIN_IDS: string[];
  MANAGER_IDS: string[];
  ROUTE_PERMISSIONS: { [key in Route]: string[] };
}

const getConfigForEmpresa = (empresaId: string): EmpresaConfig => {
  const config = empresaConfig[empresaId] || empresaConfig['default'];
  const managerIds = config.managerIds;
  const managerLowIds = config.managerLowIds;
  const managerHighIds = config.managerHighIds;
  
  const ROUTE_PERMISSIONS: { [key in Route]: string[] } = {
    [Route.Home]: ['all'],
    [Route.PermisoTemporal]: ['all'],
    [Route.HowAreYou]: ['all'],
    [Route.PanelPermisosTemporales]: [...managerIds],
    [Route.PanelAdminVacaciones]: [...managerIds],
    [Route.PanelFeedBack]: [...managerIds],
    [Route.PanelPresentismo]: [...managerIds],
    [Route.PanelAdminIdeas]: [...managerHighIds],
    [Route.PanelColaboradores]: [...managerHighIds],
    [Route.PanelCertificados]: [...managerIds],
    // Pre-MVP: Feedback manager panel acotado
    [Route.PanelDesempeno]: [...PRE_MVP_FEEDBACK_IDS],
    [Route.Calendario]: [...managerIds,...managerLowIds],   
    [Route.AusentesCalendar]: [...managerIds,...managerLowIds],   
    [Route.ManageMoods]: managerIds,
    [Route.Registro]: ['all'],
    [Route.Presentismo]: ['all'],
    [Route.Vacaciones]: ['all'],
    // Pre-MVP: Feedback individual acotado
    [Route.MiDesempeno]: [...PRE_MVP_FEEDBACK_IDS],
    [Route.Login]: ['all'],
    [Route.Unauthorized]: ['all'],
    [Route.FeedbackColaborador]: ['all'],
    [Route.Reconocemos]: ['all'],
    [Route.Certificados]: ['all'],
    [Route.MisDatos]: ['all']
  };

  return {
    ADMIN_IDS: managerIds,
    MANAGER_IDS: managerIds,
    ROUTE_PERMISSIONS
  };
};

export const hasPermission = (colaboradorID: string, route: Route, empresaId: string): boolean => {
  const id = String(colaboradorID);
  if (DEPO_SUCURSAL_LEADER_COLAB_IDS.has(id) && DEPO_SUCURSAL_LEADER_BLOCKED_PANEL_ROUTES.has(route)) {
    return false;
  }
  const config = getConfigForEmpresa(empresaId);
  const permissions = config.ROUTE_PERMISSIONS[route];

  return permissions.includes('all') || permissions.includes(id);
};