import type { CriterioConfig, Nivel } from '../types/desempeno';

export const DESCRIPCION_NIVEL: Record<Nivel, string> = {
  Jr: 'Primer nivel dentro de la estructura operativa. Su objetivo es aprender, ejecutar correctamente los procesos asignados y consolidar hábitos alineados a la cultura organizacional.',
  Ssr: 'Segunda etapa de desarrollo. Ejecuta con autonomía, aporta mejoras, garantiza calidad y actúa como referente confiable dentro del equipo.',
  Sr: 'Rol de alta madurez operativa. Asegura la excelencia en procesos, forma a perfiles menos experimentados y actúa como embajador cultural de la organización.',
};

export const DESCRIPCION_LIDER =
  'Evaluación de liderazgo. Se mide la capacidad de conducir personas, ejecutar la estrategia y sostener resultados del área.';

export const CRITERIOS_LIDER: CriterioConfig[] = [
  {
    nombre: 'Liderazgo de Personas',
    descripcion:
      'Desarrolla a su equipo, delega con método, genera autonomía y forma futuros líderes. El área no depende de su presencia constante.',
  },
  {
    nombre: 'Gestión por Objetivos (OKR / KPI)',
    descripcion:
      'Conoce, sigue y gestiona los indicadores clave de su área. Toma decisiones basadas en datos y anticipa desvíos.',
  },
  {
    nombre: 'Pensamiento Estratégico',
    descripcion:
      'Prioriza con lógica 80/20, propone mejoras que impactan en el negocio y alinea recursos a los objetivos de crecimiento.',
  },
  {
    nombre: 'Cultura y Ejemplo',
    descripcion:
      'Vive y baja la cultura al equipo. Es coherente entre lo que dice y hace. Corrige desvíos culturales, incluso cuando es incómodo.',
  },
  {
    nombre: 'Comunicación',
    descripcion:
      'Comunica de forma clara, simple y frecuente. Da feedback oportuno y baja ruido organizacional.',
  },
  {
    nombre: 'Gestión de Conflictos',
    descripcion:
      'Enfrenta conversaciones difíciles con madurez. Trae problemas acompañados de solución y plazo.',
  },
  {
    nombre: 'Delegación',
    descripcion:
      'Delegó tareas clave y desarrolló a las personas para hacerlas bien. No es cuello de botella.',
  },
  {
    nombre: 'Gestión Operativa',
    descripcion:
      'La operación funciona sin su intervención diaria. Controla por indicadores, no por presencia.',
  },
  {
    nombre: 'Orientación al Cliente',
    descripcion:
      'Toma decisiones pensando en el impacto en el cliente interno y externo. Busca mejorar la experiencia.',
  },
  {
    nombre: 'Proactividad / Protagonismo',
    descripcion:
      'Se anticipa a los problemas, propone mejoras y se hace cargo de los resultados del área.',
  },
  {
    nombre: 'Toma de Decisiones',
    descripcion:
      'Decide con información, criterio y oportunidad. Asume riesgos razonables y se hace responsable.',
  },
  {
    nombre: 'Alineación con el Negocio',
    descripcion:
      'Entiende cómo su área impacta en los resultados generales y actúa en consecuencia.',
  },
];

export const CRITERIOS_POR_NIVEL: Record<Nivel, CriterioConfig[]> = {
  Jr: [
    {
      nombre: 'Actitud',
      descripcion:
        'Se muestra predispuesto y colaborativo. Demuestra entusiasmo por aprender. Enfrenta dificultades buscando soluciones.',
    },
    {
      nombre: 'Confianza',
      descripcion:
        'Cumple con sus compromisos. Se comunica con honestidad. Transmite seguridad y responsabilidad.',
    },
    {
      nombre: 'Cumplimiento de Pautas Generales',
      descripcion:
        'Cumple con la jornada y los horarios. Respeta lineamientos internos y políticas. Mantiene orden, limpieza y buena presentación.',
    },
    {
      nombre: 'Cumplimiento de Procesos',
      descripcion:
        'Aplica correctamente los pasos definidos. No omite controles ni atajos. Busca ayuda si desconoce un proceso.',
    },
    {
      nombre: 'Comunicación',
      descripcion:
        'Informa avances y problemas a tiempo. Escucha las indicaciones de líderes y compañeros. Se comunica con respeto y claridad.',
    },
  ],
  Ssr: [
    {
      nombre: 'Autonomía Operativa',
      descripcion:
        'Gestiona su agenda. Cumple tareas sin necesidad de seguimiento constante. Resuelve la mayoría de incidencias por sí mismo.',
    },
    {
      nombre: 'Reporte y Feedback',
      descripcion:
        'Informa avances y desvíos a tiempo. Usa un formato claro de reportes. Propone soluciones al presentar problemas.',
    },
    {
      nombre: 'Protagonismo',
      descripcion:
        'Participa en propuestas de procesos. Aporta ideas en reuniones. Se anticipa a los problemas.',
    },
    {
      nombre: 'Confianza',
      descripcion:
        'Cumple compromisos. Informa errores con transparencia. Genera seguridad en líderes y pares.',
    },
    {
      nombre: 'Cumplimiento de Procesos',
      descripcion:
        'Mantiene calidad y exactitud. Minimiza errores. Respeta controles y pasos definidos.',
    },
    {
      nombre: 'Comunicación',
      descripcion:
        'Comunica de forma concisa y profesional. Escucha activamente. Comparte información relevante a tiempo.',
    },
    {
      nombre: 'Actitud Cultural',
      descripcion:
        'Colabora, respeta normas, mantiene predisposición y proactividad.',
    },
  ],
  Sr: [
    {
      nombre: 'Expertise Técnica',
      descripcion:
        'Resuelve casuísticas complejas. Minimiza errores. Es referente para los demás.',
    },
    {
      nombre: 'Liderazgo sin Cargo',
      descripcion:
        'Acompaña a compañeros. Da ejemplo. Sostiene decisiones del líder.',
    },
    {
      nombre: 'Formación y Coaching',
      descripcion:
        'Explica procesos con claridad. Acompaña nuevos ingresos. Da feedback constructivo.',
    },
    {
      nombre: 'Embajador Cultural',
      descripcion:
        'Refuerza valores. Corrige desviaciones. Previene conflictos.',
    },
    {
      nombre: 'Autonomía Avanzada',
      descripcion:
        'Cumple tiempos críticos. Se anticipa a riesgos. Propone soluciones.',
    },
    {
      nombre: 'Comunicación Profesional',
      descripcion:
        'Comparte información clave. Escucha activamente. Reporta con precisión.',
    },
    {
      nombre: 'Protagonismo y Mejora Continua',
      descripcion:
        'Propone ideas. Identifica oportunidades. Participa en automatizaciones.',
    },
  ],
};

export function getTrimestreActivoFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const quarter = Math.ceil(month / 3);
  return `Q${quarter}-${year}`;
}

