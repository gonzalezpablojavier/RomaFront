import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { IRootState } from '../../store';
import { toggleSidebar } from '../../store/themeConfigSlice';
import Dropdown from '../Dropdown';
import lw from '/assets/images/logo-head.png';
import lb from '/assets/images/logo-foot.png';
import { apiClient } from '../../api/apiClient';
import { getDefaultUserPhotoUrl } from '../../config/env';
import {
  getSessionEmpresaId,
  getSessionUserId,
  getSessionUser,
  purgeLegacyAuthStorage,
} from '../../session/sessionStore';
import { useAuth } from '../../context/AuthContext';


interface InboxNotification {
  id: number;
  type: string;
  message: string;
  colaboradorID: number;
  photo: string;
  date: string;
  isRead: boolean;
}

function formatTimeAgo(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'hace un momento';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} día${days === 1 ? '' : 's'}`;
}
const Header = () => {
  const [colaboradorID, setColaboradorID] = useState<string | null>(null);
  const [empresaID, setEmpresaID] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<InboxNotification[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // NUEVOS estados para cámara y ubicación
  const [cameraStatus, setCameraStatus] = useState<string>('No definida');
  const [locationStatus, setLocationStatus] = useState<string>('No definida');

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { logout } = useAuth();
  const themeConfig = useSelector((state: IRootState) => state.themeConfig);



  



  useEffect(() => {
    const userId = getSessionUserId();
    const storedEmpresa = getSessionEmpresaId();
    if (userId) {
      setColaboradorID(userId);
    }
    if (storedEmpresa) {
      setEmpresaID(storedEmpresa);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!colaboradorID || !empresaID) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/notificaciones/${colaboradorID}`, {
        headers: { 'x-empresa-id': empresaID },
      });
      const raw = res.data?.data;
      const items: InboxNotification[] = Array.isArray(raw) ? raw : [];
      setNotifications(
        items.map((n) => ({
          ...n,
          date: typeof n.date === 'string' ? n.date : new Date(n.date as unknown as string).toISOString(),
        })),
      );
    } catch (e) {
      console.error('Error cargando notificaciones:', e);
      setNotifications([]);
      setError('No se pudieron cargar las notificaciones');
    } finally {
      setLoading(false);
    }
  }, [colaboradorID, empresaID]);



  useEffect(() => {
    if (colaboradorID && empresaID) {
      fetchNotifications();
      const t = window.setInterval(fetchNotifications, 120000);
      return () => window.clearInterval(t);
    }
  }, [colaboradorID, empresaID, fetchNotifications]);





  const markAllAsRead = async () => {
    if (!colaboradorID || !empresaID) return;
    try {
      await apiClient.put(`/notificaciones/mark-all-read/${colaboradorID}`, {});
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };



  useEffect(() => {
    const selector = document.querySelector(
      'ul.horizontal-menu a[href="' + window.location.pathname + '"]',
    );
    if (selector) {
      selector.classList.add('active');
      const all: any = document.querySelectorAll(
        'ul.horizontal-menu .nav-link.active',
      );
      for (let i = 0; i < all.length; i++) {
        all[0]?.classList.remove('active');
      }
      const ul: any = selector.closest('ul.sub-menu');
      if (ul) {
        let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link');
        if (ele) {
          ele = ele[0];
          setTimeout(() => {
            ele?.classList.add('active');
          });
        }
      }
    }
  }, [location]);


  const fetchData = useCallback(async () => {
    if (!colaboradorID || !empresaID) {
      console.log('No colaboradorID or empresaID available fechdata', { empresaID }, { colaboradorID });
      return;
    }
    try {
      const profileResponse = await apiClient.get(`/usuarios-registrados/${colaboradorID}`);
      if (profileResponse.data.ok === 1) {
        setProfile(profileResponse.data.data);
      } else {
        console.error('Error in profile response:', profileResponse.data);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  }, [colaboradorID, empresaID]);


  const handleLogout = () => {
    purgeLegacyAuthStorage();
    logout();
    navigate('/auth/login');
  };
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function createMarkup(messages: any) {
    return { __html: messages };
  }
  const [messages, setMessages] = useState([
    {
      id: 1,
      image:
        '<span class="grid place-content-center w-9 h-9 rounded-full bg-success-light dark:bg-success text-success dark:text-success-light"><svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></span>',
      title: 'Congratulations!',
      message: 'Your OS has been updated.',
      time: '1hr',
    },
    {
      id: 2,
      image:
        '<span class="grid place-content-center w-9 h-9 rounded-full bg-info-light dark:bg-info text-info dark:text-info-light"><svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></span>',
      title: 'Did you know?',
      message: 'You can switch between artboards.',
      time: '2hr',
    },
    {
      id: 3,
      image:
        '<span class="grid place-content-center w-9 h-9 rounded-full bg-danger-light dark:bg-danger text-danger dark:text-danger-light"> <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></span>',
      title: 'Something went wrong!',
      message: 'Send Reposrt',
      time: '2days',
    },
    {
      id: 4,
      image:
        '<span class="grid place-content-center w-9 h-9 rounded-full bg-warning-light dark:bg-warning text-warning dark:text-warning-light"><svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">    <circle cx="12" cy="12" r="10"></circle>    <line x1="12" y1="8" x2="12" y2="12"></line>    <line x1="12" y1="16" x2="12.01" y2="16"></line></svg></span>',
      title: 'Warning',
      message: 'Your password strength is low.',
      time: '5days',
    },
  ]);

  const removeMessage = (value: number) => {
    setMessages(messages.filter(user => user.id !== value));
  };




  const [search, setSearch] = useState(false);


  // ────────────── NUEVO useEffect para consultar los permisos de cámara y ubicación ──────────────
  useEffect(() => {
    if (navigator.permissions) {
      // Permiso de cámara
      navigator.permissions
        .query({ name: 'camera' as PermissionName })
        .then((result) => {
          if (result.state === 'granted') {
            setCameraStatus('Activada');
          } else if (result.state === 'denied') {
            setCameraStatus('Desactivada');
          } else {
            setCameraStatus('No definida');
          }
          // Escuchar cambios en el permiso (si el navegador lo permite)
          result.onchange = () => {
            if (result.state === 'granted') {
              setCameraStatus('Activada');
            } else if (result.state === 'denied') {
              setCameraStatus('Desactivada');
            } else {
              setCameraStatus('No definida');
            }
          };
        })
        .catch(() => {
          setCameraStatus('Error');
        });

      // Permiso de geolocalización
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((result) => {
          if (result.state === 'granted') {
            setLocationStatus('Activa');
          } else if (result.state === 'denied') {
            setLocationStatus('Desactivada');
          } else {
            setLocationStatus('No definida');
          }
          result.onchange = () => {
            if (result.state === 'granted') {
              setLocationStatus('Activa');
            } else if (result.state === 'denied') {
              setLocationStatus('Desactivada');
            } else {
              setLocationStatus('No definida');
            }
          };
        })
        .catch(() => {
          setLocationStatus('Error');
        });
    } else {
      setCameraStatus('No soportada');
      setLocationStatus('No soportada');
    }
  }, []);
  // ─────────────────────────────────────────────────────────────────────────────────────────────

  // ────────────── NUEVA FUNCIÓN: Notificaciones Push ──────────────
  const handleEnablePushNotifications = async () => {
    // Verificamos si el navegador soporta notificaciones
    if (!('Notification' in window)) {
      alert('Este navegador no soporta notificaciones push.');
      return;
    }

  

    // Si no se han solicitado o se denegaron, solicitamos permiso
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
     
      } else {
        console.log('Permiso para notificaciones push no concedido.');
      }
    } catch (error) {
      console.error('Error al solicitar permiso para notificaciones push:', error);
    }
  };
  // ─────────────────────────────────────────────────────────────────


  // Inyectar CSS para forzar fondo blanco del dropdown
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .dropdown-menu-white {
        background-color: white !important;
        color: black !important;
      }
      .dropdown-menu-white * {
        color: black !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  return (
    <header>
      <div className="shadow-sm rounded-md">
        <div className="relative bg-white flex w-full items-center px-5 py-2.5">
          <div className="horizontal-logo flex justify-between items-center ltr:mr-2 rtl:ml-2">
            <Link to="/" className="main-logo flex items-center shrink-0">
              <span className="text-1xl ltr:ml-1.5 rtl:mr-1.5 font-semibold align-middle lg:inline text-blue-600">{'ROMA'}</span>

              <span className="text-2xl ltr:ml-1.5 rtl:mr-1.5  font-semibold  align-middle hidden md:inline transition-all duration-300"></span>
            </Link>
            <button
              type="button"
              className="collapse-icon flex-none hover:text-primary flex lg:hidden ltr:ml-2 rtl:mr-2 p-2 rounded-full bg-gray-100 hover:bg-gray-200"
              onClick={() => {
                dispatch(toggleSidebar(false));
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 7L4 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path opacity="0.5" d="M20 12L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M20 17L4 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>



          </div>




          <div className="sm:flex-1 ltr:sm:ml-0 ltr:ml-auto sm:rtl:mr-0 rtl:mr-auto flex items-center space-x-1.5 lg:space-x-2 rtl:space-x-reverse">
            <div className="sm:ltr:mr-auto sm:rtl:ml-auto"></div>
            {/*
                        <div>
                            {themeConfig.theme === 'light' ? (
                                <button
                                    className={`${
                                        themeConfig.theme === 'light' &&
                                        'flex items-center p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60'
                                    }`}
                                    onClick={() => {
                                        setTheme('dark');
                                        dispatch(toggleTheme('dark'));
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" />
                                        <path d="M12 2V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path d="M12 20V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path d="M4 12L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path d="M22 12L20 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path opacity="0.5" d="M19.7778 4.22266L17.5558 6.25424" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path opacity="0.5" d="M4.22217 4.22266L6.44418 6.25424" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path opacity="0.5" d="M6.44434 17.5557L4.22211 19.7779" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path opacity="0.5" d="M19.7778 19.7773L17.5558 17.5551" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </button>
                            ) : (
                                ''
                            )}
                            {themeConfig.theme === 'dark' && (
                                <button
                                    className={`${
                                        themeConfig.theme === 'dark' &&
                                        'flex items-center p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60'
                                    }`}
                                    onClick={() => {
                                        setTheme('light');
                                        dispatch(toggleTheme('light'));
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M21.0672 11.8568L20.4253 11.469L21.0672 11.8568ZM12.1432 2.93276L11.7553 2.29085V2.29085L12.1432 2.93276ZM21.25 12C21.25 17.1086 17.1086 21.25 12 21.25V22.75C17.9371 22.75 22.75 17.9371 22.75 12H21.25ZM12 21.25C6.89137 21.25 2.75 17.1086 2.75 12H1.25C1.25 17.9371 6.06294 22.75 12 22.75V21.25ZM2.75 12C2.75 6.89137 6.89137 2.75 12 2.75V1.25C6.06294 1.25 1.25 6.06294 1.25 12H2.75ZM15.5 14.25C12.3244 14.25 9.75 11.6756 9.75 8.5H8.25C8.25 12.5041 11.4959 15.75 15.5 15.75V14.25ZM20.4253 11.469C19.4172 13.1373 17.5882 14.25 15.5 14.25V15.75C18.1349 15.75 20.4407 14.3439 21.7092 12.2447L20.4253 11.469ZM9.75 8.5C9.75 6.41182 10.8627 4.5828 12.531 3.57467L11.7553 2.29085C9.65609 3.5593 8.25 5.86509 8.25 8.5H9.75ZM12 2.75C11.9115 2.75 11.8077 2.71008 11.7324 2.63168C11.6686 2.56527 11.6538 2.50244 11.6503 2.47703C11.6461 2.44587 11.6482 2.35557 11.7553 2.29085L12.531 3.57467C13.0342 3.27065 13.196 2.71398 13.1368 2.27627C13.0754 1.82126 12.7166 1.25 12 1.25V2.75ZM21.7092 12.2447C21.6444 12.3518 21.5541 12.3539 21.523 12.3497C21.4976 12.3462 21.4347 12.3314 21.3683 12.2676C21.2899 12.1923 21.25 12.0885 21.25 12H22.75C22.75 11.2834 22.1787 10.9246 21.7237 10.8632C21.286 10.804 20.7293 10.9658 20.4253 11.469L21.7092 12.2447Z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                </button>
                            )}
                            
                        </div>
                        */}
            <div className="dropdown shrink-0">
              <Dropdown
                offset={[0, 8]}
                placement={`${false ? 'bottom-start' : 'bottom-end'}`}
                btnClassName="relative block p-2 rounded-full bg-gray-50 hover:text-primary hover:bg-gray-100"
                button={
                  <span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M19.0001 9.7041V9C19.0001 5.13401 15.8661 2 12.0001 2C8.13407 2 5.00006 5.13401 5.00006 9V9.7041C5.00006 10.5491 4.74995 11.3752 4.28123 12.0783L3.13263 13.8012C2.08349 15.3749 2.88442 17.5139 4.70913 18.0116C9.48258 19.3134 14.5175 19.3134 19.291 18.0116C21.1157 17.5139 21.9166 15.3749 20.8675 13.8012L19.7189 12.0783C19.2502 11.3752 19.0001 10.5491 19.0001 9.7041Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path d="M7.5 19C8.15503 20.7478 9.92246 22 12 22C14.0775 22 15.845 20.7478 16.5 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M12 6V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    {notifications.length > 0 && (
                      <span className="flex absolute w-3 h-3 ltr:right-0 rtl:left-0 top-0">
                        <span className="animate-ping absolute ltr:-left-[3px] rtl:-right-[3px] -top-[3px] inline-flex h-full w-full rounded-full bg-success/50 opacity-75"></span>
                        <span className="relative inline-flex rounded-full w-[6px] h-[6px] bg-success"></span>
                      </span>
                    )}
                  </span>
                }
              >
                <ul className="!py-0 text-dark w-[300px] sm:w-[350px] divide-y divide-gray-200">
                  <li onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center px-4 py-2 justify-between font-semibold">
                      <h4 className="text-lg">Notificaciones</h4>
                      <p className="text-xs bg-primary-light rounded text-primary px-1">
                        {notifications.length} nueva{notifications.length === 1 ? '' : 's'}
                      </p>
                    </div>
                  </li>
                  {notifications.length > 0 ? (
                    <>
                      {notifications.map((notification) => {
                        return (
                          <li key={notification.id} className="text-gray-700" onClick={(e) => e.stopPropagation()}>
                            <div className="group flex items-center px-4 py-2">
                              <div className="grid place-content-center rounded">
                                <div className="w-12 h-12 relative">
                                  {profile ? (
                                    <img
                                      src={notification.photo || getDefaultUserPhotoUrl()}
                                      alt="Foto de perfil"
                                      className="rounded-md w-6 h-6 object-cover"
                                    />
                                  ) : (
                                    <img
                                      src={getDefaultUserPhotoUrl()}
                                      alt="Foto de perfil"
                                      className="rounded-md w-6 h-6 object-cover"
                                    />
                                  )
                                  }


                                </div>
                              </div>
                              <div className="ltr:pl-3 rtl:pr-3 flex flex-auto">
                                <div className="ltr:pr-3 rtl:pl-3">
                                  <h6 className="font-medium text-sm leading-snug">{notification.message}</h6>
                                  <span className="text-xs block font-normal text-gray-500">
                                    {formatTimeAgo(notification.date)}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  className="ltr:ml-auto rtl:mr-auto text-neutral-300 hover:text-danger opacity-0 group-hover:opacity-100"
                                  onClick={() => (notification.id)}
                                >
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle opacity="0.5" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M14.5 9.50002L9.5 14.5M9.49998 9.5L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                      <li>
                        <div className="p-4">
                          <button className="btn btn-primary block w-full btn-small" onClick={markAllAsRead}>
                            Ocultar Notificaciones
                          </button>
                        </div>
                      </li>
                    </>
                  ) : (
                    <li onClick={(e) => e.stopPropagation()}>
                      <button type="button" className="!grid place-content-center hover:!bg-transparent text-lg min-h-[200px]">
                        <div className="mx-auto ring-4 ring-primary/30 rounded-full mb-4">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="40"
                            height="40"
                            viewBox="0 0 24 24"
                            fill="#a9abb6"
                            stroke="#ffffff"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="feather feather-info bg-primary rounded-full"
                          >
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                          </svg>
                        </div>
                        No hay notificaciones disponibles.
                      </button>
                    </li>
                  )}
                </ul>
              </Dropdown>
            </div>
            <div className="dropdown shrink-0 flex">
              <Dropdown
                offset={[0, 8]}
                placement="bottom-end"
                btnClassName="relative group block"
                button={




                  <div className="">


                    {profile ? (
                      <img
                        src={profile.foto || getDefaultUserPhotoUrl()}
                        alt="Foto de perfil"
                        className="rounded-md w-6 h-6 object-cover"
                      />
                    ) : (
                      <img
                        src={getDefaultUserPhotoUrl()}
                        alt="Foto de perfil"
                        className="rounded-md w-6 h-6 object-cover"
                      />
                    )
                    }




                  </div>
                }
              >
                <ul className="text-dark !py-0 w-[230px] font-semibold bg-white dropdown-menu-white" style={{ backgroundColor: 'white !important' }}>

                  {profile ? (
                    <li>
                      <div className="flex items-center px-4 py-4">
                        <img
                          src={profile.foto || getDefaultUserPhotoUrl()}
                          alt={profile.foto ? "Foto de perfil" : "Foto por defecto"}
                          className="rounded-md w-10 h-10 object-cover"
                        />
                        <div className="ltr:pl-4 rtl:pr-4">
                          <h4 className="text-base">
                            {profile.nombre || "Nombre no disponible"}
                            <span className="text-xs bg-success-light rounded text-success px-1 ltr:ml-2 rtl:ml-2">
                              {profile.area || "Área no disponible"}
                            </span>
                          </h4>
                          <button type="button" className="text-black/60 hover:text-primary">
                            {profile.apellido || "Apellido no disponible"}
                          </button>
                        </div>
                      </div>
                    </li>
                  ) : (
                    <li>
                      <div className="flex items-center px-4 py-4">
                        <p>Información de perfil no disponible</p>
                      </div>
                    </li>
                  )}
                  {/* ────── NUEVA SECCIÓN: Información de cámara y ubicación ────── */}
                  <li className="px-4 py-2">
                    <span className="text-sm">Cámara: {cameraStatus}</span>
                  </li>
                  <li className="px-4 py-2">
                    <span className="text-sm">Ubicación: {locationStatus}</span>
                  </li>
                      {/* ─── NUEVO: Opción para habilitar notificaciones push ─── */}
                      <li className="px-4 py-2">
                    <button
                      onClick={handleEnablePushNotifications}
                      className="text-sm text-blue-600 hover:underline focus:outline-none"
                    >
                      Habilitar Notificaciones 
                    </button>
                  </li>

                  <li>
                    <Link to="/Registro" className="hover:text-blue-600">
                      <svg className="ltr:mr-2 rtl:ml-2" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" />
                        <path
                          opacity="0.5"
                          d="M20 17.5C20 19.9853 20 22 12 22C4 22 4 19.9853 4 17.5C4 15.0147 7.58172 13 12 13C16.4183 13 20 15.0147 20 17.5Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                      </svg>
                      Mis Datos
                    </Link>
                  </li>




                  <li className="border-t border-gray-200">
                    <button onClick={handleLogout} className="text-danger !py-3">
                      <svg
                        className="ltr:mr-2 rtl:ml-2 rotate-90"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          opacity="0.5"
                          d="M17 9.00195C19.175 9.01406 20.3529 9.11051 21.1213 9.8789C22 10.7576 22 12.1718 22 15.0002V16.0002C22 18.8286 22 20.2429 21.1213 21.1215C20.2426 22.0002 18.8284 22.0002 16 22.0002H8C5.17157 22.0002 3.75736 22.0002 2.87868 21.1215C2 20.2429 2 18.8286 2 16.0002L2 15.0002C2 12.1718 2 10.7576 2.87868 9.87889C3.64706 9.11051 4.82497 9.01406 7 9.00195"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M12 15L12 2M12 2L15 5.5M12 2L9 5.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Cerrar sesión
                    </button>
                  </li>
                </ul>
              </Dropdown>
            </div>
          </div>
        </div>



      </div>
    </header>
  );
};

export default Header;
