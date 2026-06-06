import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { setPageTitle } from '../../store/themeConfigSlice';

/**
 * Registro self-service deshabilitado por seguridad SaaS.
 * Alta de tenants solo vía Panel Plataforma Admin (platform.admin).
 */
const RegisterCover = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setPageTitle('Registro de Empresa'));
  }, [dispatch]);

  return (
    <div className="flex min-h-screen">
      <div className="bg-gradient-to-t from-[#FDD05B] to-[#FDD05B] w-1/2 min-h-screen hidden lg:flex flex-col items-center justify-center text-white dark:text-black p-4">
        <div className="w-full mx-auto mb-5">
          <img
            src="/assets/images/roma.jpeg"
            alt="roma_logo"
            className="lg:max-w-[370px] xl:max-w-[500px] mx-auto"
          />
        </div>
        <h3 className="text-3xl font-bold mb-4 text-center">Bienvenidos a ROMA</h3>
        <p>Tu empresa ya debe estar registrada por el administrador de la plataforma.</p>
      </div>
      <div className="w-full lg:w-1/2 relative flex justify-center items-center">
        <div className="max-w-[480px] p-5 md:p-10">
          <h2 className="font-bold text-3xl mb-3">Alta de empresas</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Por seguridad, el registro público de empresas está deshabilitado. Si necesitás
            dar de alta un tenant, contactá al administrador de la plataforma o usá el panel
            de administración si tenés permiso <code>platform.admin</code>.
          </p>
          <Link to="/auth/LoginCover" className="btn btn-primary w-full text-center block">
            Ingresar a Roma
          </Link>
          <p className="text-center mt-6">
            ¿Sos colaborador?
            <Link
              to="/auth/login"
              className="font-bold text-primary hover:underline ltr:ml-1 rtl:mr-1"
            >
              Login colaborador
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterCover;
