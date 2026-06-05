import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../store';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useEffect } from 'react';

const RegisterBoxed = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Register Boxed'));
    });
    const navigate = useNavigate();
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme) === 'dark' ? true : false;

    const submitForm = () => {
        navigate('/');
    };

    return (
        <div>
            <div className="flex justify-center items-center min-h-screen bg-cover bg-center bg-white">
                <div className="panel sm:w-[480px] m-6 max-w-lg w-full">
                    <h2 className="font-bold text-2xl mb-3">Registrarse</h2>
                    <form className="space-y-5" onSubmit={submitForm}>
                        <div>
                            <label htmlFor="name">Nombre</label>
                            <input id="name" type="text" className="form-input" placeholder="Enter Name" />
                        </div>
                        <div>
                            <label htmlFor="email">Email</label>
                            <input id="email" type="email" className="form-input" placeholder="Enter Email" />
                        </div>
                        <div>
                            <label htmlFor="password">Contraseña</label>
                            <input id="password" type="password" className="form-input" placeholder="Enter Password" />
                        </div>
                        <div>
                            <label className="cursor-pointer">
                                <input type="checkbox" className="form-checkbox" />
                                <span className="text-white-dark">
                                    Acepto los{' '}
                                    <button type="button" className="text-primary hover:underline">
                                        Terminos y Condiciones
                                    </button>
                                </span>
                            </label>
                        </div>
                        <button type="submit" className="btn btn-primary w-full">
                            Registrarse
                        </button>
                    </form>
                    <div className="relative my-7 h-5 text-center before:w-full before:h-[1px] before:absolute before:inset-0 before:m-auto before:bg-[#ebedf2]">
                        <div className="font-bold text-gray-800 bg-white px-2 relative z-[1] inline-block">
                            <span>O</span>
                        </div>
                    </div>
                    <ul className="flex justify-center gap-2 sm:gap-5 mb-5">
                        <li>
                            <button
                                type="button"
                                className="btn flex gap-1 sm:gap-2 text-black shadow-none bg-gray-100 hover:bg-white "
                            >
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 256 193" version="1.1" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid">
                                    <g>
                                        <path
                                            d="M58.1818182,192.049515 L58.1818182,93.1404244 L27.5066233,65.0770089 L0,49.5040608 L0,174.59497 C0,184.253152 7.82545455,192.049515 17.4545455,192.049515 L58.1818182,192.049515 Z"
                                            fill="#4285F4"
                                        ></path>
                                        <path
                                            d="M197.818182,192.049515 L238.545455,192.049515 C248.203636,192.049515 256,184.224061 256,174.59497 L256,49.5040608 L224.844415,67.3422767 L197.818182,93.1404244 L197.818182,192.049515 Z"
                                            fill="#34A853"
                                        ></path>
                                        <polygon
                                            fill="#EA4335"
                                            points="58.1818182 93.1404244 54.0077618 54.4932827 58.1818182 17.5040608 128 69.8676972 197.818182 17.5040608 202.487488 52.4960089 197.818182 93.1404244 128 145.504061"
                                        ></polygon>
                                        <path
                                            d="M197.818182,17.5040608 L197.818182,93.1404244 L256,49.5040608 L256,26.2313335 C256,4.64587897 231.36,-7.65957557 214.109091,5.28587897 L197.818182,17.5040608 Z"
                                            fill="#FBBC04"
                                        ></path>
                                        <path
                                            d="M0,49.5040608 L26.7588051,69.5731646 L58.1818182,93.1404244 L58.1818182,17.5040608 L41.8909091,5.28587897 C24.6109091,-7.65957557 0,4.64587897 0,26.2313335 L0,49.5040608 Z"
                                            fill="#C5221F"
                                        ></path>
                                    </g>
                                </svg>
                                Google
                            </button>
                        </li>
                    </ul>
                    <p className="text-center">
                        ¿Ya tienes una cuenta?
                        <Link to="/auth/boxed-signin" className="font-bold text-primary hover:underline ltr:ml-1 rtl:mr-1">
                            Iniciar sesión
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterBoxed;
