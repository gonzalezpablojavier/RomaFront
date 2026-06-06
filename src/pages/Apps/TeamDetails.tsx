import React, { useState, useEffect, useMemo } from 'react';
import { apiClient, getApiBaseUrl } from '../../api/apiClient';
import { getAreasForEmpresa } from '../../services/empresaService';
import { buildLeadersByArea } from '../../services/tenantRbacService';
import { getSessionEmpresaId, getSessionUserId, getSessionUser } from '../../session/sessionStore';

// Define las interfaces para la tipificación
interface Stat {
  label: string;
  value: number;
}

interface Collaborator {
  colaboradorID: string;
  nombre: string;
  apellido: string;
  area: string;
  sucursal: string;
  isLeader?: boolean;
  imageUrl?: string;
  hobbies?: string;
  role?: string;
  name?: string;
  location?: string;
  miFamilia?: string;
  pass?:string;
  tarea?:string}

interface Section {
  title: string;
  people: number;
  description: string;
  collaborators: Collaborator[];
  filterType: 'location' | 'role';
  filters: string[];
}

const TeamDetails: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'home' | 'details'>('home');
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [colaboradores, setColaboradores] = useState<Collaborator[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [empresaId, setEmpresaId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  
  // Stats dinámicos basados en datos reales
  const stats: Stat[] = [
    { label: 'AÑOS', value: 50 }, // Podrías calcular esto dinámicamente
    { label: 'ÁREAS', value: areas.length },
    { label: 'PERSONAS', value: colaboradores.length },
  ];

  // Función para obtener imagen del colaborador (real o placeholder)
  const getCollaboratorImage = (colaborador: any) => {
    // Si tiene foto real, construir la URL completa
    if (colaborador.foto && colaborador.foto.trim() !== '' && colaborador.foto !== 'null') {
      // Si la foto ya es una URL completa, usarla directamente
      if (colaborador.foto.startsWith('http')) {
        return colaborador.foto;
      }
      
      // Si es una ruta relativa, construir la URL completa
      const fullImageUrl = `${getApiBaseUrl()}${colaborador.foto.startsWith('/') ? '' : '/'}${colaborador.foto}`;
      return fullImageUrl;
    }
    
    // Si no, generar placeholder con iniciales
    const initials = `${colaborador.nombre.charAt(0)}${colaborador.apellido.charAt(0)}`;
    return `https://placehold.co/150x150/f0f9ff/1d4ed8?text=${initials}`;
  };

  // Estilos para la tarjeta del líder - Con fondo celeste
  const leaderCardStyles = {
    width: '100%', // En desktop aprovecha todo el ancho disponible
    minWidth: '335px', // Ancho mínimo según Figma
    minHeight: '155px',
    padding: '20px 10px',
    backgroundColor: 'rgba(76, 216, 239, 0.2)', // Fondo celeste como en Figma
    borderRadius: '10px',
    boxShadow: '0 4px 4px rgba(0,0,0,0.25)'
  };

  // Estilos para las tarjetas de colaboradores - Fondo blanco
  const collaboratorCardStyles = {
    width: '100%', // En desktop aprovecha todo el ancho disponible
    minWidth: '335px', // Ancho mínimo según Figma
    minHeight: '155px',
    padding: '20px 10px',
    backgroundColor: 'white', // Fondo blanco como en Figma
    borderRadius: '10px',
    boxShadow: '0 4px 4px rgba(0,0,0,0.25)'
  };

  // Componente de imagen común
  const CardImage = ({ src, alt, name }: { src: string, alt: string, name: string }) => {
    return (
      <img 
        src={src} 
        alt={alt} 
        className="w-16 h-16 rounded-full object-cover border border-secondary-200" 
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          const initials = `${name.split(' ')[0].charAt(0)}${name.split(' ')[1]?.charAt(0) || ''}`;
          const fallbackSrc = `https://placehold.co/150x150/f0f9ff/1d4ed8?text=${initials}`;
          target.src = fallbackSrc;
        }}
      />
    );
  };

  // Función para obtener descripción del área
  const getAreaDescription = (area: string) => {
    const descriptions: { [key: string]: string } = {
      'Administración': 'Gestionamos pagos, controlamos cuentas y supervisamos gastos.',
      'Comercial': 'Generamos y mantenemos relaciones presenciales con clientes, impulsando oportunidades comerciales.',
      'TV': 'Gestionamos ventas remotas atendiendo consultas y asegurando la continuidad de los clientes.',
      'Sistemas': 'Automatizamos y optimizamos procesos internos reduciendo errores y aumentando la eficiencia.',
      'Compras': 'Adquirimos los productos, materias primas y servicios.',
      'Contabilidad': 'Registramos y controlamos las operaciones y transacciones financieras de la empresa.',
      'GerenciaOP': 'Implementanmos procesos y buenas prácticas en la empresa.',
      'Marketing': 'Desarrollamos estrategias de comunicación y promoción.',
      'Depósito': 'Coordinamos la distribución y entrega de productos.',
      'Atención al Cliente': 'Brindamos soporte y asistencia a nuestros clientes.',
      'ElMate': 'Área no disponible en esta vista.',
      'Aoki': 'Área no disponible en esta vista.',
    };
    return descriptions[area] || 'Área especializada en operaciones empresariales.';
  };

  // Función para obtener especialidades de Sistemas
  const getSistemasSpecialties = () => {
    return ['Front', 'Back', 'Soporte', 'Fullstack'];
  };

  // Función para obtener especialidades de TV
  const getTVSpecialties = () => {
    return ['Hunter', 'Farmer', 'Faltantes','Analista'];
  };

  const leadersByArea = useMemo(() => buildLeadersByArea(), []);

  const isLeader = (colaborador: Collaborator, area: string) => {
    const colaboradorID = String(colaborador.colaboradorID);
    const areaLeaders = leadersByArea[area] || [];
    return areaLeaders.includes(colaboradorID);
  };

  // Función para determinar los roles/especialidades de un colaborador (Sistemas o TV)
  const getAreaRoles = (colaborador: Collaborator, area: string): string[] => {
    // Mapeo específico de colaboradores conocidos de Sistemas (soporta múltiples roles)
    const roleMapping: { [key: string]: string | string[] } = {
      // Líder de Sistemas (múltiples roles)
      '7': [ 'Soporte'], // Agustín Cámpora - Fullstack + Soporte (líder)
      
      // Desarrolladores Frontend
      '9': 'Soporte', // Federico Letoile
      '1': ['Soporte', 'Fullstack'], // Pablo Gonzalez
      '200': 'Front', // Edu Allegrini
      '206': 'Back', // Dante Carrasco
      
      // Desarrolladores Backend
      '234': 'Back', // Fernando Martin Gianetti
      '211': 'Fullstack', // Nahuel Martinez
      '279': 'Fullstack', // Ariel Di Cesare
      
      // Soporte Técnico
      '208': 'Fullstack', // LUJAN MAXIMILIANO
      '292': 'Fullstack', // Luca Gutierrez
      '324': 'Fullstack', // Imanol Vázquez
      '15': 'Fullstack', // Marcelo Zárate
      
      // Ejemplo de más múltiples roles (puedes agregar más personas aquí)
      // '999': ['Front', 'Back'], // Ejemplo: Fullstack
      // '998': ['Front', 'Soporte'], // Ejemplo: Frontend + Soporte

      // TV - Especialidades
      '134': ' ', // Pablo Rizzo (líder)
      '124':'Hunter',
      '346':'Hunter',
      '278':'Hunter', 
      '133':'Hunter',      
      '130':'Hunter',      
      '132':'Hunter',      
      '122':'Hunter',      
      '12':'Hunter', 
      '344': 'Faltantes', // Nacho Lavignasse
      '284': 'Faltantes', // Otro colaborador
      
      '125': 'Farmer', // Samu Camargo
      '280': 'Farmer', // Samu Camargo
      '136': 'Farmer', // Samu Camargo      
      '291': 'Farmer', // Samu Camargo    
      '126': 'Farmer', // Samu Camargo
      '129': 'Farmer', // Samu Camargo
      '131': 'Farmer', // Samu Camargo
      '219': 'Farmer', // Samu Camargo
      '127': 'Farmer', // Samu Camargo
      '340':'Hunter',
      '123': 'Analista', // Otro colaborador
   
    
    };

    // Convertir ID a string para asegurar compatibilidad
    const colaboradorID = String(colaborador.colaboradorID);

    // Si hay un mapeo específico por ID, lo usamos
    if (roleMapping[colaboradorID]) {
      const roleOrRoles = roleMapping[colaboradorID];
      const roles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
      return roles;
    }

    // Si no, asignamos basado en el ID para consistencia
    // Esto asegura que el mismo colaborador siempre tenga el mismo rol
    const availableRoles = area === 'TV' ? getTVSpecialties() : getSistemasSpecialties();
    const hash = colaboradorID.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return [availableRoles[hash % availableRoles.length]];
  };

  // Generar secciones dinámicamente basadas en los datos reales
  const sections: Section[] = areas.map(area => {
    const colaboradoresArea = colaboradores.filter(colab => colab.area === area);
    
    // Debug específico para GerenciaOP
    if (area === 'GerenciaOP') {
      console.log('🏢 Generando sección GerenciaOP:', {
        area,
        colaboradoresEncontrados: colaboradoresArea.length,
        colaboradores: colaboradoresArea.map(colab => ({
          id: colab.colaboradorID,
          nombre: `${colab.nombre} ${colab.apellido}`
        }))
      });
    }
    
    
    // Determinar tipo de filtro y opciones según el área
    let filterType: 'location' | 'role' = 'location';
    let filters: string[] = [];
    
    if (area === 'Sistemas') {
      filterType = 'role';
      filters = getSistemasSpecialties();
    } else if (area === 'TV') {
      filterType = 'role';
      filters = getTVSpecialties();
    } else {
      filters = Array.from(new Set(colaboradoresArea.map(colab => colab.sucursal)));
    }
    
    return {
      title: area === 'GerenciaOP' ? 'Operativa' : area,
      people: colaboradoresArea.length,
      description: getAreaDescription(area),
      filterType,
      filters,
      collaborators: colaboradoresArea.map(colab => ({
        ...colab,
        name: `${colab.nombre} ${colab.apellido}`,
        imageUrl: getCollaboratorImage(colab),
          hobbies: colab.miFamilia, // Campo miFamilia del backend
          tarea:colab.pass,
        role: (area === 'Sistemas' || area === 'TV') ? getAreaRoles(colab, area).join(', ') : colab.area,
        location: colab.sucursal,
        isLeader: isLeader(colab, area),
      })),
    };
  });

  // useEffect para cargar datos del backend
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Obtener empresa ID desde localStorage
        const storedEmpresaID = getSessionEmpresaId();
        if (!storedEmpresaID) {
          setError('No se ha especificado una empresa');
          return;
        }
        
        setEmpresaId(storedEmpresaID);
        
        // Obtener áreas desde el servicio (excluyendo ElMate y Aoki)
        const empresaAreas = getAreasForEmpresa(storedEmpresaID).filter(area => area !== 'ElMate' && area !== 'Aoki');
        setAreas(empresaAreas);
        
        // Obtener colaboradores desde la API
        const response = await apiClient.get(`/usuarios-registrados`, {
          headers: { 'x-empresa-id': storedEmpresaID },
        });
        
        const data = response.data.data || [];
        
        // Filtrar colaboradores excluidos (igual que en panelPresentismo)
        const colaboradoresExcluidos = ['297', '300', '299', '298'];
        
        // Debug removido - problema resuelto
        
        const colaboradoresFiltrados = data.filter((colaborador: Collaborator) =>
          !colaboradoresExcluidos.includes(String(colaborador.colaboradorID))
        );
        
        setColaboradores(colaboradoresFiltrados);
        
        // Debug específico para GerenciaOP después del filtro
        const gerenciaopDespues = colaboradoresFiltrados.filter((colab: Collaborator) => 
          colab.area === 'GerenciaOP'
        );
        console.log('🔍 GerenciaOP DESPUÉS del filtro:', gerenciaopDespues.map((colab: Collaborator) => ({
          id: colab.colaboradorID,
          nombre: `${colab.nombre} ${colab.apellido}`,
          area: colab.area
        })));
        
        // Buscar específicamente a Jessica y Nicole
        const jessica = colaboradoresFiltrados.find((colab: Collaborator) => colab.colaboradorID === '149');
        const nicole = colaboradoresFiltrados.find((colab: Collaborator) => colab.colaboradorID === '244');
        
        console.log('👤 Jessica Costantino (ID: 149):', jessica ? 'ENCONTRADA' : 'NO ENCONTRADA');
        console.log('👤 Nicole Kogan (ID: 244):', nicole ? 'ENCONTRADA' : 'NO ENCONTRADA');
        
      } catch (err) {
        console.error('Error al cargar los datos:', err);
        setError('Error al cargar los datos del equipo. Por favor, intente de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSectionClick = (section: Section) => {
    setSelectedSection(section);
    setCurrentPage('details');
  };

  const handleBackClick = () => {
    setCurrentPage('home');
    setSelectedSection(null);
    setSelectedFilter(null); // Reset filter when going back to home
  };

  const renderHeader = () => (
    <header>

    
    </header>
  );

  const renderHome = () => (
    <div className="flex flex-col h-full">
      {/* Stats Section - Figma Design for Mobile, Responsive for Desktop */}
      <div className="flex-shrink-0 mb-md">
        {/* Mobile: Figma design (330px width) */}
        <div 
          className="flex items-center justify-between rounded-xl shadow-sm mx-auto sm:hidden"
          style={{
            width: '330px', // Figma mobile width
            height: '92px',
            padding: '10px',
            gap: '10px',
            borderRadius: '10px',
            backgroundColor: 'rgba(76, 216, 239, 0.2)', // Fondo celeste translúcido
            border: '1px solid rgba(76, 216, 239, 0.3)' // Borde celeste sutil
          }}
        >
          {stats.map((item, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center justify-center flex-1 relative bg-white rounded-lg shadow-sm"
              style={{
                padding: '8px',
                minHeight: '70px'
              }}
            >
              <div className="text-2xl font-bold text-gray-700 mb-1">{item.value}</div>
              {/* Línea separadora como en Figma */}
              <div className="w-full h-px bg-gray-300 mb-2"></div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Desktop: Responsive grid */}
        <div className="hidden sm:grid grid-cols-3 gap-md">
          {stats.map((item, index) => (
            <div 
              key={index} 
              className="bg-white p-md text-center rounded-xl shadow-sm flex flex-col items-center justify-center border border-gray-200"
            >
              <div className="text-2xl font-bold text-gray-700 mb-1">{item.value}</div>
              {/* Línea separadora como en Figma */}
              <div className="w-full h-px bg-gray-300 mb-2"></div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Areas Section with scrollable content */}
      <div className="flex-grow overflow-y-auto pb-24">
        <h2 className="text-xl font-bold mb-md text-secondary-800">Áreas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
          {sections.map((section, index) => (
            <div
              key={index}
              className="bg-white p-md rounded-xl shadow-sm cursor-pointer hover:bg-secondary-50 transition-colors border border-secondary-100"
              onClick={() => handleSectionClick(section)}
            >
              <div className="flex items-center justify-between mb-sm">
                <h3 className="text-lg font-semibold text-secondary-800">{section.title}</h3>
                <span className="bg-secondary-200 text-secondary-700 text-xs font-semibold px-sm py-xs rounded-full">
                  {section.people} personas
                </span>
              </div>
              <p className="text-sm text-secondary-600">
                {section.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Volver Button - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-md bg-secondary-50 z-50">
        <div className="max-w-7xl mx-auto">
          <button 
            onClick={() => window.location.href = '/'} 
            className="w-full py-md px-lg bg-white text-secondary-600 rounded-full shadow-lg font-medium hover:bg-secondary-50 transition-colors flex items-center justify-center space-x-sm border border-secondary-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Volver al Home</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderDetails = () => {
    const leader = selectedSection?.collaborators.find(c => c.isLeader);
    const otherCollaborators = selectedSection?.collaborators.filter(c => !c.isLeader);

    // Debug para GerenciaOP (removido - problema resuelto)

    const filterKey = selectedSection?.filterType === 'location' ? 'location' : 'role';

    const filteredCollaborators = selectedFilter
      ? otherCollaborators?.filter(c => {
          if (filterKey === 'role') {
            // Para roles, verificar si el filtro seleccionado está en los roles del colaborador
            return c.role?.includes(selectedFilter) || false;
          } else {
            // Para ubicación, comparación exacta
            return c[filterKey] === selectedFilter;
          }
        })
      : otherCollaborators;

    return (
      <div className="flex flex-col h-full">
        {/* Fixed Header Section - Leader Card and Filters */}
        <div className="flex-shrink-0 bg-secondary-50 pb-md">
          {/* Leader Card - Fixed at top */}
          {leader && (
            <div className="flex items-center gap-2.5 mb-md" style={leaderCardStyles}>
              <div className="flex-shrink-0">
                <CardImage src={leader.imageUrl || ''} alt={leader.name || ''} name={leader.name || ''} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-sm mb-xs">
                  <h3 className="text-base sm:text-lg font-semibold truncate text-primary-800">{leader.name}</h3>
              
                </div>
                <span className="bg-[#B379DF] text-white text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0">líder</span>
                <p className="text-xs text-secondary-500 mt-xs">hobbies: {leader.hobbies}</p>
              </div>
            </div>
          )}

          {/* Location or Role Filters - Fixed below leader */}
          <div className="flex space-x-sm overflow-x-auto whitespace-nowrap pb-sm">
            {selectedSection?.filters.map(filter => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(selectedFilter === filter ? null : filter)}
                className={`py-sm px-md rounded-full font-medium text-sm flex-shrink-0 transition-colors ${
                  selectedFilter === filter 
                    ? 'bg-primary-200 text-primary-800 border border-primary-300' 
                    : 'bg-secondary-200 text-secondary-700 hover:bg-secondary-300 border border-secondary-300'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Collaborator List - Responsive Grid */}
        <div className="flex-grow overflow-y-auto pr-sm pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCollaborators?.map((collaborator, index) => (
              <div key={index} className="flex items-center gap-2.5 border border-secondary-100 hover:border-secondary-200 transition-colors" 
                   style={collaboratorCardStyles}>
                <div className="flex-shrink-0">
                  <CardImage src={collaborator.imageUrl || ''} alt={collaborator.name || ''} name={collaborator.name || ''} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-sm mb-xs">
                    <h3 className="text-base sm:text-lg font-semibold truncate text-secondary-800">{collaborator.name}</h3>
                    {collaborator.isLeader && (
                      <span className="bg-[#B379DF] text-white text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0">líder</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-secondary-600 truncate">{collaborator.role}</p>
                    {collaborator.location && (
                      <p className="text-xs text-primary-600 truncate ml-sm">📍 {collaborator.location}</p>
                    )}
                  </div>
                  <p className="text-xs text-secondary-500 mt-xs ">Tareas: {collaborator.tarea}</p>
                  <hr className="my-xs" />
                  <p className="text-xs text-secondary-500 mt-xs ">Hobbies: {collaborator.hobbies}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Back Button - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0 p-md bg-secondary-50 z-50">
          <div className="max-w-7xl mx-auto">
            <button 
              onClick={handleBackClick} 
              className="w-full py-md px-lg bg-white text-secondary-600 rounded-full shadow-lg font-medium hover:bg-secondary-50 transition-colors border border-secondary-200"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50 font-sans text-secondary-800 p-md flex flex-col h-screen">
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-md"></div>
            <p className="text-secondary-600">Cargando información del equipo...</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <div className="min-h-screen bg-secondary-50 font-sans text-secondary-800 p-md flex flex-col h-screen">
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="text-error-600 text-6xl mb-md">⚠️</div>
            <p className="text-error-600 mb-md">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-md py-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 font-sans text-secondary-800 p-md flex flex-col h-screen max-w-7xl mx-auto">
      {renderHeader()}
      <div className="flex-grow overflow-hidden">
        {currentPage === 'home' ? renderHome() : renderDetails()}
      </div>
    </div>
  );
};

export default TeamDetails;

// CSS personalizado para el panel de stats
const styles = `
  .stats-panel-celeste {
    background-color: #4CD8EF !important;
    background: #4CD8EF !important;
  }
`;

// Inyectar el CSS
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
