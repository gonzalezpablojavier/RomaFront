import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import BirthdayCheckModal from '../../components/BirthdayCheckModal';
import type { PresentismoRef } from './Presentismo';
import { isAfter, startOfDay, parseISO, differenceInMonths, differenceInDays } from 'date-fns';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toggleSidebar } from '../../store/themeConfigSlice';
import { requestNotificationPermission } from '../../config/firebase';
//import Presentismo= React.lazy(() =>  from './Presentismo';
import { calculateDistance } from '../../utils/geolocation'; // Función para calcular la distancia
import { formatHoraRegistroArgentina } from '../../utils/horaRegistro';
import { getNapsisLoginUrl, getQrHomeUrl } from '../../config/env';
import {
  QrCode,
  TrendingUp,
  Heart,
  Plane,
  Palmtree,
  Star,
  Award,
  Lightbulb,
  Receipt,
  Users,
  MapPin,
} from 'lucide-react';
import HomeTile, { type HomeTileStatus } from '../../components/Home/HomeTile';
import HomeSectionLabel from '../../components/Home/HomeSectionLabel';
import HomeHero from '../../components/Home/HomeHero';
import HomeFichajePanel from '../../components/Home/HomeFichajePanel';
import HomeMoodStrip from '../../components/Home/HomeMoodStrip';
import HomeMundialDistriCta from '../../components/Home/HomeMundialDistriCta';
import { homePageShell, homeWatermark } from '../../components/Home/homeSurface';
import { useHomeMood } from '../../hooks/useHomeMood';

const Presentismo = React.lazy(() => import('./Presentismo'));


// Variables globales para el cooldown y la última ubicación
let lastRequestTime = 0; // Tiempo de la última solicitud
const cooldownDuration = 5 * 60 * 1000; // Cooldown de 5 minutos (en milisegundos)
let lastLocation: { latitude: number; longitude: number } | null = null; // Última ubicación registrada
const distanceThreshold = 0.1; // Umbral de distancia en kilómetros (100 metros)
const colaboradoresEspeciales = [1, 8, 110, 135,
  162, 149]; // IDs especiales de colaboradores

/** Colaboradores que ven el acceso a Mundial Distri en Home (piloto). */
const colaboradoresMundialDistri = [1, 8, 7];


/** Poner en `true` para mostrar de nuevo el botón "Mi Feedback" (Mi Desempeño) en Home. */
const SHOW_MI_FEEDBACK_HOME_BADGE = true;

