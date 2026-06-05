/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Figma Tokens - Primary Colors
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // Figma Tokens - Secondary Colors
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Figma Tokens - Status Colors
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
        // Legacy colors for existing components
        'white-light': '#f8fafc',
        'white-dark': '#ffffff',
        'black': '#000000',
      },
      spacing: {
        // Figma Tokens - Spacing Scale
        'xs': '0.25rem',    // 4px
        'sm': '0.5rem',     // 8px
        'md': '1rem',       // 16px
        'lg': '1.5rem',     // 24px
        'xl': '2rem',       // 32px
        '2xl': '3rem',      // 48px
        '3xl': '4rem',      // 64px
      },
      fontSize: {
        // Figma Tokens - Typography Scale
        'xs': ['0.75rem', { lineHeight: '1.25' }],     // 12px
        'sm': ['0.875rem', { lineHeight: '1.5' }],     // 14px
        'base': ['1rem', { lineHeight: '1.5' }],       // 16px
        'lg': ['1.125rem', { lineHeight: '1.5' }],     // 18px
        'xl': ['1.25rem', { lineHeight: '1.5' }],      // 20px
        '2xl': ['1.5rem', { lineHeight: '1.25' }],     // 24px
        '3xl': ['1.875rem', { lineHeight: '1.25' }],   // 30px
        '4xl': ['2.25rem', { lineHeight: '1.25' }],    // 36px
      },
      fontWeight: {
        // Figma Tokens - Font Weights
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
      },
      borderRadius: {
        // Figma Tokens - Border Radius
        'sm': '0.25rem',   // 4px
        'md': '0.5rem',    // 8px
        'lg': '0.75rem',   // 12px
        'xl': '1rem',      // 16px
        '2xl': '1.5rem',   // 24px
        'full': '9999px',
      },
      boxShadow: {
        // Figma Tokens - Shadows
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        // Custom shadows for buttons
        'primary': '0 4px 14px 0 rgb(59 130 246 / 0.6)',
        'secondary': '0 4px 14px 0 rgb(139 92 246 / 0.6)',
        'success': '0 4px 14px 0 rgb(34 197 94 / 0.6)',
        'danger': '0 4px 14px 0 rgb(239 68 68 / 0.6)',
        'warning': '0 4px 14px 0 rgb(245 158 11 / 0.6)',
        'info': '0 4px 14px 0 rgb(33 150 243 / 0.6)',
        'dark': '0 4px 14px 0 rgb(27 46 75 / 0.6)',
      },
      zIndex: {
        // Figma Tokens - Z-Index Scale
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
      },
      fontFamily: {
        // Figma Tokens - Typography
        'nunito': ['Nunito', 'sans-serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'serif': ['Georgia', 'serif'],
        'mono': ['Fira Code', 'monospace'],
      },
      textColor: {
        // Figma Tokens - Text Colors
        'primary': '#3b82f6', // Default primary color
        'primary-50': '#eff6ff',
        'primary-100': '#dbeafe',
        'primary-200': '#bfdbfe',
        'primary-300': '#93c5fd',
        'primary-400': '#60a5fa',
        'primary-500': '#3b82f6',
        'primary-600': '#2563eb',
        'primary-700': '#1d4ed8',
        'primary-800': '#1e40af',
        'primary-900': '#1e3a8a',
        'secondary': '#64748b', // Default secondary color
        'secondary-50': '#f8fafc',
        'secondary-100': '#f1f5f9',
        'secondary-200': '#e2e8f0',
        'secondary-300': '#cbd5e1',
        'secondary-400': '#94a3b8',
        'secondary-500': '#64748b',
        'secondary-600': '#475569',
        'secondary-700': '#334155',
        'secondary-800': '#1e293b',
        'secondary-900': '#0f172a',
        'success': '#22c55e', // Default success color
        'success-50': '#f0fdf4',
        'success-100': '#dcfce7',
        'success-200': '#bbf7d0',
        'success-300': '#86efac',
        'success-400': '#4ade80',
        'success-500': '#22c55e',
        'success-600': '#16a34a',
        'success-700': '#15803d',
        'success-800': '#166534',
        'success-900': '#14532d',
        'warning': '#f59e0b', // Default warning color
        'warning-50': '#fffbeb',
        'warning-100': '#fef3c7',
        'warning-200': '#fde68a',
        'warning-300': '#fcd34d',
        'warning-400': '#fbbf24',
        'warning-500': '#f59e0b',
        'warning-600': '#d97706',
        'warning-700': '#b45309',
        'warning-800': '#92400e',
        'warning-900': '#78350f',
        'error': '#ef4444', // Default error color
        'error-50': '#fef2f2',
        'error-100': '#fee2e2',
        'error-200': '#fecaca',
        'error-300': '#fca5a5',
        'error-400': '#f87171',
        'error-500': '#ef4444',
        'error-600': '#dc2626',
        'error-700': '#b91c1c',
        'error-800': '#991b1b',
        'error-900': '#7f1d1d',
        // Legacy colors for existing components
        'white-light': '#f8fafc',
        'white-dark': '#ffffff',
        'black': '#000000',
        // Additional specific colors used in datatables.css
        'gray-600': '#506690',
        'gray-700': '#3b3f5c',
        'gray-800': '#181f32',
        'gray-900': '#191e3a',
        'gray-950': '#1a2941',
        // Specific hex colors from datatables.css
        'e1e3e7': '#e1e3e7',
        'f6f7fa': '#f6f7fa',
        '253b5c': '#253b5c',
        'adb5bd': '#adb5bd',
        // Additional colors from tailwind.css
        'dark': '#1b2e4b',
        'danger': '#e7515a',
        'info': '#2196f3',
        'light': '#f8f9fa',
        'white-light': '#f8fafc',
        'white-dark': '#ffffff',
        'black': '#000000',
        // Additional specific colors
        'primary-light': '#e3f2fd',
        'secondary-light': '#f3e5f5',
        'success-light': '#e8f5e8',
        'danger-light': '#ffebee',
        'warning-light': '#fff8e1',
        'info-light': '#e3f2fd',
        'dark-light': '#424242',
      },
      placeholderColor: {
        // Figma Tokens - Placeholder Colors
        'primary': '#3b82f6',
        'secondary': '#64748b',
        'success': '#22c55e',
        'warning': '#f59e0b',
        'error': '#ef4444',
        'info': '#2196f3',
        'dark': '#1b2e4b',
        'danger': '#e7515a',
        'light': '#f8f9fa',
        'white-light': '#f8fafc',
        'white-dark': '#ffffff',
        'black': '#000000',
        // Additional specific colors
        'primary-light': '#e3f2fd',
        'secondary-light': '#f3e5f5',
        'success-light': '#e8f5e8',
        'danger-light': '#ffebee',
        'warning-light': '#fff8e1',
        'info-light': '#e3f2fd',
        'dark-light': '#424242',
      },
      backgroundColor: {
        // Figma Tokens - Background Colors
        'primary': '#3b82f6', // Default primary color
        'primary-50': '#eff6ff',
        'primary-100': '#dbeafe',
        'primary-200': '#bfdbfe',
        'primary-300': '#93c5fd',
        'primary-400': '#60a5fa',
        'primary-500': '#3b82f6',
        'primary-600': '#2563eb',
        'primary-700': '#1d4ed8',
        'primary-800': '#1e40af',
        'primary-900': '#1e3a8a',
        'secondary': '#64748b', // Default secondary color
        'secondary-50': '#f8fafc',
        'secondary-100': '#f1f5f9',
        'secondary-200': '#e2e8f0',
        'secondary-300': '#cbd5e1',
        'secondary-400': '#94a3b8',
        'secondary-500': '#64748b',
        'secondary-600': '#475569',
        'secondary-700': '#334155',
        'secondary-800': '#1e293b',
        'secondary-900': '#0f172a',
        'success': '#22c55e', // Default success color
        'success-50': '#f0fdf4',
        'success-100': '#dcfce7',
        'success-200': '#bbf7d0',
        'success-300': '#86efac',
        'success-400': '#4ade80',
        'success-500': '#22c55e',
        'success-600': '#16a34a',
        'success-700': '#15803d',
        'success-800': '#166534',
        'success-900': '#14532d',
        'warning': '#f59e0b', // Default warning color
        'warning-50': '#fffbeb',
        'warning-100': '#fef3c7',
        'warning-200': '#fde68a',
        'warning-300': '#fcd34d',
        'warning-400': '#fbbf24',
        'warning-500': '#f59e0b',
        'warning-600': '#d97706',
        'warning-700': '#b45309',
        'warning-800': '#92400e',
        'warning-900': '#78350f',
        'error': '#ef4444', // Default error color
        'error-50': '#fef2f2',
        'error-100': '#fee2e2',
        'error-200': '#fecaca',
        'error-300': '#fca5a5',
        'error-400': '#f87171',
        'error-500': '#ef4444',
        'error-600': '#dc2626',
        'error-700': '#b91c1c',
        'error-800': '#991b1b',
        'error-900': '#7f1d1d',
        // Legacy colors for existing components
        'white-light': '#f8fafc',
        'white-dark': '#ffffff',
        'black': '#000000',
        // Additional specific colors used in datatables.css
        'gray-600': '#506690',
        'gray-700': '#3b3f5c',
        'gray-800': '#181f32',
        'gray-900': '#191e3a',
        'gray-950': '#1a2941',
        // Specific hex colors from datatables.css
        'e1e3e7': '#e1e3e7',
        'f6f7fa': '#f6f7fa',
        '253b5c': '#253b5c',
        'adb5bd': '#adb5bd',
        // Additional colors from tailwind.css
        'dark': '#1b2e4b',
        'danger': '#e7515a',
        'info': '#2196f3',
        'light': '#f8f9fa',
        'white-light': '#f8fafc',
        'white-dark': '#ffffff',
        'black': '#000000',
        // Additional specific colors
        'primary-light': '#e3f2fd',
        'secondary-light': '#f3e5f5',
        'success-light': '#e8f5e8',
        'danger-light': '#ffebee',
        'warning-light': '#fff8e1',
        'info-light': '#e3f2fd',
        'dark-light': '#424242',
      },
      placeholderColor: {
        // Figma Tokens - Placeholder Colors
        'primary': '#3b82f6',
        'secondary': '#64748b',
        'success': '#22c55e',
        'warning': '#f59e0b',
        'error': '#ef4444',
        'info': '#2196f3',
        'dark': '#1b2e4b',
        'danger': '#e7515a',
        'light': '#f8f9fa',
        'white-light': '#f8fafc',
        'white-dark': '#ffffff',
        'black': '#000000',
        // Additional specific colors
        'primary-light': '#e3f2fd',
        'secondary-light': '#f3e5f5',
        'success-light': '#e8f5e8',
        'danger-light': '#ffebee',
        'warning-light': '#fff8e1',
        'info-light': '#e3f2fd',
        'dark-light': '#424242',
      },
      borderColor: {
        // Figma Tokens - Border Colors
        'primary': '#3b82f6', // Default primary color
        'primary-50': '#eff6ff',
        'primary-100': '#dbeafe',
        'primary-200': '#bfdbfe',
        'primary-300': '#93c5fd',
        'primary-400': '#60a5fa',
        'primary-500': '#3b82f6',
        'primary-600': '#2563eb',
        'primary-700': '#1d4ed8',
        'primary-800': '#1e40af',
        'primary-900': '#1e3a8a',
        'secondary': '#64748b', // Default secondary color
        'secondary-50': '#f8fafc',
        'secondary-100': '#f1f5f9',
        'secondary-200': '#e2e8f0',
        'secondary-300': '#cbd5e1',
        'secondary-400': '#94a3b8',
        'secondary-500': '#64748b',
        'secondary-600': '#475569',
        'secondary-700': '#334155',
        'secondary-800': '#1e293b',
        'secondary-900': '#0f172a',
        'success': '#22c55e', // Default success color
        'success-50': '#f0fdf4',
        'success-100': '#dcfce7',
        'success-200': '#bbf7d0',
        'success-300': '#86efac',
        'success-400': '#4ade80',
        'success-500': '#22c55e',
        'success-600': '#16a34a',
        'success-700': '#15803d',
        'success-800': '#166534',
        'success-900': '#14532d',
        'warning': '#f59e0b', // Default warning color
        'warning-50': '#fffbeb',
        'warning-100': '#fef3c7',
        'warning-200': '#fde68a',
        'warning-300': '#fcd34d',
        'warning-400': '#fbbf24',
        'warning-500': '#f59e0b',
        'warning-600': '#d97706',
        'warning-700': '#b45309',
        'warning-800': '#92400e',
        'warning-900': '#78350f',
        'error': '#ef4444', // Default error color
        'error-50': '#fef2f2',
        'error-100': '#fee2e2',
        'error-200': '#fecaca',
        'error-300': '#fca5a5',
        'error-400': '#f87171',
        'error-500': '#ef4444',
        'error-600': '#dc2626',
        'error-700': '#b91c1c',
        'error-800': '#991b1b',
        'error-900': '#7f1d1d',
        // Legacy colors for existing components
        'white-light': '#f8fafc',
        'white-dark': '#ffffff',
        'black': '#000000',
        // Additional specific colors used in datatables.css
        'gray-600': '#506690',
        'gray-700': '#3b3f5c',
        'gray-800': '#181f32',
        'gray-900': '#191e3a',
        'gray-950': '#1a2941',
        // Specific hex colors from datatables.css
        'e1e3e7': '#e1e3e7',
        'f6f7fa': '#f6f7fa',
        '253b5c': '#253b5c',
        'adb5bd': '#adb5bd',
        // Additional colors from tailwind.css
        'dark': '#1b2e4b',
        'danger': '#e7515a',
        'info': '#2196f3',
        'light': '#f8f9fa',
        'white-light': '#f8fafc',
        'white-dark': '#ffffff',
        'black': '#000000',
        // Additional specific colors
        'primary-light': '#e3f2fd',
        'secondary-light': '#f3e5f5',
        'success-light': '#e8f5e8',
        'danger-light': '#ffebee',
        'warning-light': '#fff8e1',
        'info-light': '#e3f2fd',
        'dark-light': '#424242',
      },
      placeholderColor: {
        // Figma Tokens - Placeholder Colors
        'primary': '#3b82f6',
        'secondary': '#64748b',
        'success': '#22c55e',
        'warning': '#f59e0b',
        'error': '#ef4444',
        'info': '#2196f3',
        'dark': '#1b2e4b',
        'danger': '#e7515a',
        'light': '#f8f9fa',
        'white-light': '#f8fafc',
        'white-dark': '#ffffff',
        'black': '#000000',
        // Additional specific colors
        'primary-light': '#e3f2fd',
        'secondary-light': '#f3e5f5',
        'success-light': '#e8f5e8',
        'danger-light': '#ffebee',
        'warning-light': '#fff8e1',
        'info-light': '#e3f2fd',
        'dark-light': '#424242',
      },
    },
  },
  plugins: [],
}