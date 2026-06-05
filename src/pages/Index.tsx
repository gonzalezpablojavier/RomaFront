import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
//import { IRootState } from '../store';
import { setPageTitle } from '../store/themeConfigSlice';
import 'animate.css';

const Index = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Inicio'));
    });

  //test
   

    return (
        <div className="bg-white min-h-screen">
            <ul className=" animate__backInUp animate__animated mt-10 md:mt-20 md:space-x-12 rtl:space-x-reverse grid grid-cols-2 md:grid-cols-0 md:flex justify-center mb-10 gap-5 md:gap-0">
                    <li className="flex flex-col items-center justify-center aspect-[1] border border-[#ebedf2] rounded-md p-4 py-10 bg-white text-center md:w-[440px] group hover:shadow-[rgba(145,158,171,0.20)_0px_0px_2px_0px,_rgba(145,158,171,0.12)_0px_12px_24px_-4px]">
                        <Link to='/create'>
                            <svg viewBox="0 0 24 24" fill="#4e49b3" height='8em' width='8em' className='ml-8'>
                            <path d="M18 14h2v3h3v2h-3v3h-2v-3h-3v-2h3v-3M4 3h14a2 2 0 012 2v7.08a6.01 6.01 0 00-4.32.92H12v4h1.08c-.11.68-.11 1.35 0 2H4a2 2 0 01-2-2V5a2 2 0 012-2m0 4v4h6V7H4m8 0v4h6V7h-6m-8 6v4h6v-4H4z" />
                            </svg>
                            <h5 className="mt-3 font-bold group-hover:text-primary md:text-xl">Crear nuevo análisis</h5>
                        </Link>
                    </li>
                    <li className="flex flex-col items-center justify-center aspect-[1] border border-[#ebedf2] rounded-md p-4 py-10 bg-white text-center md:w-[440px] group hover:shadow-[rgba(145,158,171,0.20)_0px_0px_2px_0px,_rgba(145,158,171,0.12)_0px_12px_24px_-4px]">
                        <Link to="/search">
                            <svg viewBox="0 0 24 24" fill="#4e49b3" height='8em' width='8em' className='ml-8'>
                                <path d="M19.3 17.89c1.32-2.1.7-4.89-1.41-6.21a4.52 4.52 0 00-6.21 1.41C10.36 15.2 11 18 13.09 19.3c1.47.92 3.33.92 4.8 0L21 22.39 22.39 21l-3.09-3.11m-2-.62c-.98.98-2.56.97-3.54 0-.97-.98-.97-2.56.01-3.54.97-.97 2.55-.97 3.53 0 .96.99.95 2.57-.03 3.54h.03M19 4H5a2 2 0 00-2 2v12a2 2 0 002 2h5.81a6.3 6.3 0 01-1.31-2H5v-4h4.18c.16-.71.43-1.39.82-2H5V8h6v2.81a6.3 6.3 0 012-1.31V8h6v2a6.499 6.499 0 012 2V6a2 2 0 00-2-2z" />
                            </svg>
                            <h5 className="mt-3 font-bold group-hover:text-primary md:text-xl">Ver análisis previos</h5>
                        </Link>
                    </li>
            </ul>
        
            
        </div>
    );
};

export default Index;
