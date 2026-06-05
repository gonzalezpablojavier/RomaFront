# Figma Tokens - Guía de Uso

## 🎨 ¿Qué son los Figma Tokens?

Los Figma Tokens son valores de diseño reutilizables (colores, espaciados, tipografías, etc.) que mantienen consistencia entre tu diseño en Figma y tu código.

## 📁 Estructura de Archivos

```
src/tokens/
├── figma-tokens.css     # Variables CSS
├── figma-tokens.js      # Objeto JavaScript
└── README.md           # Esta guía
```

## 🚀 Cómo Usar

### 1. **Con Tailwind CSS (Recomendado)**

```tsx
// Usando las clases de Tailwind personalizadas
<div className="bg-primary-500 text-white p-lg rounded-xl shadow-md">
  <h2 className="text-2xl font-bold mb-md">Título</h2>
  <p className="text-secondary-600">Descripción</p>
</div>
```

### 2. **Con CSS Variables**

```tsx
<div 
  style={{
    backgroundColor: 'var(--color-primary-500)',
    color: 'var(--color-white)',
    padding: 'var(--spacing-lg)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-md)',
  }}
>
  Contenido
</div>
```

### 3. **Con JavaScript Object**

```tsx
import { figmaTokens, getColor, getSpacing } from '../tokens/figma-tokens';

<div 
  style={{
    backgroundColor: getColor('primary', 500),
    color: 'white',
    padding: getSpacing('lg'),
    borderRadius: figmaTokens.borderRadius.xl,
    boxShadow: figmaTokens.shadows.md,
  }}
>
  Contenido
</div>
```

## 🎯 Tokens Disponibles

### Colores
- `primary` (50-900)
- `secondary` (50-900)
- `success` (50, 500, 600)
- `warning` (50, 500, 600)
- `error` (50, 500, 600)

### Espaciado
- `xs` (4px), `sm` (8px), `md` (16px)
- `lg` (24px), `xl` (32px), `2xl` (48px), `3xl` (64px)

### Tipografía
- `fontSize`: xs, sm, base, lg, xl, 2xl, 3xl, 4xl
- `fontWeight`: normal, medium, semibold, bold
- `lineHeight`: tight, normal, relaxed

### Border Radius
- `sm` (4px), `md` (8px), `lg` (12px)
- `xl` (16px), `2xl` (24px), `full`

### Sombras
- `sm`, `md`, `lg`, `xl`

## 🔧 Cómo Actualizar los Tokens

### Opción 1: Manual
1. Edita `figma-tokens.css` y `figma-tokens.js`
2. Actualiza `tailwind.config.cjs`
3. Reinicia el servidor de desarrollo

### Opción 2: Con Figma Tokens Plugin
1. Instala el plugin "Figma Tokens" en Figma
2. Exporta los tokens como JSON
3. Usa Style Dictionary para generar los archivos

### Opción 3: Con Figma API
1. Conecta tu proyecto con la API de Figma
2. Sincroniza automáticamente los tokens

## 📱 Ejemplo Práctico

```tsx
// Antes (hardcoded)
<div className="bg-blue-500 text-white p-4 rounded-lg shadow-md">
  <h2 className="text-xl font-bold mb-2">Título</h2>
</div>

// Después (con tokens)
<div className="bg-primary-500 text-white p-md rounded-lg shadow-md">
  <h2 className="text-xl font-bold mb-sm">Título</h2>
</div>
```

## 🎨 Beneficios

✅ **Consistencia**: Mismos valores en diseño y código  
✅ **Mantenibilidad**: Cambios centralizados  
✅ **Escalabilidad**: Fácil agregar nuevos tokens  
✅ **Colaboración**: Diseñadores y desarrolladores sincronizados  
✅ **Automatización**: Posible sincronización automática  

## 🔄 Flujo de Trabajo Recomendado

1. **Diseñador**: Define tokens en Figma
2. **Desarrollador**: Exporta/actualiza tokens en código
3. **Equipo**: Usa tokens consistentemente
4. **Iteración**: Actualiza tokens según feedback

## 📚 Recursos Adicionales

- [Figma Tokens Plugin](https://www.figma.com/community/plugin/843461159747178946/Figma-Tokens)
- [Style Dictionary](https://amzn.github.io/style-dictionary/)
- [Design Tokens W3C](https://design-tokens.github.io/community-group/format/)
