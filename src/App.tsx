import { PropsWithChildren, useEffect,useState  } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from './store';
import { toggleTheme, toggleMenu, toggleLayout, toggleAnimation, toggleNavbar, toggleSemidark, closeSidebar } from './store/themeConfigSlice';
import store from './store';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { requestNotificationPermission, messageEmitter } from './config/firebase';
import { isFirebaseEnabled } from './config/env';
import useMediaQuery from './hooks/useMediaQuery';
import { ChatWidget } from './components/ChatWidget';
import { usePWAUpdate } from './hooks/usePWAUpdate';

function App({ children }: PropsWithChildren) {
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const dispatch = useDispatch();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [notification, setNotification] = useState<{ title: string; body: string } | null>(null);
    
    // Manejar actualizaciones automáticas del PWA
    usePWAUpdate();
  


     // Request permission and listen for messages
     useEffect(() => {
        if (!isFirebaseEnabled()) {
            return;
        }

        const setupNotificationListener = async () => {
            const token = await requestNotificationPermission();
            if (token) {
                console.log('Notification permission granted, token:', token);
            }
        };
        setupNotificationListener();

            const onNotification = (payload: any) => {
                console.log("Foreground message received in App component:", payload); // Debugging
                setNotification({
                    title: payload.notification?.title || 'No title',
                    body: payload.notification?.body || 'No content',
                });
            };
    

            messageEmitter.on('newNotification', onNotification);


        // Cleanup event listener on unmount
        return () => {
            messageEmitter.off('newNotification',onNotification);
        };
    }, []);

        // Muestra el mensaje como una notificación al actualizar `notification`
    useEffect(() => {
        if (notification) {
            toast.info(
                <div>
                    <strong>{notification.title}</strong>
                    <div>{notification.body}</div>
                </div>,
                {
                   
                    autoClose: false, // El usuario cierra el mensaje manualmente
                    closeOnClick: true, // Permite cerrar el toast haciendo clic
                    closeButton: true, // Muestra un botón de cerrar
                }
            );
        }
    }, [notification]);

    useEffect(() => {
        dispatch(toggleTheme());
        localStorage.removeItem('sidebar');
        if (window.innerWidth < 1024) {
            dispatch(closeSidebar());
        }
    }, [dispatch]);

    useEffect(() => {
        dispatch(toggleMenu(localStorage.getItem('menu') || themeConfig.menu));
        dispatch(toggleLayout(localStorage.getItem('layout') || themeConfig.layout));
        dispatch(toggleAnimation(localStorage.getItem('animation') || themeConfig.animation));
        dispatch(toggleNavbar(localStorage.getItem('navbar') || themeConfig.navbar));
        dispatch(toggleSemidark(false));
    }, [dispatch, themeConfig.menu, themeConfig.layout, themeConfig.animation, themeConfig.navbar]);




    const sidebarClass = `${(themeConfig.sidebar && 'toggle-sidebar') || ''}`;

return (
    <div
        className={`${sidebarClass} ${themeConfig.menu} ${themeConfig.layout}
        main-section antialiased relative font-nunito text-sm font-normal bg-white`}
    >
        {children}
        <ToastContainer />
        <ChatWidget />
    </div>
);
}

export default App;
