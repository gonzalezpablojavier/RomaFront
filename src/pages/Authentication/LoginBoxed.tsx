import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { setPageTitle } from '../../store/themeConfigSlice';
import {
  loginUser,
  setDefaultHeaders,
  isMfaPending,
  mfaEnrollBegin,
  mfaEnrollConfirm,
  mfaVerify,
  type MfaEnrollBeginResponse,
} from '../../api/api_auth';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

type LoginPhase = 'credentials' | 'mfa';

const LoginBoxed = () => {
  const [usr, setUsr] = useState<string>('');
  const [psw, setPsw] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [phase, setPhase] = useState<LoginPhase>('credentials');
  const [mfaChallengeToken, setMfaChallengeToken] = useState<string>('');
  const [mfaEnrollmentRequired, setMfaEnrollmentRequired] = useState(false);
  const [enrollData, setEnrollData] = useState<MfaEnrollBeginResponse | null>(
    null,
  );
  const [mfaCode, setMfaCode] = useState('');
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setPageTitle('Ingresar'));
  }, [dispatch]);

  const finishLogin = (
    colaboradorID: string | number,
    nombreUsuario: string,
    empresaId: string,
  ) => {
    login({ user_code: String(colaboradorID), nombreUsuario }, empresaId);
    setDefaultHeaders();
    navigate('/');
  };

  const beginMfaEnrollment = async (challengeToken: string) => {
    const data = await mfaEnrollBegin(challengeToken);
    setEnrollData(data);
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    setLoading(true);
    event.preventDefault();
    setError(false);
    setMfaError(null);

    try {
      const resp = await loginUser(usr, psw);

      if (isMfaPending(resp)) {
        setMfaChallengeToken(resp.mfaChallengeToken);
        setMfaEnrollmentRequired(resp.mfaEnrollmentRequired);
        setPhase('mfa');
        if (resp.mfaEnrollmentRequired) {
          await beginMfaEnrollment(resp.mfaChallengeToken);
        }
        return;
      }

      const { colaboradorID, nombreUsuario, empresaId } = resp;
      if (!empresaId) {
        throw new Error('Usuario no asociado a una empresa');
      }
      finishLogin(colaboradorID, nombreUsuario, empresaId);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      if (status === 401 || status === 400) {
        setPsw('');
        setError(true);
      }
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const submitMfa = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMfaError(null);

    const code = mfaCode.replace(/\s/g, '');
    if (!/^\d{6}$/.test(code)) {
      setMfaError('Ingresá un código de 6 dígitos.');
      setLoading(false);
      return;
    }

    try {
      const resp = mfaEnrollmentRequired
        ? await mfaEnrollConfirm(mfaChallengeToken, code)
        : await mfaVerify(mfaChallengeToken, code);

      finishLogin(resp.colaboradorID, resp.nombreUsuario, resp.empresaId);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Código incorrecto o expirado.';
      setMfaError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setLoading(false);
    }
  };

  const backToCredentials = () => {
    setPhase('credentials');
    setMfaCode('');
    setMfaError(null);
    setEnrollData(null);
    setMfaChallengeToken('');
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const qrUrl = enrollData?.otpauthUrl
    ? `https://quickchart.io/qr?text=${encodeURIComponent(enrollData.otpauthUrl)}&size=180`
    : null;

  return (
    <div className="flex flex-col justify-center items-center bg-white bg-cover bg-center h-[100vh]">
      <div className="panel sm:w-[400px] w-full p-4 m-6 bg-white shadow-2xl">
        <img src="/assets/images/logo-head.png" alt="Logo" className="mx-auto mb-8" />

        {phase === 'credentials' && (
          <>
            {error && (
              <p className="text-red-500">Credenciales incorrectas.</p>
            )}
            <p className="mb-7"></p>
            <form className="space-y-5" onSubmit={submitForm}>
              <div>
                <label htmlFor="user">Usuario:</label>
                <input
                  id="user"
                  className="form-input"
                  placeholder="Ingrese Usuario"
                  value={usr}
                  onChange={(event) => setUsr(event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password">Contraseña</label>
                <div className="flex">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input mr-4"
                    placeholder="Ingrese Contraseña"
                    value={psw}
                    onChange={(event) => setPsw(event.target.value)}
                  />
                  <FontAwesomeIcon
                    icon={showPassword ? faEye : faEyeSlash}
                    className="cursor-pointer mr-4 mt-[10px] h-5"
                    onClick={() => setShowPassword(!showPassword)}
                  />
                </div>
              </div>
              <button
                type="submit"
                className={`btn btn-primary w-full !mt-8 ${loading && '!bg-gray-200 !border-none'}`}
                disabled={loading}
              >
                Iniciar Sesión
              </button>

              <p className="text-center">
                <Link
                  to="/auth/LoginCover"
                  className="font-bold text-primary hover:underline ltr:ml-1 rtl:mr-1"
                >
                  Ingresar a Roma enterprise.
                </Link>
              </p>
              <p className="text-center">
                ¿Primera vez en Roma?
                <Link
                  to="/auth/register"
                  className="font-bold text-primary hover:underline ltr:ml-1 rtl:mr-1"
                >
                  Registrate aca.
                </Link>
              </p>
            </form>
          </>
        )}

        {phase === 'mfa' && (
          <>
            <h2 className="text-lg font-semibold mb-2 text-center">
              {mfaEnrollmentRequired
                ? 'Configurar autenticación en dos pasos'
                : 'Verificación en dos pasos'}
            </h2>
            <p className="text-sm text-gray-600 mb-4 text-center">
              {mfaEnrollmentRequired
                ? 'Escaneá el QR con Google Authenticator (o similar) e ingresá el código.'
                : 'Ingresá el código de 6 dígitos de tu app autenticadora.'}
            </p>

            {mfaEnrollmentRequired && enrollData && (
              <div className="mb-4 text-center">
                {qrUrl && (
                  <img
                    src={qrUrl}
                    alt="QR MFA"
                    className="mx-auto mb-3 border rounded"
                    width={180}
                    height={180}
                  />
                )}
                <p className="text-xs text-gray-500 break-all">
                  Clave manual: <code>{enrollData.secretBase32}</code>
                </p>
              </div>
            )}

            {mfaError && <p className="text-red-500 mb-2">{mfaError}</p>}

            <form className="space-y-5" onSubmit={submitMfa}>
              <div>
                <label htmlFor="mfa-code">Código MFA</label>
                <input
                  id="mfa-code"
                  className="form-input tracking-widest text-center text-lg"
                  placeholder="000000"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) =>
                    setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                />
              </div>
              <button
                type="submit"
                className={`btn btn-primary w-full ${loading && '!bg-gray-200 !border-none'}`}
                disabled={loading}
              >
                {mfaEnrollmentRequired ? 'Activar y entrar' : 'Verificar'}
              </button>
              <button
                type="button"
                className="btn btn-outline-primary w-full"
                onClick={backToCredentials}
                disabled={loading}
              >
                Volver
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginBoxed;
