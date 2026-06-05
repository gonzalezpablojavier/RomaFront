import React from 'react';
// import { figmaTokens, getColor, getSpacing } from '../tokens/figma-tokens';

// Ejemplo de cómo usar Figma Tokens en componentes
const FigmaTokenExample: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Usando Tailwind con tokens personalizados */}
      <div className="bg-primary-50 p-lg rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-primary-800 mb-md">
          Usando Tailwind con Figma Tokens
        </h2>
        <p className="text-secondary-600">
          Los colores, espaciados y tipografías están definidos en el config de Tailwind.
        </p>
      </div>

      {/* Usando CSS Variables */}
      <div 
        style={{
          backgroundColor: 'var(--color-primary-50)',
          padding: 'var(--spacing-lg)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <h2 
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-primary-800)',
            marginBottom: 'var(--spacing-md)',
          }}
        >
          Usando CSS Variables
        </h2>
        <p 
          style={{
            color: 'var(--color-secondary-600)',
            fontSize: 'var(--font-size-base)',
          }}
        >
          Acceso directo a las variables CSS definidas en Figma.
        </p>
      </div>

      {/* Usando JavaScript Object - Comentado temporalmente */}
      {/* <div 
        style={{
          backgroundColor: getColor('primary', 50),
          padding: getSpacing('lg'),
          borderRadius: figmaTokens.borderRadius.xl,
          boxShadow: figmaTokens.shadows.md,
        }}
      >
        <h2 
          style={{
            fontSize: figmaTokens.typography.fontSize['2xl'],
            fontWeight: figmaTokens.typography.fontWeight.bold,
            color: getColor('primary', 800),
            marginBottom: getSpacing('md'),
          }}
        >
          Usando JavaScript Object
        </h2>
        <p 
          style={{
            color: getColor('secondary', 600),
            fontSize: figmaTokens.typography.fontSize.base,
          }}
        >
          Acceso programático a los tokens desde JavaScript.
        </p>
      </div> */}

      {/* Ejemplo de botones con diferentes estados */}
      <div className="flex gap-md">
        <button className="bg-primary-500 hover:bg-primary-600 text-white px-lg py-sm rounded-md font-medium transition-colors">
          Primary Button
        </button>
        <button className="bg-secondary-200 hover:bg-secondary-300 text-secondary-800 px-lg py-sm rounded-md font-medium transition-colors">
          Secondary Button
        </button>
        <button className="bg-success-500 hover:bg-success-600 text-white px-lg py-sm rounded-md font-medium transition-colors">
          Success Button
        </button>
      </div>
    </div>
  );
};

export default FigmaTokenExample;
