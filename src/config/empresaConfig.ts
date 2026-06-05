// src/config/empresaConfig.ts

interface EmpresaConfig {
    areas: string[];
    managerIds: string[];
    managerLowIds: string[]; 
    managerHighIds: string[];    
    managerAreas: { [key: string]: string };
    // Puedes añadir más propiedades específicas de la empresa aquí
  }
  
  interface EmpresasConfig {
    [key: string]: EmpresaConfig;
  }
  
  export const empresaConfig: EmpresasConfig = {
    'default': {
      areas: ['Sistemas', 'Administración', 'Depósito', 'Comercial', 'GerenciaOP', 'Contabilidad', 'Compras', 'TV', 'Gerencia','Aoki','Directorio','Marketing','Intercar'],
      managerIds: ['4', '7', '134', '147', '148', '149', '150', '151', '110', '8', '118', '236', '239','162','16','373', '251', '215', '328', '262','371'],
      managerLowIds: ['135','162','244','284','123','245'],
      managerHighIds: ['8', '149', '110', '135', '162','162','16', '284','123'],
      managerAreas: {
        '118': 'Administración',
        '7': 'Sistemas',        
        '134': 'TV',
        '137': 'Depósito',
        '148': 'Comercial',
        '149': 'GerenciaOP',
        '150': 'Depósito',
        '151': 'Contabilidad',
        '110': 'Gerencia',
        '8': 'GerenciaOP',
        '236': 'Aoki',
        '239': 'Aoki',
        '244': 'GerenciaOP',     
        '373': 'Marketing',    
        '371': 'Compras',
        '251': 'Depósito',
        '215': 'Depósito',
        '328': 'Depósito',
        '262': 'Depósito'
      }
    },
    'default2': {
      areas: ['Sistemas', 'Administración', 'Depósito', 'Comercial', 'GerenciaOP', 'Contabilidad', 'Compras', 'TV', 'Gerencia','Party'],
      managerIds: ['4', '7', '134', '147', '148', '149', '150', '151', '110', '8', '118', '236', '239', '9999','9998','16', '251', '215', '328', '262'],
      managerLowIds: ['135','162'],
      managerHighIds: ['135','162','16'],
      managerAreas: {
        '118': 'Administración',
        '7': 'Sistemas',
        '134': 'TV',
        '137': 'Depósito',
        '148': 'Comercial',
        '149': 'GerenciaOP',
        '150': 'Depósito',
        '151': 'Contabilidad',
        '110': 'Gerencia',
        '8': 'GerenciaOP',
        '236': 'Aoki',
        '239': 'Aoki',
        '9999': 'GerenciaOP',
        '9998': 'GerenciaOP',  
        '16': 'Directorio',
        '251': 'Depósito',
        '215': 'Depósito',
        '328': 'Depósito',
        '262': 'Depósito'      
      } 
    },
    '5': {
      areas: ['Musica', 'Cableado'],
      managerIds: ['4', '7', '134', '147', '148', '149', '150', '151', '110', '8', '118', '236', '239', '9999','9998','10003', '251', '215', '328', '262'],
      managerLowIds: ['135','162'],
      managerHighIds: ['135','162'],
      managerAreas: {
        '118': 'Administración',
        '7': 'Sistemas',
        '134': 'TV',
        '137': 'Depósito',
        '148': 'Comercial',
        '149': 'GerenciaOP',
        '150': 'Depósito',
        '151': 'Contabilidad',
        '110': 'Gerencia',
        '8': 'GerenciaOP',
        '236': 'Aoki',
        '239': 'Aoki',
        '9999': 'GerenciaOP',
        '9998': 'GerenciaOP',        
        '251': 'Depósito',
        '215': 'Depósito',
        '328': 'Depósito',
        '262': 'Depósito'        
      } 
    },
    '6': {
      areas: ['Sistemas', 'Administración', 'Depósito', 'Comercial', 'GerenciaOP', 'Contabilidad', 'Compras', 'TV', 'Gerencia','Aoki'],
      managerIds: ['4', '7', '134', '147', '148', '149', '150', '151', '110', '8', '118', '236', '239', '1', '251', '215', '328', '262'],
      managerLowIds: ['135','162'],
      managerHighIds: ['8', '149', '110', '135', '162','1'],
      managerAreas: {
        '118': 'Administración',
        '7': 'Sistemas',
        '1': 'Sistemas',
        '134': 'TV',
        '137': 'Depósito',
        '148': 'Comercial',
        '149': 'GerenciaOP',
        '150': 'Depósito',
        '151': 'Contabilidad',
        '110': 'Gerencia',
        '8': 'GerenciaOP',
        '236': 'Aoki',
        '239': 'Aoki',
        '251': 'Depósito',
        '215': 'Depósito',
        '328': 'Depósito',
        '262': 'Depósito'        
      }
    },
    // Añade más empresas según sea necesario
  };