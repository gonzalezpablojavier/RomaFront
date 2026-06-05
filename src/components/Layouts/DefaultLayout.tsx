import { PropsWithChildren, Suspense, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import App from '../../App';
import { useAuth } from '../../context/AuthContext';
import { IRootState } from '../../store';
import { toggleSidebar } from '../../store/themeConfigSlice';
import Header from './Header';
import Sidebar from './Sidebar';
import Portals from '../../components/Portals';
import { Route } from '../../config/permissions';
import Footer from './Footer';

const DefaultLayout = ({ children }: PropsWithChildren) => {
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const { isAuthenticated, hasPermission } = useAuth();
    const dispatch = useDispatch();
    const [isMobile, setIsMobile] = useState(false);
    const [showLoader, setShowLoader] = useState(true);
    const [showTopButton, setShowTopButton] = useState(false);

    

    const navItems = [
        { path: Route.Home, icon: '/images/circle-homepage-black-outline-button-20634.png', alt: 'Home', label: 'Home' },
        { path: Route.MisDatos, icon: '/images/user-4250.png', alt: 'Home', label: 'Mi Perfil' },
        { path: Route.PermisoTemporal, icon: '/images/user-exchange-263.png', alt: 'Permiso temporal', label: 'Mis Permisos' },
        { path: Route.Vacaciones, icon: '/images/airport.png', alt: 'Vacaciones', label: 'Mis Vacaciones' },
        { path: Route.FeedbackColaborador, icon: '/images/search-favorite-8978.png', alt: 'Feedback Colaborador', label: 'Reconocer / Reforzar' },
        { path: Route.Certificados, icon: '/images/certificate.png', alt: 'Certificados', label: 'Mis Certificados' },

        { path: Route.Calendario, icon: '/images/dash-885.png', alt: 'Manage Moods', label: 'Panel Calendario' },
        { path: Route.PanelCertificados, icon: '/images/dash-885.png', alt: 'Panel Permisos', label: 'Panel Certificados' },
        { path: Route.PanelAdminIdeas, icon: '/images/dash-885.png', alt: 'Panel Permisos', label: 'Panel Ideas' },
        { path: Route.PanelPermisosTemporales, icon: '/images/dash-885.png', alt: 'Panel Permisos', label: 'Panel Permisos' },
        { path: Route.PanelAdminVacaciones, icon: '/images/dash-885.png', alt: 'Panel Admin Vacaciones', label: 'Panel Vacaciones' },
        { path: Route.PanelFeedBack, icon: '/images/dash-885.png', alt: 'Panel Feedback', label: 'Panel Reconocemos' },
        { path: Route.PanelDesempeno, icon: '/images/dash-885.png', alt: 'Panel Feedback', label: 'Panel Feedback' },
        { path: Route.ManageMoods, icon: '/images/dash-885.png', alt: 'Manage Moods', label: 'Panel Como estas?' },
        { path: Route.PanelPresentismo, icon: '/images/dash-885.png', alt: 'Manage Moods', label: 'Panel Presentismo' },
        { path: Route.PanelColaboradores, icon: '/images/dash-885.png', alt: 'Manage Moods', label: 'Panel Colaboradores' },
    ];

    const goToTop = () => {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    };

    const onScrollHandler = () => {
        if (document.body.scrollTop > 50 || document.documentElement.scrollTop > 50) {
            setShowTopButton(true);
        } else {
            setShowTopButton(false);
        }
    };

    useEffect(() => {
        window.addEventListener('scroll', onScrollHandler);

        const screenLoader = document.getElementsByClassName('screen_loader');
        if (screenLoader?.length) {
            screenLoader[0].classList.add('animate__fadeOut');
            setTimeout(() => {
                setShowLoader(false);
            }, 200);
        }

        return () => {
            window.removeEventListener('onscroll', onScrollHandler);
        };
    }, []);

    return (
        <App>
            <div className="relative">
             
                <div className={`${(!themeConfig.sidebar && 'hidden') || ''} fixed inset-0 bg-[black]/60 z-50 lg:hidden`} onClick={() => dispatch(toggleSidebar(false))}></div>
          
                <div className={`${themeConfig.navbar} main-container text-black bg-white min-h-screen`}>
                    {/* BEGIN SIDEBAR */}
                    {isAuthenticated && (
                    
                        <Sidebar navItems={navItems.filter(item => hasPermission(item.path))} />
                        

                    )}

                    {/* Main Content */}
                    <div className={`flex-1 min-h-screen transition-all duration-300 ease-in-out ${themeConfig.sidebar && isAuthenticated ? 'lg:ml-[260px]' : ''}`}>
                      

                        <div className="main-content">
                            {isAuthenticated && <Header />}
                            <Suspense>
                                <div className={`${themeConfig.animation} animate__animated`}>
                                    {children}

                                    
                               </div>
                            </Suspense>

                            

                        </div>
                       
                        {/* Top Button */}
                        <div className="fixed bottom-6 ltr:right-6 rtl:left-6 z-50">
                            {showTopButton && (
                                <button type="button" className="btn btn-outline-primary rounded-full p-2 animate-pulse bg-white hover:bg-gray-100" onClick={goToTop}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7l4-4m0 0l4 4m-4-4v18" />
                                    </svg>
                                </button>
                            )}
                             <Footer />
                        </div>

                    </div>
                </div>
            </div>
        </App>
    );
};

export default DefaultLayout;