const Home: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [colaboradorID, setColaboradorID] = useState<string | null>(null);
  const [empresaID, setEmpresaID] = useState<string | null>(null);
  const [presentTime, setPresentTime] = useState<any>(null);
  const [solicitud, setSolicitud] = useState<any>(null);
  const [solicitudVacaciones, setSolicitudVacaciones] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [felicitacionesDisponibles, setFelicitacionesDisponibles] = useState<number | null>(null);
  const [felicitacionesRecibidas, setfelicitacionesRecibidas] = useState<number | null>(null);
  const [revisionesRecibidas, setrevisionesRecibidas] = useState<number | null>(null);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [notification, setNotification] = useState<{ title: string; body: string } | null>(null);
  const [mostrarPresentismo, setMostrarPresentismo] = useState(false);
  const [cargando, setCargando] = useState(false);
  const presentismoRef = useRef<PresentismoRef | null>(null);
  const [autoIniciarCamaraAbrir, setAutoIniciarCamaraAbrir] = useState(false);
  const [pulsoTileFichaje, setPulsoTileFichaje] = useState<'idle' | 'exito' | 'error'>('idle');
  const [userArea, setUserArea] = useState<string>('');
  const [isButtonDisabled, setIsButtonDisabled] = useState(false); // Nuevo estado para controla
  const API_URL = `${import.meta.env.VITE_API_DISTRI_API}`;
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { lastMood, setLastMood, moodMessage, moodPending, submitMood } = useHomeMood({
    apiUrl: API_URL,
    empresaID,
    colaboradorID,
  });

  const manejarClick = () => {
    setCargando(true); // Mostrar la imagen de carga
    setMostrarPresentismo(true);
  };

  const manejarComponenteMontado = () => {
    setCargando(false); // Ocultar la imagen de carga al montar el componente
  };

  const limpiarAutoIniciarCamara = useCallback(() => {
    setAutoIniciarCamaraAbrir(false);
  }, []);

  const feedbackVisualFichaje = useCallback((tipo: 'exito' | 'error') => {
    setPulsoTileFichaje(tipo);
    window.setTimeout(() => setPulsoTileFichaje('idle'), 1100);
  }, []);

  const activarFichadoOfi = () => {
    if (!mostrarPresentismo) {
      setAutoIniciarCamaraAbrir(true);
      manejarClick();
    } else {
      presentismoRef.current?.iniciarCamaraSiPuede();
    }
  };


  useEffect(() => {
    const fetchUserArea = async () => {
      try {
        const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null;
        const userCode = user?.user_code;
        const empresaGuardada = localStorage.getItem('l_empresa_id');

        if (!userCode || !empresaGuardada) return;

        const response = await fetch(`${API_URL}/usuarios-registrados`, {
          headers: { 'x-empresa-id': empresaGuardada }
        });

        const data = await response.json();

        if (data.ok === 1 && Array.isArray(data.data)) {
          const colaborador = data.data.find((c: any) =>
            c.colaboradorID.toString() === userCode.toString()
          );

          if (colaborador) {
            console.log('Área encontrada:', colaborador.area);
            console.log('🔍 Debug - Colaborador encontrado:', colaborador);
            console.log('🔍 Debug - colaboradorID del colaborador:', colaborador.colaboradorID, 'tipo:', typeof colaborador.colaboradorID);
            setUserArea(colaborador.area);
            setColaboradorID(colaborador.colaboradorID.toString());

            // Verificar si la fecha de actualización es mayor a un mes
            // if (colaboradoresEspeciales.includes(Number(userCode))) 
            {
              console.log('No se encontró el colaborador con IDswwwwwwwwwwww:');

              // Convertir la fecha de actualización a un objeto Date
              let fechaActualizado;

              try {
                const fechaResponse = await fetch(`${API_URL}/colaborador-auditoria/ultima-actualizacion-domicilio/${userCode}`);

                if (!fechaResponse.ok) {
                  throw new Error('Error al obtener la fecha de actualización');
                }

                const fechaData = await fechaResponse.json();

                // Verificar si fechaData está vacío o es inválido
                if (!fechaData) {
                  // Si no hay fecha devuelta, establecer una fecha predeterminada de 2 meses atrás
                  const hoy = new Date();
                  fechaActualizado = new Date(hoy.setMonth(hoy.getMonth() - 2));
                  console.log('No se encontró fecha de actualización. Usando fecha predeterminada:', fechaActualizado);
                } else {
                  // Convertir la fecha de actualización a un objeto Date
                  fechaActualizado = new Date(fechaData); // Asume que fechaData es la fecha en formato ISO
                }
              } catch (error) {
                console.error('Error al obtener la fecha de actualización:', error);
                // En caso de error, establecer una fecha predeterminada de 2 meses atrás
                const hoy = new Date();
                fechaActualizado = new Date(hoy.setMonth(hoy.getMonth() - 2));
                console.log('Error al obtener la fecha. Usando fecha predeterminada:', fechaActualizado);
              }

              const hoy = new Date();

              const diferenciaDias = differenceInDays(hoy, fechaActualizado);
              console.log('Diferencia en días:', diferenciaDias);

              if (diferenciaDias > 30) { // Considerar un mes como 30 días
                setIsButtonDisabled(true);
                setMessage('Debe actualizar su domicilio para fichar.');
              } else {
                setIsButtonDisabled(false);
                setMessage('');
              }

              if (differenceInMonths(hoy, fechaActualizado) > 1) {
                setIsButtonDisabled(true);
                setMessage('Debe actualizar su domicilio para fichar.'); // Mensaje informativo
              }
            }


          } else {
            console.log('No se encontró el colaborador con ID:', userCode);
          }
        }
      } catch (error) {
        console.error('Error al obtener el área del usuario:', error);
      }
    };

    fetchUserArea();
  }, [API_URL]); // Solo depende de API_URL


  useEffect(() => {
    // El Service Worker se registra automáticamente por el plugin PWA
    // No es necesario registrarlo manualmente aquí

    const setupNotifications = async () => {
      const token = await requestNotificationPermission();
      if (token) {
        console.log('Token de notificación:', token);
        const colaboradorID = ((localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null) as { user_code: string | null })?.user_code;
        const empresaID = "default";


        if (colaboradorID) {
          try {
            await axios.post(
              `${API_URL}/notifications/store-token`,
              { token, colaboradorID },
              { headers: { 'x-empresa-id': empresaID } }
            );
            console.log('Token almacenado exitosamente en el backend');
          } catch (error) {
            console.error('Error al almacenar el token en el backend:', error);
          }
        }


        // Aquí podrías enviar este token al backend para guardarlo y vincularlo con el usuario
        //  await axios.post(`${API_URL}/notifications/send-web-test`, { token, colaboradorID }, { headers: { 'x-empresa-id': empresaID } });
      } else {
        console.log('Permiso de notificación denegado.');
      }
    };

    setupNotifications();
  }, [colaboradorID, empresaID]);




  useEffect(() => {
    const user = ((localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null) as { user_code: string | null })?.user_code;
    const storedEmpresa = localStorage.getItem('l_empresa_id');
    const storedColaboradorID = user;
    console.log('🔍 Debug - user_code del localStorage:', user, 'tipo:', typeof user);
    if (storedColaboradorID) {
      setColaboradorID(storedColaboradorID);
      console.log('🔍 Debug - colaboradorID establecido desde localStorage:', storedColaboradorID);
    }
    if (storedEmpresa) {
      try {
        console.log(storedEmpresa);
        setEmpresaID(storedEmpresa);
      } catch (error) {
        console.error('Error parsing empresa data:', error);
        // Manejar el error
      }
    }
  }, []);

  const fetchData = useCallback(async () => {

    if (!colaboradorID) return;

    if (!colaboradorID || !empresaID) return;

    try {
      const config = {
        headers: { 'x-empresa-id': empresaID }
      };

      const profileResponse = await axios.get(`${API_URL}/usuarios-registrados/${colaboradorID}`, config);
      if (profileResponse.data.ok === 1) {
        setProfile(profileResponse.data.data);
      }

      const recibidasFelicitacionResponse = await axios.get(`${API_URL}/feedback/received/counts/${colaboradorID}`, config);
      if (recibidasFelicitacionResponse.data.ok === 1) {
        setfelicitacionesRecibidas(recibidasFelicitacionResponse.data.data.felicitaciones);
      }

      const recibidasRevisionResponse = await axios.get(`${API_URL}/feedback/received/counts/${colaboradorID}`, config);
      if (recibidasRevisionResponse.data.ok === 1) {
        setrevisionesRecibidas(recibidasRevisionResponse.data.data.revisiones);
      }

      const moodResponse = await axios.get(`${API_URL}/howareyou/${colaboradorID}/last`, config);
      if (moodResponse.data.ok === 1) {
        const moodDate = parseISO(moodResponse.data.data.date);
        if (!isAfter(startOfDay(new Date()), startOfDay(moodDate))) {
          setLastMood(moodResponse.data.data);
        } else {
          setLastMood(null);
        }
      }

      const presentTimeResponse = await axios.get(`${API_URL}/presentismo/${colaboradorID}/last`, config);
      if (presentTimeResponse.data.ok === 1) {
        setPresentTime(presentTimeResponse.data.data);
      }

      const solicitudResponse = await axios.get(`${API_URL}/permiso-temporal/latest/${colaboradorID}`, config);
      if (solicitudResponse.data && solicitudResponse.data.fechaPermiso) {
        const fechaPermiso = parseISO(solicitudResponse.data.fechaPermiso);
        if (!isAfter(startOfDay(new Date()), startOfDay(fechaPermiso))) {
          setSolicitud(solicitudResponse.data);
        } else {
          setSolicitud({ ...solicitudResponse.data, autorizado: null });
        }
      } else {
        setSolicitud(null);
      }

      const vacacionesResponse = await axios.get(`${API_URL}/vacaciones/latest/${colaboradorID}`, config);
      setSolicitudVacaciones(vacacionesResponse.data);

      const response = await axios.get(`${API_URL}/feedback/felicitaciones-disponibles/${colaboradorID}`, config);
      if (response.data.ok === 1) {
        setFelicitacionesDisponibles(response.data.data.disponibles);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [colaboradorID, API_URL, empresaID, setLastMood]);

  useEffect(() => {
    if (colaboradorID) {
      fetchData();
      const intervalId = setInterval(() => {
        setRefreshKey(oldKey => oldKey + 1);
      }, 30000);
      return () => clearInterval(intervalId);
    }
  }, [colaboradorID, refreshKey, fetchData]);


  const monitorLocation = (colaboradorID: string) => {

    if (!navigator.geolocation) {
      console.error("La geolocalización no está soportada en este navegador.");
      return;
    }



    // Variables locales
    let lastRequestTime = 0;
    const cooldownDuration = 10 * 60 * 1000; // Cooldown de 5 minutos
    const distanceThreshold = 0.5; // Umbral de distancia en kilómetros (100 metros)  
    const toleranceRadius = 0.30; // Radio de tolerancia en kilómetros (50 metros)
    const minTimeBetweenUpdates = 5 * 60 * 1000; // Mínimo 5 minutos entre actualizaciones
    const maxHistoryLength = 5; // Número máximo de ubicaciones en el historial

    // Recuperar la última ubicación guardada
    const savedLocation = localStorage.getItem("lastLocation");
    let lastLocation: { latitude: number; longitude: number } | null = savedLocation
      ? JSON.parse(savedLocation)
      : null;


    const savedLocationHistory = localStorage.getItem("locationHistory");
    let locationHistory: { latitude: number; longitude: number }[] = savedLocationHistory
      ? JSON.parse(savedLocationHistory)
      : [];

    function getAverageLocation(): { latitude: number; longitude: number } | null {
      if (locationHistory.length === 0) return null;

      const avgLatitude =
        locationHistory.reduce((sum, loc) => sum + loc.latitude, 0) / locationHistory.length;
      const avgLongitude =
        locationHistory.reduce((sum, loc) => sum + loc.longitude, 0) / locationHistory.length;

      return { latitude: avgLatitude, longitude: avgLongitude };
    }


    function addLocationToHistory(latitude: number, longitude: number) {
      const isDuplicate = locationHistory.some(
        (loc) =>
          Math.abs(loc.latitude - latitude) < toleranceRadius &&
          Math.abs(loc.longitude - longitude) < toleranceRadius
      );
      if (!isDuplicate) {
        locationHistory.push({ latitude, longitude });
        if (locationHistory.length > maxHistoryLength) {
          locationHistory.shift(); // Eliminar la ubicación más antigua
        }
        localStorage.setItem("locationHistory", JSON.stringify(locationHistory));
      }
    }


    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Ubicación obtenida:", position.coords);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          alert("Por favor, habilita los permisos de ubicación en la configuración de tu navegador.");
        }
      }
    );


    if (colaboradorID != '288') {
      console.error("solo nico bastonero");
      // return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {

        const currentTime = Date.now();
        const { latitude, longitude } = position.coords;

        // Guardar la última ubicación en localStorage
        localStorage.setItem("lastLocation", JSON.stringify({ latitude, longitude }));

        // Actualizar el historial de ubicaciones
        addLocationToHistory(latitude, longitude);


        // Calcular el promedio de las últimas ubicaciones
        const averageLocation = getAverageLocation();
        if (!averageLocation) return;

        // Verificar si ha pasado suficiente tiempo desde la última solicitud
        if (currentTime - lastRequestTime < cooldownDuration) {
          console.log("Cooldown activo. No se enviará una nueva solicitud.");
          return;
        }


        // Verificar radio de tolerancia
        if (lastLocation) {
          const distance = calculateDistance(
            averageLocation.latitude,
            averageLocation.longitude,
            lastLocation.latitude,
            lastLocation.longitude
          );
          if (distance < toleranceRadius) {
            console.log("Movimiento dentro del radio de tolerancia. No se realizará ninguna acción.");
            return;
          }
        }

        // Verificar si hay un cambio significativo en la ubicación
        if (lastLocation) {
          const distance = calculateDistance(latitude, longitude, lastLocation.latitude, lastLocation.longitude);
          if (distance < distanceThreshold) {
            console.log("No hay cambios significativos en la ubicación. No se enviará una nueva solicitud.");
            return;
          }
        }

        // Actualizar la última ubicación y el tiempo de la última solicitud
        lastLocation = averageLocation;
        lastRequestTime = currentTime;

        try {

          // Enviar las coordenadas al backend para fichar automáticamente
          const response = await axios.post(`${API_URL}/presentismo/fichadoGeo`, {
            colaboradorID,
            latitud: averageLocation.latitude,
            longitud: averageLocation.longitude,
          });

          console.log(response.data.message); // Mensaje de confirmación
        } catch (error) {
          console.error("Error al registrar fichado:", error);
        }
      },
      (error) => {
        console.error("Error al obtener la ubicación:", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60000,
        timeout: 30000
      } // Configuración avanzada
    );
    // Detectar cuando la página vuelve a estar visible
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        console.log("La página ha vuelto a estar visible. Reanudando monitoreo...");
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log("Ubicación obtenida tras volver a estar visible:", position.coords);
          },
          (error) => {
            console.error("Error al obtener la ubicación tras volver a estar visible:", error);
          }
        );
      }
    });
    // Detener el monitoreo cuando el componente se desmonte
    return () => navigator.geolocation.clearWatch(watchId);
  };




  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("La geolocalización no está soportada en este navegador."));
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve({ latitude, longitude });
        },
        (error) => {
          reject(error);
        }
      );
    });
  };


  const handleFichado = async () => {
    setCargando(true);

    try {
      const { latitude, longitude } = await getCurrentLocation();

      // Enviar las coordenadas al backend para fichar automáticamente
      const response = await axios.post(`${API_URL}/presentismo/fichadoGeo`, {
        colaboradorID,
        latitud: latitude,
        longitud: longitude,
      });

      console.log(response.data.message); // Mensaje de confirmación

      setMessage(response.data.message || "Fichado registrado con éxito.");
    } catch (error) {
      console.error("Error al registrar fichado:", error);

      setMessage("Ocurrió un error al registrar el fichado.");
    }



  };

  const getSolicitudStatus = (estado: string | undefined): HomeTileStatus => {
    switch (estado) {
      case 'Aprobado':
        return 'success';
      case 'Rechazado':
        return 'error';
      case 'Evaluando':
        return 'pending';
      default:
        return 'neutral';
    }
  };

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  const ultimoFichajeHora = useMemo(
    () => formatHoraRegistroArgentina(presentTime?.horaRegistro),
    [presentTime]
  );

  const headerAlerta = useMemo(() => {
    if (solicitud?.autorizado === 'Evaluando') return 'Permiso en evaluación';
    if (solicitud?.autorizado === 'Aprobado') return 'Permiso aprobado hoy';
    return null;
  }, [solicitud]);

  const handleNavigation = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const navigateWithSidebarClose = useCallback(
    (path: string) => {
      dispatch(toggleSidebar(false));
      handleNavigation(path);
    },
    [dispatch, handleNavigation]
  );

  const handleEnableNotifications = async () => {
    // Llama a la función para solicitar el permiso de notificación
    const token = await requestNotificationPermission();
    if (token) {
      console.log('Token de notificación:', token);
      // Envía el token al backend para almacenarlo y utilizarlo para notificaciones
      await axios.post(`${API_URL}/notifications/register-token`, {
        token,
        colaboradorID: 123, // Usar el ID del colaborador o usuario actual
      });
      setNotificationEnabled(true);
    } else {
      console.log('Permiso de notificación denegado');
    }
  };


  // Efecto para iniciar el monitoreo si el área es "Comercial"
  useEffect(() => {
    if (userArea === "Comercial" && colaboradorID) {
      console.log("Área Comercial detectada. Iniciando monitoreo...");
      // const stopMonitoring = monitorLocation(colaboradorID);

      // Limpiar el monitoreo cuando el componente se desmonte
      // return stopMonitoring;
    } else {
      console.log("Monitoreo no iniciado. Área:", userArea);
    }
  }, [userArea, colaboradorID]); // Dependencias: userArea y colaboradorID

  // Función para manejar el clic en el mensaje
  const handleMessageClick = () => {
    navigate('/Registro'); // Redirige a /Registro
  };
  return (
    <div className={homePageShell}>
      <div className={homeWatermark} aria-hidden />
      <BirthdayCheckModal />

      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <HomeHero
          greeting={greeting}
          nombre={profile?.nombre}
          loadingName={!!colaboradorID && !profile?.nombre}
          headerAlerta={headerAlerta}
          userArea={userArea}
        />

        <HomeFichajePanel
          isButtonDisabled={isButtonDisabled}
          domicilioMessage={message}
          onDomicilioClick={handleMessageClick}
          pulso={pulsoTileFichaje}
          onFichajeActivate={activarFichadoOfi}
          ultimoFichajeHora={ultimoFichajeHora}
          cargando={cargando}
          mostrarPresentismo={mostrarPresentismo}
          presentismo={
            <Presentismo
              ref={presentismoRef}
              onMontado={manejarComponenteMontado}
              autoIniciarCamara={autoIniciarCamaraAbrir}
              onAutoInicioCamaraEncolado={limpiarAutoIniciarCamara}
              onFeedbackVisual={feedbackVisualFichaje}
            />
          }
          suspenseFallback={
            <div className={`col-span-full min-h-[9rem] animate-pulse rounded-xl bg-slate-100 md:col-span-4`} />
          }
        />

        <HomeMoodStrip
          lastMood={lastMood}
          moodPending={moodPending}
          moodMessage={moodMessage}
          onSelect={submitMood}
        />

        {colaboradorID &&
          colaboradoresMundialDistri.includes(Number(colaboradorID)) && (
            <HomeMundialDistriCta onClick={() => navigateWithSidebarClose('/mundial')} />
          )}

        <section className="mb-6">
          <HomeSectionLabel>Solicitudes y gestión</HomeSectionLabel>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <HomeTile
              title="Reconocer / Reforzar"
              icon={Heart}
              badges={[
                { content: felicitacionesDisponibles ?? 0, variant: 'primary' },
                { content: felicitacionesRecibidas ?? 0, variant: 'success' },
              ]}
              onClick={() => navigateWithSidebarClose('/FeedbackColaborador')}
            />
            <HomeTile
              title="Permiso Temporal"
              icon={Plane}
              status={getSolicitudStatus(solicitud?.autorizado)}
              onClick={() => navigateWithSidebarClose('/PermisoTemporal')}
            />
            <HomeTile
              title="Vacaciones"
              icon={Palmtree}
              status={getSolicitudStatus(solicitudVacaciones?.autorizado)}
              onClick={() => navigateWithSidebarClose('/vacaciones')}
            />
            <HomeTile
              title="Ranking"
              icon={Star}
              onClick={() => navigateWithSidebarClose('/reconocemos')}
            />
            <HomeTile
              title="Mis Certificados"
              icon={Award}
              onClick={() => navigateWithSidebarClose('/Certificados')}
            />
            <HomeTile
              title="Caja de Ideas"
              icon={Lightbulb}
              onClick={() => navigateWithSidebarClose('/IdeaBox')}
            />
          </div>
        </section>

        <section>
          <HomeSectionLabel>Equipo y más</HomeSectionLabel>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <HomeTile
              title="Mis Recibos"
              icon={Receipt}
              onClick={() => {
                window.open(getNapsisLoginUrl(), '_blank');
              }}
            />
            <HomeTile
              title="Qr Home"
              icon={QrCode}
              badges={[{ content: 'Nuevo', variant: 'primary' }]}
              onClick={() => {
                window.open(getQrHomeUrl(), '_blank');
              }}
            />
            {SHOW_MI_FEEDBACK_HOME_BADGE && (Number(colaboradorID) === 1 || userArea === 'Administración') && (
              <HomeTile
                title="Mi Feedback"
                icon={TrendingUp}
                onClick={() => navigateWithSidebarClose('/MiDesempeno')}
              />
            )}
            <HomeTile
              title="Nosotros"
              icon={Users}
              onClick={() => navigateWithSidebarClose('/TeamDetails')}
            />
            {userArea === 'Comercial' && (
              <HomeTile
                title="Marcar Posición"
                icon={MapPin}
                onClick={() => handleFichado()}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;