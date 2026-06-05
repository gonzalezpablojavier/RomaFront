import { useNavigate ,Link} from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { setPageTitle } from '../../store/themeConfigSlice';
import { loginUser, setDefaultHeaders } from '../../api/api_auth';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { Route } from '../../config/permissions';




const LoginBoxed = () => {
  const [usr, setUsr] = useState<string>('');
  const [psw, setPsw] = useState<string>('');
  const [usuario, setUsuario] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setPageTitle('Ingresar'));
  }, [dispatch]);


  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    setLoading(true);
    event.preventDefault();

  


    try {
      const resp = await loginUser(usr, psw);
      const { colaboradorID, nombreUsuario, empresaId } = resp;
     
      if (!empresaId) {
        throw new Error('Usuario no asociado a una empresa');
      }
        console.log(resp);
        setUsuario(nombreUsuario);
        login({ user_code: colaboradorID}, empresaId );
     //   login({ user_code: colaboradorID,{empresa_id: empresaId} });
        localStorage.setItem('user_name', nombreUsuario);
        localStorage.setItem('l_empresa_id', empresaId);
        setDefaultHeaders();
        console.log('exito');
        navigate('/');
      
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 400) {
        setPsw('');
        setError(true);
      }
      console.log(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  return (
    
    <div className="flex flex-col justify-center items-center bg-white bg-cover bg-center h-[100vh]">
      
      <div className="panel sm:w-[400px] w-full p-4 m-6 bg-white shadow-2xl">
        <img src="/assets/images/logo-head.png" alt="Logo" className="mx-auto mb-8" />
       
        {error && <p className="text-red-500"> Credenciales incorrectas.</p>}
        <p className="mb-7"></p>
        <form className="space-y-5" onSubmit={submitForm}>
          <div>
            <label htmlFor="user">Usuario:</label>
            <input
              id="user"
              className="form-input"
              placeholder="Ingrese Usuario"
              value={usr}
              onChange={event => setUsr(event.target.value)}
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
                onChange={event => setPsw(event.target.value)}
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
            
            <Link to="/auth/LoginCover" className="font-bold text-primary hover:underline ltr:ml-1 rtl:mr-1">
              Ingresar a Roma enterprise.
            </Link>
          </p>
          <p className="text-center">
            ¿Primera vez en Roma?
            <Link to="/auth/register" className="font-bold text-primary hover:underline ltr:ml-1 rtl:mr-1">
              Registrate aca.
            </Link>
          </p>
        </form>
      </div>
    </div>
 
  );
};

export default LoginBoxed;
