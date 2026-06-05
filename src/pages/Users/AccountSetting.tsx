import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';

const AccountSetting = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Account Setting'));
    });


    return (
        <div>
            <ul className="m-4 flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link to="/" className="flex text-primary hover:underline" style={{marginLeft: '-18px'}}>
                        <svg width="4" height="4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className=" mr-2 w-4 h-4 text-primary mx-auto">
                            <path
                                opacity="0.5"
                                d="M19.164 19.547c-1.641-2.5-3.669-3.285-6.164-3.484V17.5c0 .534-.208 1.036-.586 1.414-.756.756-2.077.751-2.823.005l-6.293-6.207a1 1 0 010-1.425l6.288-6.203c.754-.755 2.073-.756 2.829.001.377.378.585.88.585 1.414v1.704c4.619.933 8 4.997 8 9.796v1a.999.999 0 01-1.836.548zm-7.141-5.536c2.207.056 4.638.394 6.758 2.121a7.985 7.985 0 00-6.893-6.08C11.384 9.996 11 10 11 10V6.503l-5.576 5.496 5.576 5.5V14l1.023.011z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                        </svg>
                    
                        aoki RH
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Información de Usuario</span>
                </li>
            </ul>
            <div className="pt-5">
                <div>
                    <form className="border border-[#ebedf2] rounded-md p-4 mb-5 bg-white">
                        <h6 className="text-lg font-bold mb-5">Informacion General</h6>
                        <div className="flex flex-col sm:flex-row">
                            <div className="ltr:sm:mr-4 rtl:sm:ml-4 w-full sm:w-2/12 mb-5">
                                <img src="/assets//images/profile-34.jpeg" alt="img" className="w-20 h-20 md:w-32 md:h-32 rounded-full object-cover mx-auto" />
                            </div>
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label htmlFor="name">Nombre completo</label>
                                    <input id="name" type="text" placeholder="Juan Perez" className="form-input" />
                                </div>
                                <div>
                                    <label htmlFor="profession">Profesion</label>
                                    <input id="profession" type="text" placeholder="Web Developer" className="form-input" />
                                </div>
                                <div>
                                    <label htmlFor="country">País</label>
                                    <select defaultValue="United States" id="country" className="form-select text-white-dark">
                                        <option value="All Countries">All Countries</option>
                                        <option value="United States">United States</option>
                                        <option value="India">India</option>
                                        <option value="Japan">Japan</option>
                                        <option value="China">China</option>
                                        <option value="Brazil">Brazil</option>
                                        <option value="Norway">Norway</option>
                                        <option value="Canada">Canada</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="address">Provincia</label>
                                    <input id="address" type="text" placeholder="Buenos Aires" className="form-input" />
                                </div>
                                <div>
                                    <label htmlFor="location">Ciudad</label>
                                    <input id="location" type="text" placeholder="Mar del Plata" className="form-input" />
                                </div>
                                <div>
                                    <label htmlFor="phone">Teléfono</label>
                                    <input id="phone" type="text" placeholder="(530) 555-12121" className="form-input" />
                                </div>
                                <div>
                                    <label htmlFor="email">Email</label>
                                    <input id="email" type="email" placeholder="Jimmy@gmail.com" className="form-input" />
                                </div>
                                <div>
                                    <label htmlFor="web">Página web</label>
                                    <input id="web" type="text" placeholder="Ingresar url..." className="form-input" />
                                </div>
                                <div className="sm:col-span-2 mt-3">
                                    <button type="button" className="btn btn-primary">
                                        Guardar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                    <form className="border border-[#ebedf2] rounded-md p-4 bg-white">
                        <h6 className="text-lg font-bold mb-5">Redes Sociales</h6>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="flex">
                                <div className="bg-[#eee] flex justify-center items-center rounded px-3 font-semibold ltr:mr-2 rtl:ml-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24px"
                                        height="24px"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="w-5 h-5"
                                    >
                                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                        <rect x="2" y="9" width="4" height="12"></rect>
                                        <circle cx="4" cy="4" r="2"></circle>
                                    </svg>
                                </div>
                                <input type="text" placeholder="jimmy_turner" className="form-input" />
                            </div>
                            <div className="flex">
                                <div className="bg-[#eee] flex justify-center items-center rounded px-3 font-semibold ltr:mr-2 rtl:ml-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24px"
                                        height="24px"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="w-5 h-5"
                                    >
                                        <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                                    </svg>
                                </div>
                                <input type="text" placeholder="jimmy_turner" className="form-input" />
                            </div>
                            <div className="flex">
                                <div className="bg-[#eee] flex justify-center items-center rounded px-3 font-semibold ltr:mr-2 rtl:ml-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24px"
                                        height="24px"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="w-5 h-5"
                                    >
                                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                                    </svg>
                                </div>
                                <input type="text" placeholder="jimmy_turner" className="form-input" />
                            </div>
                            <div className="flex">
                                <div className="bg-[#eee] flex justify-center items-center rounded px-3 font-semibold ltr:mr-2 rtl:ml-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24px"
                                        height="24px"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="w-5 h-5"
                                    >
                                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                                    </svg>
                                </div>
                                <input type="text" placeholder="jimmy_turner" className="form-input" />
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AccountSetting;
