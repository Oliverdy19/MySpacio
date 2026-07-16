/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        mango: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA', // Añadido para fondos sutiles de alertas
          300: '#FDBA74',
          400: '#F7A93B',
          500: '#F5900B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E', // Añadido para contrastes en modo oscuro
        },
        lime: {
          50: '#F4F9F0', // Excelente para fondos de éxito o tags
          100: '#E6F2DB',
          400: '#8BC34A',
          500: '#6BA539',
          600: '#568C2E',
          700: '#436B25',
        },
        ink: {
          50: '#FAFAF8',   // Fondo principal (App background)
          100: '#F0F0ED',  // Fondo secundario (Sidebar/Cards)
          200: '#E4E4E1',  // Bordes sutiles y divisores
          300: '#D1D1CD',  // Bordes fuertes o inputs deshabilitados
          400: '#A1A19D',  // Texto terciario / placeholders
          500: '#71736F',  // Texto secundario (descripciones)
          600: '#525855',  // Iconos
          700: '#3A4340',  // Texto principal
          800: '#262B2E',  // Títulos
          900: '#1C2321',  // Títulos de alto contraste
          950: '#14181B',  // Modo oscuro extremo
        },
      },
      fontFamily: {
        // Inter es perfecta para legibilidad de datos, Manrope para dar carácter a los títulos.
        display: ['Manrope', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        // Sombras multicapa para dar un efecto de "flotación" realista
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        card: '0 1px 3px rgba(0,0,0,0.02), 0 4px 14px rgba(0,0,0,0.04)',
        floating: '0 6px 24px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.04)',
        dropdown: '0 10px 32px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
        modal: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        // Sombra interna sutil para inputs
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};