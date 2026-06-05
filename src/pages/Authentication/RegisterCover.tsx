import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { setPageTitle } from '../../store/themeConfigSlice';
import { createEmpresa, loginEmpresa } from '../../config/api_empresa';





const RegisterCover = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        pass: '',
        user:'',
        confirmPassword: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        dispatch(setPageTitle('Registro de Empresa'));
    }, [dispatch]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const submitForm = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (formData.pass !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        try {
            const createdEmpresa = await createEmpresa(formData);
            await loginEmpresa({ email: formData.user, password: formData.pass });
            navigate(`/CompanyConfig/${createdEmpresa.id}`);
        } catch (err) {
            setError(err.message || 'Error al registrar la empresa');
        }
    };

    return (
        <div className="flex min-h-screen">
            <div className="bg-gradient-to-t from-[#FDD05B] to-[#FDD05B] w-1/2 min-h-screen hidden lg:flex flex-col items-center justify-center text-white dark:text-black p-4">
                <div className="w-full mx-auto mb-5">
                    <img src="/assets/images/roma.jpeg" alt="roma_logo" className="lg:max-w-[370px] xl:max-w-[500px] mx-auto" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-center">Bienvenidos a ROMA</h3>
                <p>Registra tu empresa y comienza a disfrutar de nuestros servicios</p>
            </div>
            <div className="w-full lg:w-1/2 relative flex justify-center items-center">
                <div className="max-w-[480px] p-5 md:p-10">
                    <h2 className="font-bold text-3xl mb-3">Registra tu Empresa en ROMA</h2>
               
                    {error && <p className="text-red-500 mb-4">{error}</p>}

                    <form className="space-y-5" onSubmit={submitForm}>
                        <div>
                            <label htmlFor="companyName">Nombre de la empresa</label>
                            <input 
                                id="nombre" 
                                type="text" 
                                className="form-input" 
                                placeholder="Nombre de la empresa"
                                value={formData.nombre}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="email">Email</label>
                            <input 
                                id="user" 
                                type="email" 
                                className="form-input" 
                                placeholder="Ingresa Email"
                                value={formData.user}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="password">Contraseña</label>
                            <input 
                                id="pass" 
                                type="password" 
                                className="form-input" 
                                placeholder="Ingresa Contraseña"
                                value={formData.pass}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                            <input 
                                id="confirmPassword" 
                                type="password" 
                                className="form-input" 
                                placeholder="Confirma tu Contraseña"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>
                 
                        <button type="submit" className="btn btn-primary w-full">
                            REGISTRAR EMPRESA
                        </button>
                    </form>
                   
                    <p className="text-center mt-6">
                        ¿Tu empresa ya tiene una cuenta?
                        <Link to="/auth/LoginCover" className="font-bold text-primary hover:underline ltr:ml-1 rtl:mr-1">
                            Ingresar a Roma
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterCover;