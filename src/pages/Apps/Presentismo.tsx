import React, { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircle2, CircleAlert } from 'lucide-react';

export type PresentismoRef = {
  iniciarCamaraSiPuede: () => void;
};

interface PresentismoProps {
  onMontado: () => void;
  /** Si es true, al tener cámara disponible se llama a iniciar escaneo una sola vez (p. ej. primer toque en Home). */
  autoIniciarCamara?: boolean;
  /** Se invoca justo antes de encolar el auto-inicio (para limpiar el flag en el padre). */
  onAutoInicioCamaraEncolado?: () => void;
  /** Pulso visual en el contenedor padre (p. ej. tile de Home) al mostrar resultado. */
  onFeedbackVisual?: (tipo: 'exito' | 'error') => void;
}


interface Camera {
  id: string;
  label: string;
}

type BackendResponse = {
  success: boolean;
  data?: any;
  message?: string;
};

type EstadoEscaneo = {
  mostrar: boolean;
  exito: boolean;
  mensaje: string;
};

/** Éxito (entrada/salida): tiempo largo para leer en el celu. */
const MS_ALERTA_EXITO = 16000;
const MS_ALERTA_ERROR = 9000;

function obtenerEmpresaId(): string {
  return localStorage.getItem('l_empresa_id') ?? '';
}

/** Interpreta respuestas tipo `{ ok: 1 }` o cuerpo vacío/legacy en 200. */
function interpretarRespuestaPresentismo(
  json: unknown,
  httpOk: boolean
): { success: boolean; message?: string } {
  const mensajeDe = (o: Record<string, unknown>) =>
    (typeof o.message === 'string' && o.message) ||
    (typeof o.error === 'string' && o.error) ||
    (typeof o.mensaje === 'string' && o.mensaje) ||
    undefined;

  if (json != null && typeof json === 'object') {
    const o = json as Record<string, unknown>;
    if ('ok' in o) {
      const okVal = o.ok;
      const msg = mensajeDe(o);
      if (okVal === 1 || okVal === true) {
        return { success: true, message: msg };
      }
      if (okVal === 0 || okVal === false) {
        return {
          success: false,
          message: msg || 'No se pudo registrar el presente',
        };
      }
    }
    if (o.success === false) {
      return {
        success: false,
        message: mensajeDe(o) || 'No se pudo registrar el presente',
      };
    }
  }
  if (!httpOk) {
    const fallback =
      json != null && typeof json === 'object'
        ? mensajeDe(json as Record<string, unknown>)
        : undefined;
    return {
      success: false,
      message: fallback || 'Error en la solicitud al servidor',
    };
  }
  if (json == null || typeof json !== 'object') {
    return { success: true };
  }
  return { success: true };
}


interface Registro {
  id: number;
  colaboradorID: number;
  tipo: 'entrada' | 'salida';
  tipoPresencial: 'Ofi' | 'Home';
  horaRegistro: string;
  empresaId: string;
}

interface ResumenDia {
  cantidadRegistros: number;
  proximoTipo: 'entrada' | 'salida';
  registros: Registro[];
}

const CustomAlert = ({ type, title, message }: { type: 'success' | 'error', title: string, message: string }) => {
  const shell =
    type === 'success'
      ? 'bg-green-50 border-green-500 ring-1 ring-green-200/80'
      : 'bg-red-50 border-red-600 ring-1 ring-red-200/90';

  const titleClass =
    type === 'success' ? 'text-green-800' : 'text-red-800';
  const bodyClass =
    type === 'success' ? 'text-green-950' : 'text-red-950';

  return (
    <div className={`rounded-xl border-l-4 p-4 shadow-sm ${shell}`}>
      <div className="flex gap-3">
        {type === 'success' ? (
          <CheckCircle2 className="h-12 w-12 shrink-0 text-green-600" strokeWidth={1.75} aria-hidden />
        ) : (
          <CircleAlert className="h-12 w-12 shrink-0 text-red-600" strokeWidth={1.75} aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-bold uppercase tracking-wide ${titleClass}`}>{title}</p>
          <p className={`mt-2 text-base font-semibold leading-snug ${bodyClass}`}>{message}</p>
        </div>
      </div>
    </div>
  );
};




const Presentismo = forwardRef<PresentismoRef, PresentismoProps>(function Presentismo(
  { onMontado, autoIniciarCamara = false, onAutoInicioCamaraEncolado, onFeedbackVisual },
  ref
) {
  const [estaEscaneando, setEstaEscaneando] = useState<boolean>(false);
  const [camaraId, setCamaraId] = useState<string>('');
  const [camaras, setCamaras] = useState<Camera[]>([]);
  const escaneadorRef = useRef<Html5Qrcode | null>(null);
  const lectorRef = useRef<HTMLDivElement>(null);
  const alertaOcultarRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const procesandoRegistroRef = useRef(false);
  const procesandoSyncRef = useRef(false);
  const scannerStartLockRef = useRef(false);
  const iniciarEscaneoRef = useRef<() => void>(() => {});
  const autoInicioCamaraEjecutadoRef = useRef(false);
  const feedbackAnchorRef = useRef<HTMLDivElement | null>(null);
  const [colaboradorID, setColaboradorID] = useState<string | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [estadoEscaneo, setEstadoEscaneo] = useState<EstadoEscaneo>({
    mostrar: false,
    exito: false,
    mensaje: ''
  });
  const [userArea, setUserArea] = useState<string>('');
  const API_URL = `${import.meta.env.VITE_API_DISTRI_API}`;
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('entrada');
  const [tipoPresencial, setTipoPresente] = useState<'Ofi' | 'Home'>('Ofi');
  const [token, setToken] = useState('');
  const COMERCIAL_TOKEN = 'COM2024';



  const [resumenDia, setResumenDia] = useState<ResumenDia>({
    cantidadRegistros: 0,
    proximoTipo: 'entrada',
    registros: []
  });
  const [procesandoRegistro, setProcesandoRegistro] = useState(false);
  procesandoSyncRef.current = procesandoRegistro;
  const formatearHora = (fecha: string) => {
    return new Date(fecha).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    // Notificar al padre que el componente se ha montado
    onMontado();
  }, [onMontado]);


  // Función actualizada para obtener el resumen del día
  const obtenerResumenDia = async () => {
    const usuario = ((localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null) as { user_code: string | null })?.user_code;
    const empresaGuardada = localStorage.getItem('l_empresa_id');
    if (!empresaGuardada || !empresaGuardada) return;

    console.log('colaborado:', usuario);
    try {
      const respuesta = await fetch(`${API_URL}/presentismo/resumen-dia/${usuario}`, {
        headers: {
          'x-empresa-id': empresaGuardada,
        },
      });

      if (!respuesta.ok) {
        console.error('Error al obtener resumen del día');
        return;
      }

      const resumen: ResumenDia = await respuesta.json();
      console.log('Resumen recibido:', resumen);
      setResumenDia(resumen);
    } catch (error) {
      console.error('Error al obtener resumen:', error);
    }
  };





  const validarToleranciaHoraria = (timestamp1: string, timestamp2: string, toleranciaMinutos: number): boolean => {
    const fecha1 = new Date(timestamp1);
    const fecha2 = new Date(timestamp2);

    if (isNaN(fecha1.getTime()) || isNaN(fecha2.getTime())) {
      return false;
    }

    const diferenciaEnMinutos = Math.abs(fecha1.getTime() - fecha2.getTime()) / (1000 * 60);

    return diferenciaEnMinutos <= toleranciaMinutos;
  };

  const mostrarEstadoEscaneo = (exito: boolean, mensaje: string) => {
    if (alertaOcultarRef.current != null) {
      clearTimeout(alertaOcultarRef.current);
      alertaOcultarRef.current = null;
    }
    setEstadoEscaneo({
      mostrar: true,
      exito,
      mensaje
    });
    onFeedbackVisual?.(exito ? 'exito' : 'error');

    const ms = exito ? MS_ALERTA_EXITO : MS_ALERTA_ERROR;
    alertaOcultarRef.current = setTimeout(() => {
      setEstadoEscaneo(prev => ({ ...prev, mostrar: false }));
      alertaOcultarRef.current = null;
    }, ms);
  };

  const enviarDatosAlBackend = async (textoDecodificado: string): Promise<BackendResponse> => {
    const usuario = ((localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null) as { user_code: string | null })?.user_code;

    const colaboradorID = usuario;
    const tipoEnviado = resumenDia.proximoTipo;
    const ahora = new Date();
    const horaArgentina = new Date(ahora.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));

    const horaRegistro = horaArgentina.getFullYear() + '-' +
      ('0' + (horaArgentina.getMonth() + 1)).slice(-2) + '-' +
      ('0' + horaArgentina.getDate()).slice(-2) + ' ' +
      ('0' + horaArgentina.getHours()).slice(-2) + ':' +
      ('0' + horaArgentina.getMinutes()).slice(-2) + ':' +
      ('0' + horaArgentina.getSeconds()).slice(-2);

    const partes = textoDecodificado.split(': ');
    const whereQR = partes[0] ?? textoDecodificado;
    let where = '';
    console.log('where', whereQR);
    const esHoraValida = validarToleranciaHoraria(horaRegistro, horaRegistro, 720);

    if (whereQR === 'Home') {
      where = 'Home';
    }
    else {
      where = 'Ofi';
    }

    if (!esHoraValida) {
      return {
        success: false,
        message: 'El código QR ha expirado o no es válido'
      };
    }

    const empresaEfectiva = obtenerEmpresaId() || empresaId || '';
    const datos = {
      colaboradorID,
      tipo: tipoEnviado,
      tipoPresencial: where,
      horaRegistro,
      empresaId: empresaEfectiva
    };

    try {
      const respuesta = await fetch(`${API_URL}/presentismo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-empresa-id': empresaEfectiva,
        },
        body: JSON.stringify(datos),
      });

      const rawText = await respuesta.text();
      let respuestaJSON: unknown = null;
      if (rawText.trim()) {
        try {
          respuestaJSON = JSON.parse(rawText);
        } catch {
          return {
            success: false,
            message: respuesta.ok
              ? 'Respuesta inválida del servidor'
              : (rawText.slice(0, 180) || 'Error en la solicitud al servidor'),
          };
        }
      }

      const interpretado = interpretarRespuestaPresentismo(respuestaJSON, respuesta.ok);
      if (!interpretado.success) {
        return {
          success: false,
          message: interpretado.message || 'No se pudo registrar el presente',
        };
      }

      await obtenerResumenDia();

      const etiquetaTipo = tipoEnviado === 'entrada' ? 'Entrada' : 'Salida';
      const lugar = where === 'Ofi' ? 'oficina' : 'remoto';
      const horaCorta = formatearHora(horaRegistro.replace(' ', 'T'));

      return {
        success: true,
        data: respuestaJSON,
        message:
          interpretado.message && interpretado.message.trim().length > 0
            ? `${etiquetaTipo} registrada a las ${horaCorta} (${lugar}). ${interpretado.message}`
            : `${etiquetaTipo} registrada a las ${horaCorta} (${lugar}).`,
      };
    } catch (error) {
      console.error('Error al enviar los datos al servidor:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  };

  const manejarEscaneoExitoso = async (textoDecodificado: string) => {
    if (procesandoRegistroRef.current) return;
    procesandoRegistroRef.current = true;
    detenerEscaneo();
    setProcesandoRegistro(true);

    try {
      const resultado = await enviarDatosAlBackend(textoDecodificado);
      mostrarEstadoEscaneo(
        resultado.success,
        resultado.message ||
          (resultado.success ? 'Presente registrado correctamente' : 'Error al registrar presente')
      );
    } catch (error: unknown) {
      mostrarEstadoEscaneo(false, 'Ha ocurrido un error al procesar el código QR');
      console.error('Detalles del error:', error);
    } finally {
      procesandoRegistroRef.current = false;
      setProcesandoRegistro(false);
    }
  };

  const buscarCamaraTrasera = (dispositivos: Array<{ id: string; label: string }>) => {
    // Primero, intentar encontrar una cámara con "trasera" o "environment" en la etiqueta
    const camaraTrasera = dispositivos.find(dispositivo =>
      /(back|rear|trasera|environment)/i.test(dispositivo.label)
    );

    if (camaraTrasera) return camaraTrasera;

    // En dispositivos Android, la última cámara suele ser la trasera
    if (/android/i.test(navigator.userAgent)) {
      return dispositivos[dispositivos.length - 1];
    }

    // Para iOS, la primera cámara sin etiqueta o sin "front" suele ser la trasera
    return dispositivos.find(dispositivo =>
      !/(front|user|facetime|selfie|delantera)/i.test(dispositivo.label)
    ) || dispositivos[0];
  };

  const validarTokenComercial = async () => {
    if (token.toUpperCase() === COMERCIAL_TOKEN) {
      const usuario = ((localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null) as { user_code: string | null })?.user_code;

      const ahora = new Date();
      const horaArgentina = new Date(ahora.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));

      const horaRegistro = horaArgentina.getFullYear() + '-' +
        ('0' + (horaArgentina.getMonth() + 1)).slice(-2) + '-' +
        ('0' + horaArgentina.getDate()).slice(-2) + ' ' +
        ('0' + horaArgentina.getHours()).slice(-2) + ':' +
        ('0' + horaArgentina.getMinutes()).slice(-2) + ':' +
        ('0' + horaArgentina.getSeconds()).slice(-2);

      const empresaEfectiva = obtenerEmpresaId() || empresaId || '';
      const datos = {
        colaboradorID: usuario,
        tipo,
        tipoPresencial: 'Home',
        horaRegistro,
        empresaId: empresaEfectiva
      };

      setProcesandoRegistro(true);
      try {
        const respuesta = await fetch(`${API_URL}/presentismo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-empresa-id': empresaEfectiva,
          },
          body: JSON.stringify(datos),
        });

        const rawText = await respuesta.text();
        let respuestaJSON: unknown = null;
        if (rawText.trim()) {
          try {
            respuestaJSON = JSON.parse(rawText);
          } catch {
            mostrarEstadoEscaneo(false, 'Respuesta inválida del servidor');
            return;
          }
        }

        const interpretado = interpretarRespuestaPresentismo(respuestaJSON, respuesta.ok);
        if (!interpretado.success) {
          mostrarEstadoEscaneo(false, interpretado.message || 'Error al registrar el presente');
          return;
        }

        const etiquetaTipo = tipo === 'entrada' ? 'Entrada' : 'Salida';
        const horaCorta = formatearHora(horaRegistro.replace(' ', 'T'));
        const msg =
          interpretado.message && interpretado.message.trim().length > 0
            ? `${etiquetaTipo} registrada a las ${horaCorta} (remoto). ${interpretado.message}`
            : `${etiquetaTipo} registrada a las ${horaCorta} (remoto).`;
        mostrarEstadoEscaneo(true, msg);
        setToken('');
        await obtenerResumenDia();
      } catch (error) {
        console.error('Error al enviar los datos:', error);
        mostrarEstadoEscaneo(false, 'Error al registrar el presente');
      } finally {
        setProcesandoRegistro(false);
      }
    } else {
      mostrarEstadoEscaneo(false, 'Código inválido');
    }
  };


  const iniciarEscaneo = () => {
    if (scannerStartLockRef.current || estaEscaneando || procesandoSyncRef.current) {
      return;
    }
    if (!camaraId) {
      mostrarEstadoEscaneo(false, "No se encontró la cámara trasera");
      return;
    }

    scannerStartLockRef.current = true;
    setEstaEscaneando(true);
    const iniciarLector = () => {
      if (lectorRef.current) {
        const configuracion = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1
        };

        escaneadorRef.current = new Html5Qrcode(lectorRef.current.id);
        escaneadorRef.current.start(
          camaraId,
          configuracion,
          manejarEscaneoExitoso,
          (error) => {
            console.warn(`Error al escanear código QR: ${error}`);
          }
        ).catch((err) => {
          console.error("Error al iniciar el escáner:", err);
          mostrarEstadoEscaneo(false, "Error al iniciar la cámara");
          scannerStartLockRef.current = false;
          setEstaEscaneando(false);
        });
      } else {
        console.error("No se encontró el elemento lector de QR");
        scannerStartLockRef.current = false;
        setEstaEscaneando(false);
      }
    };
    requestAnimationFrame(() => {
      requestAnimationFrame(iniciarLector);
    });
  };

  iniciarEscaneoRef.current = iniciarEscaneo;

  useImperativeHandle(ref, () => ({
    iniciarCamaraSiPuede: () => {
      iniciarEscaneoRef.current();
    },
  }), []);

  useEffect(() => {
    if (!autoIniciarCamara || !camaraId || autoInicioCamaraEjecutadoRef.current) return;
    autoInicioCamaraEjecutadoRef.current = true;
    onAutoInicioCamaraEncolado?.();
    iniciarEscaneoRef.current();
  }, [autoIniciarCamara, camaraId, onAutoInicioCamaraEncolado]);

  useEffect(() => {
    if (!estadoEscaneo.mostrar) return;
    const t = window.setTimeout(() => {
      feedbackAnchorRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }, 80);
    return () => window.clearTimeout(t);
  }, [estadoEscaneo.mostrar, estadoEscaneo.exito, estadoEscaneo.mensaje]);

  const detenerEscaneo = () => {
    scannerStartLockRef.current = false;
    setEstaEscaneando(false);
    if (escaneadorRef.current) {
      escaneadorRef.current.stop().then(() => {
        escaneadorRef.current = null;
      }).catch(err => {
        console.error("Error al detener el escáner:", err);
      });
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
            setUserArea(colaborador.area);
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
    const colaboradorGuardado = localStorage.getItem('colaboradorID');
    const empresaGuardada = localStorage.getItem('l_empresa_id');

    // Obtener el resumen inicial
    obtenerResumenDia();

    if (colaboradorGuardado) {
      setColaboradorID(colaboradorGuardado);
    }

    if (empresaGuardada) {
      setEmpresaId(empresaGuardada);
    }

    Html5Qrcode.getCameras().then((dispositivos) => {
      const camaraTrasera = buscarCamaraTrasera(dispositivos);
      if (camaraTrasera) {
        setCamaraId(camaraTrasera.id);
        setCamaras([camaraTrasera]); // Solo almacenar la cámara trasera
      } else {
        mostrarEstadoEscaneo(false, "No se encontró la cámara trasera");
      }
    }).catch(err => {
      console.error('Error al obtener las cámaras:', err);
      mostrarEstadoEscaneo(false, "Error al acceder a las cámaras");
    });

    return () => {
      if (alertaOcultarRef.current != null) {
        clearTimeout(alertaOcultarRef.current);
      }
      if (escaneadorRef.current) {
        escaneadorRef.current.clear();
      }
    };
  }, []);



  return (
    <div className="flex flex-col items-center justify-center bg-white-100 p-4 rounded">






      <div className="flex w-full min-h-[200px] flex-col items-center justify-center gap-3 rounded text-gray-900">
        <div
          className="relative mx-auto w-[300px] max-w-full shrink-0"
          style={{ display: estaEscaneando ? 'block' : 'none' }}
          aria-hidden={!estaEscaneando}
        >
          <div className="relative overflow-hidden rounded-2xl bg-black/50 shadow-xl ring-2 ring-white/25">
            <div
              id="qr-reader"
              ref={lectorRef}
              className="overflow-hidden rounded-2xl [&_video]:rounded-2xl [&_video]:object-cover"
              style={{ width: '300px', maxWidth: '100%' }}
            />
            {estaEscaneando && (
              <>
                <div
                  className="pointer-events-none absolute inset-0 z-[5] rounded-2xl shadow-[inset_0_0_88px_rgba(0,0,0,0.72)]"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-0 z-[6] rounded-2xl ring-2 ring-cyan-300/35 animate-pulse"
                  aria-hidden
                />
                <div className="pointer-events-none absolute bottom-3 left-2 right-2 z-20 flex justify-center px-1">
                  <span className="inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-sm ring-1 ring-white/25">
                    <span
                      className="inline-block h-2 w-2 shrink-0 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.9)]"
                      aria-hidden
                    />
                    Buscando código…
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {procesandoRegistro && (
          <div
            className="mb-4 w-full max-w-md border-l-4 border-blue-500 bg-blue-50 text-blue-800 p-4 rounded"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            <p className="font-semibold">Enviando fichaje…</p>
            <p className="text-sm mt-1">Esperá la confirmación; no cierres la app.</p>
          </div>
        )}

        {estadoEscaneo.mostrar && (
          <div
            ref={feedbackAnchorRef}
            className="z-10 mb-1 w-full max-w-md scroll-mt-20"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="status"
            aria-live="polite"
          >
            <CustomAlert
              type={estadoEscaneo.exito ? 'success' : 'error'}
              title={estadoEscaneo.exito ? "Éxito" : "Error"}
              message={estadoEscaneo.mensaje}
            />
          </div>
        )}
        {estaEscaneando ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              detenerEscaneo();
            }}
            className="sticky bottom-2 z-30 mt-1 w-full max-w-[280px] rounded-lg bg-red-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-red-600"
          >
            Cancelar escaneo
          </button>
        ) : (
          <div
            className={`w-32 h-32 rounded-full flex items-center justify-center bg-blue-900 transition-colors duration-200 select-none ${
              !camaraId || procesandoRegistro ? 'opacity-50' : ''
            }`}
            aria-hidden="true"
          >
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        )}
      </div>


      {userArea === 'Comercialessss' && (
        <div
          className="w-full max-w-2xl mb-6 p-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="presentation"
        >
          <p className="font-semibold">Recordatorio para el área Comercial:</p>
          <ul className="list-disc ml-6 mt-2">
            <li>Recuerda registrar tu entrada antes de las 8:00 AM</li>
            <li>El registro de salida debe realizarse después de completar tus actividades diarias</li>
            <li>Si trabajas remoto, asegúrate de seleccionar la opción "Remoto"</li>
          </ul>




          <div className="flex flex-col items-center space-y-4">
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Ingrese el código"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={10}
            />
            <button
              type="button"
              onClick={validarTokenComercial}
              disabled={procesandoRegistro}
              className="w-full py-3 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-800 transition-colors duration-300 disabled:opacity-50 disabled:pointer-events-none"
            >
              Registrar Presencia
            </button>
          </div>

        </div>



      )}

    </div>
  );
});

export default Presentismo;