import { createSlice } from '@reduxjs/toolkit';
//import i18next from 'i18next';
import themeConfig from '../theme.config';

if (typeof document !== 'undefined') {
    document.body.classList.remove('dark');
    localStorage.setItem('theme', 'light');
}

const defaultState = {
    isDarkMode: false,
    mainLayout: 'app',
    theme: 'light',
    menu: 'vertical',
    layout: 'full',
    animation: '',
    sidebar: false,
    navbar: 'navbar-sticky',
    locale: 'en',
    pageTitle: '',
    semidark: false,
};

const initialState = {
    theme:  themeConfig.theme,
    menu: localStorage.getItem('menu') || themeConfig.menu,
    layout: localStorage.getItem('layout') || themeConfig.layout,
    animation: localStorage.getItem('animation') || themeConfig.animation,
    navbar: localStorage.getItem('navbar') || themeConfig.navbar,
    sidebar: localStorage.getItem('sidebar') || defaultState.sidebar,
    locale: localStorage.getItem('i18nextLng') || themeConfig.locale,
    isDarkMode: false,
    semidark: localStorage.getItem('semidark') || themeConfig.semidark,
};

const themeConfigSlice = createSlice({
    name: 'auth',
    initialState: initialState,
    reducers: {
        toggleTheme(state) {
            localStorage.setItem('theme', 'light');
            state.theme = 'light';
            state.isDarkMode = false;
            document.querySelector('body')?.classList.remove('dark');
        },
        toggleMenu(state, { payload }) {
            payload = payload || state.menu; // vertical, collapsible-vertical, horizontal
            localStorage.setItem('menu', payload);
            state.menu = payload;
        },
        toggleLayout(state, { payload }) {
            payload = payload || state.layout; // full, boxed-layout
            localStorage.setItem('layout', payload);
            state.layout = payload;
        },
        toggleAnimation(state, { payload }) {
            payload = payload || state.animation; // animate__fadeIn, animate__fadeInDown, animate__fadeInUp, animate__fadeInLeft, animate__fadeInRight, animate__slideInDown, animate__slideInLeft, animate__slideInRight, animate__zoomIn
            payload = payload?.trim();
            localStorage.setItem('animation', payload);
            state.animation = payload;
        },
        toggleNavbar(state, { payload }) {
            payload = payload || state.navbar; // navbar-sticky, navbar-floating, navbar-static
            localStorage.setItem('navbar', payload);
            state.navbar = payload;
        },
        toggleSidebar(state, { payload }) {
            if (payload !== undefined) {
                state.sidebar = payload;
            } else {
                state.sidebar = !state.sidebar;
            }
            localStorage.setItem('sidebar', state.sidebar.toString());
        },
        toggleSemidark(state, { payload }) {
            payload = payload === true || payload === 'true' ? true : false;
            localStorage.setItem('semidark', payload);
            state.semidark = payload;
        },
        setPageTitle(state, { payload }) {
            document.title = `${payload} | Roma`;
        },
    },
});

export const { toggleTheme, toggleMenu, toggleLayout, toggleAnimation, toggleNavbar, toggleSemidark,toggleSidebar, setPageTitle } = themeConfigSlice.actions;

export default themeConfigSlice.reducer;
