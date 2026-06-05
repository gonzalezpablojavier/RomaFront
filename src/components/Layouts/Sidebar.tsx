import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar } from '../../store/themeConfigSlice';
import { IRootState } from '../../store';
import { Route } from '../../config/permissions';
import { useState, useEffect } from 'react';
import lw from '/assets/images/logo-negro.png';
interface NavItem {
    path: Route;
    icon: string;
    alt: string;
    label: string;
}

interface SidebarProps {
    navItems: NavItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ navItems }) => {
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);
    const [currentMenu, setCurrentMenu] = useState<string>('');
    const location = useLocation();
    const dispatch = useDispatch();
    const { t } = useTranslation();


    const toggleMenu = (value: string) => {
        setCurrentMenu((oldValue) => {
            return oldValue === value ? '' : value;
        });
    };
    useEffect(() => {
        const selector = document.querySelector('.sidebar ul a[href="' + window.location.pathname + '"]');
        if (selector) {
            selector.classList.add('active');
            const ul: any = selector.closest('ul.sub-menu');
            if (ul) {
                let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link') || [];
                if (ele.length) {
                    ele = ele[0];
                    setTimeout(() => {
                        ele.click();
                    });
                }
            }
        }
    }, []);

    const isActive = (path: string) => location.pathname === path;
    useEffect(() => {
        if (window.innerWidth < 1024) {
           dispatch(toggleSidebar(false));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location]);
    return (
        <div className={semidark ? 'dark' : ''}>
            <nav className={`sidebar overflow-y-auto  fixed min-h-screen h-full top-0 bottom-0 w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] z-50 transition-all duration-300 ${semidark ? 'text-white-dark' : ''}`}>
                <div className="bg-white h-full">
                    <div className="flex px-4 py-3">
                        <NavLink to="/" className="main-logo flex items-center shrink-0">    
                                               
                            <span className="text-1xl ltr:ml-1.5 rtl:mr-1.5 font-semibold align-middle lg:inline text-blue-600">{t('ROMA')}</span>
             

                        </NavLink>
                        <button
                            type="button"
                            className="collapse-icon w-8 h-8 rounded-full flex items-center hover:bg-gray-500/10 transition duration-300 rtl:rotate-180"
                            onClick={() => dispatch(toggleSidebar(false))}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 m-auto">
                                <path d="M13 19L7 12L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path opacity="0.5" d="M16.9998 19L10.9998 12L16.9998 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                    <ul className="relative font-semibold space-y-0.5 p-4 py-0">
                        {navItems.map((item) => (
                            <li key={item.path} className="nav-item">
                                <NavLink to={item.path} className={`group flex items-center px-4 py-2 ${isActive(item.path) ? 'bg-gray-100 text-blue-600 ' : 'hover:bg-gray-100 hover:text-blue-600'}`}>
                                    <img src={item.icon} width={28} alt={item.alt} className="mr-3 flex-shrink-0" />
                                    <span className="text-left flex-grow">{t(item.label)}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;