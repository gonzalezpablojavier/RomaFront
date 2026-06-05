
import PrivateRoute from './PrivateRoute';
import Login from '../pages/Authentication/LoginBoxed';
import Register from '../pages/Authentication/RegisterCover';

import Error from '../components/Error';
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
import LoginCover from '../pages/Authentication/LoginCover';
//import Index from '../pages/Index';



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
    element: <CompanyConfig />,
  },

  {
    path: '/auth/LoginCover',
    element: <LoginCover />,
  },
  {
    path: '/Calendar',
    element: <PrivateRoute><Calendar /></PrivateRoute>,
  },

  {
    path: '/CalendarAusentes',
    element: <PrivateRoute><CalendarAusentes /></PrivateRoute>,
  },
  {
    path: '/PanelColaboradoresList',
    element: <PrivateRoute><PanelColaboradoresList /></PrivateRoute>,
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
    element: <PrivateRoute><PanelFeedBack /></PrivateRoute>,
  },
  {
    path: '/Vacaciones',
    element: <PrivateRoute><Vacaciones /></PrivateRoute>,
  },
  {
    path: '/panelAdminVacaciones',
    element: <PrivateRoute><PanelAdminVacaciones /></PrivateRoute>,
  },
  {
    path: '/panelAdminIdeas',
    element: <PrivateRoute><PanelAdminIdeas /></PrivateRoute>,
  },
  {
    path: '/panelPermisosTemporales',
    element: <PrivateRoute><PanelPermisosTemporales /></PrivateRoute>,
  },
  {
    path: '/ManageMoods',
    element: <PrivateRoute><ManageMoods /></PrivateRoute>,
  },
  {
    path: '/PanelPresentismo',
    element: <PrivateRoute><PanelPresentismo /></PrivateRoute>,
  },
  {
    path: '/PanelCertificados',
    element: <PrivateRoute><PanelCertificados /></PrivateRoute>,
  },
  {
    path: '/PanelDesempeno',
    element: <PrivateRoute><PanelDesempeno /></PrivateRoute>,
  },
  {
    path: '/MiDesempeno',
    element: <PrivateRoute><MiDesempeno /></PrivateRoute>,
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
    path: '/*',
    element: <Error />,
  },
];

export { routes };