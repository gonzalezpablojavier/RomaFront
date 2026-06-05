import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { setPageTitle } from '../../store/themeConfigSlice';
import { loginEmpresa, LoginResponse } from '../../config/api_empresa';

interface FormData {
    email: string;
    password: string;
}

const LoginCover: React.FC = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [formData, setFormData] = useState<FormData>({
        email: '',
        password: '',
    });
    const [error, setError] = useState<string>('');

    useEffect(() => {
        dispatch(setPageTitle('Login de Empresa'));
    }, [dispatch]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const submitForm = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        try {
            const loggedInEmpresa: LoginResponse = await loginEmpresa(formData);
            // Navigate to the company dashboard or home page after successful login
            navigate(`/CompanyConfig/${loggedInEmpresa.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
        }
    };

    return (
        <div className="flex min-h-screen">
            <div className="bg-white w-1/2 min-h-screen hidden lg:flex flex-col items-center justify-center text-dark dark:text-white p-4">
                <div className="w-full mx-auto mb-5">
                    <img src="/assets/images/roma.jpeg" alt="roma_logo" className="lg:max-w-[370px] xl:max-w-[500px] mx-auto" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-center">Bienvenidos de vuelta a ROMA</h3>
                <p>Inicia sesión para acceder a tu cuenta empresarial</p>
            </div>
            <div className="w-full lg:w-1/2 relative flex justify-center items-center bg-white">
                <div className="max-w-[480px] p-5 md:p-10 bg-white rounded-lg shadow-2xl">
                    <h2 className="font-bold text-3xl mb-3">Iniciar ROMA enterprise</h2>
               
                    {error && <p className="text-red-500 mb-4">{error}</p>}

                    <form className="space-y-5" onSubmit={submitForm}>
                        <div>
                            <label htmlFor="email">Email</label>
                            <input 
                                id="email" 
                                type="email" 
                                className="form-input" 
                                placeholder="Ingresa Email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="password">Contraseña</label>
                            <input 
                                id="password" 
                                type="password" 
                                className="form-input" 
                                placeholder="Ingresa Contraseña"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-full">
                            INICIAR SESIÓN
                        </button>
                    </form>
                   
                    <p className="text-center mt-6">
                        ¿No tienes una cuenta?
                        <Link to="/auth/register" className="font-bold text-primary hover:underline ltr:ml-1 rtl:mr-1">
                            Registrar Empresa
                        </Link>
                    </p>
                    <p className="text-center mt-6">
                    ¿Tenes una cuenta?
                        <Link to="/auth/login" className="font-bold text-primary hover:underline ltr:ml-1 rtl:mr-1">
                            Ingresar como Colaborador
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginCover;