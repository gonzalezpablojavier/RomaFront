
import PrivateRoute from './PrivateRoute';
import PermissionRoute from './PermissionRoute';
import Login from '../pages/Authentication/LoginBoxed';
import Register from '../pages/Authentication/RegisterCover';

import Error from '../components/Error';
import Unauthorized from '../pages/Pages/Unauthorized';
import Registro from '../pages/Apps/RegistroUsuario';
import PanelFeedBack from '../pages/Apps/panelFeedback';
import Home from '../pages/Apps/Home';
import ManageMoods from '../pages/Apps/ManageMoods';
import PanelAdminVacaciones from '../pages/Apps/panelAdminVacaciones';
import PanelPermisosTemporales from '../pages/Apps/panelPermisosTemporales';
import PanelAdminIdeas from '../pages/Apps/panelAdminIdeas';
import PanelCertificados from '../pages/Apps/panelCertificados';

import Vacaciones from '../pages/Apps/Vacaciones';
import Reconocemos from '../pages/Apps/Reconocemos';
import FeedbackColaborador from '../pages/Apps/FeedbackColaborador';
import PermisoTemporal from '../pages/Apps/PermisoTemporal';
import HowAreYou from '../pages/Apps/HowAreYou';
import PanelPresentismo from '../pages/Apps/panelPresentismo';
import PanelColaboradoresList from '../pages/Apps/panelColaboradoresList';
import PanelDesempeno from '../pages/Apps/PanelDesempeno';
import MiDesempeno from '../pages/Apps/MiDesempeno';

import Certificados from '../pages/Apps/Certificados';
import IdeaBox from '../pages/Apps/IdeaBox';
import Calendar from '../pages/Apps/VacationCalendar';
import CalendarAusentes from '../pages/Apps/AusentesCalendar';
import TeamDetails from '../pages/Apps/TeamDetails';
import MundialPage from '../pages/Mundial/MundialPage';

import CompanyConfig from '../pages/Apps/CompanyConfig';
import PanelPlataformaAdmin from '../pages/Apps/PanelPlataformaAdmin';
import LoginCover from '../pages/Authentication/LoginCover';
import EmpresaPrivateRoute from './EmpresaPrivateRoute';
import { Route } from '../config/permissions';

const routes = [
  {
    path: '/auth/login',
    element: <Login />,
  },
  {
    path: '/auth/register',
    element: <Register />,
  },
  {
    path: '/CompanyConfig/:empresaId',
    element: (
      <EmpresaPrivateRoute>
        <CompanyConfig />
      </EmpresaPrivateRoute>
    ),
  },
  {
    path: '/auth/LoginCover',
    element: <LoginCover />,
  },
  {
    path: '/unauthorized',
    element: <PrivateRoute><Unauthorized /></PrivateRoute>,
  },
  {
    path: '/Calendar',
    element: (
      <PrivateRoute>
        <PermissionRoute route={Route.Calendario}>
          <Calendar />
        </PermissionRoute>
      </PrivateRoute>
    ),
  },
  {
    path: '/CalendarAusentes',
    element: (
      <PrivateRoute>
        <PermissionRoute route={Route.AusentesCalendar}>
          <CalendarAusentes />
        </PermissionRoute>
      </PrivateRoute>
    ),
  },
  {
    path: '/PanelColaboradoresList',
    element: (
      <PrivateRoute>
        <PermissionRoute route={Route.PanelColaboradores}>
          <PanelColaboradoresList />
        </PermissionRoute>
      </PrivateRoute>
    ),
  },
  {
    path: '/',
    element: <PrivateRoute><Home /></PrivateRoute>,
  },
  {
    path: '/HowAreYou',
    element: <PrivateRoute><HowAreYou /></PrivateRoute>,
  },
  {
    path: '/IdeaBox',
    element: <PrivateRoute><IdeaBox /></PrivateRoute>,
  },
  {
    path: '/FeedbackColaborador',
    element: <PrivateRoute><FeedbackColaborador /></PrivateRoute>,
  },
  {
    path: '/PermisoTemporal',
    element: <PrivateRoute><PermisoTemporal /></PrivateRoute>,
  },
  {
    path: '/Reconocemos',
    element: <PrivateRoute><Reconocemos /></PrivateRoute>,
  },
  {
    path: '/Certificados',
    element: <PrivateRoute><Certificados /></PrivateRoute>,
  },
  {
    path: '/Registro',
    element: <PrivateRoute><Registro /></PrivateRoute>,
  },
  {
    path: '/panelFeedback',
    element: (
      <PrivateRoute>
        <PermissionRoute route={Route.PanelFeedBack}>
          <PanelFeedBack />
        </PermissionRoute>
      </PrivateRoute>
    ),
  },
  {
    path: '/Vacaciones',
    element: <PrivateRoute><Vacaciones /></PrivateRoute>,
  },
  {
    path: '/panelAdminVacaciones',
    element: (
      <PrivateRoute>
        <PermissionRoute route={Route.PanelAdminVacaciones}>
          <PanelAdminVacaciones />
        </PermissionRoute>
      </PrivateRoute>
    ),
  },
  {
    path: '/panelAdminIdeas',
    element: (
      <PrivateRoute>
        <PermissionRoute route={Route.PanelAdminIdeas}>
          <PanelAdminIdeas />
        </PermissionRoute>
      </PrivateRoute>
    ),
  },
  {
    path: '/panelPermisosTemporales',
    element: (
      <PrivateRoute>
        <PermissionRoute route={Route.PanelPermisosTemporales}>
          <PanelPermisosTemporales />
        </PermissionRoute>
      </PrivateRoute>
    ),
  },
  {
    path: '/ManageMoods',
    element: (
      <PrivateRoute>
        <PermissionRoute route={Route.ManageMoods}>
          <ManageMoods />
        </PermissionRoute>
      </PrivateRoute>
    ),
  },
  {
    path: '/PanelPresentismo',
    element: (
      <PrivateRoute>
        <PermissionRoute route={Route.PanelPresentismo}>
          <PanelPresentismo />
        </PermissionRoute>
      </PrivateRoute>
    ),
  },
  {
    path: '/PanelCertificados',
    element: (
      <PrivateRoute>
        <PermissionRoute route={Route.PanelCertificados}>
          <PanelCertificados />
        </PermissionRoute>
      </PrivateRoute>
    ),
  },
  {
    path: '/PanelDesempeno',
    element: (
      <PrivateRoute>
        <PermissionRoute route={Route.PanelDesempeno}>
          <PanelDesempeno />
        </PermissionRoute>
      </PrivateRoute>
    ),
  },
  {
    path: '/MiDesempeno',
    element: (
      <PrivateRoute>
        <PermissionRoute route={Route.MiDesempeno}>
          <MiDesempeno />
        </PermissionRoute>
      </PrivateRoute>
    ),
  },
  {
    path: '/TeamDetails',
    element: <PrivateRoute><TeamDetails /></PrivateRoute>,
  },
  {
    path: '/mundial',
    element: <PrivateRoute><MundialPage /></PrivateRoute>,
  },
  {
    path: '/platform-admin',
    element: (
      <PrivateRoute>
        <PermissionRoute route={Route.PlatformAdmin}>
          <PanelPlataformaAdmin />
        </PermissionRoute>
      </PrivateRoute>
    ),
  },
  {
    path: '/*',
    element: <Error />,
  },
];

export { routes };
